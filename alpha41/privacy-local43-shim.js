/* HPOS Alpha 4.3.3 Privacy Hotfix – local projection for legacy Alpha 4.3 UI
   Intercepts the retired public portfolio-snapshot request and answers it from the
   already-local HPOS state. No private portfolio data is uploaded or fetched.
*/
(() => {
'use strict';
const nativeFetch433=window.fetch.bind(window);
const RETIRED_SNAPSHOT433='data/portfolio/parqet_snapshot.json';

function txCost433(assetId){
  const rows=(state.transactions||[]).filter(t=>t.assetId===assetId&&['OPENING_POSITION','BUY','SELL'].includes(t.type)).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  let qty=0,cost=0,first=null;
  for(const t of rows){
    const q=Math.max(0,Number(t.qty||0)),p=Math.max(0,Number(t.price||0));
    if(!first&&t.date)first=t.date;
    if(t.type==='SELL'){
      if(qty<=0)continue;
      const sold=Math.min(q,qty),avg=cost/qty;
      qty-=sold;cost=Math.max(0,cost-avg*sold);
    }else{qty+=q;cost+=q*p;}
  }
  return{qty,cost,avg:qty>0?cost/qty:0,first};
}
function localProjection433(){
  try{recompute();}catch{}
  const positions=(snapshot?.positions||[]),assets=state.assets||[],byId=new Map(assets.map(a=>[a.assetId,a]));
  const holdings=positions.map(p=>{
    const a=byId.get(p.assetId)||{},basis=txCost433(p.assetId),qty=Number(p.qty??basis.qty??0);
    const currentPrice=Number(p.valuationPrice??a.priceQuote?.price??basis.avg??0),currentValue=Number(p.marketValue??(qty*currentPrice));
    const purchaseValue=basis.cost>0?basis.cost:Math.max(0,qty*Number(p.purchasePrice??basis.avg??currentPrice));
    const averageEntryPrice=qty>0?purchaseValue/qty:0;
    const gain=currentValue-purchaseValue;
    return{name:p.name||a.name||a.isin,isin:p.isin||a.isin,shares:qty,currentPrice,currentValue,purchaseValue,purchasePrice:averageEntryPrice,avgEntryPrice:averageEntryPrice,avgCost:averageEntryPrice,unrealizedGainNet:gain,unrealizedReturnNet:purchaseValue>0?gain/purchaseValue*100:0,earliestActivityDate:basis.first||a.createdAt?.slice(0,10)||null,broker:a.broker||'LOCAL',holdingId:a.sourceHoldingId||a.assetId};
  }).filter(h=>h.isin&&h.shares>0);
  const activeWatchIds=new Set((state.watchlistEntries||[]).filter(w=>w.status!=='ARCHIVED').map(w=>w.assetId));
  const watchlist=assets.filter(a=>a.portfolioRole==='WATCHLIST'||activeWatchIds.has(a.assetId)).filter(a=>a.isin&&!holdings.some(h=>String(h.isin).toUpperCase()===String(a.isin).toUpperCase())).map(a=>({name:a.name,isin:a.isin,source:'LOCAL_STATE',excludeFromPortfolioTotals:true}));
  const dividends=(state.transactions||[]).filter(t=>t.type==='DIVIDEND').map(t=>{const a=byId.get(t.assetId)||{};return{date:t.date,isin:a.isin,net:Number(t.amount||0),gross:Number(t.grossAmount??t.amount??0),tax:Number(t.tax||0),broker:t.broker||a.broker||'LOCAL'};}).filter(d=>d.isin);
  const cashValue=snapshot?.effectiveProfile?.cashMode==='TRACKED'?Number(snapshot?.cash||0):0;
  const cash=cashValue?[{broker:'LOCAL',name:'Lokaler Cashbestand',currency:'EUR',value:cashValue}]:[];
  const total=holdings.reduce((s,h)=>s+h.currentValue,0)+cashValue;
  const accountTotal=b=>holdings.filter(h=>h.broker===b).reduce((s,h)=>s+h.currentValue,0)+(b==='SCALABLE'?cashValue:0);
  const stamp=state.appMeta?.parqetImport?.generatedAt||state.dataStatus?.portfolio?.asOf||new Date().toISOString();
  return{schemaVersion:2,generatedAt:stamp,source:'HPOS_LOCAL_STATE',sourcePortfolio:{id:null,name:'Lokaler HPOS-State',currency:'EUR'},accounts:[{id:'ALL',name:'Gesamtdepot',broker:'ALL'},{id:'SCALABLE',name:'Scalable Capital',broker:'SCALABLE'},{id:'TRADE_REPUBLIC',name:'Trade Republic',broker:'TRADE_REPUBLIC'},{id:'WATCHLIST',name:'Watchlist',broker:'WATCHLIST',excludeFromPortfolioTotals:true}],cash,holdings,watchlist,dividends,kpis:{importedPortfolioTotal:total,scalableTotal:accountTotal('SCALABLE'),tradeRepublicTotal:accountTotal('TRADE_REPUBLIC'),markerValueExcluded:0,parqetReportedTotal:total},reconciliation:{status:'LOCAL_ONLY',message:'Anzeige aus lokalem HPOS-State; keine öffentliche Depotdatei.'},privacyBoundary:'LOCAL_ONLY'};
}
window.fetch=function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  if(String(url).includes(RETIRED_SNAPSHOT433)){
    const body=JSON.stringify(localProjection433());
    return Promise.resolve(new Response(body,{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-HPOS-Privacy':'local-projection'}}));
  }
  return nativeFetch433(input,init);
};
window.HPOSLocalProjection433=localProjection433;
})();
