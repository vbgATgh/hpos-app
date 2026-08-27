/* HPOS Alpha 4.1.4 - News Automation Extension
   Beim App-Start wird nur der kleine Status-Snapshot geladen.
   Der eigentliche Feed wird lazy erst bei News/Asset-News/KI geladen. */
(() => {
  'use strict';
  const NEWS_STATUS_URL='../data/news/news_status.json';
  const NEWS_FEED_URL='../data/news/news_feed.json';
  const NEWS_CACHE_MS=15*60*1000;
  const NEWS_STALE_MS=18*60*60*1000;
  let externalNewsStatus=null, externalNewsFeed=null, externalNewsLoaded=false, externalNewsLoading=null, newsRenderLimit=20;

  const cacheGet=(key,maxAge=NEWS_CACHE_MS)=>{try{const raw=sessionStorage.getItem(key);if(!raw)return null;const x=JSON.parse(raw);return x&&Date.now()-Number(x.at||0)<=maxAge?x.value:null;}catch{return null;}};
  const cacheSet=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),value}));}catch{}};
  const fetchJson=async(url,timeout=8000)=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{cache:'no-cache',signal:c.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}finally{clearTimeout(timer);}};
  const effectiveStatus=()=>{const base=externalNewsStatus||state?.dataStatus?.news||{state:'UNKNOWN',message:'News-Status unbekannt.'};if(base.state!=='CURRENT'||!base.asOf)return base;const t=new Date(base.asOf).getTime();if(Number.isFinite(t)&&Date.now()-t>NEWS_STALE_MS)return {...base,state:'STALE',message:`Discovery-News veraltet: letzter erfolgreicher Abruf ${dateFmt(base.asOf)}.`};return base;};

  async function loadStatus(force=false){
    const cached=!force&&cacheGet('hposNewsStatus414');if(cached){externalNewsStatus=cached;return cached;}
    try{externalNewsStatus=await fetchJson(NEWS_STATUS_URL);cacheSet('hposNewsStatus414',externalNewsStatus);}
    catch(e){externalNewsStatus={state:'ERROR',source:'github-pages',asOf:null,lastAttemptAt:new Date().toISOString(),message:'Automatischer News-Status nicht erreichbar; lokale Meldungen bleiben verfügbar.',error:String(e)};}
    return externalNewsStatus;
  }

  async function loadFeed(force=false){
    if(externalNewsLoaded&&!force)return externalNewsFeed;
    if(externalNewsLoading&&!force)return externalNewsLoading;
    externalNewsLoading=(async()=>{
      const cached=!force&&cacheGet('hposNewsFeed414');
      if(cached){externalNewsFeed=cached;externalNewsLoaded=true;externalNewsLoading=null;return cached;}
      try{const d=await fetchJson(NEWS_FEED_URL,10000);externalNewsFeed=d&&Array.isArray(d.items)?d:{items:[],assetIndex:{}};cacheSet('hposNewsFeed414',externalNewsFeed);}
      catch(e){externalNewsFeed={items:[],assetIndex:{},loadError:String(e)};}
      externalNewsLoaded=true;externalNewsLoading=null;return externalNewsFeed;
    })();
    return externalNewsLoading;
  }

  const norm=v=>String(v??'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  function resolveAssetId(item){
    const meta=externalNewsFeed?.assetIndex?.[item.assetKey]||{};
    const isin=String(item.isin||meta.isin||'').toUpperCase();
    if(isin){const a=state.assets.find(x=>String(x.isin||'').toUpperCase()===isin);if(a)return a.assetId;}
    const ticker=norm(item.ticker||meta.ticker);
    if(ticker){const hits=state.assets.filter(x=>norm(x.ticker)===ticker);if(hits.length===1)return hits[0].assetId;}
    const aliases=[item.assetName,meta.name,...(meta.aliases||[])].filter(Boolean).map(norm).filter(x=>x.length>=3);
    for(const a of state.assets){const local=[a.name,a.ticker,a.isin].filter(Boolean).map(norm);if(aliases.some(x=>local.includes(x)))return a.assetId;}
    return null;
  }
  const externalItems=()=>externalNewsFeed?.items?.map(n=>{const meta=externalNewsFeed?.assetIndex?.[n.assetKey]||{};return {...n,assetName:n.assetName||meta.name,ticker:n.ticker||meta.ticker,isin:n.isin||meta.isin,scope:n.scope||meta.scope,provider:n.provider||externalNewsFeed?.provider,assetId:resolveAssetId(n),origin:'AUTO'};})||[];
  function merged(assetId=null){
    const local=(state.newsEntries||[]).map(n=>({...n,origin:n.origin||'MANUAL'}));
    const all=[...externalItems(),...local].filter(n=>!assetId||n.assetId===assetId).sort((a,b)=>String(b.publishedAt||b.updatedAt||'').localeCompare(String(a.publishedAt||a.updatedAt||'')));
    const seen=new Set(),out=[];
    for(const n of all){const key=n.url?`u:${n.url}`:`t:${norm(n.title)}:${n.assetId||n.assetKey||''}`;if(seen.has(key))continue;seen.add(key);out.push(n);}return out;
  }
  function aiSelection(limit=25){
    const candidates=merged(),perAsset=new Map(),selected=[];
    for(const n of candidates){const key=n.assetId||n.assetKey||'UNASSIGNED',used=perAsset.get(key)||0;if(used>=5)continue;selected.push(n);perAsset.set(key,used+1);if(selected.length>=limit)break;}
    if(selected.length<limit){const usedIds=new Set(selected.map(n=>n.newsId||n.url||n.title));for(const n of candidates){const id=n.newsId||n.url||n.title;if(usedIds.has(id))continue;selected.push(n);if(selected.length>=limit)break;}}
    return selected;
  }

  const originalDataStrip=renderDataStrip;
  renderDataStrip=function(){const old=state.dataStatus.news;state.dataStatus.news=effectiveStatus();try{return originalDataStrip();}finally{state.dataStatus.news=old;}};
  const originalOpenDataStatus=openDataStatus;
  openDataStatus=function(key){if(key!=='news')return originalOpenDataStatus(key);const old=state.dataStatus.news;state.dataStatus.news=effectiveStatus();try{return originalOpenDataStatus(key);}finally{state.dataStatus.news=old;}};

  const originalDashboard=renderDashboard;
  renderDashboard=function(){
    originalDashboard();
    const ds=effectiveStatus(),auto=Number(ds.articlesStored||0),manual=(state.newsEntries||[]).length;
    const card=$('#openNews')?.closest('.compact-summary');
    if(card){const first=card.querySelector('div');const strong=first?.querySelector('strong'),small=first?.querySelector('small');if(strong)strong.textContent=`${auto+manual} News verfügbar`;if(small)small.textContent=ds.state==='CURRENT'?`${auto} automatisch · ${manual} manuell`:(ds.message||'News-Status unbekannt');}
  };

  const originalBuildAssetInsight=buildAssetInsight;
  buildAssetInsight=function(s,snap,als,assetId){const v=originalBuildAssetInsight(s,snap,als,assetId);if(externalNewsLoaded){v.news=merged(assetId);if(v.news.length&&!v.summary.includes('News-Meldung'))v.summary+=` ${v.news.length} aktuelle News-Meldung${v.news.length===1?'':'en'} ist/sind diesem Asset zugeordnet.`;}return v;};

  newsCard=function(n){
    const a=n.assetId?state.assets.find(x=>x.assetId===n.assetId):null,auto=n.origin==='AUTO';
    return `<div class="card news-card"><div class="top generic-top"><div><strong>${esc(n.title||'Meldung')}</strong>${a?`<button class="asset-link" data-news-asset="${esc(a.assetId)}">${esc(a.name)}</button>`:n.assetName?`<div class="asset-link" style="color:var(--muted)">${esc(n.assetName)} · nicht lokal zugeordnet</div>`:''}</div><span class="badge info">${esc(n.source||'Quelle unbekannt')}</span></div><div class="asset-badges" style="margin-top:8px">${n.primarySource?'<span class="badge good">Primärquelle</span>':''}<span class="badge ${auto?'info':''}">${auto?'Automatisch':'Manuell'}</span>${n.scope?`<span class="badge">${esc(n.scope)}</span>`:''}</div><p>${esc(n.summary||n.note||(auto?'Automatisch gefundene Meldung. Inhalt noch nicht durch HPOS/ChatGPT bewertet.':'Keine Zusammenfassung gespeichert.'))}</p><div class="rule-source">${esc(dateFmt(n.publishedAt||n.updatedAt))}${n.provider?` · ${esc(n.provider)}`:''}</div>${n.url?`<div class="action-row"><a class="btn small" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">Artikel öffnen</a></div>`:''}</div>`;
  };

  renderNews=function(){
    const ds=effectiveStatus();if(!externalNewsLoaded&&!externalNewsLoading)loadFeed().then(()=>{if(currentPage==='news')renderNews();});
    const all=merged(),items=all.slice(0,newsRenderLimit),auto=externalNewsFeed?.items?.length??Number(ds.articlesStored||0),manual=(state.newsEntries||[]).length,loading=!externalNewsLoaded&&Boolean(externalNewsLoading),byScope=ds.articlesByScope||{};
    $('#main').innerHTML=`<div class="section-head"><div><h1>News</h1><p>Automatisch + manuell · Quelle und Datum bleiben sichtbar</p></div><div class="action-row" style="margin:0"><button class="btn small" id="newsRefresh">Aktualisieren</button><button class="btn small" id="newsAi">Mit ChatGPT prüfen</button><button class="btn primary small" id="newsAdd">＋ Meldung</button></div></div><div class="card"><div class="top generic-top"><div><h3>Datenstatus</h3><p>${esc(ds.message||'Kein Status.')}</p></div>${dataStateBadge(ds)}</div><div class="asset-badges" style="margin-top:10px"><span class="badge info">${auto} automatisch</span><span class="badge">${manual} manuell</span>${byScope.PORTFOLIO!==undefined?`<span class="badge">Portfolio ${esc(byScope.PORTFOLIO)}</span>`:''}${byScope.WATCHLIST!==undefined?`<span class="badge">Watchlist ${esc(byScope.WATCHLIST)}</span>`:''}${ds.asOf?`<span class="badge">Stand ${esc(dateFmt(ds.asOf))}</span>`:''}</div></div>${loading?'<div class="card" style="margin-top:12px">News-Snapshot wird geladen …</div>':''}<div class="section-head"><div><h2>Meldungen</h2><p>${items.length} von ${all.length} geladen · 20er-Paginierung für schnelle Darstellung</p></div></div><div class="stack">${items.length?items.map(newsCard).join(''):`<div class="card empty"><div class="emoji">◉</div>${ds.state==='CURRENT'?'Konfigurierte Discovery-Abfragen waren erfolgreich; im aktuellen Snapshot liegen keine Meldungen vor.':'News sind noch nicht belastbar aktualisiert.'}</div>`}</div>${all.length>newsRenderLimit?'<div class="action-row"><button class="btn" id="newsMore">Weitere 20 anzeigen</button></div>':''}`;
    $('#newsAi').onclick=openAiHandoff;$('#newsAdd').onclick=()=>openNewsForm();$('#newsRefresh').onclick=async()=>{newsRenderLimit=20;externalNewsLoaded=false;externalNewsFeed=null;await loadStatus(true);await loadFeed(true);toast('News-Snapshot neu geladen');renderNews();};$('#newsMore')?.addEventListener('click',()=>{newsRenderLimit+=20;renderNews();});$$('[data-news-asset]').forEach(b=>b.onclick=()=>openAsset(b.dataset.newsAsset,'news'));
  };

  const originalAssetTab=renderAssetTab;
  renderAssetTab=function(v,tab){
    if(tab!=='news')return originalAssetTab(v,tab);
    const a=v.asset;if(!externalNewsLoaded&&!externalNewsLoading)loadFeed().then(()=>{if(currentPage==='asset'&&currentAssetTab==='news')renderAssetDetail();});
    const all=merged(a.assetId),items=all.slice(0,15);
    return `<div class="section-head"><div><h2>News</h2><p>${items.length}${all.length>15?` von ${all.length}`:''} Meldung${all.length===1?'':'en'} · automatisch + manuell</p></div><button class="btn primary small" data-add-news>＋ Meldung</button></div><div class="stack">${items.length?items.map(newsCard).join(''):`<div class="card empty">${externalNewsLoaded?'Keine belegte News zu diesem Asset im aktuellen Snapshot.':'Automatische News werden geladen …'}</div>`}</div>`;
  };

  const originalAi=buildAiHandoff;
  openAiHandoff=async function(){
    recompute();await loadStatus();await loadFeed();const h=originalAi(state,snapshot,alerts),ds=effectiveStatus();
    h.missing=(h.missing||[]).filter(x=>!String(x).startsWith('News:'));if(ds.state!=='CURRENT')h.missing.push(`News: ${ds.state} – ${ds.message||'Status unbekannt'}`);
    const news=aiSelection(25).map(n=>({asset:n.assetId?(state.assets.find(a=>a.assetId===n.assetId)?.name||n.assetName):n.assetName||null,title:n.title,source:n.source||null,publishedAt:n.publishedAt||n.updatedAt||null,primarySource:Boolean(n.primarySource),origin:n.origin,url:n.url||null}));
    h.prompt=h.prompt.replace('\nReviews/Termine:',`\n\nAutomatisch/lokal gespeicherte News (max. 25, höchstens 5 je Asset; Quelle/Datum beibehalten):\n${safe(news)}\n\nReviews/Termine:`);
    openModal('Mit ChatGPT analysieren',`<div class="stack"><div class="notice info">HPOS sendet nichts automatisch. Du kopierst den strukturierten Analyseauftrag bewusst.</div>${h.missing.length?`<div class="notice warn"><strong>Fehlend / veraltet</strong><ul>${h.missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'<div class="notice info">Keine fehlenden Daten vom Handoff-Builder erkannt.</div>'}<div class="action-row"><button class="btn primary" id="copyPrompt">Analyseauftrag kopieren</button></div></div>`);$('#copyPrompt').onclick=async()=>{try{await navigator.clipboard.writeText(h.prompt);toast('Analyseauftrag kopiert');closeModal();}catch(e){openModal('Analyseauftrag',`<div class="field"><textarea style="min-height:55vh">${esc(h.prompt)}</textarea></div>`);}};
  };

  loadStatus().then(()=>{if(['dashboard','news','data'].includes(currentPage))route(currentPage,false);});
})();
