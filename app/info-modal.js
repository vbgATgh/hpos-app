(()=>{'use strict';
const $=s=>document.querySelector(s);
function ensure(){
 let d=$('#infoDialog'); if(d) return d;
 d=document.createElement('dialog'); d.id='infoDialog'; d.className='sheet infoSheet';
 d.innerHTML='<div class="sheetHead"><div><div class="eye" id="infoEye">Info</div><h2 id="infoTitle">Details</h2></div><button class="close" id="infoClose" aria-label="Schließen">×</button></div><div id="infoBody" class="infoDialogBody"></div>';
 document.body.appendChild(d);
 $('#infoClose').onclick=()=>d.close();
 d.addEventListener('click',e=>{if(e.target===d)d.close()});
 return d;
}
function open(title,html,eye='Info'){const d=ensure();$('#infoTitle').textContent=title||'Details';$('#infoEye').textContent=eye;$('#infoBody').innerHTML=html||'';if(!d.open)d.showModal()}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-info-title]'); if(!b)return;
 e.preventDefault(); e.stopPropagation();
 open(b.dataset.infoTitle,b.dataset.infoHtml||'',b.dataset.infoEye||'Info');
},true);
window.HPOS_INFO_MODAL=Object.freeze({open});
})();
