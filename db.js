// IndexedDB: store 'q' (presupuestos, key id) y 'm' (meta: srv, cur, step, cfg)
const DB=new Promise((ok,ko)=>{const r=indexedDB.open('teneplagas',1);r.onupgradeneeded=()=>{r.result.createObjectStore('q',{keyPath:'id'});r.result.createObjectStore('m')};r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)});
const tx=(st,mode,fn)=>DB.then(d=>new Promise((ok,ko)=>{const t=d.transaction(st,mode),o=t.objectStore(st),r=fn(o);t.oncomplete=()=>ok(r&&r.result);t.onerror=()=>ko(t.error)}));
const dbAll=()=>tx('q','readonly',o=>o.getAll());
const dbPut=q=>tx('q','readwrite',o=>o.put(q));
const dbDel=id=>tx('q','readwrite',o=>o.delete(id));
const mGet=k=>tx('m','readonly',o=>o.get(k));
const mSet=(k,v)=>tx('m','readwrite',o=>o.put(v,k));
const uid=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const newQ=()=>({id:uid(),creado:Date.now(),upd:Date.now(),cli:{nombre:'',tipo:'hotel',dir:'',fecha:new Date().toISOString().slice(0,10),tecnico:'',tel:'',email:''},zonas:[]});
const hoy=()=>new Date().toLocaleDateString('sv');// YYYY-MM-DD local
let CFG={auto:true,lastBackup:0,lastBackupDay:'',lastChange:0};
const mark=()=>{CFG.lastChange=Date.now();mSet('cfg',CFG)};
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),4500)}
async function exportar(auto){
  const data={app:'tepresupuesto',version:1,fecha:new Date().toISOString(),presupuestos:await dbAll(),servicios:SRV};
  const b=new Blob([JSON.stringify(data)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=`teneplagas-copia-${hoy()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  CFG.lastBackup=Date.now();CFG.lastBackupDay=hoy();await mSet('cfg',CFG);
  toast(auto?`Copia automática descargada (${data.presupuestos.length} presupuestos) en Descargas`:`Copia exportada: ${a.download}`);return data;
}
async function restaurar(file){
  let d;try{d=JSON.parse(await file.text())}catch(e){return alert('Archivo no válido')}
  if(!d||!Array.isArray(d.presupuestos))return alert('Este archivo no es una copia de TePresupuesto');
  const cur=Object.fromEntries((await dbAll()).map(q=>[q.id,q]));let n=0,o=0,s=0;
  const dup=d.presupuestos.filter(q=>cur[q.id]);
  const over=dup.length?confirm(`${dup.length} presupuesto(s) de la copia ya existen en el dispositivo.\n¿Sobrescribirlos con la versión de la copia?\n(Aceptar = sobrescribir, Cancelar = conservar los actuales)`):false;
  for(const q of d.presupuestos){if(cur[q.id]&&!over){s++;continue}await dbPut(q);cur[q.id]?o++:n++}
  if(Array.isArray(d.servicios))for(const v of d.servicios){const i=SRV.findIndex(x=>x.id==v.id);if(i<0)SRV.push(v);else if(over)SRV[i]=v}
  await mSet('srv',SRV);mark();
  if(cur[S.id]&&over){const q=d.presupuestos.find(x=>x.id==S.id);if(q)S=q}
  toast(`Restaurado: ${n} nuevos, ${o} sobrescritos, ${s} conservados`);await loadList();render();
}
async function migrar(){
  if(await mGet('migrado'))return;
  const old=localStorage.tp&&JSON.parse(localStorage.tp);
  if(old&&(old.zonas?.length||old.cli?.nombre)){old.id=old.id||uid();old.creado=old.upd=Date.now();await dbPut(old);await mSet('cur',old.id);await mSet('step',+(localStorage.tpStep||0))}
  if(localStorage.tpSrv)await mSet('srv',JSON.parse(localStorage.tpSrv));
  await mSet('migrado',true);
}
