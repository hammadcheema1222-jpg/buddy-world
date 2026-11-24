
/* ===================== 30 · PLUGIN API: lets anyone add layers, buttons and data without editing the core =====================
   Docs: PLUGINS.md · Examples: plugins/*.js · Register a plugin by adding its file name to plugins/index.json            */
const PLUG={list:[],tick:[],city:[],reset:[]};
const BW=window.BuddyWorld={
 version:'1.0.0',THREE,scene,world,camera,renderer,
 get place(){return {name:O.name,city:cityName(),lat:O.lat,lon:O.lon,radius:O.R,country:O.cc,isLondon:isLondon()};},
 get time(){return {hour:cityHour(),sun:solar(),weather:WX,air:AQ,wind:WIND};},
 get buddy(){return {x:pet.x,z:pet.z,lat:toLL(pet.x,pet.z)[0],lon:toLL(pet.x,pet.z)[1]};},
 get city(){return CITY?{buildings:CITY.buildings,pois:CITY.pois,roads:CITY.roads,buildingAt:CITY.buildingAt}:null;},
 toLocal:(lat,lon)=>{const p=toL(lat,lon);return {x:p[0],z:p[1]};},toLatLon:(x,z)=>{const l=toLL(x,z);return {lat:l[0],lon:l[1]};},
 getJSON:jget,overpass:q=>ovp(q.replace('{{bbox}}',bbS())),bbox:()=>{const b=box3();return {south:b.s,west:b.w,north:b.n,east:b.e,overpass:bbS()};},
 pin(layerId,{lat,lon,x,z,emoji='📍',label='',height,color,onTap}){if(lat!=null){const p=toL(lat,lon);x=p[0];z=p[1];}return xpin(layerId,x,z,emoji,String(label).slice(0,60),onTap||(()=>{}),{h:height,pole:color});},
 clearPins:layerId=>clearKey(layerId),
 card:({title='',html='',image,link,linkText})=>card(title,image?'<img src="'+esc(image)+'" alt="">':'',html,link?'<a target="_blank" rel="noopener" href="'+esc(link)+'">'+esc(linkText||'Open')+'</a>':''),
 hint:(t,s)=>showHint(t,s||4),say:(t,s)=>say(t,s||4),escape:esc,
 flyTo:(lat,lon,zoom)=>{const p=toL(lat,lon);flyTo(p[0],p[1],zoom||150);},walkTo:(lat,lon,name)=>{const p=toL(lat,lon);routeTo(p[0],p[1],name);},
 onTick:fn=>PLUG.tick.push(fn),onCityLoaded:fn=>PLUG.city.push(fn),onReset:fn=>PLUG.reset.push(fn),
 addLayer(def){/* {id,name,emoji,description,load(),unload(),defaultOn} */if(!def||!def.id)throw new Error('addLayer needs an id');def.id='pl_'+def.id.replace(/[^\w-]/g,'');if(!(def.id in LAY))LAY[def.id]=!!def.defaultOn;PLUG.list.push(Object.assign({kind:'layer'},def));return def.id;},
 addButton(def){/* {name,emoji,description,onClick()} */PLUG.list.push(Object.assign({kind:'button'},def));},
 isOn:id=>!!LAY['pl_'+id]};
function plugRun(fn,...a){try{return fn(...a);}catch(e){console.warn('[Buddy plugin]',e);showHint('🧩 A plugin had a problem: '+e.message,4);}}
const _apply30=applyLayer;applyLayer=function(k){_apply30(k);const d=PLUG.list.find(p=>p.id===k);if(!d)return;if(LAY[k]){if(!d.loaded||d.reloadEachTime){d.loaded=true;Promise.resolve(plugRun(()=>d.load&&d.load())).catch(e=>showHint('🧩 '+d.name+': '+e.message,4));}}else{clearKey(k);plugRun(()=>d.unload&&d.unload());}};
const _layerUI30=layerUI;layerUI=function(){_layerUI30();const box=$('layList');const h=document.createElement('div');h.style.cssText='grid-column:1/-1;font-weight:bold;margin-top:6px';h.textContent='🧩 Community plugins';box.appendChild(h);
 PLUG.list.forEach(d=>{const b=document.createElement('button');b.style.textAlign='left';b.innerHTML=(d.emoji||'🧩')+' '+esc(d.name||d.id)+'<br><small>'+esc(d.description||'')+(d.author?' · by '+esc(d.author):'')+'</small>';
  if(d.kind==='layer'){b.className=LAY[d.id]?'on':'';b.onclick=()=>{LAY[d.id]=!LAY[d.id];b.className=LAY[d.id]?'on':'';applyLayer(d.id);};}else b.onclick=()=>{$('layers').style.display='none';plugRun(()=>d.onClick&&d.onClick());};box.appendChild(b);});
 const dev=document.createElement('button');dev.style.textAlign='left';dev.innerHTML='🛠️ Try a plugin from a link<br><small>For developers: test your plugin before sending a pull request</small>';dev.onclick=()=>{$('layers').style.display='none';devPluginCard();};box.appendChild(dev);};
function devPluginCard(){card('🛠️ Try a plugin','','<div>Paste the link to a plugin <b>.js</b> file (for example a raw GitHub link). It runs inside Buddy World with full access to this page, so <b>only load code you trust</b>. It is not saved: reload to remove it.</div><div style="display:flex;gap:4px;margin-top:6px"><input id="dpU" placeholder="https://…/my-plugin.js" style="flex:1;min-width:0"><button id="dpGo" style="width:auto;height:auto;padding:6px 10px">Load</button></div><div id="dpO"></div>','<a target="_blank" rel="noopener" href="https://github.com/hammadcheema1222-jpg/buddy-world/blob/main/PLUGINS.md">How to write a plugin</a>');
 $('dpU').onkeydown=e=>e.stopPropagation();$('dpU').onkeyup=e=>e.stopPropagation();$('dpGo').onclick=async()=>{const u=$('dpU').value.trim();if(!/^https:\/\//.test(u)){$('dpO').textContent='Use an https:// link.';return;}try{const n=PLUG.list.length;await loadScript(u);$('dpO').innerHTML='✅ Loaded. '+(PLUG.list.length-n)+' new item(s) in Layers → 🧩 Community plugins.';}catch(e){$('dpO').textContent='Could not load that file.';}};}
async function loadPlugins(){try{const r=await fetch('plugins/index.json',{cache:'no-cache'});if(!r.ok)return;const j=await r.json();for(const f of (j.plugins||[])){if(!/^[\w-]+\.js$/.test(f))continue;try{await loadScript('plugins/'+f);}catch(e){console.warn('plugin failed',f);}}}catch(e){}
 PLUG.list.forEach(d=>{if(d.kind==='layer'&&LAY[d.id]&&CITY)applyLayer(d.id);});}
loadPlugins();
const _after30=afterCityLoaded;afterCityLoaded=function(){PLUG.list.forEach(d=>{d.loaded=false;});_after30();PLUG.city.forEach(fn=>plugRun(fn,BW.place));};
const _reset30=resetLayers;resetLayers=function(){_reset30();PLUG.reset.forEach(fn=>plugRun(fn));};
const _upd30=updateLayers;updateLayers=function(dt){_upd30(dt);for(const fn of PLUG.tick)plugRun(fn,dt);};
