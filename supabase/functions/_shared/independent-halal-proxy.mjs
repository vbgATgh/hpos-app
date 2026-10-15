/** Independent Halal Verification Engine v0.1: JS port of supplied Python proxy.
 * NOT a certified AAOIFI ruling; no trade authorization. Source data must be
 * independently verified by the server before this result may be relied on.
 */
export const FRAMEWORK="HPOS-AAOIFI-inspired proxy v0.1 (not certified AAOIFI ruling)";
export const PROXY_THRESHOLDS=Object.freeze({debt:30,cash:30,receivables:30,impermissibleIncome:5});
const required=["company","period","source_url","source_date","revenue","market_cap","interest_bearing_debt","cash_and_interest_investments","receivables","impermissible_income"];
function validAmount(n){return typeof n==="number"&&Number.isFinite(n)&&n>=0;}
function ratio(n,d){return validAmount(n)&&validAmount(d)&&d>0?Math.round(n/d*100000)/1000:null;}
function check(name,value,limit){return {name,ratio_pct:value,threshold_pct:limit,status:value===null?"WAIT":value<limit?"PASS":"FAIL"};}
export function assessIndependentProxy(input,asof=new Date().toISOString().slice(0,10)){
 const x=input&&typeof input==="object"?input:{};
 const missing=required.filter(k=>x[k]===null||x[k]===undefined||x[k]==="");
 const invalid=["revenue","market_cap","interest_bearing_debt","cash_and_interest_investments","receivables","impermissible_income"].filter(k=>x[k]!==null&&x[k]!==undefined&&!validAmount(x[k]));
 const market=validAmount(x.market_cap)?x.market_cap:null,revenue=validAmount(x.revenue)?x.revenue:null;
 const tests=[
 check("interest_bearing_debt / market_cap",ratio(x.interest_bearing_debt,market),30),
 check("cash_and_interest_investments / market_cap",ratio(x.cash_and_interest_investments,market),30),
 check("receivables / market_cap",ratio(x.receivables,market),30),
 check("impermissible_income / revenue",ratio(x.impermissible_income,revenue),5)
 ];
 const activity=["PASS","FAIL","WAIT"].includes(x.business_activity_status)?x.business_activity_status:"WAIT";
 // Bad input cannot create a decisive outcome. All four ratios are proxies only.
 const gate=invalid.length?"REVIEW":tests.some(t=>t.status==="FAIL")||activity==="FAIL"?"HARD_FAIL":missing.length||tests.some(t=>t.status==="WAIT")||activity!=="PASS"||!x.market_cap_asof||!x.activity_evidence?"WAIT_EVIDENCE":"PASS_PRELIMINARY";
 return {company:x.company??null,screening_framework:FRAMEWORK,asof,period:x.period??null,source_url:x.source_url??null,market_cap_asof:x.market_cap_asof??null,missing_fields:missing,invalid_fields:invalid,tests,business_activity_status:activity,halal_gate:gate,warning:"A final Sharia ruling requires exact methodology, income classification, debt definitions, up-to-date market capitalization and documented business review."};
}
