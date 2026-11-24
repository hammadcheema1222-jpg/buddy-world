
/* ===================== 24 · DESIGN SYSTEM: one icon set, labelled tab bar, calmer side controls, compact header, searchable layers ===================== */
// Line icons (24×24, stroke = currentColor), consistent on every phone instead of mixed emoji
const IC={search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',layers:'<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5" opacity=".5"/>',
 walk:'<circle cx="13" cy="4" r="2"/><path d="m9 21 2.2-6.5L14 17v4"/><path d="m7 12 3-4 4 1 2.5 3.5"/><path d="M11.2 14.5 10 8"/>',fly:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
 map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',paw:'<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="5.5" r="1.8"/><circle cx="15.5" cy="6.5" r="1.8"/><circle cx="18" cy="11" r="1.8"/><path d="M8.5 17c0-3 2-5.5 4.5-5.5s4 2 4 4.5c0 2-1.5 3-3 3-1 0-1.6-.5-2.6-.5-1 0-1.6.8-2.6.5-.4-.2-.3-1-.3-2z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',full:'<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
 locate:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',find:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
 more:'<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>',
 north:'<circle cx="12" cy="12" r="9"/><path d="m12 6 3 8-3-1.6L9 14z" fill="currentColor"/>',route:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
 status:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',work:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',buddy:'<circle cx="12" cy="13" r="7"/><path d="M6.5 8.5 6 3l4 3.5M17.5 8.5 18 3l-4 3.5"/><circle cx="9.5" cy="12.5" r=".9" fill="currentColor"/><circle cx="14.5" cy="12.5" r=".9" fill="currentColor"/><path d="M11 15.5h2l-1 1z" fill="currentColor"/>'};
const svgI=(k,s)=>'<svg viewBox="0 0 24 24" width="'+(s||22)+'" height="'+(s||22)+'" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[k]+'</svg>';

/* ---- tokens & type: friendly sans for controls, serif kept for the brand voice ---- */
{const css=document.createElement('style');css.textContent=`
 :root{--ui:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--r:14px;--ink:#2b1d10;--muted:#6b5a45;--accent:#2f6fbf;--warm:#f09a3e;--surface:rgba(252,248,239,.94)}
 body,button,input,select,#nearP,#hint,.card p,.card div,#layList small{font-family:var(--ui)}
 .card h1,#place,#iTitle{font-family:Georgia,"Times New Roman",serif}
 /* header */
 #hud{gap:10px!important;padding:6px 12px 6px 6px!important}#hud #place{font-weight:700;font-size:15px;line-height:1.2}
 #hud #clock,#hud #wx{display:inline;font-size:12.5px!important;color:var(--muted)}#hud #clock::after{content:" · "}
 /* tab bar */
 #top button.tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--ink);background:transparent;border:0;border-radius:12px;padding:6px 4px;min-width:54px}
 #top button.tab span{font-size:10.5px;font-weight:600;letter-spacing:.2px;line-height:1}
 #top button.tab.on{background:rgba(240,154,62,.16)!important;color:#b35d00;box-shadow:none!important}
 #top{gap:4px!important;background:var(--surface)!important}
 @media (max-width:760px){#top button.tab{flex:1 1 0;min-width:0!important;padding:6px 0}#bFs{display:none!important}#hud{max-width:calc(100vw - 118px)!important}#hud #wx{font-size:12px!important}}
 @media (min-width:1280px){#top button.tab{flex-direction:row;gap:6px;padding:7px 12px}#top button.tab span{font-size:13px}}@media (min-width:761px) and (max-width:1279px){#top button.tab{min-width:52px;padding:4px 6px}#top button.tab svg{width:20px;height:20px}}
 /* side controls: 2 always-on + a "more" menu */
 #qbWrap{gap:8px!important}#qbWrap button{width:44px!important;height:44px!important;border-radius:50%!important;display:flex;align-items:center;justify-content:center;color:var(--ink);background:var(--surface);border:1px solid rgba(107,79,46,.35)}
 #qbWrap .qbx{display:none}#qbWrap.open .qbx{display:flex}#qbWrap button.qbm{background:var(--ink);color:#fff}
 #eyeB{display:none!important}
 /* layers sheet */
 #layers .card{padding-top:0!important}#layHead{position:sticky;top:0;z-index:2;background:var(--surface);padding:12px 0 8px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid rgba(107,79,46,.2)}
 #layHead .lh1{display:flex;align-items:center;justify-content:space-between}#layHead h1{margin:0;font-size:22px}#laySearch{width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(107,79,46,.4);font-size:15px;background:#fff}
 #layList{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))!important;gap:8px!important}#layList>div{font-family:var(--ui);font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted)!important;margin:14px 2px 2px!important;cursor:pointer}
 #layList>div.shut~button.sec{display:none}
 #layList button{font-size:14.5px;line-height:1.3;min-height:0!important;padding:10px 12px}#layList button small{color:var(--muted);font-size:12px}
 #layers p{display:none}
 /* cards */
 #info .card{border-radius:20px 20px 0 0}@media (min-width:761px){#info .card{border-radius:20px}}
 #iTitle{font-size:20px}`;document.head.appendChild(css);}

/* ---- tab bar with icons + labels ---- */
const TABS={bPlaces:['search','Search'],bLayers:['layers','Layers'],mWalk:['walk','Walk'],mFly:['fly','Fly'],mMap:['map','Map'],bKind:['buddy','Buddy'],bTime:['clock','Time'],bFs:['full','Full']};
compactTop=function(){};
function renderTabs(){for(const id in TABS){const b=$(id);if(!b||b.querySelector('svg'))continue;const [ic,lab]=TABS[id];b.classList.add('tab');b.innerHTML=svgI(ic)+'<span>'+lab+'</span>';b.title=lab;b.setAttribute('aria-label',lab);}}
renderTabs();new MutationObserver(()=>setTimeout(renderTabs,0)).observe($('top'),{subtree:true,childList:true,characterData:true});

/* ---- side controls: Locate + Find visible, everything else behind "More" ---- */
{const keep={'Where am I (GPS)':['locate','Find me'],'Find nearby':['find','Find nearby']},extra={'North up':'north','Go to Buddy':'paw','Plan a journey':'route','Tube & rail status':'status','Opportunities near here':'work'};
 [...QB.children].forEach(b=>{const t=b.title;if(keep[t]){b.innerHTML=svgI(keep[t][0]);b.setAttribute('aria-label',keep[t][1]);}else{b.innerHTML=svgI(extra[t]||'more');b.classList.add('qbx');b.setAttribute('aria-label',t);}});
 const eye=document.createElement('button');eye.className='qbx';eye.title='Clean view';eye.setAttribute('aria-label','Clean view: hide controls');eye.innerHTML=svgI('eye');eye.onclick=()=>{document.body.classList.toggle('clean');showHint(document.body.classList.contains('clean')?'Clean view: tap the ⋯ button again to bring controls back':'Controls back',3);};QB.appendChild(eye);
 const more=document.createElement('button');more.className='qbm';more.title='More';more.setAttribute('aria-label','More controls');more.setAttribute('aria-expanded','false');more.innerHTML=svgI('more');more.onclick=()=>{const o=QB.classList.toggle('open');more.innerHTML=svgI(o?'close':'more');more.setAttribute('aria-expanded',String(o));};QB.appendChild(more);
 const cs=document.createElement('style');cs.textContent='body.clean #qbWrap{display:flex!important}body.clean #qbWrap>button:not(.qbm){display:none!important}';document.head.appendChild(cs);}

/* ---- layers sheet: sticky header with search, collapsible sections ---- */
{const card=document.querySelector('#layers .card'),h1=card.querySelector('h1');const head=document.createElement('div');head.id='layHead';head.innerHTML='<div class="lh1"></div><input id="laySearch" type="search" placeholder="Search layers: buses, history, jobs…" aria-label="Search layers">';card.insertBefore(head,card.firstChild);
 const row=head.querySelector('.lh1');h1.textContent='Layers';row.appendChild(h1);const x=document.createElement('button');x.innerHTML=svgI('close');x.setAttribute('aria-label','Close layers');x.style.cssText='width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center';x.onclick=()=>{$('layers').style.display='none';};row.appendChild(x);
 const S=$('laySearch');S.onkeydown=e=>e.stopPropagation();S.onkeyup=e=>e.stopPropagation();
 const filter=()=>{const q=S.value.trim().toLowerCase();const kids=[...$('layList').children];let lastH=null,shown=0;const flush=()=>{if(lastH)lastH.style.display=q&&!shown?'none':'';};kids.forEach(k=>{if(k.tagName==='DIV'){flush();lastH=k;shown=0;if(q)k.classList.remove('shut');return;}const ok=!q||k.textContent.toLowerCase().includes(q);k.style.display=ok?'':'none';if(ok)shown++;});flush();};S.oninput=filter;
 const SHUT=new Set(JSON.parse(localStorage.getItem('bw.shut')||'[]'));
 const _lui=layerUI;layerUI=function(){_lui();const L=$('layList');const first=document.createElement('div');first.textContent='Discovery';L.insertBefore(first,L.firstChild);let cur=null;[...L.children].forEach(k=>{if(k.tagName==='DIV'){cur=k;k.setAttribute('role','button');k.tabIndex=0;k.textContent=k.textContent.replace(/^[^\w]+/u,'').trim()+'  ▾';if(SHUT.has(k.textContent))k.classList.add('shut');
   k.onclick=()=>{const s=!k.classList.contains('shut');k.classList.toggle('shut',s);let n=k.nextElementSibling;while(n&&n.tagName!=='DIV'){n.style.display=s?'none':'';n=n.nextElementSibling;}s?SHUT.add(k.textContent):SHUT.delete(k.textContent);try{localStorage.setItem('bw.shut',JSON.stringify([...SHUT]));}catch(e){}};}else if(cur&&cur.classList.contains('shut'))k.style.display='none';});if(S.value)filter();};}
