const ESTAB=['Bar','Cafetería','Restaurante','Taller','Carnicería','Inmobiliaria','Minimercado','Panadería','Pescadería','Frutería','Supermercado','Tienda','Oficina','Farmacia','Clínica','Peluquería','Gimnasio','Nave industrial','Almacén','Colegio','Guardería','Residencia'];
const TL=(c,long)=>c?.tipo=='comunidad'?(long?'Comunidad de vecinos':'Comunidad'):c?.tipo=='estab'?(c.estab||'Establecimiento'):'Hotel';
const ZONAS=['Recepción / Hall','Bar','Cafetería','Restaurante','Buffet','Cocina principal','Cocina auxiliar','Office','Cámaras frigoríficas','Almacén de alimentos','Almacén general','Bodega','Economato','Cuarto de basuras','Muelle de carga','Lavandería','Lencería','Habitaciones','Pasillos de habitaciones','Piscina','Bar de piscina','Jardines','Zonas verdes','Terrazas','Azotea','Patios','Spa','Gimnasio','Vestuarios','Aseos públicos','Sala de máquinas','Sala de calderas','Cuarto de contadores','Garaje / Parking','Trasteros','Ascensores','Escaleras','Portal','Zonas comunes','Arquetas y alcantarillado','Bajantes','Comedor de personal','Oficinas','Salón de eventos','Discoteca / Animación','Parque infantil','Otra'];
const PLAGAS=['Cucarachas (germánica)','Cucarachas (americana)','Roedores (ratas/ratones)','Hormigas','Termitas / Xilófagos','Mosquitos','Moscas','Chinches','Pulgas','Palomas','Polilla','Pececillo de plata','Avispas','Otra'];
const TRAT=['Gel insecticida','Pulverización','Nebulización / Termonebulización','Estaciones portacebos','Trampas de captura','Desinsectación en arquetas','Barrera física / sellado','Repelente aves','Tratamiento xilófagos','Inspección y seguimiento'];
let S=null,LIST=[];
const DEFSRV=[['Tratamiento con cebo en gel','Aplicación de cebo en gel de uso profesional en grietas y hendiduras'],['Pulverización residual','Insecticida residual en zócalos, rodapiés y puntos de paso'],['Nebulización / termonebulización','Tratamiento aéreo en espacios cerrados y huecos'],['Portacebos rodenticidas','Instalación y revisión de estaciones portacebos con seguridad'],['Trampas de luz UV para moscas','Equipos de captura con lámina adhesiva en cocinas y office'],['Monitoreo y seguimiento','Trampas de monitorización y revisiones periódicas con informe'],['Desinsectación de arquetas','Tratamiento de arquetas, sumideros y redes de saneamiento'],['Control aviar','Instalación de pinchos, redes y repelentes para palomas'],['Sellado de accesos','Sellado de huecos, pasos de tubería y puntos de entrada'],['Desratización','Plan integral de control de roedores'],['Servicio DDD','Desinfección, desinsectación y desratización con certificado sanitario']];
let SRV=[];const saveSrv=()=>{mSet('srv',SRV);mark()};
// ---- Periodicidad y descuentos (campos opcionales: si faltan en presupuestos antiguos se usan valores por defecto) ----
const PER={'':{n:'',u:'',f:0},mensual:{n:'Mensual',u:'/ mes',f:12},trimestral:{n:'Trimestral',u:'/ trimestre',f:4},anual:{n:'Anual',u:'/ año',f:1},puntual:{n:'Puntual',u:'pago único',f:0},doc:{n:'Solo documentación',u:'solo documentación',f:0}};
const PKEYS=Object.keys(PER).filter(k=>k);
const isPK=k=>k==='custom'||(k&&Object.prototype.hasOwnProperty.call(PER,k));
// Periodicidad "spec": {key,n(texto),u(unidad de precio),f(veces/año; 0=no anualizada),custom}. '' = sin indicar. 'custom' = texto libre (+ veces al año opcional)
const perSpec=(k,t,n)=>{if(k==='custom'){t=String(t||'').trim();if(!t)return Object.assign({key:''},PER['']);const f=Math.max(0,+String(n==null?'':n).replace(',','.')||0);return{key:'c:'+t.toLowerCase()+'#'+f,n:t,u:'/ '+t,f,custom:1}}
 return Object.assign({key:''},PER[k&&Object.prototype.hasOwnProperty.call(PER,k)?k:''],k&&Object.prototype.hasOwnProperty.call(PER,k)?{key:k}:{})};
const DEFSPEC=()=>perSpec(S&&S.per,S&&S.perT,S&&S.perN);
const srvSpec=(z,id)=>{const k=(z.per||{})[id];if(isPK(k)){const c=(z.perc||{})[id]||{};return perSpec(k,c.t,c.n)}return DEFSPEC()};
const zSpec=z=>{if(isPK(z.pper))return perSpec(z.pper,z.pperT,z.pperN);const m={};(z.srv||[]).filter(id=>SRV.find(v=>v.id==id)).forEach(id=>{const sp=srvSpec(z,id);m[sp.key]=sp});const ks=Object.keys(m);return ks.length==1?m[ks[0]]:DEFSPEC()};
const perLbl=sp=>sp.n||'sin indicar';
const perOpts=(v,defl)=>`<option value="">${esc(defl||'— Sin indicar —')}</option>`+PKEYS.map(k=>`<option value="${k}" ${k==v?'selected':''}>${PER[k].n}</option>`).join('')+`<option value="custom" ${v=='custom'?'selected':''}>Personalizada…</option>`;
// Selector + (si es «Personalizada…») texto libre y «veces al año»
const perBlock=(o)=>`<span class="perw" style="${o.hide?'display:none':''}"><select ${o.id?`id="${o.id}"`:''} class="${o.cls||''}" aria-label="Periodicidad" onchange="${o.on}(this.value);var c=this.nextElementSibling;c.style.display=this.value=='custom'?'':'none';if(this.value=='custom')c.firstElementChild.focus()">${perOpts(o.k||'',o.defl)}</select><span class="perc" style="${o.k=='custom'?'':'display:none'}"><input class="pert" list="perHist" maxlength="40" autocomplete="off" placeholder="Ej.: cada 2 meses" aria-label="Periodicidad personalizada" value="${esc(o.t||'')}" oninput="${o.onT}(this.value)" onchange="perRem(this.value)"><input class="pern" type="number" min="0" step="any" inputmode="decimal" placeholder="veces al año" aria-label="Veces al año (opcional)" title="Veces al año (opcional): sirve para calcular el equivalente anual" value="${esc(String(o.n==null?'':o.n))}" oninput="${o.onN}(this.value)"></span></span>`;
const PH_K='tp_perhist',perHist=()=>{try{const a=JSON.parse(localStorage.getItem(PH_K)||'[]');return Array.isArray(a)?a.filter(x=>typeof x=='string'):[]}catch(e){return[]}};
function perHistFill(){let d=document.getElementById('perHist');if(!d){d=document.createElement('datalist');d.id='perHist';document.body.appendChild(d)}d.innerHTML=perHist().map(x=>`<option value="${esc(x)}">`).join('')}
function perRem(t){t=String(t||'').trim().slice(0,40);if(!t)return;try{const a=[t,...perHist().filter(x=>x.toLowerCase()!=t.toLowerCase())].slice(0,15);localStorage.setItem(PH_K,JSON.stringify(a))}catch(e){}perHistFill()}
const DTO=o=>Object.assign({tipo:'pct',val:'',concepto:''},o||{});
const dtoAmt=(base,o)=>{o=DTO(o);const v=Math.max(0,+String(o.val).replace(',','.')||0);return Math.min(base,Math.max(0,o.tipo=='eur'?v:base*Math.min(v,100)/100))};
const dtoTxt=o=>{o=DTO(o);const v=+String(o.val).replace(',','.')||0;return o.tipo=='eur'?'':' ('+String(Math.min(v,100)).replace('.',',')+' %)'};
const zGross=z=>+z.precio||0,zDto=z=>dtoAmt(zGross(z),z.dto),zNet=z=>zGross(z)-zDto(z);
const pAmt=z=>{const u=zSpec(z).u;return `${eur(z.precio)}${u?` <small class="pu">${esc(u)}</small>`:''}`};
function calcTot(){const zs=S.zonas.filter(z=>+z.precio>0),sub=zs.reduce((a,z)=>a+zNet(z),0),d=dtoAmt(sub,S.dto),base=sub-d,ig=base*.07,k=sub?base/sub:1,G={};
 zs.forEach(z=>{const sp=zSpec(z);(G[sp.key]=G[sp.key]||{sp,v:0}).v+=zNet(z)*k});
 const ks=Object.keys(G),ord=[...PKEYS.filter(x=>G[x]),...ks.filter(x=>x.startsWith('c:')),...(G['']?['']:[])];
 const rec=ord.filter(x=>G[x].sp.f>0).map(x=>G[x]),uni=ord.filter(x=>!(G[x].sp.f>0)&&x!=='').map(x=>G[x]),sin=G['']||null;
 return{sub,d,base,ig,tot:base+ig,rec,uni,sin,anual:rec.reduce((a,x)=>a+x.v*x.sp.f,0),unico:uni.reduce((a,x)=>a+x.v,0)+(sin?sin.v:0)}}
function totHTML(){const T=calcTot(),dd=T.d>0.005,o=DTO(S.dto),r=(l,v,c='')=>`<tr class="${c}"><td>${l}</td><td style="text-align:right">${v}</td></tr>`;
 const lines=ORD().filter(HP).map((z,i)=>{const zd=zDto(z);return `<tr><td>${z.hot?'🔥 ':''}${i+1}. ${esc(ZT(z))} ${zSpec(z).n?`<small class="pu">· ${esc(zSpec(z).n)}</small>`:''}</td><td style="text-align:right">${pAmt(z)}</td></tr>`+(zd>0.005?`<tr class="dz"><td>&nbsp;&nbsp;↳ Descuento zona${dtoTxt(z.dto)}</td><td style="text-align:right">−${eur(zd)}</td></tr>`:'')}).join('');
 const rw=(x,an)=>`<tr><td>${esc(x.sp.n||'Sin periodicidad indicada')}${x.sp.custom&&x.sp.f?` <small class="pu">(×${String(x.sp.f).replace('.',',')} / año)</small>`:''}</td><td style="text-align:right">${eur(x.v)}${x.sp.u?` <small class="pu">${esc(x.sp.u)}</small>`:''}</td><td style="text-align:right">${an?`${eur(x.v*x.sp.f)} <small class="pu">/ año</small>`:'—'}</td></tr>`;
 const anyC=T.rec.some(x=>x.sp.custom),onlyPD=T.uni.every(x=>!x.sp.custom)&&!T.sin;
 const sum=T.rec.length?`<table class="persum"><tr><th>Resumen por periodicidad</th><th style="text-align:right">Base imponible</th><th style="text-align:right">Equivalente anual</th></tr>${T.rec.map(x=>rw(x,1)).join('')}${T.uni.map(x=>rw(x,0)).join('')}${T.sin?rw({sp:PER[''],v:T.sin.v},0):''}<tr class="tot2"><td colspan="2">Total anual recurrente (base, sin IGIC)</td><td style="text-align:right">${eur(T.anual)}</td></tr>${T.uni.length||T.sin?`<tr><td colspan="2">${onlyPD?'Pagos únicos':'Importes no anualizados'} (base, sin IGIC)</td><td style="text-align:right">${eur(T.unico)}</td></tr>`:''}</table><small class="pu">Equivalente anual: Mensual ×12 · Trimestral ×4 · Anual ×1${anyC?' · Personalizada ×«veces al año» indicadas':''}. ${onlyPD?'Los pagos únicos no se anualizan.':'Puntual, solo documentación, personalizadas sin «veces al año» y sin periodicidad no se anualizan.'}</small>`:'';
 return `<table><tr><th>Concepto</th><th style="text-align:right">Importe</th></tr>${lines}${dd?r('Subtotal',eur(T.sub))+r((o.concepto.trim()?esc(o.concepto.trim()):'Descuento')+dtoTxt(o),'−'+eur(T.d),'dsc'):''}
${r('Base imponible',eur(T.base))}${r('IGIC 7%',eur(T.ig))}${r('TOTAL',eur(T.tot),'tot')}</table>${sum}`}
function updTot(){const b=$('#totbox');if(b){b.innerHTML=totHTML();save()}}
function dtoPanel(){if(!S.zonas.some(HP))return'';const o=DTO(S.dto);
 return `<div class="geop dtop"><b>🏷 Descuento</b><div class="dtor"><select id="dtoT"><option value="pct" ${o.tipo=='pct'?'selected':''}>% porcentaje</option><option value="eur" ${o.tipo=='eur'?'selected':''}>€ importe fijo</option></select><input id="dtoV" type="number" min="0" step="any" inputmode="decimal" placeholder="0" value="${esc(String(o.val))}"><input id="dtoC" placeholder="Concepto (ej.: Descuento cliente nuevo)" value="${esc(o.concepto)}"></div><span class="geoi">Se aplica sobre el subtotal, antes del IGIC. También puede descontar por zona en cada zona.</span></div>`}
function bindDto(){const t=$('#dtoT'),v=$('#dtoV'),c=$('#dtoC');if(!t)return;const u=()=>{S.dto={tipo:t.value,val:v.value,concepto:c.value};updTot()};t.onchange=v.oninput=c.oninput=u}
let step=0;
let _t;const save=()=>{if(!S)return;if(step==N()-1&&$('.doc'))invalidatePDF();S.upd=Date.now();clearTimeout(_t);_t=setTimeout(()=>{dbPut(S).then(loadList);mSet('cur',S.id);mSet('step',step);mark()},300)};
const $=q=>document.querySelector(q),esc=s=>(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const N=()=>S.zonas.length+2;const eur=n=>(+n||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
function go(i){window.SRVV=0;step=Math.max(0,Math.min(N()-1,i));save();render();scrollTo(0,0)}
$('#prev').onclick=()=>go(step-1);$('#next').onclick=()=>go(step+1);
const addZ=hot=>{S.zonas.push({zona:'',otra:'',plaga:'',obs:'',trat:'',precio:'',abre:'',cierra:'',hot,fotos:[]});go(S.zonas.length)};
$('#fab').onclick=()=>addZ(true);$('#fabz').onclick=()=>addZ(false);
function render(){
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',(b.dataset.v||0)==(window.SRVV||0)));document.body.classList.toggle('aux',!!window.SRVV);
 if(window.SRVV){$('#steps').innerHTML='';return window.SRVV=='hist'?historial():config()}
 $('#steps').innerHTML=['Portada',...S.zonas.map((z,i)=>`${z.hot?'🔥 ':''}${i+1}. ${(z.nom||'').trim()||(z.zona==='Otra'?z.otra||'Otra':z.zona||'Zona')}`),'Presupuesto'].map((t,i)=>`<button class="${i==step?'on':''} ${i>0&&i<N()-1&&S.zonas[i-1].hot?'hot':''}" onclick="go(${i})">${esc(t)}</button>`).join('');
 $('#prev').disabled=step==0;$('#next').textContent=step==N()-1?'—':'Siguiente ▶';$('#next').disabled=step==N()-1;
 step==0?portada():step==N()-1?doc():zona(step-1)}
function f(id,lab,val,type='text',ph=''){return `<label>${lab}</label><input id="${id}" type="${type}" value="${esc(val)}" placeholder="${ph}">`}
function portada(){const c=S.cli;$('#view').innerHTML=`<div class="hero"><img src="logo.png"><h1>TENEPLAGAS</h1><div>Presupuesto profesional de control de plagas</div><div class="badges"><span>📍 Tenerife</span><span>📍 Gran Canaria</span><span>📍 Fuerteventura</span><span>📍 Lanzarote</span><span>📍 Sevilla</span></div></div>
<div class="card"><label>Tipo de cliente</label><div class="seg"><button data-t="hotel" class="${c.tipo=='hotel'?'on':''}">🏨<span> Hotel</span></button><button data-t="comunidad" class="${c.tipo=='comunidad'?'on':''}">🏢<span> Comunidad</span></button><button data-t="estab" class="${c.tipo=='estab'?'on':''}">🏪<span> Establecimiento</span></button></div>
${c.tipo=='estab'?`<label>Tipo de establecimiento</label><select id="estabSel">${[...ESTAB,...(CFG.estab||[])].map(o=>`<option ${o==c.estab?'selected':''}>${esc(o)}</option>`).join('')}<option value="__new" ${window.ESTNEW?'selected':''}>＋ Agregar establecimiento</option></select>${window.ESTNEW?`<div class="hrs" style="margin-top:6px"><input id="estabNew" placeholder="Escribe el tipo (ej.: Heladería)"><button class="del" style="flex:none" id="estabOk">Guardar</button></div>`:''}`:''}
${f('nombre','Nombre del cliente / establecimiento',c.nombre,'text','Hotel Las Palmeras')}${f('dir','Dirección',c.dir)}${f('tel','Teléfono',c.tel,'tel')}${f('email','Email',c.email,'email')}${f('fecha','Fecha',c.fecha,'date')}${f('tecnico','Técnico',c.tecnico)}<label>Periodicidad del servicio (por defecto del presupuesto)</label>${perBlock({id:'perdef',on:'setQP',k:S.per||'',t:S.perT,n:S.perN,onT:'setQPt',onN:'setQPn'})}
<button class="more ${window.EXP?'on':''}" id="more">${window.EXP?'▾':'▸'} Datos adicionales de la empresa <small style="font-weight:400">(opcional)</small></button>
${window.EXP?`<div class="extra">${f('cif','CIF',c.cif)}${f('hotel','Nombre del hotel',c.hotel)}${f('empresa','Nombre de la empresa',c.empresa)}${f('dirfiscal','Dirección fiscal',c.dirfiscal)}${f('dirhotel','Dirección del establecimiento',c.dirhotel)}</div>`:''}</div>
`;


 const es=$('#estabSel');if(es){if(!c.estab&&!window.ESTNEW){c.estab=es.value;save()}es.onchange=()=>{if(es.value=='__new'){window.ESTNEW=1}else{window.ESTNEW=0;c.estab=es.value;save()}portada()}}
 const en=$('#estabNew');if(en){en.focus();$('#estabOk').onclick=()=>{const v=en.value.trim();if(!v)return;CFG.estab=[...new Set([...(CFG.estab||[]),v])];mSet('cfg',CFG);c.estab=v;window.ESTNEW=0;save();portada()}}
 $('#more').onclick=()=>{window.EXP=!window.EXP;portada()};
 ['nombre','dir','tel','email','fecha','tecnico','cif','hotel','empresa','dirfiscal','dirhotel'].forEach(k=>{const el=$('#'+k);if(el)el.oninput=e=>{c[k]=e.target.value;save()}});
 document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{c.tipo=b.dataset.t;save();portada()})}
const opts=(a,v)=>'<option value="">— Seleccionar —</option>'+a.map(o=>`<option ${o==v?'selected':''}>${o}</option>`).join('');
function zona(i){const z=S.zonas[i];const ph=(k,t)=>`<div class="ph">${z.fotos[k]?`<img src="${z.fotos[k]}"><button class="x" onclick="delF(${i},${k})">✕</button>`:`📷 ${t}<input type="file" accept="image/*" capture="environment" onchange="addF(event,${i},${k})">`}</div>`;
 $('#view').innerHTML=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="margin:0;color:var(--r)">${z.hot?'Punto caliente':'Zona'} ${i+1}</h2><button class="hotbtn ${z.hot?'on':''}" onclick="S.zonas[${i}].hot=!S.zonas[${i}].hot;save();render()">${z.hot?'🔥 PUNTO CALIENTE':'Marcar punto caliente'}</button></div>${z.hot?'<div class="hotnote">Prioridad alta · requiere máxima atención</div>':''}
<label>Zona</label><select id="zona">${opts(ZONAS,z.zona)}</select>${z.zona=='Otra'?f('otra','Tipo de zona',z.otra):''}${f('nom','Nombre de la zona (opcional)',z.nom,'text','Ej.: Restaurante Luna')}
<label>Plaga detectada</label><select id="plaga">${opts(PLAGAS,z.plaga)}</select>

<div class="hrs"><div><label>Hora de apertura</label><input id="abre" type="time" value="${z.abre||''}"></div><div><label>Hora de cierre</label><input id="cierra" type="time" value="${z.cierra||''}"></div></div><label>Servicios</label><div class="srvs">${SRV.map(v=>{const on=(z.srv||[]).includes(v.id);return `<div class="srvi"><label class="chk"><input type="checkbox" ${on?'checked':''} onchange="togS(${i},'${v.id}',this.checked);this.closest('.srvi').querySelector('.perw').style.display=this.checked?'':'none'"> ${esc(v.n)}</label>${perBlock({cls:'perS',hide:!on,on:`(v=>setPer(${i},'${v.id}',v))`,onT:`(v=>setPerC(${i},'${v.id}','t',v))`,onN:`(v=>setPerC(${i},'${v.id}','n',v))`,k:(z.per||{})[v.id]||'',t:((z.perc||{})[v.id]||{}).t,n:((z.perc||{})[v.id]||{}).n,defl:'Por defecto ('+esc(perLbl(DEFSPEC()))+')'})}</div>`}).join('')}</div><div class="hrs"><input id="qs" placeholder="Nuevo servicio rápido…"><button class="del" style="flex:none" onclick="qAdd(${i})">＋ Añadir</button></div><label>Observaciones</label><textarea id="obs" rows="3">${esc(z.obs)}</textarea>${f('precio','Precio (€ sin IGIC)',z.precio,'number')}<div id="pextra" style="${+z.precio>0?'':'display:none'}"><label>Periodicidad del precio</label>${perBlock({id:'pper',on:`(v=>setZP(${i},'pper',v))`,onT:`(v=>setZP(${i},'pperT',v))`,onN:`(v=>setZP(${i},'pperN',v))`,k:z.pper||'',t:z.pperT,n:z.pperN,defl:'Automática ('+esc(perLbl(zSpec(z)))+')'})}<label>Descuento de esta zona (opcional)</label><div class="dtor"><select id="zdT"><option value="pct" ${DTO(z.dto).tipo=='pct'?'selected':''}>%</option><option value="eur" ${DTO(z.dto).tipo=='eur'?'selected':''}>€</option></select><input id="zdV" type="number" min="0" step="any" inputmode="decimal" placeholder="0" value="${esc(String(DTO(z.dto).val))}"></div></div></div>
<div class="card"><label>Fotos centrales</label><div class="c2">${ph(0,'Foto 1')}${ph(1,'Foto 2')}</div><label>Fotos adicionales (hasta 6)</label><div class="g6">${[2,3,4,5,6,7].map(k=>ph(k,k-1)).join('')}</div></div>
<button class="del" onclick="if(confirm('¿Eliminar esta zona?')){S.zonas.splice(${i},1);go(${i})}">🗑 Eliminar zona</button>`;
 ['zona','plaga','obs','precio','otra','nom','abre','cierra'].forEach(k=>{const e=$('#'+k);if(e)e.oninput=e.onchange=ev=>{z[k]=ev.target.value;if(k=='precio')$('#pextra').style.display=+z.precio>0?'':'none';save();if(k=='zona'&&ev.type=='change')render()}});
 const zu=()=>{z.dto={tipo:$('#zdT').value,val:$('#zdV').value};save()};$('#zdT').onchange=$('#zdV').oninput=zu}
function updAuto(z){const o=document.querySelector('#pper');if(o&&o.options[0])o.options[0].textContent='Automática ('+perLbl(zSpec(z))+')'}
function setPer(i,id,v){const z=S.zonas[i];z.per=z.per||{};if(v)z.per[id]=v;else{delete z.per[id];if(z.perc)delete z.perc[id]}save();updAuto(z)}
function setPerC(i,id,f,v){const z=S.zonas[i];z.perc=z.perc||{};(z.perc[id]=z.perc[id]||{})[f]=v;save();updAuto(z)}
function setZP(i,f,v){const z=S.zonas[i];z[f]=v;if(f=='pper'&&!v){delete z.pperT;delete z.pperN}save()}
function setQP(v){S.per=v;if(!v){delete S.perT;delete S.perN}save()}
function setQPt(v){S.perT=v;save()}
function setQPn(v){S.perN=v;save()}
function togS(i,id,on){const z=S.zonas[i];z.srv=(z.srv||[]).filter(x=>x!=id);if(on)z.srv.push(id);save();updAuto(z)}
function qAdd(i){const n=$('#qs').value.trim();if(!n)return;const v={id:'s'+Date.now(),n,d:''};SRV.push(v);saveSrv();togS(i,v.id,true);render()}
function vista(v){window.SRVV=v;render();scrollTo(0,0)}
const isVal=q=>!(q.zonas||[]).some(z=>+z.precio>0);
function historial(){const f=(window.HQ||'').toLowerCase(),ft=window.HT||'';
 const R=LIST.filter(q=>(!f||[(q.cli?.nombre||''),q.cli?.hotel||'',q.cli?.empresa||'',q.cli?.dir||''].join(' ').toLowerCase().includes(f))&&(!ft||ft==q.cli?.tipo||(ft=='val'&&isVal(q))||(ft=='pre'&&!isVal(q))));
 $('#view').innerHTML=`<div class="card"><div class="hhead"><h2 style="margin:0;color:var(--r)">📂 Historial <small style="color:var(--g);font-size:14px">(${LIST.length})</small></h2></div>
<input id="hq" placeholder="🔍 Buscar por cliente, hotel o dirección…" value="${esc(window.HQ||'')}" style="margin-top:10px">
<div class="chips">${[['','Todos'],['hotel','Hoteles'],['comunidad','Comunidades'],['estab','Establecimientos'],['pre','Presupuestos'],['val','Valoraciones']].map(([k,t])=>`<button class="${ft==k?'on':''}" onclick="window.HT='${k}';render()">${t}</button>`).join('')}</div></div>
<div class="card" style="padding:4px 14px">${R.map(q=>`<div class="hrow ${q.id==S.id?'cur':''}"><div class="hi"><b>${esc(q.cli?.nombre)||'(sin nombre)'}</b><div class="tags"><span class="tag">${esc(TL(q.cli))}</span><span class="tag ${isVal(q)?'tv':'tp'}">${isVal(q)?'Valoración':'Presupuesto'}</span>${q.id==S.id?'<span class="tag tc">Abierto</span>':''}</div><small>📅 ${q.cli?.fecha?new Date(q.cli.fecha).toLocaleDateString('es-ES'):'—'} · ${(q.zonas||[]).length} zonas${(q.zonas||[]).some(z=>z.hot)?` · 🔥 ${(q.zonas||[]).filter(z=>z.hot).length}`:''}</small></div>
<div class="hb"><button onclick="abrir('${q.id}')">✏ Editar</button><button onclick="duplicar('${q.id}')">📑 Clonar</button><button onclick="verPDF('${q.id}')">📄 PDF</button><button onclick="borrar('${q.id}')">🗑</button></div></div>`).join('')||'<p style="text-align:center;color:#888">Sin resultados.</p>'}</div>`;
 const h=$('#hq');h.oninput=()=>{window.HQ=h.value;const p=h.selectionStart;render();const n=$('#hq');n.focus();n.setSelectionRange(p,p)}}
async function verPDF(id){await abrir(id);go(N()-1)}
const EMP=()=>Object.assign({nombre:'Teneplagas S.L.',cif:'',dir:'',zona:'',tel:'',email:''},CFG.emp||{},{nombre:(CFG.emp?.nombre||'').trim()||'Teneplagas S.L.'});
const empLines=()=>{const e=EMP();return [e.cif&&'CIF: '+e.cif,e.dir,e.zona,[e.tel&&'Tel. '+e.tel,e.email].filter(Boolean).join(' · ')].filter(Boolean).map(x=>'<br>'+esc(x)).join('')};
const empFooter=()=>{const e=EMP();return `<div class="dfoot">${[e.nombre,e.cif&&'CIF '+e.cif,e.dir,e.zona,e.tel&&'Tel. '+e.tel,e.email].filter(Boolean).map(esc).join(' · ')}</div>`};
function config(){const e=EMP(),fe=(k,l,ph,t='text')=>`<label>${l}</label><input data-emp="${k}" type="${t}" value="${esc((CFG.emp||{})[k]||'')}" placeholder="${ph}">`;
 $('#view').innerHTML=`<div class="card"><h2 style="margin:0;color:var(--r)">⚙ Configuración</h2></div>
<div class="card"><h3 style="margin:0 0 4px;color:var(--r)">🏢 Datos de la empresa</h3><small>Aparecen en la cabecera y el pie de los presupuestos (solo los rellenados).</small>${fe('nombre','Nombre comercial','Teneplagas S.L.')}${fe('cif','CIF','B00000000')}${fe('dir','Dirección','Calle, nº, municipio')}${fe('zona','Zona regional','Ej.: Canarias · Andalucía')}${fe('tel','Teléfono (opcional)','','tel')}${fe('email','Email (opcional)','','email')}</div>
${updCard()}<div class="card"><h3 style="margin:0 0 8px;color:var(--r)">💾 Copia de seguridad</h3><small>Se guarda como archivo en Descargas del dispositivo (fuera de la app). Última copia: <b>${CFG.lastBackup?new Date(CFG.lastBackup).toLocaleString('es-ES'):'nunca'}</b></small><div class="hrs" style="margin-top:10px"><button class="more" style="margin:0;text-align:center" onclick="exportar().then(render)">⬇ Exportar copia</button><label class="more" style="margin:0;text-align:center">⬆ Restaurar copia<input type="file" accept=".json,application/json" hidden onchange="this.files[0]&&restaurar(this.files[0])"></label></div><label class="chk"><input type="checkbox" ${CFG.auto?'checked':''} onchange="CFG.auto=this.checked;mSet('cfg',CFG)"> Copia automática diaria (al abrir la app si hay cambios)</label></div>
${servicios(1)}<button class="pbtn" onclick="vista(0)">✔ Volver al presupuesto</button>`;
 document.querySelectorAll('[data-emp]').forEach(i=>i.oninput=()=>{CFG.emp=Object.assign(CFG.emp||{},{[i.dataset.emp]:i.value});mSet('cfg',CFG);mark()})}
function servicios(inner){const h=`<div class="card"><h3 style="margin:0 0 8px;color:var(--r)">🧰 Catálogo de servicios</h3><small>Se guardan en este dispositivo para todos los presupuestos.</small>${SRV.map((v,k)=>`<div class="srow"><input value="${esc(v.n)}" oninput="SRV[${k}].n=this.value;saveSrv()" placeholder="Nombre"><textarea rows="2" oninput="SRV[${k}].d=this.value;saveSrv()" placeholder="Descripción (opcional)">${esc(v.d)}</textarea><button class="del" onclick="if(confirm('¿Eliminar servicio?')){SRV.splice(${k},1);saveSrv();render()}">🗑 Eliminar</button></div>`).join('')}
<button class="more" onclick="SRV.push({id:'s'+Date.now(),n:'',d:''});saveSrv();render()">＋ Nuevo servicio</button></div>`;return h}
function addF(e,i,k){const file=e.target.files[0];if(!file)return;const img=new Image();img.onload=()=>{const m=1024,s=Math.min(1,m/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);S.zonas[i].fotos[k]=c.toDataURL('image/jpeg',.7);save();render()};img.src=URL.createObjectURL(file)}
function delF(i,k){S.zonas[i].fotos[k]=null;save();render()}
const ZT=z=>(z.zona=='Otra'?z.otra:z.zona)+((z.nom||'').trim()?' — '+z.nom.trim():'');
const HP=z=>+z.precio>0;
const ORD=()=>[...S.zonas.filter(z=>z.hot),...S.zonas.filter(z=>!z.hot)];
function doc(){const VAL=!S.zonas.some(HP),c=S.cli,base=S.zonas.reduce((a,z)=>a+(+z.precio||0),0),ig=base*.07,num='TP-'+(c.fecha||'').replace(/-/g,'')+'-'+(c.nombre||'X').slice(0,3).toUpperCase();
 const fecha=c.fecha?new Date(c.fecha).toLocaleDateString('es-ES'):'';
 $('#view').innerHTML=`<div class="pdfst" id="pdfst"></div><div class="acts">${S.pid?`<a class="pbtn sb gr tpback" href="../teprospeccion/">↩ Volver a TeProspección</a>`:''}<button class="pbtn" onclick="tprosSync();print()">🖨 Imprimir / Guardar PDF</button><button class="pbtn sb wa" onclick="compartir('wa')">📲 Enviar por WhatsApp</button><button class="pbtn sb" onclick="compartir('mail')">✉ Enviar por correo</button><button class="pbtn sb gr" onclick="compartir('dl')">⬇ Descargar PDF</button></div>${VAL?'':dtoPanel()}${geoPanel()}<div class="doc">
<div class="dh"><div style="display:flex;gap:10px;align-items:center"><img src="logo.png"><div><b style="color:var(--r);font-size:20px;letter-spacing:2px">${esc(EMP().nombre.toUpperCase())}</b><br><small>Control de plagas · Empresa certificada por Sanidad${empLines()}</small></div></div><div style="text-align:right"><h2>${VAL?'VALORACIÓN TÉCNICA':'PRESUPUESTO'}</h2><small>Nº ${esc(num)}<br>Fecha: ${fecha}</small></div></div>
<div class="box"><b>Cliente:</b> ${esc(c.nombre)} (${c.tipo=='estab'?'Establecimiento: '+esc(TL(c)):TL(c,1)})<br><b>Dirección:</b> ${esc(c.dir)}<br>${c.tel?'<b>Tel:</b> '+esc(c.tel)+' ':''}${c.email?'<b>Email:</b> '+esc(c.email):''}${[['empresa','Empresa'],['cif','CIF'],['dirfiscal','Dirección fiscal'],['hotel','Hotel'],['dirhotel','Dirección del establecimiento']].filter(([k])=>(c[k]||'').trim()).map(([k,l])=>`<br><b>${l}:</b> ${esc(c[k])}`).join('')}<br><b>Técnico:</b> ${esc(c.tecnico)}</div>
${(H=>H.length?`<div class="hotsum"><b>🔥 Puntos calientes (${H.length}) — prioridad alta</b><ul>${H.map(z=>`<li><b>${esc(ZT(z))}</b>${z.plaga?' — '+esc(z.plaga):''}</li>`).join('')}</ul></div>`:'')(S.zonas.filter(z=>z.hot))}<h3>Puntos de inspección</h3>${ORD().map((z,i)=>{const fs=z.fotos||[];return `<div class="z ${z.hot?'zhot':''}">${z.hot?'<div class="flag">🔥 PUNTO CALIENTE · PRIORIDAD ALTA</div>':''}<h3><span>${i+1}. ${esc(ZT(z))}</span><span>${HP(z)?pAmt(z):''}</span></h3><p style="font-size:14px;margin:6px 0"><b>Plaga:</b> ${esc(z.plaga)}${z.abre||z.cierra?` · <b>Horario:</b> ${z.abre||'—'} – ${z.cierra||'—'}`:''}<br>${esc(z.obs)}</p>${(z.srv||[]).map(id=>SRV.find(v=>v.id==id)).filter(Boolean).length?`<div class="zs"><b>Servicios:</b><ul>${(z.srv||[]).map(id=>SRV.find(v=>v.id==id)).filter(Boolean).map(v=>`<li><b>${esc(v.n)}</b>${srvSpec(z,v.id).n?` · <span class="perl">${esc(srvSpec(z,v.id).n)}</span>`:''}${v.d?' — '+esc(v.d):''}</li>`).join('')}</ul></div>`:''}${fs[0]||fs[1]?`<div class="c2">${[0,1].filter(k=>fs[k]).map(k=>`<img src="${fs[k]}">`).join('')}</div>`:''}${fs.slice(2).some(x=>x)?`<div class="g6">${fs.slice(2).filter(x=>x).map(x=>`<img src="${x}">`).join('')}</div>`:''}</div>`}).join('')||'<p>Sin zonas añadidas.</p>'}
${VAL?'':`<div id="totbox">${totHTML()}</div>`}
<div class="box"><b>Condiciones:</b> Validez del presupuesto: 30 días. ${esc(EMP().nombre)}, empresa autorizada por Sanidad.</div>
<div class="firmas">${[['tec','Firma del técnico · '+esc(EMP().nombre),`<div class="fn">${esc(c.tecnico)||'&nbsp;'}</div>`],['cli','Conforme cliente',`<input class="fn fni" id="firmante" placeholder="Nombre de quien firma (opcional)" value="${esc(c.firmante||'')}"><div class="fn fnp">${esc(c.firmante||'')||'&nbsp;'}</div><div class="fsub">${esc(c.nombre)}</div>`]].map(([k,t,n])=>`<div class="fbox"><div class="ft">${t}</div><div class="fpad"><canvas data-k="${k}"></canvas><button class="fclr" onclick="borrarFirma('${k}')">Borrar</button>${(S.firmas||{})[k]?'':'<span class="fhint">Firme aquí ✍</span>'}</div>${n}</div>`).join('')}</div>${empFooter()}${geoDoc()}</div>`;initFirmas();bindDto();pdfState();invalidatePDF()}
function initFirmas(){const fi=$('#firmante');if(fi)fi.oninput=()=>{S.cli.firmante=fi.value;fi.nextElementSibling.textContent=fi.value||'\u00a0';save()};
 document.querySelectorAll('.fpad canvas').forEach(cv=>{const k=cv.dataset.k,r=Math.max(2,devicePixelRatio||1),W=cv.clientWidth,H=cv.clientHeight;cv.width=W*r;cv.height=H*r;const x=cv.getContext('2d');x.scale(r,r);x.lineCap=x.lineJoin='round';x.strokeStyle='#14286e';
  const d=(S.firmas||{})[k];if(d){const im=new Image();im.onload=()=>x.drawImage(im,0,0,W,H);im.src=d}
  let pts=null,dirty=false;const P=e=>{const b=cv.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top,p:e.pressure&&e.pointerType!='mouse'?e.pressure:.5}};
  cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);pts=[P(e)];const h=cv.parentNode.querySelector('.fhint');h&&h.remove();x.beginPath();x.arc(pts[0].x,pts[0].y,1.2,0,7);x.fillStyle='#14286e';x.fill();dirty=true};
  cv.onpointermove=e=>{if(!pts)return;e.preventDefault();(e.getCoalescedEvents?e.getCoalescedEvents():[e]).forEach(ev=>{const q=P(ev);pts.push(q);const n=pts.length;if(n<3)return;const a=pts[n-3],b=pts[n-2],m1={x:(a.x+b.x)/2,y:(a.y+b.y)/2},m2={x:(b.x+q.x)/2,y:(b.y+q.y)/2};x.lineWidth=1.6+q.p*2;x.beginPath();x.moveTo(m1.x,m1.y);x.quadraticCurveTo(b.x,b.y,m2.x,m2.y);x.stroke()})};
  cv.onpointerup=cv.onpointercancel=()=>{if(!pts)return;pts=null;if(dirty){S.firmas=S.firmas||{};S.firmas[k]=cv.toDataURL('image/png');save()}}})}
function borrarFirma(k){if(S.firmas)delete S.firmas[k];save();render()}
async function loadList(){LIST=(await dbAll()).sort((a,b)=>b.upd-a.upd);if(step==0&&window.SRVV!='cfg'&&document.activeElement?.tagName!='INPUT'&&document.activeElement?.tagName!='TEXTAREA')render()}
function pedirNuevo(){const d=document.createElement('div');d.id='modal';d.innerHTML=`<div class="mbox"><div style="font-size:34px">📝</div><p>¿Desea realizar un nuevo presupuesto?<br><small>El actual se guardará en el historial.</small></p><div class="mb"><button id="mNo">Cancelar</button><button id="mSi">Sí, nuevo</button></div></div>`;document.body.appendChild(d);
 d.querySelector('#mNo').onclick=()=>d.remove();d.onclick=e=>{if(e.target==d)d.remove()};d.querySelector('#mSi').onclick=async()=>{d.remove();await nuevo();scrollTo(0,0)}}
async function nuevo(){window.SRVV=0;await dbPut(S);S=newQ();step=0;await dbPut(S);mSet('cur',S.id);window.EXP=0;await loadList();render();toast('Nuevo presupuesto creado')}
async function abrir(id){window.SRVV=0;await dbPut(S);S=(await dbAll()).find(q=>q.id==id);step=0;mSet('cur',id);window.EXP=['cif','hotel','empresa','dirfiscal','dirhotel'].some(k=>S.cli[k]);await loadList();render()}
async function duplicar(id){const q=structuredClone((await dbAll()).find(q=>q.id==id));q.id=uid();q.creado=q.upd=Date.now();q.cli.nombre=(q.cli.nombre||'')+' (copia)';await dbPut(q);mark();await loadList();render();toast('Duplicado')}
async function borrar(id){const q=LIST.find(x=>x.id==id);if(!confirm(`¿Eliminar definitivamente "${q?.cli?.nombre||'(sin nombre)'}"?`))return;await dbDel(id);mark();if(id==S.id){S=LIST.find(x=>x.id!=id)||newQ();await dbPut(S);mSet('cur',S.id)}await loadList();render()}
(async()=>{
 perHistFill();
 try{await migrar()}catch(e){console.warn(e)}
 SRV=(await mGet('srv'))||DEFSRV.map(([n,d],i)=>({id:'s'+i,n,d}));CFG=Object.assign(CFG,await mGet('cfg')||{});
 const all=await dbAll(),cur=await mGet('cur');S=all.find(q=>q.id==cur)||all.sort((a,b)=>b.upd-a.upd)[0];
 if(!S){S=newQ();await dbPut(S);mSet('cur',S.id)}else step=Math.min(+(await mGet('step'))||0,S.zonas.length+1);
 try{await importTpros()}catch(e){console.warn('importTpros',e)}
 window.EXP=['cif','hotel','empresa','dirfiscal','dirhotel'].some(k=>S.cli[k]);await loadList();render();
 if(navigator.storage?.persist)navigator.storage.persisted().then(p=>p||navigator.storage.persist());
 if(CFG.auto&&CFG.lastBackupDay!=hoy()&&CFG.lastChange>CFG.lastBackup)setTimeout(()=>exportar(true),1200);
})();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');

// ---- Ubicación geolocalizada + ortofoto ----
const GMS=(v,p,n)=>{const a=Math.abs(v),d=Math.floor(a),m=Math.floor((a-d)*60),s=((a-d)*60-m)*60;return `${d}°${String(m).padStart(2,'0')}'${s.toFixed(1).padStart(4,'0')}" ${v<0?n:p}`};
const GTXT=g=>`${g.lat.toFixed(6)}, ${g.lon.toFixed(6)}`,GGMS=g=>GMS(g.lat,'N','S')+'  '+GMS(g.lon,'E','O');
const GMAP=g=>`https://www.google.com/maps?q=${g.lat.toFixed(6)},${g.lon.toFixed(6)}`;
function geoPanel(){const g=S.geo;return `<div class="geop"><b>📍 Ubicación del servicio</b>${g?`<span class="geoi">${GTXT(g)}${g.acc?' · ±'+Math.round(g.acc)+' m':' · '+esc(g.origen||'')}</span><button class="pbtn sb" onclick="capturarUbic()">🔄 Repetir ubicación</button><button class="pbtn sb gr" onclick="borrarUbic()">🗑 Borrar ubicación</button>`:`<span class="geoi">Añade una ortofoto de satélite de donde estás a la última página del PDF.</span><button class="pbtn sb" onclick="capturarUbic()">📍 Capturar ubicación</button>`}</div>`}
function geoDoc(){const g=S.geo;if(!g)return'';return `<div class="ubic"><h3>📍 Ubicación del servicio</h3>${g.img?`<img class="orto" src="${g.img}">`:''}<div class="box"><b>Coordenadas:</b> ${GTXT(g)} (${GGMS(g)})${g.acc?`<br><b>Precisión:</b> ±${Math.round(g.acc)} m · `:'<br>'}<b>Fecha:</b> ${new Date(g.fecha).toLocaleString('es-ES')}<br><b>Google Maps:</b> <a href="${GMAP(g)}">${GMAP(g)}</a>${g.src?`<br><small>Ortofoto: ${esc(g.src)}</small>`:''}</div></div>`}
function borrarUbic(){if(!confirm('¿Borrar la ubicación de este presupuesto?'))return;delete S.geo;save();render()}
function capturarUbic(){if(!navigator.geolocation){toast('Este dispositivo no permite obtener la ubicación.');return}
 loading(1,'Obteniendo ubicación GPS…');
 navigator.geolocation.getCurrentPosition(async p=>{const g={lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy||0,fecha:new Date().toISOString()};
  loading(1,'Descargando ortofoto…');try{const r=await ortofoto(g.lat,g.lon,g.acc);g.img=r.img;g.src=r.src}catch(e){toast('Ubicación guardada, pero no se pudo descargar la ortofoto (¿sin internet?).')}
  S.geo=g;save();loading(0);render();toast('📍 Ubicación capturada')},
 e=>{loading(0);toast(e.code==1?'Permiso de ubicación denegado. Actívelo en los ajustes del navegador para esta app.':e.code==2?'No hay señal GPS / ubicación no disponible. Salga al exterior o active el GPS y repita.':e.code==3?'Tiempo agotado buscando la ubicación. Inténtelo de nuevo.':'Error de ubicación: '+e.message)},
 {enableHighAccuracy:true,timeout:25000,maximumAge:0})}
const loadImg=async u=>{const r=await fetch(u,{mode:'cors'});if(!r.ok)throw Error('HTTP '+r.status);const b=await r.blob();if(!/image/.test(b.type))throw Error('no image');return await createImageBitmap(b)};
async function ortofoto(lat,lon,acc){const W=1000,H=700,R=6378137,x=R*lon*Math.PI/180,y=R*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
 const mpp=0.3/Math.cos(lat*Math.PI/180);// ~0.3 m/px en suelo -> 300x210 m
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');let src,gm;// metros reales por pixel
 try{const bb=[x-W/2*mpp,y-H/2*mpp,x+W/2*mpp,y+H/2*mpp].map(v=>v.toFixed(2)).join(',');
  const im=await loadImg(`https://www.ign.es/wms-inspire/pnoa-ma?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=OI.OrthoimageCoverage&STYLES=&CRS=EPSG:3857&BBOX=${bb}&WIDTH=${W}&HEIGHT=${H}&FORMAT=image/jpeg`);
  ctx.drawImage(im,0,0,W,H);src='PNOA © Instituto Geográfico Nacional (IGN)';gm=mpp*Math.cos(lat*Math.PI/180)}
 catch(e){const z=18,n=2**z,fx=(lon+180)/360*n,fy=(1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*n,tx=Math.floor(fx),ty=Math.floor(fy);
  const ox=W/2-(fx-tx)*256,oy=H/2-(fy-ty)*256,jobs=[];
  for(let dx=-3;dx<=3;dx++)for(let dy=-2;dy<=2;dy++){const px=ox+dx*256,py=oy+dy*256;if(px>W||py>H||px<-256||py<-256)continue;
   jobs.push(loadImg(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty+dy}/${tx+dx}`).then(im=>ctx.drawImage(im,px,py)).catch(()=>0))}
  ctx.fillStyle='#ccc';ctx.fillRect(0,0,W,H);await Promise.all(jobs);src='Esri World Imagery (Esri, Maxar, Earthstar Geographics)';gm=2*Math.PI*R*Math.cos(lat*Math.PI/180)/(n*256)}
 // círculo de precisión
 const cx=W/2,cy=H/2,ar=Math.min(acc/gm,400);if(ar>12){ctx.beginPath();ctx.arc(cx,cy,ar,0,7);ctx.fillStyle='rgba(200,16,46,.15)';ctx.fill();ctx.strokeStyle='rgba(200,16,46,.8)';ctx.lineWidth=2;ctx.stroke()}
 // marcador
 ctx.save();ctx.translate(cx,cy);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-6,-14,-20,-24,-20,-38);ctx.arc(0,-38,20,Math.PI,0);ctx.bezierCurveTo(20,-24,6,-14,0,0);ctx.fillStyle='#C8102E';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.stroke();ctx.beginPath();ctx.arc(0,-38,7,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.restore();
 // escala
 const opts=[10,20,25,50,100,200,500],m=opts.reduce((a,v)=>v/gm<=220?v:a,10),L=m/gm;
 ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(14,H-50,L+20,36);ctx.fillStyle='#222';ctx.fillRect(24,H-24,L,5);ctx.fillRect(24,H-30,3,11);ctx.fillRect(24+L-3,H-30,3,11);ctx.font='bold 15px Arial';ctx.fillText(m+' m',24,H-31);
 // texto
 const t1=`${lat.toFixed(6)}, ${lon.toFixed(6)}`,t2=GMS(lat,'N','S')+'  '+GMS(lon,'E','O');ctx.font='bold 18px Arial';const bw=Math.max(ctx.measureText(t1).width,ctx.measureText(t2).width)+24;
 ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(W-bw-14,14,bw,56);ctx.fillStyle='#fff';ctx.fillText(t1,W-bw-2,38);ctx.font='16px Arial';ctx.fillText(t2,W-bw-2,60);
 ctx.font='12px Arial';const at=src;const aw=ctx.measureText(at).width+12;ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(W-aw,H-20,aw,20);ctx.fillStyle='#333';ctx.fillText(at,W-aw+6,H-6);
 return{img:c.toDataURL('image/jpeg',.82),src}}

// ---- Integración con TeProspección ----
const TPCAT={bar:'Bar',cafe:'Cafetería',rest:'Restaurante',inmo:'Inmobiliaria',super:'Supermercado',mini:'Minimercado',taller:'Taller',carn:'Carnicería',pan:'Panadería',farm:'Farmacia',gym:'Gimnasio',pelu:'Peluquería',cole:'Colegio',clin:'Clínica',alm:'Almacén'};
const qHasData=q=>!!(q&&((q.cli.nombre||'').trim()||(q.cli.dir||'').trim()||(q.cli.tel||'').trim()||q.zonas.length||q.geo||(q.firmas&&Object.keys(q.firmas).length)));
async function importTpros(){const P=new URLSearchParams(location.search);if(P.get('from')!='tpros')return;
 history.replaceState(null,'',location.pathname);
 const g=k=>(P.get(k)||'').trim();
 if(qHasData(S)){await dbPut(S);S=newQ()}else{const id=S.id;S=newQ();S.id=id}
 const cat=g('cat'),c=S.cli;
 if(cat=='hotel')c.tipo='hotel';else{c.tipo='estab';const e=TPCAT[cat]||(cat&&cat[0].toUpperCase()+cat.slice(1))||'';
  if(e){if(![...ESTAB,...(CFG.estab||[])].includes(e)){CFG.estab=[...(CFG.estab||[]),e];mSet('cfg',CFG)}c.estab=e}}
 c.nombre=g('nombre');c.dir=g('dir');c.dirhotel=g('dir');c.tel=g('tel');S.pid=g('pid');S.origen='teprospeccion';
 const lat=parseFloat(g('lat')),lon=parseFloat(g('lon'));
 if(isFinite(lat)&&isFinite(lon)){S.geo={lat,lon,acc:0,fecha:new Date().toISOString(),origen:'TeProspección (Google Maps)'};
  if(navigator.onLine!==false)ortofoto(lat,lon,0).then(r=>{if(S.geo&&S.geo.lat==lat&&S.geo.lon==lon&&!S.geo.img){S.geo.img=r.img;S.geo.src=r.src;save();if(step==N()-1)render()}}).catch(e=>console.warn('ortofoto',e))}
 step=0;await dbPut(S);mSet('cur',S.id);mSet('step',0);setTimeout(()=>toast('Datos importados de TeProspección'),300)}
function tprosSync(){try{if(!S||!S.pid)return;const a=JSON.parse(localStorage.getItem('tpros_sync')||'[]');const ref=docInfo().num;
 if(a.some(x=>x.pid==S.pid&&x.ref==ref))return;a.push({pid:S.pid,fecha:new Date().toISOString(),estado:'presupuesto',ref,qid:S.id,val:!S.zonas.some(z=>+z.precio>0)});localStorage.setItem('tpros_sync',JSON.stringify(a))}catch(e){console.warn('tprosSync',e)}}
{const _c=compartir;compartir=function(via){tprosSync();return _c(via)}}
