import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const APP_ORIGIN="https://vbgatgh.github.io";
const Y1="https://query1.finance.yahoo.com";
const Y2="https://query2.finance.yahoo.com";
const OFFICIAL_PROFILES:Record<string,{name:string;sector:string;industry:string;businessSummary:string;website:string;country:string;profileSource:string;profileUrl:string}>={
  "CJ.TO":{
    name:"Cardinal Energy Ltd.",
    sector:"Energy",
    industry:"Oil & Gas Exploration & Production",
    businessSummary:"Canadian oil and natural gas producer focused on acquiring, exploring and producing low-decline assets in Alberta, British Columbia and Saskatchewan.",
    website:"https://cardinalenergy.ca/",
    country:"Canada",
    profileSource:"CARDINAL_ENERGY_OFFICIAL",
    profileUrl:"https://cardinalenergy.ca/"
  }
};

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("Origin")||"";
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(origin!==APP_ORIGIN)return json({error:"origin_not_allowed"},403,origin);
  try{
    const u=new URL(req.url),symbol=String(u.searchParams.get("symbol")||"").trim().toUpperCase();
    if(!/^[A-Z0-9.^=\-]{1,24}$/.test(symbol))return json({error:"symbol_invalid"},400,origin);
    return json(await loadProfile(symbol),200,origin);
  }catch(e){
    console.error("hpos-profile",String((e as any)?.message||e));
    return json({error:"profile_unavailable"},502,origin);
  }
});

async function loadProfile(symbol:string){
  const official=OFFICIAL_PROFILES[symbol];
  const modules="assetProfile,price,summaryDetail,defaultKeyStatistics,financialData,balanceSheetHistory,balanceSheetHistoryQuarterly,incomeStatementHistory,incomeStatementHistoryQuarterly,cashflowStatementHistory,cashflowStatementHistoryQuarterly";
  for(const base of [Y1,Y2]){
    try{
      const url=`${base}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`;
      const r=await fetch(url,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});
      if(!r.ok)continue;
      const d=await r.json(),root=d?.quoteSummary?.result?.[0]; if(!root)continue;
      const a=root.assetProfile||{},p=root.price||{},s=root.summaryDetail||{},k=root.defaultKeyStatistics||{},f=root.financialData||{};
      const bs=latest(root.balanceSheetHistoryQuarterly?.balanceSheetStatements)||latest(root.balanceSheetHistory?.balanceSheetStatements)||{};
      const inc=latest(root.incomeStatementHistoryQuarterly?.incomeStatementHistory)||latest(root.incomeStatementHistory?.incomeStatementHistory)||{};
      const shares=num(k.sharesOutstanding?.raw??k.sharesOutstanding);
      const reportedMarketCap=num(p.marketCap?.raw??p.marketCap),point=reportedMarketCap>0?{value:reportedMarketCap,asOf:marketTimestamp(p.regularMarketTime?.raw??p.regularMarketTime),method:"YAHOO_REPORTED_MARKET_CAP_AT_CHECK",sourceUrl:url}:await pointMarketValue(symbol);
      const marketValueAtCheck=point.value,marketValueAsOf=point.asOf;
      const revenue=firstNum([inc.totalRevenue,f.totalRevenue]);
      const interestIncome=firstNum([inc.interestIncomeNonOperating,inc.interestIncome,inc.netInterestIncome]);
      const totalDebt=firstNum([bs.totalDebt,f.totalDebt,bs.longTermDebtAndFinanceLeaseObligation,bs.longTermDebt]);
      const cashOnly=firstNum([bs.cashAndCashEquivalents,bs.cash,f.totalCash]);
      const cashAndStInv=firstNum([bs.cashCashEquivalentsAndShortTermInvestments]);
      const shortInvest=firstNum([bs.otherShortTermInvestments,bs.investmentsAndOtherFinancialAssets,bs.availableForSaleSecurities]);
      const interestAssets=Math.max(cashAndStInv,Math.max(cashOnly,0)+Math.max(shortInvest,0));
      const valuationEvidence=buildValuationEvidence(root,url,p,f,shares);
      const baseProfile:any={
        symbol,name:String(p.longName||p.shortName||symbol),
        sector:String(a.sector||""),industry:String(a.industry||""),businessSummary:String(a.longBusinessSummary||""),
        employees:num(a.fullTimeEmployees),website:String(a.website||""),city:String(a.city||""),country:String(a.country||""),
        marketCap:marketValueAtCheck,sharesOutstanding:shares,marketValueAtCheck,marketValueAsOf,
        marketValueMethod:marketValueAtCheck>0?point.method:"UNAVAILABLE",currency:String(p.currency||s.currency||""),quoteType:String(p.quoteType||""),
        trailingPE:num(s.trailingPE?.raw??s.trailingPE),forwardPE:num(k.forwardPE?.raw??k.forwardPE),dividendYield:num(s.dividendYield?.raw??s.dividendYield),
        fiftyTwoWeekHigh:num(s.fiftyTwoWeekHigh?.raw??s.fiftyTwoWeekHigh),fiftyTwoWeekLow:num(s.fiftyTwoWeekLow?.raw??s.fiftyTwoWeekLow),
        revenue,totalDebt,totalCash:num(f.totalCash?.raw??f.totalCash),cashOnly,cashAndShortTermInvestments:cashAndStInv,
        shortTermInvestments:shortInvest,interestBearingAssetsUpperBound:interestAssets,interestIncome,
        totalCashPerShare:num(f.totalCashPerShare?.raw??f.totalCashPerShare),revenueGrowth:num(f.revenueGrowth?.raw??f.revenueGrowth),
        profitMargins:num(f.profitMargins?.raw??f.profitMargins),operatingMargins:num(f.operatingMargins?.raw??f.operatingMargins),
        debtToEquity:num(f.debtToEquity?.raw??f.debtToEquity),
        statementDate:dateOf(bs)||dateOf(inc)||"",source:"YAHOO_QUOTE_SUMMARY_UNOFFICIAL",
        profileSource:a.longBusinessSummary?"YAHOO_PROFILE":"",fetchedAt:new Date().toISOString(),valuationEvidence,
        metricSources:marketValueAtCheck>0?{marketValueAtCheck:{sourceType:"YAHOO_MARKET_CAP_AT_CHECK",sourceName:point.method==="YAHOO_REPORTED_MARKET_CAP_AT_CHECK"?"Yahoo Finance reported market capitalization":"Current price × latest reported ordinary shares",sourceUrl:point.sourceUrl,period:marketValueAsOf,label:"Marktwert am Prüftag"}}:{},
        dataQuality:{
          profile:!!a.longBusinessSummary,revenue:!!(inc.totalRevenue||f.totalRevenue),debt:!!(bs.totalDebt||f.totalDebt||bs.longTermDebtAndFinanceLeaseObligation||bs.longTermDebt),interestAssets:!!(bs.cashCashEquivalentsAndShortTermInvestments||bs.cashAndCashEquivalents||bs.cash||f.totalCash||bs.otherShortTermInvestments||bs.investmentsAndOtherFinancialAssets||bs.availableForSaleSecurities),
          interestIncome:!!(inc.interestIncomeNonOperating||inc.interestIncome||inc.netInterestIncome),marketValueAtCheck:marketValueAtCheck>0
        }
      };
      if(official){Object.assign(baseProfile,official);baseProfile.dataQuality.profile=true}
      if(!baseProfile.businessSummary){const wiki=await wikipediaProfile(baseProfile.name);if(wiki){baseProfile.businessSummary=wiki.summary;baseProfile.profileSource=wiki.source;baseProfile.profileUrl=wiki.url}}
      return baseProfile;
    }catch{}
  }
  const search=await yahooSearch(symbol); if(!search)throw new Error("profile_missing");
  const q=await yahooQuote(symbol),point=num(q?.marketCap)>0?{value:num(q?.marketCap),asOf:marketTimestamp(q?.regularMarketTime),method:"YAHOO_REPORTED_MARKET_CAP_AT_CHECK",sourceUrl:`${Y1}/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`}:await pointMarketValue(symbol),name=String(search.longname||search.shortname||q?.longName||q?.shortName||symbol),wiki=official?null:await wikipediaProfile(name);
  const pointPrice=num((point as any).price),derivedShares=num(q?.sharesOutstanding)||num((point as any).shares)||((point.value>0&&(num(q?.regularMarketPrice)||pointPrice)>0)?point.value/(num(q?.regularMarketPrice)||pointPrice):0),valuationEvidence=await timeseriesValuationEvidence(symbol,{...q,regularMarketPrice:num(q?.regularMarketPrice)||pointPrice,currency:String(q?.currency||(point as any).currency||"")},derivedShares),latestPeriod=valuationEvidence.periods?.[0]||{};
  return {symbol,name:official?.name||name,sector:official?.sector||String(search.sector||search.sectorDisp||""),industry:official?.industry||String(search.industry||search.industryDisp||""),
    businessSummary:official?.businessSummary||String(wiki?.summary||""),employees:0,website:official?.website||"",city:"",country:official?.country||"",marketCap:point.value,
    sharesOutstanding:derivedShares,marketValueAtCheck:point.value,marketValueAsOf:point.asOf,marketValueMethod:point.value>0?point.method:"UNAVAILABLE",currency:String(q?.currency||point.currency||""),
    quoteType:String(search.quoteType||q?.quoteType||""),revenue:num(latestPeriod.revenue),totalDebt:num(valuationEvidence.totalDebt),totalCash:num(valuationEvidence.totalCash),cashAndShortTermInvestments:num(valuationEvidence.totalCash),
    shortTermInvestments:0,interestBearingAssetsUpperBound:num(valuationEvidence.totalCash),interestIncome:0,valuationEvidence,
    source:"YAHOO_SEARCH_QUOTE_FALLBACK",profileSource:official?.profileSource||wiki?.source||"",profileUrl:official?.profileUrl||wiki?.url||"",fetchedAt:new Date().toISOString(),
    metricSources:point.value>0?{marketValueAtCheck:{sourceType:"YAHOO_MARKET_CAP_AT_CHECK",sourceName:point.method==="YAHOO_REPORTED_MARKET_CAP_AT_CHECK"?"Yahoo Finance reported market capitalization":"Current price × latest reported ordinary shares",sourceUrl:point.sourceUrl,period:point.asOf,label:"Marktwert am Prüftag"}}:{},
    dataQuality:{profile:!!(official?.businessSummary||wiki?.summary),revenue:num(latestPeriod.revenue)>0,debt:num(valuationEvidence.totalDebt)>0,interestAssets:num(valuationEvidence.totalCash)>0,interestIncome:false,marketValueAtCheck:point.value>0}};
}

async function pointMarketValue(symbol:string){
 const chartUrl=`${Y1}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`,period2=Math.floor(Date.now()/1000)+86400,period1=period2-5*366*86400;
 const sharesUrl=`${Y1}/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}?symbol=${encodeURIComponent(symbol)}&type=quarterlyOrdinarySharesNumber,annualOrdinarySharesNumber&period1=${period1}&period2=${period2}`;
 try{
   const [cr,sr]=await Promise.all([fetch(chartUrl,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}}),fetch(sharesUrl,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}})]);if(!cr.ok||!sr.ok)throw new Error("point_market_missing");
   const chart=await cr.json(),series=await sr.json(),x=chart?.chart?.result?.[0]||{},meta=x?.meta||{},closes=x?.indicators?.quote?.[0]?.close||[],price=num(meta.regularMarketPrice)||[...closes].reverse().map(num).find((v:number)=>v>0)||0;
   const rows=(Array.isArray(series?.timeseries?.result)?series.timeseries.result:[]).flatMap((row:any)=>{const type=Array.isArray(row?.meta?.type)?row.meta.type[0]:"";return Array.isArray(row?.[type])?row[type]:[]}).map((row:any)=>({value:num(row?.reportedValue?.raw),period:String(row?.asOfDate||"")})).filter((row:any)=>row.value>0&&row.period).sort((a:any,b:any)=>b.period.localeCompare(a.period));
   if(price>0&&rows[0])return{value:price*rows[0].value,price,shares:rows[0].value,currency:String(meta.currency||""),asOf:marketTimestamp(meta.regularMarketTime),method:"CURRENT_PRICE_X_LATEST_REPORTED_ORDINARY_SHARES",sourceUrl:chartUrl,sharesPeriod:rows[0].period};
 }catch{}
 return{value:0,price:0,shares:0,currency:"",asOf:new Date().toISOString(),method:"UNAVAILABLE",sourceUrl:chartUrl,sharesPeriod:""};
}

function latest(a:any[]){return Array.isArray(a)&&a.length?a[0]:null}
function buildValuationEvidence(root:any,sourceUrl:string,price:any,financial:any,currentShares:number){
 const incomeRows=Array.isArray(root?.incomeStatementHistory?.incomeStatementHistory)?root.incomeStatementHistory.incomeStatementHistory:[];
 const cashRows=Array.isArray(root?.cashflowStatementHistory?.cashflowStatements)?root.cashflowStatementHistory.cashflowStatements:[];
 const cashByPeriod=new Map<string,any>(cashRows.map((row:any)=>[dateOf(row),row]));
 const periods=incomeRows.map((income:any)=>{
   const periodEnd=dateOf(income),cash:any=cashByPeriod.get(periodEnd)||{},revenue=raw(income?.totalRevenue),netIncome=raw(income?.netIncome),operatingIncome=raw(income?.operatingIncome);
   const operatingCashFlow=firstNum([cash?.totalCashFromOperatingActivities,cash?.operatingCashFlow]),capitalExpenditure=Math.abs(firstNum([cash?.capitalExpenditures,cash?.capitalExpenditure]));
   const reportedFreeCashFlow=firstNum([cash?.freeCashFlow]),freeCashFlow=reportedFreeCashFlow||((operatingCashFlow>0&&capitalExpenditure>=0)?operatingCashFlow-capitalExpenditure:0);
   const dilutedAverageShares=firstNum([income?.dilutedAverageShares,income?.basicAverageShares])||currentShares;
   return{periodEnd,revenue,netIncome,operatingIncome,operatingCashFlow,capitalExpenditure,freeCashFlow,dilutedAverageShares};
 }).filter((row:any)=>row.periodEnd&&row.revenue>0).sort((a:any,b:any)=>b.periodEnd.localeCompare(a.periodEnd)).slice(0,4);
 return{
   schemaVersion:1,sourceTier:"MARKET_AGGREGATOR",sourceName:"Yahoo Finance annual statements",sourceUrl,currency:String(price?.currency||financial?.financialCurrency||""),
   observedAt:new Date().toISOString(),currentPrice:raw(price?.regularMarketPrice),sharesOutstanding:currentShares,totalDebt:raw(financial?.totalDebt),totalCash:raw(financial?.totalCash),
   revenueGrowth:raw(financial?.revenueGrowth),earningsGrowth:raw(financial?.earningsGrowth),operatingMargin:raw(financial?.operatingMargins),periods
 };
}
async function timeseriesValuationEvidence(symbol:string,quote:any,currentShares:number){
 const types=["annualTotalRevenue","annualNetIncome","annualOperatingIncome","annualOperatingCashFlow","annualCapitalExpenditure","annualFreeCashFlow","annualDilutedAverageShares","annualTotalDebt","annualCashCashEquivalentsAndShortTermInvestments"],period2=Math.floor(Date.now()/1000)+86400,period1=period2-6*366*86400,endpointUrl=`${Y1}/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}?symbol=${encodeURIComponent(symbol)}&type=${types.join(",")}&period1=${period1}&period2=${period2}`,sourceUrl=`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/financials/`;
 try{
  const r=await fetch(endpointUrl,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});if(!r.ok)throw new Error("valuation_timeseries_missing");const d=await r.json(),rows=Array.isArray(d?.timeseries?.result)?d.timeseries.result:[],byDate=new Map<string,any>(),latestByType=new Map<string,number>();
  for(const series of rows){const type=String(Array.isArray(series?.meta?.type)?series.meta.type[0]:""),items=Array.isArray(series?.[type])?series[type]:[];for(const item of items){const periodEnd=String(item?.asOfDate||"");const value=num(item?.reportedValue?.raw);if(!periodEnd||!Number.isFinite(value))continue;latestByType.set(type,value);if(!type.startsWith("annual")||["annualTotalDebt","annualCashCashEquivalentsAndShortTermInvestments"].includes(type))continue;const row=byDate.get(periodEnd)||{periodEnd};row[type]=value;byDate.set(periodEnd,row)}}
  const periods=[...byDate.values()].map((x:any)=>{const operatingCashFlow=num(x.annualOperatingCashFlow),capitalExpenditure=Math.abs(num(x.annualCapitalExpenditure)),reportedFcf=num(x.annualFreeCashFlow);return{periodEnd:x.periodEnd,revenue:num(x.annualTotalRevenue),netIncome:num(x.annualNetIncome),operatingIncome:num(x.annualOperatingIncome),operatingCashFlow,capitalExpenditure,freeCashFlow:reportedFcf||((operatingCashFlow>0)?operatingCashFlow-capitalExpenditure:0),dilutedAverageShares:num(x.annualDilutedAverageShares)||currentShares}}).filter((x:any)=>x.revenue>0).sort((a:any,b:any)=>b.periodEnd.localeCompare(a.periodEnd)).slice(0,4);
  return{schemaVersion:1,sourceTier:"MARKET_AGGREGATOR",sourceName:"Yahoo Finance annual fundamentals time series",sourceUrl,currency:String(quote?.currency||""),observedAt:new Date().toISOString(),currentPrice:num(quote?.regularMarketPrice),sharesOutstanding:currentShares,totalDebt:num(latestByType.get("annualTotalDebt")),totalCash:num(latestByType.get("annualCashCashEquivalentsAndShortTermInvestments")),revenueGrowth:num(quote?.revenueGrowth),earningsGrowth:num(quote?.earningsGrowth),operatingMargin:0,periods};
 }catch{return{schemaVersion:1,sourceTier:"MARKET_AGGREGATOR",sourceName:"Yahoo Finance annual fundamentals time series",sourceUrl,currency:String(quote?.currency||""),observedAt:new Date().toISOString(),currentPrice:num(quote?.regularMarketPrice),sharesOutstanding:currentShares,totalDebt:0,totalCash:0,revenueGrowth:0,earningsGrowth:0,operatingMargin:0,periods:[]}}
}
function raw(v:any){return num(v?.raw??v)}
function firstNum(xs:any[]){for(const x of xs){const n=raw(x);if(Number.isFinite(n)&&n!==0)return n}return 0}
function dateOf(x:any){const t=x?.endDate?.raw??x?.endDate;if(!t)return"";const n=Number(t);return Number.isFinite(n)?new Date(n*1000).toISOString().slice(0,10):String(t)}
function marketTimestamp(v:any){const n=Number(v?.raw??v);return Number.isFinite(n)&&n>0?new Date(n*1000).toISOString():new Date().toISOString()}
async function yahooSearch(symbol:string){for(const base of [Y1,Y2]){try{const r=await fetch(`${base}/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=8&newsCount=0`,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});if(!r.ok)continue;const d=await r.json(),rows=Array.isArray(d?.quotes)?d.quotes:[],exact=rows.find((q:any)=>String(q?.symbol||"").toUpperCase()===symbol);if(exact)return exact;if(rows[0])return rows[0]}catch{}}return null}
async function yahooQuote(symbol:string){for(const base of [Y1,Y2]){try{const r=await fetch(`${base}/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});if(!r.ok)continue;const d=await r.json(),x=d?.quoteResponse?.result?.[0];if(x)return x}catch{}}return null}
async function wikipediaProfile(companyName:string){
 const query=cleanCompanyName(companyName);if(!query)return null;
 for(const lang of ["de","en"]){try{const api=`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*`;const r=await fetch(api,{headers:{Accept:"application/json","User-Agent":"HPOS/1.0 company-profile"}});if(!r.ok)continue;const d=await r.json(),rows=Array.isArray(d?.query?.search)?d.query.search:[],candidate=rows.find((x:any)=>titleMatches(query,String(x?.title||"")));if(!candidate?.title)continue;const sr=await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate.title)}`,{headers:{Accept:"application/json","User-Agent":"HPOS/1.0 company-profile"}});if(!sr.ok)continue;const s=await sr.json(),extract=String(s?.extract||"").replace(/\s+/g," ").trim();if(!extract||!summaryLooksCorporate(extract,query))continue;return{summary:extract.slice(0,900),source:`WIKIPEDIA_${lang.toUpperCase()}`,url:String(s?.content_urls?.desktop?.page||"")}}catch{}}return null}
function cleanCompanyName(v:string){return String(v||"").replace(/\b(AG|SE|PLC|LTD\.?|LIMITED|INC\.?|CORPORATION|CORP\.?|COMPANY|CO\.?|NV|SA|S\.A\.|HOLDINGS?)\b/gi," ").replace(/\s+/g," ").trim()}
function titleMatches(q:string,t:string){const a=normWords(q),b=normWords(t);if(!a.length||!b.length)return false;return a.some(w=>w.length>=3&&b.includes(w))}
function normWords(v:string){return String(v||"").toLowerCase().replace(/[^a-z0-9äöüß]+/gi," ").split(/\s+/).filter(Boolean)}
function summaryLooksCorporate(x:string,q:string){const low=x.toLowerCase(),words=normWords(q).filter(w=>w.length>=3);if(words.length&&!words.some(w=>low.includes(w)))return false;return /(unternehmen|hersteller|konzern|gesellschaft|firma|company|manufacturer|corporation|business|technology|software|automotive|pharmaceutical|retailer|provider|mining|energy|healthcare|chemicals)/i.test(x)}
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:0}
function cors(o:string){return{"Access-Control-Allow-Origin":o===APP_ORIGIN?APP_ORIGIN:"","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"public, max-age=3600","Vary":"Origin"}}
function json(d:unknown,status:number,o:string){return new Response(JSON.stringify(d),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors(o)}})}
