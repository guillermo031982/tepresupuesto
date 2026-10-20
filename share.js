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
 const top0=cl.getBoundingClientRect().top,blocks=[...cl.querySelectorAll('.dh,.box,.hotsum,.z,tr,.firmas,h3')].map(e=>{const r=e.getBoundingClientRect();return[r.top-top0,r.bottom-top0]});
 const sc=2,cv=await html2canvas(cl,{scale:sc,backgroundColor:'#fff',useCORS:true,logging:false});box.remove();
 const total=cv.height/sc,pdf=new jspdf.jsPDF({unit:'px',format:[W,H],hotfixes:['px_scaling'],compress:true});
 let y=0,pg=0;while(y<total-2){let end=Math.min(y+H,total);
  if(end<total){const cut=blocks.filter(([a,b])=>a<end&&b>end&&a>y+60).map(([a])=>a);if(cut.length)end=Math.min(...cut)-4}
  const h=end-y,pc=document.createElement('canvas');pc.width=cv.width;pc.height=Math.ceil(h*sc);const ctx=pc.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,pc.width,pc.height);ctx.drawImage(cv,0,-y*sc);
  if(pg++)pdf.addPage([W,H]);pdf.addImage(pc.toDataURL('image/jpeg',.82),'JPEG',0,0,W,h,undefined,'FAST');
  pdf.setFontSize(9);pdf.setTextColor(150);pdf.text(`Página ${pg}`,W-60,H-14);y=end}
 return pdf.output('blob');
}
async function compartir(via){
 const I=docInfo();loading(1);let blob;
 try{await new Promise(r=>setTimeout(r,50));blob=await makePDF()}catch(e){loading(0);return alert('No se pudo generar el PDF: '+e.message)}
 loading(0);const file=new File([blob],I.name,{type:'application/pdf'});
 const txt=`${I.tit} Teneplagas S.L. — ${I.c.nombre||''} (${I.num})`;
 if(via!='dl'&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:I.name,text:txt});return}catch(e){if(e.name=='AbortError')return}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=I.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
 if(via=='dl')return toast('PDF descargado: '+I.name);
 const msg=`Hola, le enviamos ${I.val?'la valoración técnica':'el presupuesto'} ${I.num} de Teneplagas S.L. El PDF "${I.name}" se ha descargado en el dispositivo; adjúntelo a este mensaje.`;
 if(via=='wa'){let t=(I.c.tel||'').replace(/\D/g,'');if(t.length==9)t='34'+t;open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`,'_blank')}
 else if(via=='mail')location.href=`mailto:${encodeURIComponent(I.c.email||'')}?subject=${encodeURIComponent(txt)}&body=${encodeURIComponent(msg)}`;
 toast('PDF descargado. Adjúntalo al mensaje.');
}
