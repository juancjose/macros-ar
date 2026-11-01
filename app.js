'use strict';
/* ===== Datos ===== */
const MEALS=[['desayuno','Desayuno','☕'],['almuerzo','Almuerzo','🍽️'],['merienda','Merienda','🧉'],['cena','Cena','🌙'],['snacks','Snacks','🍎']];
const norm=s=>(s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
FOODS.forEach(f=>{f.key=f.n+'|'+f.st;f.hay=norm(f.n+' '+f.s.replace(/,/g,' ')+' '+f.cat+' '+(f.st==='—'?'':f.st));f.nn=norm(f.n)});
const BYKEY=Object.fromEntries(FOODS.map(f=>[f.key,f]));
const POP=['Pechuga de pollo (sin piel)','Huevo entero','Arroz blanco','Avena arrollada','Banana','Leche descremada','Queso de máquina (tybo)','Carne picada magra (95/5)','Fideos secos (trigo)','Papa','Manzana','Yogur natural descremado','Pan integral','Tomate'];
const CATS=[...new Set(FOODS.map(f=>f.cat))];
const TR=[[/\bcups?\b/g,'taza'],[/\btbsp\b/g,'cda'],[/\btsp\b/g,'cdita'],[/\bslices?\b/g,'feta/rodaja'],[/\bextra large\b/g,'extra grande'],[/\blarge\b/g,'grande'],[/\bmedium\b/g,'mediano'],[/\bsmall\b/g,'chico'],[/\bfruit\b/g,'unidad'],[/\bpieces?\b/g,'porción'],[/\bsteak\b/g,'bife'],[/\bbreast\b/g,'pechuga'],[/\bthigh\b/g,'muslo'],[/\bdrumstick\b/g,'pata'],[/\bcan\b/g,'lata'],[/\bchopped\b/g,'picado'],[/\bsliced\b/g,'en rodajas'],[/\bdiced\b/g,'en cubos'],[/\bwhole\b/g,'entero'],[/\bcooked\b/g,'cocido'],[/\bnuts?\b/g,'unidades'],[/\bpackage\b/g,'paquete'],[/\bserving\b/g,'porción'],[/\bstalk\b/g,'tallo'],[/\bleaf\b|\bleaves\b/g,'hoja'],[/\bclove\b/g,'diente'],[/\bear\b/g,'choclo'],[/\bcontainer\b/g,'pote'],[/\bfl oz\b/g,'onza líq.'],[/\boz\b/g,'oz'],[/\bunit\b/g,'unidad'],[/\bundetermined\b/g,'unidad'],[/\bpat\b/g,'trocito'],[/\bpatty\b/g,'hamburguesa']];
const trPortion=s=>{let t=s.toLowerCase();TR.forEach(([a,b])=>t=t.replace(a,b));return t.replace(/\(.*?\)/g,'').replace(/\s+/g,' ').trim()};
const prank=p=>/cup|oz|package|lb\b|container|can\b/i.test(p[0])?(/^1 cup/i.test(p[0])&&!/,/.test(p[0])?1:2):0;
FOODS.forEach(f=>{f.portions=(f.por||[]).filter(p=>p[1]>0&&p[1]<600&&!/oz$|package|\blb\b|NLEA/i.test(p[0])).sort((a,b)=>prank(a)-prank(b)).map(p=>[trPortion(p[0]),Math.round(p[1])]).filter((p,i,a)=>a.findIndex(q=>q[0]===p[0])===i).slice(0,4)});
const calc=(f,g)=>({kcal:f.kcal*g/100,p:f.p*g/100,c:f.c*g/100,f:f.f*g/100,fib:f.fib*g/100});

/* ===== Estado ===== */
const KEY='macros-ar-v1';
const DEF={targets:{kcal:2200,p:150,c:240,f:70},profile:{},days:{},favs:[],templates:[],progress:[],recent:[],seenHint:false};
let S;try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S={...DEF}}
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const TODAY=()=>ymd(new Date());
let pendMeal=null,cur=TODAY(),tab='inicio',q='',cat='',histMonth=null;
const day=d=>S.days[d]||(S.days[d]={meals:{}});
const items=d=>{const D=S.days[d];if(!D)return[];return MEALS.flatMap(([m])=>(D.meals[m]||[]).map(it=>({...it,meal:m})))};
const totals=d=>items(d).reduce((t,it)=>{const f=BYKEY[it.k];if(!f)return t;const m=calc(f,it.g);for(const k in m)t[k]+=m[k];return t},{kcal:0,p:0,c:0,f:0,fib:0});
const r0=x=>Math.round(x),r1=x=>Math.round(x*10)/10;
const fmtD=(d,o={weekday:'long',day:'numeric',month:'long'})=>parse(d).toLocaleDateString('es-AR',o);
const status=(v,t)=>{if(!t)return'';const r=v/t;return r>=.9&&r<=1.1?'ok':r>=.8&&r<=1.2?'warn':'bad'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s),V=$('#view');
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1600)}
const defMeal=()=>{const h=new Date().getHours();return h<11?'desayuno':h<15?'almuerzo':h<19?'merienda':h<23?'cena':'snacks'};

/* ===== Búsqueda (difusa, sin acentos) ===== */
function lev1(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,e=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++e>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}}return e+(a.length-i)+(b.length-j)<=1}
function tokMatch(t,hay){if(hay.includes(t))return 2;if(t.length>=4){const ws=hay.split(/\s+/);for(const w of ws){if(lev1(t,w.slice(0,t.length))||lev1(t,w))return 1}}return 0}
function search(qq,c){const toks=norm(qq).split(/\s+/).filter(Boolean);let L=FOODS.filter(f=>!c||f.cat===c);if(c==='★')L=FOODS.filter(f=>S.favs.includes(f.n));
 if(!toks.length)return L;const out=[];for(const f of L){let sc=0,ok=true;for(const t of toks){const m=tokMatch(t,f.hay);if(!m){ok=false;break}sc+=m}if(!ok)continue;if(f.nn.startsWith(toks[0]))sc+=5;else if(f.nn.includes(toks[0]))sc+=3;if(S.favs.includes(f.n))sc+=1;if(POP.includes(f.n))sc+=2.5;out.push([sc,f])}
 return out.sort((a,b)=>b[0]-a[0]||a[1].n.localeCompare(b[1].n)).map(x=>x[1])}
const groupKeys=L=>{const seen=new Set,out=[];for(const f of L){if(seen.has(f.n))continue;seen.add(f.n);out.push(f)}return out};
const variants=n=>FOODS.filter(f=>f.n===n);

/* ===== Vistas ===== */
function setTab(t){tab=t;document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));render();scrollTo(0,0)}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function render(){$('#topdate').textContent=fmtD(TODAY(),{weekday:'short',day:'numeric',month:'short'});({inicio:vInicio,hoy:vHoy,historial:vHist,perfil:vPerfil,mas:vMas})[tab]()}

function foodRow(f){const vs=variants(f.n);const fv=vs.find(v=>v.st==='cocido')&&q.match(/cocid/)?vs.find(v=>v.st==='cocido'):vs[0];
 return `<div class="food" data-n="${esc(f.n)}"><div class="grow"><div class="nm">${esc(f.n)}${S.favs.includes(f.n)?' <span class="C">★</span>':''}${vs.length>1?'<span class="tag">crudo/cocido</span>':''}</div><div class="sub">${esc(f.cat)} · <span class="P">P ${r1(fv.p)}</span> · <span class="C">C ${r1(fv.c)}</span> · <span class="F">G ${r1(fv.f)}</span>${fv.st!=='—'?' · '+fv.st:''}</div></div><div class="kc">${r0(fv.kcal)}<small>kcal/100 g</small></div></div>`}

function miniSummary(){const t=totals(TODAY()),T=S.targets,left=T.kcal-t.kcal;
 return `<div class="card" id="mini" style="cursor:pointer"><div class="row between"><div><h3 style="margin:0">Hoy</h3><div style="font-size:26px;font-weight:800">${r0(t.kcal)} <span class="mut" style="font-size:14px;font-weight:500">de ${T.kcal} kcal</span></div><div class="small mut">${left>=0?'Te quedan '+r0(left)+' kcal':'Te pasaste '+r0(-left)+' kcal'}</div></div>
 <div class="legend small"><div><span class="P">●</span> Proteína ${r0(t.p)}/${T.p} g</div><div><span class="C">●</span> Carbos ${r0(t.c)}/${T.c} g</div><div><span class="F">●</span> Grasas ${r0(t.f)}/${T.f} g</div></div></div>
 <div class="bar" style="margin-bottom:0"><i style="width:${Math.min(100,t.kcal/T.kcal*100)}%;background:linear-gradient(90deg,var(--acc),var(--acc2))"></i></div></div>`}

function vInicio(){
 const hint=!S.seenHint?`<div class="card" id="hint" style="border-color:var(--acc)"><div class="row between"><b>👋 ¿Cómo se usa?</b><button class="icon" id="hintx" aria-label="cerrar">✕</button></div><div class="small" style="margin-top:6px">1. Buscá un alimento (ej: <i>pollo</i>, <i>avena</i>, <i>nalga</i>).<br>2. Tocalo y poné cuántos gramos.<br>3. Tocá <b>Agregar</b>. ¡Listo! Se suma a tu día.</div></div>`:'';
 V.innerHTML=`<div class="search"><input id="q" type="search" inputmode="search" autocomplete="off" placeholder="🔎 Buscá un alimento… (pollo, avena, nalga)" value="${esc(q)}" aria-label="Buscar alimento">
 <div class="chips" id="cats"><button class="chip ${!cat?'on':''}" data-c="">Todos</button><button class="chip ${cat==='★'?'on':''}" data-c="★">★ Favoritos</button>${CATS.map(c=>`<button class="chip ${cat===c?'on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
 ${hint}<div id="res"></div>`;
 const qi=$('#q');qi.oninput=()=>{q=qi.value;drawRes()};
 $('#cats').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;cat=b.dataset.c;document.querySelectorAll('#cats .chip').forEach(x=>x.classList.toggle('on',x===b));drawRes()};
 if($('#hintx'))$('#hintx').onclick=()=>{S.seenHint=true;save();$('#hint').remove()};
 drawRes();
}
function drawRes(){const R=$('#res');
 if(!q&&!cat){const rec=S.recent.map(n=>FOODS.find(f=>f.n===n)).filter(Boolean).slice(0,6);
  R.innerHTML=miniSummary()+(rec.length?`<h3>Usados hace poco</h3><div class="card" style="padding:0">${rec.map(foodRow).join('')}</div>`:'')+`<h3>Populares</h3><div class="card" style="padding:0">${['Pechuga de pollo (sin piel)','Huevo entero','Avena arrollada','Arroz blanco','Nalga','Banana','Yogur griego descremado','Atún al natural (lata)'].map(n=>FOODS.find(f=>f.n===n)).filter(Boolean).map(foodRow).join('')}</div>`;
  $('#mini').onclick=()=>setTab('hoy');}
 else{const L=groupKeys(search(q,cat));R.innerHTML=L.length?`<div class="small mut" style="margin:0 4px 6px">${L.length} resultado${L.length>1?'s':''}</div><div class="card" style="padding:0">${L.slice(0,80).map(foodRow).join('')}</div>`:`<div class="empty-st">No encontré "${esc(q)}". Probá con otra palabra.</div>`}
 R.querySelectorAll('.food').forEach(el=>el.onclick=()=>openFood(el.dataset.n));
}

/* ===== Ficha de alimento (agregar / editar) ===== */
function openSheet(html){$('#sheetCard').innerHTML=html;$('#sheet').classList.remove('hidden')}
function closeSheet(){$('#sheet').classList.add('hidden')}
$('.sheet-bg').onclick=closeSheet;
function openFood(n,edit){const vs=variants(n);let f=edit?BYKEY[edit.k]:(vs.find(v=>v.st==='cocido'&&/cocid/.test(norm(q)))||vs[0]);let g=edit?edit.g:100,meal=edit?edit.meal:(pendMeal||defMeal()),date=edit?edit.date:cur===TODAY()?TODAY():cur;
 const draw=()=>{const m=calc(f,g||0);const fav=S.favs.includes(f.n);
 openSheet(`<div class="row between"><div><div style="font-size:20px;font-weight:800">${esc(f.n)}</div><div class="small mut">${esc(f.cat)}</div></div><button class="icon" id="fav" style="font-size:26px;color:${fav?'var(--c)':'var(--mut)'}" aria-label="favorito">${fav?'★':'☆'}</button></div>
 ${vs.length>1?`<div class="seg" style="margin:12px 0">${vs.map(v=>`<button data-st="${v.st}" class="${v===f?'on':''}">${v.st==='crudo'?'🥩 Crudo':'🔥 Cocido'}</button>`).join('')}</div><div class="small mut" style="margin-top:-6px;margin-bottom:8px">Pesalo ${f.st==='crudo'?'crudo, antes de cocinar':'ya cocido'}.</div>`:''}
 <div class="gin" style="margin-top:10px"><button class="btn" id="minus" style="font-size:24px;width:56px;height:56px">−</button><input id="g" type="number" inputmode="decimal" min="0" value="${g}" aria-label="gramos"><span style="font-size:20px;font-weight:700">g</span><button class="btn" id="plus" style="font-size:24px;width:56px;height:56px">+</button></div>
 <div class="chips" id="qg" style="flex-wrap:wrap">${[50,100,150,200,250].map(x=>`<button class="chip ${g==x?'on':''}" data-g="${x}">${x} g</button>`).join('')}${f.portions.map(p=>`<button class="chip" data-g="${p[1]}">${esc(p[0])} · ${p[1]} g</button>`).join('')}</div>
 <div class="big" id="kc">${r0(m.kcal)} <span style="font-size:16px" class="mut">kcal</span></div>
 <div class="grid3"><div class="stat"><b class="P" id="mp">${r1(m.p)}</b><span>Proteína (g)</span></div><div class="stat"><b class="C" id="mc">${r1(m.c)}</b><span>Carbohidratos (g)</span></div><div class="stat"><b class="F" id="mf">${r1(m.f)}</b><span>Grasas (g)</span></div></div>
 <div class="small mut" style="text-align:center;margin:8px 0" id="mfib">Fibra ${r1(m.fib)} g</div>
 <div class="chips" id="ml" style="flex-wrap:wrap;justify-content:center">${MEALS.map(([k,l,e])=>`<button class="chip ${k===meal?'on':''}" data-m="${k}">${e} ${l}</button>`).join('')}</div>
 <button class="btn pri" id="add" style="width:100%;font-size:18px;padding:16px;margin-top:10px">${edit?'Guardar cambios':'＋ Agregar'}${date!==TODAY()?' ('+fmtD(date,{day:'numeric',month:'short'})+')':''}</button>
 ${edit?'<button class="btn danger ghost" id="del" style="width:100%;margin-top:8px">Quitar de la comida</button>':''}
 <details style="margin-top:12px"><summary class="small mut">Fuente de los datos</summary><div class="small mut" style="margin-top:6px">${esc(f.src)}<br>Equivalente usado: <i>${esc(f.usda)}</i><br>Valores cada 100 g: ${f.kcal} kcal · P ${f.p} · C ${f.c} · G ${f.f} · fibra ${f.fib} g.<br><a href="https://fdc.nal.usda.gov/food-details/${f.src.split('#')[1]}/nutrients" target="_blank" rel="noopener">Ver en USDA FoodData Central</a></div></details>`);
 const gi=$('#g');const upd=()=>{const m=calc(f,g||0);$('#kc').innerHTML=`${r0(m.kcal)} <span style="font-size:16px" class="mut">kcal</span>`;$('#mp').textContent=r1(m.p);$('#mc').textContent=r1(m.c);$('#mf').textContent=r1(m.f);$('#mfib').textContent='Fibra '+r1(m.fib)+' g';document.querySelectorAll('#qg .chip').forEach(c=>c.classList.toggle('on',+c.dataset.g===g))};
 gi.oninput=()=>{g=parseFloat(gi.value.replace(',','.'))||0;upd()};gi.onfocus=()=>gi.select();
 $('#minus').onclick=()=>{g=Math.max(0,(g||0)-10);gi.value=g;upd()};$('#plus').onclick=()=>{g=(g||0)+10;gi.value=g;upd()};
 $('#qg').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;g=+c.dataset.g;gi.value=g;upd()};
 $('#ml').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;meal=c.dataset.m;document.querySelectorAll('#ml .chip').forEach(x=>x.classList.toggle('on',x===c))};
 document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{f=vs.find(v=>v.st===b.dataset.st);draw()});
 $('#fav').onclick=()=>{S.favs=fav?S.favs.filter(x=>x!==f.n):[...S.favs,f.n];save();draw()};
 $('#add').onclick=()=>{if(!(g>0)){toast('Poné los gramos');return}const D=day(date);
  if(edit){const arr=D.meals[edit.meal];const i=arr.findIndex(x=>x.id===edit.id);const it={...arr[i],k:f.key,g};arr.splice(i,1);(D.meals[meal]=D.meals[meal]||[]).push(it)}
  else{(D.meals[meal]=D.meals[meal]||[]).push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),k:f.key,g,t:new Date().toISOString()});S.recent=[f.n,...S.recent.filter(x=>x!==f.n)].slice(0,12);S.seenHint=true}
  pendMeal=null;save();closeSheet();toast(edit?'Guardado ✓':'Agregado a '+MEALS.find(x=>x[0]===meal)[1]+' ✓');render()};
 if($('#del'))$('#del').onclick=()=>{const D=day(date);D.meals[edit.meal]=D.meals[edit.meal].filter(x=>x.id!==edit.id);save();closeSheet();toast('Quitado');render()};
 if(!edit)setTimeout(()=>{gi.focus();gi.select()},250);};
 draw();}

/* ===== Mi día ===== */
function bar(lbl,v,t,col){const pc=t?Math.min(100,v/t*100):0;return `<div class="row between small"><span>${lbl}</span><span><b>${r0(v)}</b> / ${t} g</span></div><div class="bar"><i style="width:${pc}%;background:${col}"></i></div>`}
function donut(t){const kp=t.p*4,kc=t.c*4,kf=t.f*9,s=kp+kc+kf||1;const a=kp/s*360,b=a+kc/s*360;
 return `<div class="row"><div class="donut" style="background:${s>1?`conic-gradient(var(--p) 0 ${a}deg,var(--c) ${a}deg ${b}deg,var(--f) ${b}deg 360deg)`:'var(--card2)'}"></div><div class="legend"><div><span class="dot" style="background:var(--p)"></span>Proteína ${r0(kp/s*100)}%</div><div><span class="dot" style="background:var(--c)"></span>Carbos ${r0(kc/s*100)}%</div><div><span class="dot" style="background:var(--f)"></span>Grasas ${r0(kf/s*100)}%</div></div></div>`}
function vHoy(){const t=totals(cur),T=S.targets,D=S.days[cur]||{meals:{}};const pc=Math.min(100,t.kcal/T.kcal*100);const st=status(t.kcal,T.kcal);
 V.innerHTML=`<div class="row between" style="margin-bottom:10px"><button class="btn sm" id="prev" aria-label="día anterior">‹</button><div style="text-align:center"><b style="text-transform:capitalize">${cur===TODAY()?'Hoy':fmtD(cur)}</b>${cur!==TODAY()?'<div class="small"><a href="#" id="gotoday">Volver a hoy</a></div>':''}</div><button class="btn sm" id="next" aria-label="día siguiente">›</button></div>
 <div class="card"><div class="hero"><div class="ring" style="background:conic-gradient(${st==='bad'&&t.kcal>T.kcal?'var(--bad)':'var(--acc)'} ${pc*3.6}deg,var(--card2) 0)"><div><div><b>${r0(t.kcal)}</b><span>de ${T.kcal} kcal</span></div></div></div>
 <div class="grow">${bar('<span class="P">Proteína</span>',t.p,T.p,'var(--p)')}${bar('<span class="C">Carbohidratos</span>',t.c,T.c,'var(--c)')}${bar('<span class="F">Grasas</span>',t.f,T.f,'var(--f)')}<div class="small mut">Fibra ${r0(t.fib)} g</div></div></div>
 <div style="margin-top:12px" class="row between">${donut(t)}<button class="btn sm" id="edT">Objetivos</button></div></div>
 ${MEALS.map(([k,l,e])=>{const arr=D.meals[k]||[];const mt=arr.reduce((a,it)=>{const f=BYKEY[it.k];return f?a+calc(f,it.g).kcal:a},0);
  return `<div class="card meal"><div class="meal-h"><b>${e} ${l}</b><span class="row"><span class="mut small">${r0(mt)} kcal</span><button class="btn sm" data-add="${k}">＋</button>${arr.length?`<button class="icon" data-menu="${k}" aria-label="opciones">⋯</button>`:''}</span></div>
  ${arr.map(it=>{const f=BYKEY[it.k];if(!f)return'';const m=calc(f,it.g);return `<div class="item" data-meal="${k}" data-id="${it.id}" style="cursor:pointer"><div class="grow"><div class="nm">${esc(f.n)}${f.st!=='—'?` <span class="tag">${f.st}</span>`:''}</div><div class="small mut">${it.g} g · ${new Date(it.t).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})} · <span class="P">P ${r1(m.p)}</span> <span class="C">C ${r1(m.c)}</span> <span class="F">G ${r1(m.f)}</span></div></div><b>${r0(m.kcal)}</b></div>`}).join('')}</div>`}).join('')}
 ${S.templates.length?`<div class="card"><h3>Comidas guardadas</h3>${S.templates.map((tp,i)=>`<div class="item"><div class="grow"><div class="nm">${esc(tp.name)}</div><div class="small mut">${tp.items.length} alimentos · ${r0(tp.items.reduce((a,it)=>a+(BYKEY[it.k]?calc(BYKEY[it.k],it.g).kcal:0),0))} kcal</div></div><button class="btn sm" data-tpl="${i}">＋ Usar</button><button class="icon" data-tdel="${i}" aria-label="borrar">🗑</button></div>`).join('')}</div>`:''}`;
 $('#prev').onclick=()=>{const d=parse(cur);d.setDate(d.getDate()-1);cur=ymd(d);render()};
 $('#next').onclick=()=>{const d=parse(cur);d.setDate(d.getDate()+1);cur=ymd(d);render()};
 if($('#gotoday'))$('#gotoday').onclick=e=>{e.preventDefault();cur=TODAY();render()};
 $('#edT').onclick=()=>{setTab('perfil');setTimeout(()=>$('#targets')?.scrollIntoView({behavior:'smooth'}),50)};
 V.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{pendMeal=b.dataset.add;setTab('inicio');toast('Buscá el alimento para '+MEALS.find(m=>m[0]===b.dataset.add)[1])});
 V.querySelectorAll('.item[data-id]').forEach(el=>el.onclick=()=>{const it=(S.days[cur].meals[el.dataset.meal]).find(x=>x.id===el.dataset.id);openFood(BYKEY[it.k].n,{...it,meal:el.dataset.meal,date:cur})});
 V.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>{const k=b.dataset.menu;openSheet(`<h2>${MEALS.find(m=>m[0]===k)[1]}</h2><button class="btn" id="svT" style="width:100%;margin-bottom:8px">💾 Guardar como comida frecuente</button><button class="btn" id="cpT" style="width:100%;margin-bottom:8px">📋 Copiar a hoy</button><button class="btn danger" id="clr" style="width:100%">Vaciar esta comida</button>`);
  $('#svT').onclick=()=>{const name=prompt('Nombre de la comida (ej: Desayuno de siempre)',MEALS.find(m=>m[0]===k)[1]);if(!name)return;S.templates.push({name,meal:k,items:S.days[cur].meals[k].map(({k,g})=>({k,g}))});save();closeSheet();toast('Comida guardada ✓');render()};
  $('#cpT').onclick=()=>{const D=day(TODAY());D.meals[k]=(D.meals[k]||[]).concat(S.days[cur].meals[k].map(it=>({...it,id:Math.random().toString(36).slice(2),t:new Date().toISOString()})));save();closeSheet();toast('Copiado a hoy ✓');render()};
  $('#clr').onclick=()=>{if(!confirm('¿Vaciar '+k+'?'))return;S.days[cur].meals[k]=[];save();closeSheet();render()}});
 V.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>{const tp=S.templates[+b.dataset.tpl];const D=day(cur);const m=tp.meal||defMeal();D.meals[m]=(D.meals[m]||[]).concat(tp.items.map(it=>({...it,id:Math.random().toString(36).slice(2),t:new Date().toISOString()})));save();toast('Agregado ✓');render()});
 V.querySelectorAll('[data-tdel]').forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar esta comida guardada?'))return;S.templates.splice(+b.dataset.tdel,1);save();render()});
}

/* ===== Gráfico de líneas SVG ===== */
function lineChart(series,{target,labels=[],unit=''}={}){const W=600,H=170,P=28;const all=series.flatMap(s=>s.pts.map(p=>p[1])).concat(target?[target]:[]);if(!all.length)return'<div class="empty-st small">Todavía no hay datos</div>';
 let mn=Math.min(...all),mx=Math.max(...all);if(mn===mx){mn-=1;mx+=1}const pad=(mx-mn)*.12;mn-=pad;mx+=pad;const n=Math.max(...series.map(s=>s.pts.length))-1||1;
 const X=i=>P+i*(W-P*2)/n,Y=v=>H-P-(v-mn)/(mx-mn)*(H-P*2);let o=`<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;
 [mn+pad,(mn+mx)/2,mx-pad].forEach(v=>o+=`<line x1="${P}" x2="${W-P}" y1="${Y(v)}" y2="${Y(v)}" stroke="#232d3a"/><text x="2" y="${Y(v)+4}" fill="#8a97a8" font-size="11">${r0(v)}</text>`);
 if(target)o+=`<line x1="${P}" x2="${W-P}" y1="${Y(target)}" y2="${Y(target)}" stroke="#34d399" stroke-dasharray="6 5"/>`;
 series.forEach(s=>{const pts=s.pts.filter(p=>p[1]!=null);if(!pts.length)return;o+=`<polyline fill="none" stroke="${s.col}" stroke-width="3" stroke-linejoin="round" points="${pts.map(p=>X(p[0])+','+Y(p[1])).join(' ')}"/>`+pts.map(p=>`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.5" fill="${s.col}"/>`).join('')});
 labels.forEach((l,i)=>{if(l)o+=`<text x="${X(i)}" y="${H-6}" fill="#8a97a8" font-size="11" text-anchor="middle">${l}</text>`});return o+'</svg>'}

/* ===== Historial ===== */
function vHist(){const T=S.targets;const base=histMonth||parse(TODAY());const y=base.getFullYear(),mo=base.getMonth();const first=new Date(y,mo,1),days=new Date(y,mo+1,0).getDate();const off=(first.getDay()+6)%7;
 let cal='';['L','M','M','J','V','S','D'].forEach(d=>cal+=`<div class="dh">${d}</div>`);for(let i=0;i<off;i++)cal+='<div class="d empty"></div>';
 for(let d=1;d<=days;d++){const k=ymd(new Date(y,mo,d));const t=totals(k);const has=items(k).length;cal+=`<div class="d ${has?status(t.kcal,T.kcal):''} ${k===TODAY()?'today':''}" data-d="${k}">${d}${has?`<small>${r0(t.kcal)}</small>`:''}</div>`}
 const last7=[...Array(7)].map((_,i)=>{const d=parse(TODAY());d.setDate(d.getDate()-6+i);return ymd(d)});const logged=last7.filter(k=>items(k).length);
 const avg=logged.reduce((a,k)=>{const t=totals(k);for(const x in a)a[x]+=t[x]/logged.length;return a},{kcal:0,p:0,c:0,f:0});
 const last30=[...Array(30)].map((_,i)=>{const d=parse(TODAY());d.setDate(d.getDate()-29+i);return ymd(d)});
 V.innerHTML=`<div class="card"><h3>Promedio últimos 7 días</h3>${logged.length?`<div class="grid2" style="grid-template-columns:repeat(4,1fr)"><div class="stat"><b>${r0(avg.kcal)}</b><span>kcal / ${T.kcal}</span></div><div class="stat"><b class="P">${r0(avg.p)}</b><span>prot / ${T.p}</span></div><div class="stat"><b class="C">${r0(avg.c)}</b><span>carb / ${T.c}</span></div><div class="stat"><b class="F">${r0(avg.f)}</b><span>grasa / ${T.f}</span></div></div><div class="small mut" style="margin-top:6px">${logged.length} de 7 días registrados</div>`:'<div class="empty-st small">Registrá comidas para ver tus promedios.</div>'}</div>
 <div class="card"><h3>Tendencia (30 días)</h3>${lineChart([{col:'#0ea5e9',pts:last30.map((k,i)=>[i,items(k).length?r0(totals(k).kcal):null])}],{target:T.kcal,labels:last30.map((k,i)=>i%7===0?parse(k).getDate()+'/'+(parse(k).getMonth()+1):'')})}<div class="small mut"><span style="color:#0ea5e9">━</span> kcal por día &nbsp; <span class="C" style="color:var(--acc)">┅</span> objetivo</div></div>
 <div class="card"><div class="row between"><button class="btn sm" id="pm">‹</button><b style="text-transform:capitalize">${first.toLocaleDateString('es-AR',{month:'long',year:'numeric'})}</b><button class="btn sm" id="nm">›</button></div><div class="cal" style="margin-top:10px">${cal}</div>
 <div class="small mut" style="margin-top:8px"><span class="pill ok">±10%</span> cerca del objetivo · <span class="pill warn">±20%</span> · <span class="pill bad">lejos</span></div></div>
 <div class="card"><h3>Semana</h3>${last7.slice().reverse().map(k=>{const t=totals(k);const has=items(k).length;return `<div class="wk" data-d="${k}"><div class="small" style="text-transform:capitalize">${fmtD(k,{weekday:'short',day:'numeric'})}</div><div class="small">${has?`<span class="P">P ${r0(t.p)}</span> · <span class="C">C ${r0(t.c)}</span> · <span class="F">G ${r0(t.f)}</span>`:'<span class="mut">Sin registro</span>'}</div><div>${has?`<span class="pill ${status(t.kcal,T.kcal)}">${r0(t.kcal)} kcal</span>`:''}</div></div>`}).join('')}</div>`;
 $('#pm').onclick=()=>{histMonth=new Date(y,mo-1,1);render()};$('#nm').onclick=()=>{histMonth=new Date(y,mo+1,1);render()};
 V.querySelectorAll('[data-d]').forEach(el=>el.onclick=()=>{cur=el.dataset.d;setTab('hoy')});
}

/* ===== Perfil y progreso ===== */
const ACT=[[1.2,'Sedentario (poco o nada de ejercicio)'],[1.375,'Liviano (1-3 días/semana)'],[1.55,'Moderado (3-5 días/semana)'],[1.725,'Alto (6-7 días/semana)'],[1.9,'Muy alto (2 turnos o trabajo físico)']];
const GOALS=[['bajar','Bajar grasa (−20%)',-.2],['mantener','Mantener',0],['subir','Ganar músculo (+10%)',.1]];
function mifflin(p){const w=+p.weight,h=+p.height,a=+p.age;if(!w||!h||!a)return null;const bmr=10*w+6.25*h-5*a+(p.sex==='f'?-161:5);const tdee=bmr*(+p.act||1.55);const g=GOALS.find(x=>x[0]===(p.goal||'mantener'));const kcal=Math.round(tdee*(1+g[2])/10)*10;
 const pr=Math.round(w*(p.goal==='bajar'?2.2:p.goal==='subir'?2:1.8));const fat=Math.round(kcal*.25/9);const carb=Math.max(0,Math.round((kcal-pr*4-fat*9)/4));return{bmr:r0(bmr),tdee:r0(tdee),kcal,p:pr,c:carb,f:fat}}
const MEAS=[['weight','Peso','kg'],['cintura','Cintura','cm'],['pecho','Pecho','cm'],['brazo','Brazo','cm'],['cadera','Cadera','cm'],['grasa','% grasa','%']];
let chartM='weight';
function vPerfil(){const p=S.profile,T=S.targets;const lastW=[...S.progress].sort((a,b)=>a.date<b.date?-1:1).filter(e=>e.weight).pop();if(lastW&&!p.weight)p.weight=lastW.weight;const res=mifflin(p);
 const PR=[...S.progress].sort((a,b)=>a.date<b.date?-1:1);const W=PR.filter(e=>e[chartM]!=null&&e[chartM]!=='');
 const startW=PR.find(e=>e.weight)?.weight,nowW=lastW?.weight;let goalPc=null;if(startW&&nowW&&p.targetWeight&&+startW!==+p.targetWeight)goalPc=Math.max(0,Math.min(100,(startW-nowW)/(startW-p.targetWeight)*100));
 V.innerHTML=`<div class="card"><h2>👤 Mi perfil</h2><div class="grid2">
 <label>Nombre<input id="p_name" value="${esc(p.name||'')}" placeholder="Juan José"></label><label>Edad<input id="p_age" type="number" inputmode="numeric" value="${esc(p.age||'')}"></label>
 <label>Sexo<select id="p_sex"><option value="m" ${p.sex!=='f'?'selected':''}>Hombre</option><option value="f" ${p.sex==='f'?'selected':''}>Mujer</option></select></label><label>Altura (cm)<input id="p_height" type="number" inputmode="decimal" value="${esc(p.height||'')}"></label>
 <label>Peso actual (kg)<input id="p_weight" type="number" inputmode="decimal" value="${esc(p.weight||'')}"></label><label>Peso objetivo (kg)<input id="p_targetWeight" type="number" inputmode="decimal" value="${esc(p.targetWeight||'')}"></label></div>
 <label>Actividad<select id="p_act">${ACT.map(([v,l])=>`<option value="${v}" ${+p.act===v||(!p.act&&v===1.55)?'selected':''}>${l}</option>`).join('')}</select></label>
 <label>Objetivo<select id="p_goal">${GOALS.map(([v,l])=>`<option value="${v}" ${(p.goal||'mantener')===v?'selected':''}>${l}</option>`).join('')}</select></label>
 ${res?`<div class="card" style="background:var(--card2);margin:4px 0 0"><div class="small mut">Fórmula Mifflin-St Jeor · metabolismo basal ${res.bmr} kcal · gasto diario ≈ ${res.tdee} kcal</div><div style="font-size:18px;margin:6px 0"><b>${res.kcal} kcal</b> · <span class="P">P ${res.p} g</span> · <span class="C">C ${res.c} g</span> · <span class="F">G ${res.f} g</span></div><button class="btn pri" id="apply" style="width:100%">Usar como mis objetivos</button></div>`:'<div class="small mut">Completá edad, altura y peso para calcular tus objetivos.</div>'}</div>
 <div class="card" id="targets"><h2>🎯 Objetivos diarios</h2><div class="grid2"><label>Calorías (kcal)<input id="t_kcal" type="number" inputmode="numeric" value="${T.kcal}"></label><label>Proteína (g)<input id="t_p" type="number" inputmode="numeric" value="${T.p}"></label><label>Carbohidratos (g)<input id="t_c" type="number" inputmode="numeric" value="${T.c}"></label><label>Grasas (g)<input id="t_f" type="number" inputmode="numeric" value="${T.f}"></label></div><div class="small mut">Se guardan solos.</div></div>
 <div class="card"><h2>📈 Mi progreso</h2>
 ${startW?`<div class="grid3"><div class="stat"><b>${nowW}</b><span>kg actual</span></div><div class="stat"><b>${(nowW-startW>0?'+':'')+r1(nowW-startW)}</b><span>kg vs inicio (${startW})</span></div><div class="stat"><b>${p.targetWeight||'—'}</b><span>kg objetivo</span></div></div>${goalPc!=null?`<div class="row between small" style="margin-top:10px"><span>Camino al objetivo</span><b>${r0(goalPc)}%</b></div><div class="bar"><i style="width:${goalPc}%;background:linear-gradient(90deg,var(--acc),var(--acc2))"></i></div>`:''}`:'<div class="small mut">Registrá tu peso y medidas para ver tu evolución.</div>'}
 <div class="chips" id="cm" style="margin-top:8px">${MEAS.map(([k,l])=>`<button class="chip ${k===chartM?'on':''}" data-k="${k}">${l}</button>`).join('')}</div>
 ${lineChart([{col:'#34d399',pts:W.map((e,i)=>[i,+e[chartM]])}],{target:chartM==='weight'&&p.targetWeight?+p.targetWeight:null,labels:W.map((e,i)=>W.length<8||i%Math.ceil(W.length/6)===0?parse(e.date).getDate()+'/'+(parse(e.date).getMonth()+1):'')})}
 ${W.length>1?`<div class="small mut">Cambio en ${MEAS.find(m=>m[0]===chartM)[1].toLowerCase()}: <b>${(W.at(-1)[chartM]-W[0][chartM]>0?'+':'')+r1(W.at(-1)[chartM]-W[0][chartM])} ${MEAS.find(m=>m[0]===chartM)[2]}</b> desde ${fmtD(W[0].date,{day:'numeric',month:'short'})}</div>`:''}
 <button class="btn pri" id="newE" style="width:100%;margin-top:12px">＋ Registrar peso / medidas</button>
 <div id="plist" style="margin-top:10px">${PR.slice().reverse().map(e=>`<div class="item" data-e="${e.id}" style="cursor:pointer"><div class="grow"><div class="nm">${fmtD(e.date,{day:'numeric',month:'short',year:'numeric'})}</div><div class="small mut">${MEAS.filter(m=>e[m[0]]).map(m=>m[1]+' '+e[m[0]]+' '+m[2]).join(' · ')}${e.notes?' · 📝':''}${e.photos?.length?' · 📷 '+e.photos.length:''}</div></div><span class="mut">›</span></div>`).join('')}</div></div>`;
 ['name','age','sex','height','weight','targetWeight','act','goal'].forEach(k=>{const el=$('#p_'+k);el.onchange=()=>{p[k]=el.value;save();vPerfil()}});
 ['kcal','p','c','f'].forEach(k=>{const el=$('#t_'+k);el.oninput=()=>{T[k]=+el.value||0;save()}});
 if($('#apply'))$('#apply').onclick=()=>{Object.assign(T,{kcal:res.kcal,p:res.p,c:res.c,f:res.f});save();toast('Objetivos actualizados ✓');vPerfil()};
 $('#cm').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;chartM=c.dataset.k;vPerfil()};
 $('#newE').onclick=()=>editEntry();V.querySelectorAll('[data-e]').forEach(el=>el.onclick=()=>editEntry(S.progress.find(x=>x.id===el.dataset.e)));
}
async function editEntry(e){const isNew=!e;e=e||{id:Date.now().toString(36),date:TODAY(),photos:[]};const urls=await Promise.all((e.photos||[]).map(id=>idbGet(id)));let newPhotos=[];
 openSheet(`<h2>${isNew?'Nuevo registro':'Editar registro'}</h2><label>Fecha<input id="e_date" type="date" value="${e.date}"></label><div class="grid2">${MEAS.map(([k,l,u])=>`<label>${l} (${u})${k==='grasa'?' – opcional':''}<input id="e_${k}" type="number" inputmode="decimal" step="0.1" value="${esc(e[k]??'')}"></label>`).join('')}</div>
 <label>Notas<textarea id="e_notes" rows="2" placeholder="Cómo te sentiste, entrenamiento…">${esc(e.notes||'')}</textarea></label>
 <label>Fotos de progreso (se guardan solo en este teléfono)<input id="e_ph" type="file" accept="image/*" multiple></label><div class="photos" id="phs">${urls.map((u,i)=>u?`<img src="${u}" alt="foto ${i+1}">`:'').join('')}</div>
 <button class="btn pri" id="e_save" style="width:100%;margin-top:12px">Guardar</button>${isNew?'':'<button class="btn danger ghost" id="e_del" style="width:100%;margin-top:8px">Borrar registro</button>'}`);
 $('#e_ph').onchange=async ev=>{for(const file of ev.target.files){const url=await shrink(file);newPhotos.push(url);$('#phs').insertAdjacentHTML('beforeend',`<img src="${url}">`)}};
 $('#e_save').onclick=async()=>{e.date=$('#e_date').value||TODAY();MEAS.forEach(([k])=>{const v=$('#e_'+k).value;if(v==='')delete e[k];else e[k]=+v});e.notes=$('#e_notes').value;
  for(const u of newPhotos){const id='ph_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);await idbSet(id,u);(e.photos=e.photos||[]).push(id)}
  if(isNew)S.progress.push(e);if(e.weight&&e.date>=(S.progress.filter(x=>x.weight).map(x=>x.date).sort().pop()||''))S.profile.weight=e.weight;save();closeSheet();toast('Guardado ✓');vPerfil()};
 if($('#e_del'))$('#e_del').onclick=async()=>{if(!confirm('¿Borrar este registro?'))return;for(const id of e.photos||[])await idbDel(id);S.progress=S.progress.filter(x=>x.id!==e.id);save();closeSheet();vPerfil()};
}
function shrink(file){return new Promise(res=>{const img=new Image();img.onload=()=>{const s=Math.min(1,1080/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82))};img.src=URL.createObjectURL(file)})}
/* IndexedDB para fotos */
const idb=new Promise((res,rej)=>{const r=indexedDB.open('macros-ar',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=async(m,fn)=>{const db=await idb;return new Promise((res,rej)=>{const t=db.transaction('photos',m);const r=fn(t.objectStore('photos'));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error)})};
const idbGet=id=>tx('readonly',s=>s.get(id)),idbSet=(id,v)=>tx('readwrite',s=>s.put(v,id)),idbDel=id=>tx('readwrite',s=>s.delete(id));

/* ===== Más: backup, fuentes ===== */
function vMas(){V.innerHTML=`<div class="card"><h2>💾 Copia de seguridad</h2><div class="small mut" style="margin-bottom:10px">Todo se guarda en este teléfono. Descargá una copia (incluye comidas, historial, perfil, progreso y fotos) y podés restaurarla en otro dispositivo.</div>
 <div class="row wrap"><button class="btn pri" id="exp">⬇ Exportar backup (JSON)</button><label class="btn" style="margin:0;color:var(--tx);font-size:15px">⬆ Importar backup<input id="imp" type="file" accept="application/json,.json" style="display:none"></label></div></div>
 <div class="card"><h2>📲 Instalar en el celular</h2><div class="small mut">Android (Chrome): menú ⋮ → <b>Instalar app</b> / <b>Agregar a pantalla principal</b>. iPhone (Safari): compartir → <b>Agregar a inicio</b>. Funciona sin internet.</div>${window._bip?'<button class="btn pri" id="inst" style="margin-top:10px">Instalar ahora</button>':''}</div>
 <div class="card"><h2>📚 Fuentes de los datos</h2><div class="small">Los ${FOODS.length} alimentos (${new Set(FOODS.map(f=>f.n)).size} distintos, con versión cruda y cocida cuando corresponde) usan valores reales por 100 g de <b>USDA FoodData Central – SR Legacy</b> (Departamento de Agricultura de EE.UU.). Cada alimento muestra su código de origen y el equivalente usado.<br><br>Los cortes argentinos se asociaron al corte de EE.UU. más parecido (ej: nalga → top round, peceto → eye of round, cuadril → tri-tip, bola de lomo → tip round, vacío → flank, entraña → skirt). La tabla argentina ARGENFOODS (UNLu) no está disponible en formato descargable abierto, por eso no se usó. Los valores son orientativos: la composición real varía según el animal, la marca y la cocción.</div>
 <div class="small mut" style="margin-top:8px">Calorías objetivo: fórmula Mifflin-St Jeor. No reemplaza el consejo de un/a nutricionista.</div></div>
 <div class="card"><h2>🗑 Borrar todo</h2><button class="btn danger" id="wipe">Borrar todos mis datos</button></div>`;
 $('#exp').onclick=async()=>{const photos={};for(const e of S.progress)for(const id of e.photos||[])photos[id]=await idbGet(id);const blob=new Blob([JSON.stringify({app:'macros-ar',version:1,exported:new Date().toISOString(),data:S,photos})],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='macros-ar-backup-'+TODAY()+'.json';a.click();toast('Backup descargado ✓')};
 $('#imp').onchange=async ev=>{try{const j=JSON.parse(await ev.target.files[0].text());if(j.app!=='macros-ar'||!j.data)throw 0;if(!confirm('Esto reemplaza tus datos actuales. ¿Seguir?'))return;S=Object.assign({},DEF,j.data);for(const id in j.photos||{})if(j.photos[id])await idbSet(id,j.photos[id]);save();toast('Backup restaurado ✓');render()}catch(e){alert('Ese archivo no es un backup válido de Macros AR.')}};
 if($('#inst'))$('#inst').onclick=()=>window._bip.prompt();
 $('#wipe').onclick=()=>{if(!confirm('¿Seguro? Se borra todo (comidas, perfil, progreso).'))return;localStorage.removeItem(KEY);indexedDB.deleteDatabase('macros-ar');location.reload()};
}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();window._bip=e});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
window.__app={search,calc,mifflin,totals,S:()=>S,FOODS};
render();
