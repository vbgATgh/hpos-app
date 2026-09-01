const PARQET_ISSUER = 'https://connect.parqet.com';
const AUTH_URL = `${PARQET_ISSUER}/oauth2/authorize`;
const TOKEN_URL = `${PARQET_ISSUER}/oauth2/token`;
const API_BASE = PARQET_ISSUER;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    try {
      if (url.pathname === '/health') {
        return json({ ok: true, service: 'hpos-api', version: '0.1.0' }, 200, origin, env);
      }

      if (url.pathname === '/auth/parqet/start') {
        return startParqetAuth(request, env);
      }

      if (url.pathname === '/auth/parqet/callback') {
        return finishParqetAuth(request, env);
      }

      if (url.pathname === '/api/parqet/portfolios') {
        const token = await getAccessToken(request, env);
        const data = await parqetFetch('/portfolios', token);
        return json(data, 200, origin, env);
      }

      if (url.pathname === '/api/parqet/holdings') {
        const portfolioId = url.searchParams.get('portfolioId');
        if (!portfolioId) return json({ error: 'portfolioId required' }, 400, origin, env);
        const token = await getAccessToken(request, env);
        const data = await parqetFetch(`/portfolios/${encodeURIComponent(portfolioId)}/holdings`, token);
        return json(data, 200, origin, env);
      }

      if (url.pathname === '/api/parqet/activities') {
        const portfolioId = url.searchParams.get('portfolioId');
        if (!portfolioId) return json({ error: 'portfolioId required' }, 400, origin, env);
        const token = await getAccessToken(request, env);
        const q = new URLSearchParams();
        const limit = url.searchParams.get('limit');
        const cursor = url.searchParams.get('cursor');
        if (limit) q.set('limit', limit);
        if (cursor) q.set('cursor', cursor);
        const suffix = q.toString() ? `?${q}` : '';
        const data = await parqetFetch(`/portfolios/${encodeURIComponent(portfolioId)}/activities${suffix}`, token);
        return json(data, 200, origin, env);
      }

      return json({ error: 'not_found' }, 404, origin, env);
    } catch (error) {
      const status = Number(error?.status) || 500;
      const message = status >= 500 ? 'internal_error' : String(error?.message || 'request_failed');
      return json({ error: message }, status, origin, env);
    }
  }
};

async function startParqetAuth(request, env) {
  requireEnv(env, ['PARQET_CLIENT_ID', 'PARQET_REDIRECT_URI', 'APP_ORIGIN', 'HPOS_KV']);

  const state = randomUrlSafe(32);
  const verifier = randomUrlSafe(64);
  const challenge = await sha256Base64Url(verifier);
  const sessionId = randomUrlSafe(32);

  await env.HPOS_KV.put(`oauth:${state}`, JSON.stringify({ verifier, sessionId }), { expirationTtl: 600 });

  const auth = new URL(AUTH_URL);
  auth.searchParams.set('client_id', env.PARQET_CLIENT_ID);
  auth.searchParams.set('redirect_uri', env.PARQET_REDIRECT_URI);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'portfolio:read');
  auth.searchParams.set('code_challenge', challenge);
  auth.searchParams.set('code_challenge_method', 'S256');
  auth.searchParams.set('state', state);

  return Response.redirect(auth.toString(), 302);
}

async function finishParqetAuth(request, env) {
  requireEnv(env, ['PARQET_CLIENT_ID', 'PARQET_REDIRECT_URI', 'APP_ORIGIN', 'HPOS_KV']);

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) throw httpError(400, 'oauth_callback_invalid');

  const pendingRaw = await env.HPOS_KV.get(`oauth:${state}`);
  if (!pendingRaw) throw httpError(400, 'oauth_state_expired');
  await env.HPOS_KV.delete(`oauth:${state}`);

  const pending = JSON.parse(pendingRaw);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.PARQET_CLIENT_ID,
    redirect_uri: env.PARQET_REDIRECT_URI,
    code,
    code_verifier: pending.verifier
  });

  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!tokenResponse.ok) throw httpError(502, `parqet_token_http_${tokenResponse.status}`);

  const tokens = normalizeTokens(await tokenResponse.json());
  await env.HPOS_KV.put(`session:${pending.sessionId}`, JSON.stringify(tokens));

  const redirect = new URL(env.APP_ORIGIN);
  redirect.searchParams.set('parqet', 'connected');
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirect.toString(),
      'Set-Cookie': sessionCookie(pending.sessionId)
    }
  });
}

async function getAccessToken(request, env) {
  requireEnv(env, ['PARQET_CLIENT_ID', 'HPOS_KV']);
  const sessionId = readCookie(request.headers.get('Cookie') || '', 'hpos_session');
  if (!sessionId) throw httpError(401, 'not_authenticated');

  const raw = await env.HPOS_KV.get(`session:${sessionId}`);
  if (!raw) throw httpError(401, 'session_expired');

  let tokens = JSON.parse(raw);
  if (tokens.expiresAt && Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  if (!tokens.refreshToken) throw httpError(401, 'refresh_token_missing');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: env.PARQET_CLIENT_ID,
    refresh_token: tokens.refreshToken
  });

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!r.ok) throw httpError(401, `refresh_failed_${r.status}`);

  tokens = normalizeTokens(await r.json(), tokens.refreshToken);
  await env.HPOS_KV.put(`session:${sessionId}`, JSON.stringify(tokens));
  return tokens.accessToken;
}

async function parqetFetch(path, accessToken) {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });
  if (!r.ok) throw httpError(r.status === 401 ? 401 : 502, `parqet_api_http_${r.status}`);
  return r.json();
}

function normalizeTokens(data, previousRefreshToken = '') {
  const expiresIn = Number(data.expires_in || 3600);
  return {
    accessToken: String(data.access_token || ''),
    refreshToken: String(data.refresh_token || previousRefreshToken || ''),
    tokenType: String(data.token_type || 'Bearer'),
    scope: String(data.scope || 'portfolio:read'),
    expiresAt: Date.now() + expiresIn * 1000
  };
}

function corsHeaders(origin, env) {
  const allowed = origin && origin === env.APP_ORIGIN ? origin : env.APP_ORIGIN || '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin, env) }
  });
}

function readCookie(header, name) {
  const parts = header.split(';').map(v => v.trim());
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx) === name) return decodeURIComponent(part.slice(idx + 1));
  }
  return '';
}

function sessionCookie(value) {
  return `hpos_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000`;
}

function requireEnv(env, names) {
  for (const name of names) {
    if (!env[name]) throw httpError(500, `missing_env_${name}`);
  }
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function randomUrlSafe(bytes) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return base64Url(data);
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function base64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
