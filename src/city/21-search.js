
/* ===================== EXTRAS 12: better place search (postcodes, clear area names), robust map download, auto-fill missing buildings ===================== */
const PC_RE=/^\s*([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\s*$/i;
search=async function(q,box){box.innerHTML='<i>Searching…</i>';const list=[];
 try{if(PC_RE.test(q)){const j=await jget('https://api.postcodes.io/postcodes/'+encodeURIComponent(q.replace(/\s+/g,'')));const r=j.result;list.push({n:r.postcode,sub:[r.admin_ward,r.admin_district].filter(Boolean).join(', '),lat:r.latitude,lon:r.longitude,cc:'gb'});}}catch(e){}
 try{const near=CITY?`&viewbox=${O.lon-0.3},${O.lat+0.2},${O.lon+0.3},${O.lat-0.2}`:'';const d=await jget('https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8'+near+'&q='+encodeURIComponent(q));
  d.forEach(it=>{const a=it.address||{};const area=[a.suburb||a.neighbourhood||a.village||a.quarter,a.town||a.city||a.city_district,a.postcode].filter(Boolean);list.push({n:it.display_name.split(',')[0],sub:[...new Set(area)].join(' · ')||it.display_name.split(',').slice(1,3).join(','),lat:+it.lat,lon:+it.lon,cc:a.country_code||'',type:it.type});});}catch(e){}
 box.innerHTML='';if(!list.length){box.innerHTML='<i>Nothing found. Try a postcode like RM7 9DS, or add the area name.</i>';return;}
 if(list.filter(x=>x.n===list[list.length-1].n).length>1)box.insertAdjacentHTML('beforeend','<div style="font-size:13px;margin:4px 0"><b>Several places have this name</b>: check the area and postcode.</div>');
 list.forEach(it=>{const b=document.createElement('button');b.style.cssText='width:100%;text-align:left;height:auto;padding:8px 10px;margin:3px 0;font-size:15px';b.innerHTML='📍 <b>'+esc(it.n)+'</b><br><small>'+esc(it.sub)+'</small>';b.onclick=()=>goTo('📍 '+it.n+(it.sub?', '+it.sub.split(' · ')[0]:''),it.lat,it.lon,it.cc);box.appendChild(b);});};
// fill gaps automatically when OpenStreetMap has few buildings mapped here
const _after12=afterCityLoaded;afterCityLoaded=function(){_after12();if(!CITY)return;const nb=CITY.buildings.filter(b=>!b.outlineOnly).length,km2=(2*O.R/1000)**2,dens=nb/km2;
 if(dens<450&&!LAY.overture){LAY.overture=true;applyLayer('overture');showHint('🏗️ OpenStreetMap only has '+nb+' buildings mapped here, so I’m adding missing houses from Overture Maps (open building footprints).',7);}};
