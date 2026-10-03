(()=>{'use strict';
const VERSION='1.0.0';
const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const positive=v=>finite(v)&&Number(v)>0;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const round=(v,d=2)=>Number(Number(v).toFixed(d));
function median(values){const a=values.filter(finite).map(Number).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function fingerprint(e){const stable={schemaVersion:e.schemaVersion||1,sourceTier:e.sourceTier||'',sourceName:e.sourceName||'',sourceUrl:e.sourceUrl||'',currency:e.currency||'',sharesOutstanding:finite(e.sharesOutstanding)?Number(e.sharesOutstanding):null,totalDebt:finite(e.totalDebt)?Number(e.totalDebt):null,totalCash:finite(e.totalCash)?Number(e.totalCash):null,revenueGrowth:finite(e.revenueGrowth)?Number(e.revenueGrowth):null,earningsGrowth:finite(e.earningsGrowth)?Number(e.earningsGrowth):null,operatingMargin:finite(e.operatingMargin)?Number(e.operatingMargin):null,periods:(Array.isArray(e.periods)?e.periods:[]).map(p=>({periodEnd:p.periodEnd||'',revenue:finite(p.revenue)?Number(p.revenue):null,netIncome:finite(p.netIncome)?Number(p.netIncome):null,operatingIncome:finite(p.operatingIncome)?Number(p.operatingIncome):null,operatingCashFlow:finite(p.operatingCashFlow)?Number(p.operatingCashFlow):null,capitalExpenditure:finite(p.capitalExpenditure)?Number(p.capitalExpenditure):null,freeCashFlow:finite(p.freeCashFlow)?Number(p.freeCashFlow):null,dilutedAverageShares:finite(p.dilutedAverageShares)?Number(p.dilutedAverageShares):null}))};let h=2166136261;for(const ch of JSON.stringify(stable)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return 'FV-'+(h>>>0).toString(16).padStart(8,'0').toUpperCase()}
function evaluate(profile={}){
 const e=profile?.valuationEvidence||{},periods=(Array.isArray(e.periods)?e.periods:[]).filter(p=>p&&positive(p.revenue)).sort((a,b)=>String(b.periodEnd||'').localeCompare(String(a.periodEnd||''))).slice(0,4),missing=[];
 const source={tier:String(e.sourceTier||''),name:String(e.sourceName||''),url:String(e.sourceUrl||''),observedAt:String(e.observedAt||''),currency:String(e.currency||profile.currency||'')},evidenceFingerprint=fingerprint(e);
 if(periods.length<2)missing.push('mindestens zwei vollständige Geschäftsjahre');
 if(!source.url)missing.push('nachvollziehbare Bewertungsquelle');
 const eps=median(periods.slice(0,3).map(p=>positive(p.netIncome)&&positive(p.dilutedAverageShares)?Number(p.netIncome)/Number(p.dilutedAverageShares):null));
 const fcfps=median(periods.slice(0,3).map(p=>positive(p.freeCashFlow)&&positive(p.dilutedAverageShares)?Number(p.freeCashFlow)/Number(p.dilutedAverageShares):null));
 if(!positive(eps))missing.push('positive Gewinne je Aktie');
 if(!positive(fcfps))missing.push('positiver Free Cashflow je Aktie');
 const latest=periods[0]||{},oldest=periods[periods.length-1]||{},steps=Math.max(1,periods.length-1),derivedGrowth=positive(latest.revenue)&&positive(oldest.revenue)?Math.pow(Number(latest.revenue)/Number(oldest.revenue),1/steps)-1:null;
 const growth=clamp(median([derivedGrowth,finite(e.revenueGrowth)?Number(e.revenueGrowth):null])??0,-0.05,0.20);
 const margin=clamp(positive(latest.revenue)&&finite(latest.operatingIncome)?Number(latest.operatingIncome)/Number(latest.revenue):(finite(e.operatingMargin)?Number(e.operatingMargin):0),-0.10,0.35);
 const shares=positive(e.sharesOutstanding)?Number(e.sharesOutstanding):(positive(latest.dilutedAverageShares)?Number(latest.dilutedAverageShares):0),netDebt=Math.max(0,(finite(e.totalDebt)?Number(e.totalDebt):0)-(finite(e.totalCash)?Number(e.totalCash):0)),normalizedFcf=positive(fcfps)&&positive(shares)?Number(fcfps)*shares:0,leverage=normalizedFcf>0?netDebt/normalizedFcf:0;
 if(missing.length)return{status:'INSUFFICIENT',modelVersion:VERSION,reviewRequired:true,evidenceFingerprint,source,missing,reason:'Bewertung offen: '+missing.join(', ')+'.',bands:null,inputs:{periodCount:periods.length,growth:round(growth,4),operatingMargin:round(margin,4),netDebtToFcf:round(leverage,2)}};
 const growthPoints=clamp(growth*40,-2,8),marginPoints=clamp(margin*12,-1,4),leveragePenalty=clamp(Math.max(0,leverage-1)*1.2,0,6),earningsMultiple=clamp(12+growthPoints+marginPoints-leveragePenalty,8,26),fcfMultiple=clamp(11+growthPoints+marginPoints-leveragePenalty,7,24);
 const earningsValue=Number(eps)*earningsMultiple,fcfValue=Number(fcfps)*fcfMultiple,fairValue=median([earningsValue,fcfValue]),unofficial=source.tier!=='OFFICIAL',safetyMargin=clamp(0.20+(periods.length<3?0.05:0)+(leverage>3?0.05:0)+(unofficial?0.05:0),0.20,0.40);
 const bands={fairValue:round(fairValue),fairLow:round(fairValue*0.90),fairHigh:round(fairValue*1.10),buyZone1Upper:round(fairValue*(1-safetyMargin)),buyZone2Upper:round(fairValue*Math.max(0.45,1-safetyMargin-0.10)),safetyMargin:round(safetyMargin,4)},price=positive(e.currentPrice)?Number(e.currentPrice):null;
 const zone=price===null?'PRICE_OPEN':price<=bands.buyZone2Upper?'BUY_ZONE_2':price<=bands.buyZone1Upper?'BUY_ZONE_1':price<=bands.fairHigh&&price>=bands.fairLow?'FAIR':price<bands.fairLow?'BELOW_FAIR':'DEMANDING';
 return{status:'COMPLETE',modelVersion:VERSION,reviewRequired:unofficial,evidenceFingerprint,source,zone,currentPrice:price,bands,inputs:{periodCount:periods.length,normalizedEps:round(eps,4),normalizedFcfPerShare:round(fcfps,4),growth:round(growth,4),operatingMargin:round(margin,4),netDebtToFcf:round(leverage,2),earningsMultiple:round(earningsMultiple,1),fcfMultiple:round(fcfMultiple,1)},components:{earningsValue:round(earningsValue),fcfValue:round(fcfValue)},reason:'Fair Value aus normalisiertem Gewinn und Free Cashflow; Wachstum, operative Marge, Verschuldung und Sicherheitsabschlag sind explizit berücksichtigt.'}
}
window.HPOS_VALUATION_ENGINE=Object.freeze({version:VERSION,evaluate});
})();
