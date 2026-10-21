// Genera PDF real (A4, multipágina) del documento y lo comparte
const slug=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'cliente';
function docInfo(){const c=S.cli,val=!S.zonas.some(z=>+z.precio>0),num='TP-'+(c.fecha||'').replace(/-/g,'')+'-'+(c.nombre||'X').slice(0,3).toUpperCase();
 return{c,val,num,name:`${val?'Valoracion':'Presupuesto'}-${slug(c.nombre)}-${num}.pdf`,tit:val?'Valoración técnica':'Presupuesto'}}
function loading(on,t){let d=$('#loadov');if(!on){d&&d.remove();return}if(!d){d=document.createElement('div');d.id='loadov';document.body.appendChild(d)}d.innerHTML=`<div><div class="spin"></div><b>${t||'Generando PDF…'}</b></div>`}
async function makePDF(){
 const src=$('.doc');const W=794,H=Math.round(W*297/210),M=0;// px a 96dpi
 const box=document.createElement('div');box.style.cssText=`position:fixed;left:-10000px;top:0;width:${W}px;background:#fff`;
 const cl=src.cloneNode(true);box.className='pdfmode';const oc=src.querySelectorAll('canvas');cl.querySelectorAll('canvas').forEach((c,i)=>{const im=new Image();im.src=oc[i].toDataURL();im.style.cssText='width:100%;height:100%;display:block';c.replaceWith(im)});cl.style.cssText='box-shadow:none;max-width:none;width:'+W+'px;margin:0;padding:45px';box.appendChild(cl);document.body.appendChild(box);
 await Promise.all([...cl.querySelectorAll('img')].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
 // puntos de corte: no partir zonas, filas, cajas
 const top0=cl.getBoundingClientRect().top,blocks=[...cl.querySelectorAll('.dh,.box,.hotsum,.z,tr,.firmas,h3')].map(e=>{const r=e.getBoundingClientRect();return[r.top-top0,r.bottom-top0]});const ub=cl.querySelector('.ubic'),ubY=ub?ub.getBoundingClientRect().top-top0-10:-1;
 const sc=2,cv=await html2canvas(cl,{scale:sc,backgroundColor:'#fff',useCORS:true,logging:false});box.remove();
 const total=cv.height/sc,pdf=new jspdf.jsPDF({unit:'px',format:[W,H],hotfixes:['px_scaling'],compress:true});
 let y=0,pg=0;while(y<total-2){let end=Math.min(y+H,total);
  if(end<total){const cut=blocks.filter(([a,b])=>a<end&&b>end&&a>y+60).map(([a])=>a);if(cut.length)end=Math.min(...cut)-4}
  if(ubY>y+20&&ubY<end)end=ubY;
  const h=end-y,pc=document.createElement('canvas');pc.width=cv.width;pc.height=Math.ceil(h*sc);const ctx=pc.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,pc.width,pc.height);ctx.drawImage(cv,0,-y*sc);
  if(pg++)pdf.addPage([W,H]);pdf.addImage(pc.toDataURL('image/jpeg',.82),'JPEG',0,0,W,h,undefined,'FAST');
  pdf.setFontSize(9);pdf.setTextColor(150);pdf.text(`Página ${pg}`,W-60,H-14);y=end}
 return pdf.output('blob');
}
// ---- PDF pre-generado (para compartir dentro del gesto del usuario) ----
const PDFC={file:null,url:null,busy:null,tok:0,t:null};
function invalidatePDF(){PDFC.tok++;PDFC.file=null;if(PDFC.url){const u=PDFC.url;setTimeout(()=>URL.revokeObjectURL(u),60000)}PDFC.url=null;pdfState();clearTimeout(PDFC.t);if($('.doc'))PDFC.t=setTimeout(prepPDF,1200)}
async function prepPDF(){if(!$('.doc'))return null;const tok=PDFC.tok;pdfState('gen');
 const run=(async()=>{await new Promise(r=>setTimeout(r,30));const blob=await makePDF();if(tok!==PDFC.tok)return null;
  const I=docInfo();PDFC.file=new File([blob],I.name,{type:'application/pdf',lastModified:Date.now()});PDFC.url=URL.createObjectURL(PDFC.file);pdfState('ok');return PDFC.file})();
 PDFC.busy=run;try{return await run}catch(e){pdfState('err');toast('Error generando el PDF: '+e.message);return null}finally{if(PDFC.busy===run)PDFC.busy=null}}
function pdfState(st){const e=$('#pdfst');if(!e)return;e.className='pdfst '+(st||'');e.textContent=st=='ok'?'✓ PDF listo para enviar':st=='gen'?'⏳ Preparando PDF…':st=='err'?'⚠ Error al preparar el PDF':''}
function canShareFile(f){try{return!!(navigator.canShare&&navigator.share&&navigator.canShare({files:[f]}))}catch(e){return false}}
function shareFile(f){// llamada síncrona dentro del gesto; SOLO archivo + título (sin texto)
 return navigator.share({files:[f],title:f.name}).then(()=>true,e=>{if(e&&e.name=='AbortError')return true;toast('No se pudo compartir el PDF ('+(e&&e.name||'error')+'). Pulse otra vez o use Descargar.');return false})}
function descargar(f,url){try{const a=document.createElement('a');a.href=url;a.download=f.name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),1000)}catch(e){window.open(url,'_blank')}
 toastAcc(`PDF descargado: ${f.name}`,[['Abrir PDF',()=>{window.open(url,'_blank')||(location.href=url)}],...(canShareFile(f)?[['Guardar en Archivos',()=>shareFile(f)]]:[])])}
function toastAcc(t,btns){document.querySelectorAll('.toast').forEach(x=>x.remove());const d=document.createElement('div');d.className='toast tacc';d.innerHTML=`<div>${esc(t)}</div><div class="tb"></div>`;btns.forEach(([l,fn])=>{const b=document.createElement('button');b.textContent=l;b.onclick=()=>{fn();d.remove()};d.querySelector('.tb').appendChild(b)});const x=document.createElement('button');x.textContent='✕';x.onclick=()=>d.remove();d.querySelector('.tb').appendChild(x);document.body.appendChild(d);setTimeout(()=>d.remove(),15000)}
function compartir(via){
 const f=PDFC.file;
 if(!f){// aún no está listo: generar y pedir otro toque (el gesto ya no vale para share)
  loading(1,'Preparando PDF…');(PDFC.busy||prepPDF()).then(ff=>{loading(0);if(!ff)return;
   if(via=='dl')return descargar(ff,PDFC.url);toastAcc('PDF listo. Pulse para enviar.',[[via=='wa'?'📲 Enviar ahora':'✉ Enviar ahora',()=>compartir(via)]])});return}
 if(via=='dl')return descargar(f,PDFC.url);
 if(canShareFile(f)){shareFile(f);return}
 // sin soporte de compartir archivos: descarga + mensaje
 const I=docInfo();descargar(f,PDFC.url);toast('Este navegador no permite adjuntar archivos al compartir. El PDF se ha descargado: adjúntelo manualmente.');
 const msg=`Hola, le enviamos ${I.val?'la valoración técnica':'el presupuesto'} ${I.num} de ${EMP().nombre}. Adjuntamos el PDF "${I.name}".`;
 setTimeout(()=>{if(via=='wa'){let t=(I.c.tel||'').replace(/\D/g,'');if(t.length==9)t='34'+t;window.open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`,'_blank')}
  else location.href=`mailto:${encodeURIComponent(I.c.email||'')}?subject=${encodeURIComponent(I.tit+' '+EMP().nombre+' — '+(I.c.nombre||''))}&body=${encodeURIComponent(msg)}`},800)}
