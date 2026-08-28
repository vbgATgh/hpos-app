import fs from 'node:fs';
import vm from 'node:vm';

globalThis.window=globalThis;
globalThis.document={querySelectorAll:()=>[],getElementById:()=>null};
globalThis.MutationObserver=class{constructor(){} observe(){}};
globalThis.setTimeout=()=>0;
vm.runInThisContext(fs.readFileSync('alpha41/alpha47.js','utf8'));
const {compare,choose,rotation}=globalThis.HPOSCapital47;
const dim=(v,known=true,higherIsBetter=true,label=String(v))=>({value:v,known,higherIsBetter,label});
const row=(key,{thesis=2,val=null,income=null,div=10,net=null,owned=false,eligible=true,state='NEUTRAL'}={})=>({
 assetKey:key,name:key,owned,eligible,evidenceState:state,
 dimensions:{
  THESIS_EVIDENCE:dim(thesis,thesis!==null,true),
  PORTFOLIO_FIT:dim(2,true,true),
  VALUATION:dim(val,val!==null,true),
  INCOME_QUALITY:dim(income,income!==null,true),
  DIVERSIFICATION:dim(div,true,false),
  NET_ECONOMIC_EFFECT:dim(net,net!==null,true)
 }
});

{
 const a=row('A',{thesis:3,div:5}),b=row('B',{thesis:2,div:10});
 const c=compare(a,b);
 if(!c.aDominates)throw new Error('A should Pareto-dominate B on known dimensions');
 const x=choose([a,b]);
 if(x.outcome!=='BEST_NEW_MONEY_DESTINATION'||x.best.assetKey!=='A')throw new Error('unique undominated A expected');
}
{
 const a=row('A',{thesis:3,val:null,div:15}),b=row('B',{thesis:2,val:4,div:5});
 const c=compare(a,b);
 if(c.aDominates||c.bDominates)throw new Error('trade-off must not create fake dominance');
 if(choose([a,b]).outcome!=='NO_CLEAR_ADVANTAGE')throw new Error('trade-off should wait');
}
{
 const a=row('A',{thesis:3}),b=row('B',{thesis:2,eligible:false});
 if(compare(a,b).aDominates)throw new Error('ineligible opponent must not be treated as comparable dominance target');
}
{
 const src=row('SRC',{thesis:1,div:20,net:null,owned:true,state:'WEAKENING'}),dst=row('DST',{thesis:3,div:5,net:null});
 const r=rotation([src,dst]);
 if(r.outcome!=='NONE')throw new Error('rotation must fail closed without known net economic effect');
}
{
 const src=row('SRC',{thesis:1,div:20,net:0,owned:true,state:'WEAKENING'}),dst=row('DST',{thesis:3,div:5,net:1});
 const r=rotation([src,dst]);
 if(r.outcome!=='BEST_ROTATION')throw new Error('rotation should be eligible with thesis + diversification + net benefit');
}
console.log('Alpha 4.7 Pareto allocation logic: OK');
