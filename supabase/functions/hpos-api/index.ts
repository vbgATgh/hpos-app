import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const P="https://connect.parqet.com";
const AUTH=`${P}/oauth2/authorize`;
const TOKEN=`${P}/oauth2/token`;
const YAHOO="https://query1.finance.yahoo.com";
const APP_ORIGIN="https://vbgatgh.github.io";
const APP_REDIRECT="https://vbgatgh.github.io/hpos-app/app/";
const BASE="https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api";
const REDIRECT=`${BASE}/auth/parqet/callback`;
const TTL=12*60*60*1000;
const TR=new Set(["CA14150G4007","CA8051121090"]);

Deno.serve(async(req:Request)=>{
  const u=new URL(req.url),r=route(u.pathname),o=req.headers.get("Origin")||"";
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(o)});
  try{
    if(r==="/health")return j({ok:true,service:"hpos-api",version:"0.4.1",parqetConfigured:!!Deno.env.get("PARQET_CLIENT_ID"),marketProxy:true},200,o);

    if(r==="/"&&u.searchParams.get("s")==="yahoo"){
      origin(o);
      return j(await marketQuote(u.searchParams.get("t")||""),200,o);
    }
    if(r==="/"&&["search","yahoo-search"].includes(u.searchParams.get("s")||"")){
      origin(o);
      return j(await marketSearch(u.searchParams.get("q")||""),200,o);
    }

    if(r==="/auth/parqet/start")return start();
    if(r==="/auth/parqet/callback")return callback(u);
    if(r==="/api/parqet/status"){origin(o);await access(session(req));return j({connected:true},200,o)}
    if(r==="/api/parqet/portfolios"){origin(o);return j(await pf("/portfolios",await access(session(req))),200,o)}
    if(r==="/api/parqet/holdings"){origin(o);const id=u.searchParams.get("portfolioId");if(!id)throw err(400,"portfolioId_required");return j(await pf(`/portfolios/${encodeURIComponent(id)}/holdings`,await access(session(req))),200,o)}
    if(r==="/api/parqet/normalized"){origin(o);return j(await normalized(await access(session(req))),200,o)}
    if(r==="/api/parqet/activities"){origin(o);const id=u.searchParams.get("portfolioId");if(!id)throw err(400,"portfolioId_required");const q=new URLSearchParams();for(const k of ["limit","cursor"]){const v=u.searchParams.get(k);if(v)q.set(k,v)}return j(await pf(`/portfolios/${encodeURIComponent(id)}/activities${q.toString()?`?${q}`:""}`,await access(session(req))),200,o)}
    return j({error:"not_found"},404,o);
  }catch(e){
    const s=Number((e as any)?.status)||500,m=String((e as any)?.message||"request_failed");
    console.error("hpos-api",s,m);
    const safe=/^(parqet_|session_|refresh_|oauth_|portfolioId_|origin_|not_|supabase_|market_)/.test(m)?m:(s>=500?"internal_error":m);
    return j({error:safe},s,o);
  }
});

function db(){const u=Deno.env.get("SUPABASE_URL"),k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!u||!k)throw err(500,"supabase_service_config_missing");return createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}})}

async function marketQuote(symbolRaw:string){
  const symbol=String(symbolRaw||"").trim().toUpperCase();
  if(!/^[A-Z0-9.^=\-]{1,24}$/.test(symbol))throw err(400,"market_symbol_invalid");
  const url=`${YAHOO}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d&events=div%2Csplits&includeAdjustedClose=true`;
  const r=await fetch(url,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});
  if(!r.ok)throw err(502,`market_quote_http_${r.status}`);
  const d=await r.json();
  const result=d?.chart?.result?.[0];
  if(!result)throw err(502,"market_quote_missing");
  const meta=result.meta||{};
  const closes=Array.isArray(result?.indicators?.quote?.[0]?.close)?result.indicators.quote[0].close.filter((x:any)=>Number.isFinite(Number(x))):[];
  const price=n(meta.regularMarketPrice)||n(closes.at(-1));
  if(price<=0)throw err(502,"market_quote_price_missing");
  const previousClose=n(meta.chartPreviousClose)||n(meta.previousClose)||(closes.length>1?n(closes.at(-2)):0);
  return {symbol,price,previousClose,currency:String(meta.currency||""),exchange:String(meta.exchangeName||meta.fullExchangeName||""),marketTime:n(meta.regularMarketTime)};
}

async function marketSearch(qRaw:string){
  const q=String(qRaw||"").trim().slice(0,120);
  if(q.length<2)throw err(400,"market_search_query_too_short");
  const url=`${YAHOO}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0&enableFuzzyQuery=false`;
  const r=await fetch(url,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});
  if(!r.ok)throw err(502,`market_search_http_${r.status}`);
  const d=await r.json();
  const quotes=Array.isArray(d?.quotes)?d.quotes.slice(0,15).map((x:any)=>({symbol:String(x?.symbol||""),shortname:String(x?.shortname||""),longname:String(x?.longname||""),name:String(x?.longname||x?.shortname||x?.symbol||""),isin:String(x?.isin||""),quoteType:String(x?.quoteType||""),exchange:String(x?.exchange||""),exchDisp:String(x?.exchDisp||"")})):[];
  return {quotes,count:quotes.length};
}

async function start(){const c=client(),state=rnd(32),v=rnd(64),ch=await sha(v),sid=rnd(32),s=db();await s.from("hpos_oauth_pending").delete().lt("expires_at",new Date().toISOString());const {error}=await s.from("hpos_oauth_pending").insert({state,code_verifier:v,session_id:sid,expires_at:new Date(Date.now()+600000).toISOString()});if(error)throw err(500,"oauth_state_store_failed");const u=new URL(AUTH);for(const [k,val] of Object.entries({client_id:c,redirect_uri:REDIRECT,response_type:"code",scope:"portfolio:read",code_challenge:ch,code_challenge_method:"S256",state}))u.searchParams.set(k,val);return Response.redirect(u.toString(),302)}

async function callback(u:URL){const c=client(),ep=u.searchParams.get("error");if(ep)throw err(400,`oauth_authorization_${ep}`);const code=u.searchParams.get("code"),state=u.searchParams.get("state");if(!code||!state)throw err(400,"oauth_callback_invalid");const s=db(),{data:p,error}=await s.from("hpos_oauth_pending").select("state,code_verifier,session_id,expires_at").eq("state",state).maybeSingle();if(error||!p)throw err(400,"oauth_state_invalid");await s.from("hpos_oauth_pending").delete().eq("state",state);if(Date.parse(p.expires_at)<Date.now())throw err(400,"oauth_state_expired");const b=new URLSearchParams({grant_type:"authorization_code",client_id:c,redirect_uri:REDIRECT,code,code_verifier:p.code_verifier}),r=await fetch(TOKEN,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:b});if(!r.ok)throw err(502,`parqet_token_http_${r.status}`);const t=tok(await r.json()),{error:se}=await s.from("hpos_parqet_sessions").upsert({session_id:p.session_id,access_token:t.a,refresh_token:t.r||null,token_type:t.t,scope:t.s,expires_at:new Date(t.e).toISOString(),updated_at:new Date().toISOString()});if(se)throw err(500,"session_store_failed");const d=new URL(APP_REDIRECT);d.hash=`parqet=connected&session=${encodeURIComponent(p.session_id)}&sessionExpires=${encodeURIComponent(new Date(Date.now()+TTL).toISOString())}`;return Response.redirect(d.toString(),302)}

function session(req:Request){const m=(req.headers.get("Authorization")||"").match(/^Bearer\s+([A-Za-z0-9_-]{20,})$/i);if(!m)throw err(401,"not_authenticated");return m[1]}

async function access(id:string){const s=db(),{data:x,error}=await s.from("hpos_parqet_sessions").select("session_id,access_token,refresh_token,expires_at,created_at").eq("session_id",id).maybeSingle();if(error||!x)throw err(401,"session_expired");if(Date.now()-Date.parse(x.created_at)>TTL){await s.from("hpos_parqet_sessions").delete().eq("session_id",id);throw err(401,"session_expired")}const e=x.expires_at?Date.parse(x.expires_at):0;if(e&&Date.now()<e-60000)return x.access_token;if(!x.refresh_token)throw err(401,"refresh_token_missing");const b=new URLSearchParams({grant_type:"refresh_token",client_id:client(),refresh_token:x.refresh_token}),r=await fetch(TOKEN,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:b});if(!r.ok)throw err(401,`refresh_failed_${r.status}`);const t=tok(await r.json(),x.refresh_token),{error:ue}=await s.from("hpos_parqet_sessions").update({access_token:t.a,refresh_token:t.r||null,token_type:t.t,scope:t.s,expires_at:new Date(t.e).toISOString(),updated_at:new Date().toISOString()}).eq("session_id",id);if(ue)throw err(500,"session_refresh_store_failed");return t.a}

async function normalized(t:string){const portfolios=await pf("/portfolios",t),portfolioId=findPortfolioId(portfolios);if(!portfolioId)throw err(502,"parqet_portfolio_not_found");const perf=await ppost("/performance",t,{portfolioIds:[portfolioId],interval:{type:"relative",value:"max"},currency:"EUR"});const raw=Array.isArray(perf?.holdings)?perf.holdings:[];if(raw.length<1||raw.length>1000)throw err(502,`parqet_performance_holdings_unplausible_${raw.length}`);let cash=0;const active:any[]=[],watch:any[]=[];for(const x of raw){const a=x?.asset||{},p=x?.position||{};if(p?.isSold===true)continue;const type=String(a?.type||"").toLowerCase(),shares=n(p?.shares),value=n(p?.currentValue),price=n(p?.currentPrice??x?.quote?.price);if(type==="cash"){cash+=value||shares;continue}if(type!=="security")continue;const isin=String(a?.isin||"").toUpperCase();if(!isin||shares<=0)continue;const currentValue=value||shares*price;if(currentValue<=0)continue;const h={name:String(a?.name??x?.nickname??isin),isin,shares,currentPrice:price,currentValue,averagePrice:n(p?.purchasePrice),broker:TR.has(isin)?"TRADE_REPUBLIC":"SCALABLE",halalStatus:"UNKNOWN"};(currentValue<1?watch:active).push(currentValue<1?{...h,candidate:true}:h)}const dedup=new Map<string,any>();for(const h of active){const old=dedup.get(h.isin);if(!old||h.currentValue>old.currentValue)dedup.set(h.isin,h)}const holdings=[...dedup.values()];if(holdings.length<1||holdings.length>200)throw err(502,`parqet_active_count_unplausible_${holdings.length}`);if(!Number.isFinite(cash)||cash<-100000||cash>10000000)throw err(502,"parqet_cash_unplausible");return{source:"PARQET_SUPABASE",portfolioId,holdings,cash,watchCandidates:watch,reconciliation:{rawHoldings:raw.length,activePositions:holdings.length,watchCandidates:watch.length,brokerCounts:{SCALABLE:holdings.filter(x=>x.broker==="SCALABLE").length,TRADE_REPUBLIC:holdings.filter(x=>x.broker==="TRADE_REPUBLIC").length},valuationAtEnd:n(perf?.performance?.valuation?.atIntervalEnd)}}}

function findPortfolioId(root:any){const stack=[root],seen=new Set<any>();while(stack.length){const x=stack.shift();if(x==null)continue;if(Array.isArray(x)){stack.push(...x);continue}if(typeof x!=="object"||seen.has(x))continue;seen.add(x);const id=String(x.id??x.portfolioId??x.uuid??"");if(/^[a-f0-9]{24}$/i.test(id))return id;for(const v of Object.values(x))if(v&&typeof v==="object")stack.push(v)}return""}
function n(v:any){const x=Number(v);return Number.isFinite(x)?x:0}
async function pf(path:string,t:string){const r=await fetch(`${P}${path}`,{headers:{Authorization:`Bearer ${t}`,Accept:"application/json"}});if(!r.ok)throw err(r.status===401?401:502,`parqet_api_http_${r.status}`);return r.json()}
async function ppost(path:string,t:string,body:unknown){const r=await fetch(`${P}${path}`,{method:"POST",headers:{Authorization:`Bearer ${t}`,Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(body)});if(!r.ok){const txt=(await r.text()).slice(0,120).replace(/[^A-Za-z0-9_:. -]/g,"");console.error("parqet-post",r.status,txt);throw err(r.status===401?401:502,`parqet_api_http_${r.status}`)}return r.json()}
function client(){const v=Deno.env.get("PARQET_CLIENT_ID");if(!v)throw err(503,"parqet_not_configured");return v}
function origin(o:string){if(o!==APP_ORIGIN)throw err(403,"origin_not_allowed")}
function route(p:string){const m="/hpos-api",i=p.indexOf(m);return i>=0?(p.slice(i+m.length)||"/"):p}
function cors(o:string){return{"Access-Control-Allow-Origin":o===APP_ORIGIN?APP_ORIGIN:"","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"GET,OPTIONS","Vary":"Origin","Cache-Control":"no-store"}}
function j(d:unknown,s:number,o:string){return new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json; charset=utf-8",...cors(o)}})}
function tok(d:any,pr=""){const a=String(d?.access_token||"");if(!a)throw err(502,"parqet_token_missing");return{a,r:String(d?.refresh_token||pr||""),t:String(d?.token_type||"Bearer"),s:String(d?.scope||"portfolio:read"),e:Date.now()+Number(d?.expires_in||3600)*1000}}
function err(status:number,message:string){const e:any=new Error(message);e.status=status;return e}
function rnd(n:number){const d=new Uint8Array(n);crypto.getRandomValues(d);return b64(d)}
async function sha(v:string){return b64(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v))))}
function b64(d:Uint8Array){let b="";for(const x of d)b+=String.fromCharCode(x);return btoa(b).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
