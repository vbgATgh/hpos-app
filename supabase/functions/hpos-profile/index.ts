import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const APP_ORIGIN="https://vbgatgh.github.io";
const Y1="https://query1.finance.yahoo.com";
const Y2="https://query2.finance.yahoo.com";

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
  const modules="assetProfile,price,summaryDetail,defaultKeyStatistics,financialData,balanceSheetHistory,balanceSheetHistoryQuarterly,incomeStatementHistory,incomeStatementHistoryQuarterly";
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
      const mv36=await avgMarketValue36m(symbol,shares);
      const revenue=firstNum([inc.totalRevenue,f.totalRevenue]);
      const interestIncome=firstNum([inc.interestIncomeNonOperating,inc.interestIncome,inc.netInterestIncome]);
      const totalDebt=firstNum([bs.totalDebt,f.totalDebt,bs.longTermDebtAndFinanceLeaseObligation,bs.longTermDebt]);
      const cashOnly=firstNum([bs.cashAndCashEquivalents,bs.cash,f.totalCash]);
      const cashAndStInv=firstNum([bs.cashCashEquivalentsAndShortTermInvestments]);
      const shortInvest=firstNum([bs.otherShortTermInvestments,bs.investmentsAndOtherFinancialAssets,bs.availableForSaleSecurities]);
      const interestAssets=Math.max(cashAndStInv,Math.max(cashOnly,0)+Math.max(shortInvest,0));
      const baseProfile:any={
        symbol,name:String(p.longName||p.shortName||symbol),
        sector:String(a.sector||""),industry:String(a.industry||""),businessSummary:String(a.longBusinessSummary||""),
        employees:num(a.fullTimeEmployees),website:String(a.website||""),city:String(a.city||""),country:String(a.country||""),
        marketCap:num(p.marketCap?.raw??p.marketCap),sharesOutstanding:shares,marketValue36mAvg:mv36.value,marketValue36mMonths:mv36.months,
        marketValue36mMethod:mv36.method,currency:String(p.currency||s.currency||""),quoteType:String(p.quoteType||""),
        trailingPE:num(s.trailingPE?.raw??s.trailingPE),forwardPE:num(k.forwardPE?.raw??k.forwardPE),dividendYield:num(s.dividendYield?.raw??s.dividendYield),
        fiftyTwoWeekHigh:num(s.fiftyTwoWeekHigh?.raw??s.fiftyTwoWeekHigh),fiftyTwoWeekLow:num(s.fiftyTwoWeekLow?.raw??s.fiftyTwoWeekLow),
        revenue,totalDebt,totalCash:num(f.totalCash?.raw??f.totalCash),cashOnly,cashAndShortTermInvestments:cashAndStInv,
        shortTermInvestments:shortInvest,interestBearingAssetsUpperBound:interestAssets,interestIncome,
        totalCashPerShare:num(f.totalCashPerShare?.raw??f.totalCashPerShare),revenueGrowth:num(f.revenueGrowth?.raw??f.revenueGrowth),
        profitMargins:num(f.profitMargins?.raw??f.profitMargins),operatingMargins:num(f.operatingMargins?.raw??f.operatingMargins),
        debtToEquity:num(f.debtToEquity?.raw??f.debtToEquity),
        statementDate:dateOf(bs)||dateOf(inc)||"",source:"YAHOO_QUOTE_SUMMARY_UNOFFICIAL",
        profileSource:a.longBusinessSummary?"YAHOO_PROFILE":"",fetchedAt:new Date().toISOString(),
        dataQuality:{
          profile:!!a.longBusinessSummary,revenue:!!(inc.totalRevenue||f.totalRevenue),debt:!!(bs.totalDebt||f.totalDebt||bs.longTermDebtAndFinanceLeaseObligation||bs.longTermDebt),interestAssets:!!(bs.cashCashEquivalentsAndShortTermInvestments||bs.cashAndCashEquivalents||bs.cash||f.totalCash||bs.otherShortTermInvestments||bs.investmentsAndOtherFinancialAssets||bs.availableForSaleSecurities),
          interestIncome:!!(inc.interestIncomeNonOperating||inc.interestIncome||inc.netInterestIncome),marketValue36m:mv36.months>=30
        }
      };
      if(!baseProfile.businessSummary){const wiki=await wikipediaProfile(baseProfile.name);if(wiki){baseProfile.businessSummary=wiki.summary;baseProfile.profileSource=wiki.source;baseProfile.profileUrl=wiki.url}}
      return baseProfile;
    }catch{}
  }
  const search=await yahooSearch(symbol); if(!search)throw new Error("profile_missing");
  const q=await yahooQuote(symbol),name=String(search.longname||search.shortname||q?.longName||q?.shortName||symbol),wiki=await wikipediaProfile(name);
  return {symbol,name,sector:String(search.sector||search.sectorDisp||""),industry:String(search.industry||search.industryDisp||""),
    businessSummary:String(wiki?.summary||""),employees:0,website:"",city:"",country:"",marketCap:num(q?.marketCap),
    sharesOutstanding:num(q?.sharesOutstanding),marketValue36mAvg:0,marketValue36mMonths:0,currency:String(q?.currency||""),
    quoteType:String(search.quoteType||q?.quoteType||""),revenue:0,totalDebt:0,totalCash:0,cashAndShortTermInvestments:0,
    shortTermInvestments:0,interestBearingAssetsUpperBound:0,interestIncome:0,
    source:"YAHOO_SEARCH_QUOTE_FALLBACK",profileSource:wiki?.source||"",profileUrl:wiki?.url||"",fetchedAt:new Date().toISOString(),
    dataQuality:{profile:!!wiki?.summary,revenue:false,debt:false,interestAssets:false,interestIncome:false,marketValue36m:false}};
}

async function avgMarketValue36m(symbol:string,shares:number){
 if(!(shares>0))return{value:0,months:0,method:"UNAVAILABLE"};
 for(const base of [Y1,Y2]){
    try{
      const r=await fetch(`${base}/v8/finance/chart/${encodeURIComponent(symbol)}?range=3y&interval=1mo&events=history`,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});
      if(!r.ok)continue; const d=await r.json(),x=d?.chart?.result?.[0],cl=x?.indicators?.adjclose?.[0]?.adjclose||x?.indicators?.quote?.[0]?.close||[];
      const vals=(Array.isArray(cl)?cl:[]).map((v:any)=>num(v)).filter((v:number)=>v>0).slice(-36);
      if(vals.length){return{value:(vals.reduce((a:number,b:number)=>a+b,0)/vals.length)*shares,months:vals.length,method:"MONTHLY_PRICE_X_CURRENT_SHARES_APPROX"}}
    }catch{}
  }
  return{value:0,months:0,method:"UNAVAILABLE"};
}
function latest(a:any[]){return Array.isArray(a)&&a.length?a[0]:null}
function raw(v:any){return num(v?.raw??v)}
function firstNum(xs:any[]){for(const x of xs){const n=raw(x);if(Number.isFinite(n)&&n!==0)return n}return 0}
function dateOf(x:any){const t=x?.endDate?.raw??x?.endDate;if(!t)return"";const n=Number(t);return Number.isFinite(n)?new Date(n*1000).toISOString().slice(0,10):String(t)}
async function yahooSearch(symbol:string){for(const base of [Y1,Y2]){try{const r=await fetch(`${base}/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=8&newsCount=0`,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});if(!r.ok)continue;const d=await r.json(),rows=Array.isArray(d?.quotes)?d.quotes:[],exact=rows.find((q:any)=>String(q?.symbol||"").toUpperCase()===symbol);if(exact)return exact;if(rows[0])return rows[0]}catch{}}return null}
async function yahooQuote(symbol:string){for(const base of [Y1,Y2]){try{const r=await fetch(`${base}/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0 HPOS/1.0"}});if(!r.ok)continue;const d=await r.json(),x=d?.quoteResponse?.result?.[0];if(x)return x}catch{}}return null}
async function wikipediaProfile(companyName:string){
 const query=cleanCompanyName(companyName);if(!query)return null;
 for(const lang of ["de","en"]){try{const api=`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*`;const r=await fetch(api,{headers:{Accept:"application/json","User-Agent":"HPOS/1.0 company-profile"}});if(!r.ok)continue;const d=await r.json(),rows=Array.isArray(d?.query?.search)?d.query.search:[],candidate=rows.find((x:any)=>titleMatches(query,String(x?.title||"")))||rows[0];if(!candidate?.title)continue;const sr=await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate.title)}`,{headers:{Accept:"application/json","User-Agent":"HPOS/1.0 company-profile"}});if(!sr.ok)continue;const s=await sr.json(),extract=String(s?.extract||"").replace(/\s+/g," ").trim();if(!extract||!summaryLooksCorporate(extract,query))continue;return{summary:extract.slice(0,900),source:`WIKIPEDIA_${lang.toUpperCase()}`,url:String(s?.content_urls?.desktop?.page||"")}}catch{}}return null}
function cleanCompanyName(v:string){return String(v||"").replace(/\b(AG|SE|PLC|LTD\.?|LIMITED|INC\.?|CORPORATION|CORP\.?|COMPANY|CO\.?|NV|SA|S\.A\.|HOLDINGS?)\b/gi," ").replace(/\s+/g," ").trim()}
function titleMatches(q:string,t:string){const a=normWords(q),b=normWords(t);if(!a.length||!b.length)return false;return a.some(w=>w.length>=3&&b.includes(w))}
function normWords(v:string){return String(v||"").toLowerCase().replace(/[^a-z0-9äöüß]+/gi," ").split(/\s+/).filter(Boolean)}
function summaryLooksCorporate(x:string,q:string){const low=x.toLowerCase(),words=normWords(q).filter(w=>w.length>=3);if(words.length&&!words.some(w=>low.includes(w)))return false;return /(unternehmen|hersteller|konzern|gesellschaft|firma|company|manufacturer|corporation|business|technology|software|automotive|pharmaceutical|retailer|provider|mining|energy|healthcare|chemicals)/i.test(x)}
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:0}
function cors(o:string){return{"Access-Control-Allow-Origin":o===APP_ORIGIN?APP_ORIGIN:"","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"public, max-age=3600","Vary":"Origin"}}
function json(d:unknown,status:number,o:string){return new Response(JSON.stringify(d),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors(o)}})}
