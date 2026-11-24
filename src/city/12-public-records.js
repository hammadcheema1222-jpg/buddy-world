
/* ===================== EXTRAS 3: public records about PLACES & EVENTS (never private people) ===================== */
Object.assign(LAY,{cases:true,hygiene:false,heritage:false});
const box3=()=>{const dLat=O.R*1.2/KZ,dLon=O.R*1.2/KX();return {s:O.lat-dLat,n:O.lat+dLat,w:O.lon-dLon,e:O.lon+dLon};};
const fmtD=d=>{if(!d)return '';const m=String(d).match(/^[+-]?(\d{1,4})-(\d\d)-(\d\d)/);return m?(m[2]==='00'||m[2]==='01'&&m[3]==='01'?m[1]:m[3]+'/'+m[2]+'/'+m[1]):String(d).slice(0,10);};

/* ---- 1. Real cases & events here: crimes, frauds, trials, disasters, protests (Wikidata + Wikipedia) ---- */
const CASE_E={crime:'🕵️',fraud:'💷',legal:'⚖️',disaster:'🔥',riot:'📢',attack:'⚠️',accident:'💥',protest:'✊',scandal:'📰'};
async function loadCases(){if(XL.cases)return;XL.cases=true;const km=Math.max(0.8,O.R*1.5/1000).toFixed(2);
 const q=`SELECT ?item ?itemLabel ?itemDescription ?date ?typeLabel ?cls ?coord ?article WHERE{SERVICE wikibase:around{?item wdt:P625 ?coord. bd:serviceParam wikibase:center "Point(${O.lon} ${O.lat})"^^geo:wktLiteral. bd:serviceParam wikibase:radius "${km}".}
 ?item wdt:P31 ?type. VALUES ?cls{wd:Q83267 wd:Q2334719 wd:Q3839081 wd:Q124757 wd:Q2223653 wd:Q171558 wd:Q273120 wd:Q192909} ?type wdt:P279* ?cls.
 OPTIONAL{?item wdt:P585 ?date} OPTIONAL{?item wdt:P580 ?date} OPTIONAL{?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>}
 SERVICE wikibase:label{bd:serviceParam wikibase:language "en".}} LIMIT 120`;
 const CL={Q83267:'crime',Q2334719:'legal',Q3839081:'disaster',Q124757:'riot',Q2223653:'attack',Q171558:'accident',Q273120:'protest',Q192909:'scandal'};
 try{const j=await jget('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q));const seen=new Set();
  j.results.bindings.forEach(b=>{const id=b.item.value.split('/').pop();if(seen.has(id))return;seen.add(id);const m=b.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);if(!m)return;const lab=b.itemLabel.value;if(/^Q\d+$/.test(lab))return;
   let k=CL[b.cls.value.split('/').pop()]||'crime';if(/fraud|swindl|embezzl|scam|ponzi|forg/i.test(lab+' '+(b.typeLabel&&b.typeLabel.value)))k='fraud';
   const c={id,title:lab,desc:b.itemDescription&&b.itemDescription.value,date:b.date&&b.date.value,type:b.typeLabel&&b.typeLabel.value,k,wiki:b.article&&decodeURIComponent(b.article.value.split('/wiki/').pop()),lat:+m[2],lon:+m[1]};
   const p=toL(c.lat,c.lon),y=c.date?+(c.date.match(/\d{4}/)||[0])[0]:null;xpin('cases',p[0],p[1],CASE_E[k],(y?y+' · ':'')+lab.slice(0,60),()=>caseCard(c),{pole:'#7a1f1f'});});
  showHint(seen.size?'🕵️ '+seen.size+' real cases & events happened right here (crimes, trials, disasters, protests). Tap one to see what happened and how it ended.':'🕵️ No recorded cases or events pinned here on Wikidata.',6);}catch(e){XL.cases=false;}}
async function caseCard(c){card(CASE_E[c.k]+' '+c.title,'','<div><b>Type</b> '+esc(c.type||c.k)+'</div>'+(c.date?'<div><b>When</b> '+fmtD(c.date)+'</div>':'')+(c.desc?'<div>'+esc(c.desc)+'</div>':'')+'<div id="cWhat"><i>Reading what happened…</i></div><button id="cCourt">⚖️ Find court judgments about this</button><div id="cCourtL"></div>',
 (c.wiki?'<a target="_blank" rel="noopener" href="https://en.wikipedia.org/wiki/'+encodeURIComponent(c.wiki)+'">Full story on Wikipedia</a> · ':'')+'<a target="_blank" rel="noopener" href="https://www.wikidata.org/wiki/'+c.id+'">Wikidata</a>');
 $('cCourt').onclick=()=>courtSearch(c.title,$('cCourtL'));
 if(c.wiki){try{const s=await jget('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(c.wiki));if(s.thumbnail)$('iImg').innerHTML='<img src="'+esc(s.thumbnail.source)+'" alt="">';$('cWhat').innerHTML='<b>What happened & outcome</b><div>'+esc(s.extract)+'</div>';
  const sec=await jget('https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=sections&page='+encodeURIComponent(c.wiki));const want=(sec.parse.sections||[]).find(x=>/aftermath|outcome|verdict|trial|sentenc|conviction|investigation|legacy|result|inquiry|inquest/i.test(x.line));
  if(want){const t=await jget('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&explaintext=1&exsectionformat=plain&titles='+encodeURIComponent(c.wiki));const full=Object.values(t.query.pages)[0].extract||'';const i=full.indexOf('\n'+want.line.replace(/<[^>]+>/g,''));if(i>=0)$('cWhat').innerHTML+='<b>'+esc(want.line.replace(/<[^>]+>/g,''))+'</b><div>'+esc(full.slice(i,i+900).trim().replace(/^.*\n/,''))+'…</div>';}}catch(e){$('cWhat').innerHTML='';}}else $('cWhat').innerHTML='';}

/* ---- 2. UK court judgments (The National Archives – Find Case Law, open data) ---- */
async function courtSearch(q,el){el.innerHTML='<i>Searching UK court judgments…</i>';const web='https://caselaw.nationalarchives.gov.uk/search?query='+encodeURIComponent(q);
 try{const r=await fetch('https://caselaw.nationalarchives.gov.uk/atom.xml?order=-date&per_page=8&query='+encodeURIComponent('"'+q+'"'));const x=new DOMParser().parseFromString(await r.text(),'application/xml');const es=[...x.getElementsByTagName('entry')];
  el.innerHTML=es.length?es.map(e=>{const t=e.getElementsByTagName('title')[0].textContent,l=(e.querySelector('link[rel="alternate"]')||e.getElementsByTagName('link')[0]).getAttribute('href'),d=(e.getElementsByTagName('published')[0]||e.getElementsByTagName('updated')[0]||{}).textContent;return '<div>⚖️ <a target="_blank" rel="noopener" href="'+esc(l)+'">'+esc(t)+'</a> <small>'+fmtD(d)+'</small></div>';}).join('')+'<small><a target="_blank" rel="noopener" href="'+web+'">More on Find Case Law</a></small>':'<div>No judgments found. <a target="_blank" rel="noopener" href="'+web+'">Search Find Case Law</a></div>';}
 catch(e){el.innerHTML='<a target="_blank" rel="noopener" href="'+web+'">Open these court judgments on Find Case Law</a>';}}

/* ---- 3. Police reports WITH outcomes (how each case ended) ---- */
incCard=function(list){const st=list[0].location.street&&list[0].location.street.name||'here';const counts={};list.forEach(c=>counts[c.category]=(counts[c.category]||0)+1);
 const out={};list.forEach(c=>{const o=c.outcome_status?c.outcome_status.category:'No outcome recorded yet';out[o]=(out[o]||0)+1;});
 card('🚓 Reported '+st,'','<div><b>Month</b> '+list[0].month+'</div>'+Object.entries(counts).map(([k,v])=>'<div><b>'+(INC_E[k]||'❗')+' '+k.replace(/-/g,' ')+'</b> '+v+'</div>').join('')+'<div style="margin-top:6px"><b>How they ended</b></div>'+Object.entries(out).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div>'+(/charged|court|sentenc|caution|penalty|fine/i.test(k)?'⚖️':/no suspect|unable|not in the public/i.test(k)?'❔':'📁')+' '+esc(k)+' · '+v+'</div>').join(''),
 'From data.police.uk (open data). Locations are moved to a nearby point and no names are published, to protect privacy.');};

/* ---- 4. Food hygiene ratings (Food Standards Agency) ---- */
async function loadHygiene(){if(XL.hygiene)return;XL.hygiene=true;if(O.cc!=='gb'){showHint('🍽️ Food hygiene ratings are UK only (FSA open data).',4);return;}
 try{const r=await fetch(`https://api.ratings.food.gov.uk/Establishments?latitude=${O.lat}&longitude=${O.lon}&maxDistanceLimit=${(O.R*1.2/1609).toFixed(2)}&pageSize=300`,{headers:{'x-api-version':'2',accept:'application/json'}});const j=await r.json();let n=0;
  (j.establishments||[]).forEach(e=>{const la=+e.geocode.latitude,lo=+e.geocode.longitude;if(!la)return;n++;const p=toL(la,lo),rv=e.RatingValue,good=/^[45]$|Pass/.test(rv),bad=/^[012]$|Improvement/.test(rv);
   xpin('hygiene',p[0],p[1],bad?'⚠️':good?'⭐':'🍽️',e.BusinessName.slice(0,34)+' · '+(isNaN(+rv)?rv:rv+'/5'),()=>card('🍽️ '+e.BusinessName,'','<div><b>Hygiene rating</b> '+esc(rv)+(isNaN(+rv)?'':' out of 5')+'</div><div><b>Type</b> '+esc(e.BusinessType)+'</div><div><b>Inspected</b> '+fmtD(e.RatingDate)+'</div>'+(e.scores&&e.scores.Hygiene!=null?'<div><b>Scores</b> hygiene '+e.scores.Hygiene+', structure '+e.scores.Structural+', management '+e.scores.ConfidenceInManagement+' <small>(lower is better)</small></div>':'')+'<div><b>Address</b> '+esc([e.AddressLine1,e.AddressLine2,e.PostCode].filter(Boolean).join(', '))+'</div>','<a target="_blank" rel="noopener" href="https://ratings.food.gov.uk/business/'+e.FHRSID+'">FSA record</a>'),{h:3,pole:bad?'#c33':'#3a8a3a'});});
  showHint('🍽️ '+n+' food places with official hygiene ratings.',4);}catch(e){XL.hygiene=false;showHint('🍽️ Food ratings service not answering.',3);}}

/* ---- 5. Heritage & planning (planning.data.gov.uk): listed buildings, monuments, planning applications ---- */
async function loadHeritage(){if(XL.heritage)return;XL.heritage=true;if(O.cc!=='gb'){showHint('🏛️ Listed buildings & planning data are for England (planning.data.gov.uk).',4);return;}const b=box3();
 const poly=`POLYGON((${b.w} ${b.s},${b.e} ${b.s},${b.e} ${b.n},${b.w} ${b.n},${b.w} ${b.s}))`;let n=0;
 for(const ds of ['listed-building','scheduled-monument','planning-application','park-and-garden']){try{const j=await jget('https://www.planning.data.gov.uk/entity.json?dataset='+ds+'&geometry_relation=intersects&limit=300&geometry='+encodeURIComponent(poly));
  (j.entities||[]).forEach(e=>{const m=(e.point||'').match(/POINT\s*\(([-\d.]+) ([-\d.]+)\)/);if(!m)return;n++;const p=toL(+m[2],+m[1]);const emo=ds==='listed-building'?'🏛️':ds==='scheduled-monument'?'🗿':ds==='park-and-garden'?'🌳':'📝';
   const nm=e.name||e.description||e.reference;const grade=e['listed-building-grade'];xpin('heritage',p[0],p[1],emo,(grade?'Grade '+grade+' · ':'')+String(nm).slice(0,46),()=>card(emo+' '+String(nm).slice(0,90),'',
    '<div><b>Record</b> '+esc(ds.replace(/-/g,' '))+'</div>'+(grade?'<div><b>Listed grade</b> '+esc(grade)+'</div>':'')+(e['start-date']?'<div><b>Date</b> '+fmtD(e['start-date'])+'</div>':'')+(e.description&&e.description!==nm?'<div>'+esc(String(e.description).slice(0,400))+'</div>':'')+(e.decision||e['decision-date']?'<div><b>Decision</b> '+esc(e.decision||'')+' '+fmtD(e['decision-date'])+'</div>':''),
    (e['documentation-url']?'<a target="_blank" rel="noopener" href="'+esc(e['documentation-url'])+'">Official record</a> · ':'')+'<small>planning.data.gov.uk</small>'),{h:ds==='listed-building'?undefined:3,pole:'#6b4f8a'});});}catch(e){}}
 showHint(n?'🏛️ '+n+' listed buildings, monuments & planning records.':'🏛️ No heritage or planning records here.',4);}

/* ---- 6. Openly licensed photos from many platforms (Openverse: Flickr, Wikimedia, museums…) ---- */
async function openversePhotos(name){const box=document.createElement('div');box.innerHTML='<b>📷 Open photos (Flickr, Wikimedia & more via Openverse)</b><div class="ov" style="display:flex;gap:6px;overflow:auto;padding:4px 0"><i>searching…</i></div>';$('iBody').appendChild(box);const row=box.querySelector('.ov');
 try{const j=await jget('https://api.openverse.org/v1/images/?page_size=10&q='+encodeURIComponent(name+' '+cityName()));row.innerHTML=(j.results||[]).length?j.results.map(r=>'<a target="_blank" rel="noopener" href="'+esc(r.foreign_landing_url)+'" title="'+esc(r.title)+' · '+esc(r.creator||'')+' · '+esc((r.license||'').toUpperCase())+' · '+esc(r.source)+'" style="flex:0 0 110px"><img src="'+esc(r.thumbnail||r.url)+'" style="width:110px;height:90px;object-fit:cover"><small>'+esc(r.source)+' · '+esc((r.license||'').toUpperCase())+'</small></a>').join(''):'<small>No open photos found.</small>';}catch(e){row.innerHTML='<small>Openverse not reachable.</small>';}}

/* ---- 7. Live crowding at Tube stations + Environment Agency flood warnings ---- */
const _tflCard=tflCard;tflCard=async function(s){await _tflCard(s);if(!(s.modes||[]).includes('tube'))return;try{const c=await jget('https://api.tfl.gov.uk/crowding/'+s.naptanId+'/Live');if(c.dataAvailable){const pc=Math.round(c.percentageOfBaseline*100);$('iBody').insertAdjacentHTML('afterbegin','<div><b>Busy right now</b> '+(pc<40?'🟢 quiet':pc<80?'🟡 normal':'🔴 busy')+' ('+pc+'% of usual)</div>');}}catch(e){}};
const _hz=loadHazards;loadHazards=async function(){await _hz();if(O.cc!=='gb')return;try{const j=await jget(`https://environment.data.gov.uk/flood-monitoring/id/floods?lat=${O.lat}&long=${O.lon}&dist=40`);(j.items||[]).forEach((f,i)=>{const a=f.floodArea||{};const an=i*1.3;
 xpin('hazards',Math.cos(an)*O.R*0.8,Math.sin(an)*O.R*0.8,'🌊',(f.severity||'Flood')+' · '+(f.eaAreaName||a.riverOrSea||''),()=>card('🌊 '+f.severity,'','<div><b>Area</b> '+esc(f.description)+'</div><div><b>River/sea</b> '+esc(a.riverOrSea||'')+'</div><div>'+esc((f.message||'').slice(0,500))+'</div>','<small>Environment Agency live flood warnings</small>'),{h:14,pole:'#2a6fb0'});});if(j.items&&j.items.length)showHint('🌊 '+j.items.length+' live flood alerts within 40 km.',5);}catch(e){}};

/* ---- one "Public records" panel per building ---- */
const _showInfo3=showInfo;showInfo=async function(b,poi){await _showInfo3(b,poi);const n=(poi&&poi.t.name)||(b&&(b.t.name||(b.pois&&b.pois[0]&&b.pois[0].t.name)));if(!n)return;openversePhotos(n);
 const d=document.createElement('div');d.innerHTML='<b>🔎 Public records about this place</b><div><button id="prCourt">⚖️ Court judgments</button> <button id="prNews">📰 News</button></div><div id="prOut"></div>';$('iBody').appendChild(d);
 $('prCourt').onclick=()=>courtSearch(n,$('prOut'));$('prNews').onclick=async()=>{$('prOut').innerHTML='<i>Searching news…</i>';try{const j=await jget('https://api.gdeltproject.org/api/v2/doc/doc?query='+encodeURIComponent('"'+n+'"')+'&mode=artlist&maxrecords=8&format=json&sort=datedesc');$('prOut').innerHTML=(j.articles||[]).map(a=>'<div>📰 <a target="_blank" rel="noopener" href="'+esc(a.url)+'">'+esc(a.title)+'</a> <small>'+esc(a.domain)+'</small></div>').join('')||'No recent news.';}catch(e){$('prOut').textContent='News search busy.';}};};

/* ---------- wiring ---------- */
const XLAY3=[['cases','🕵️ Real cases & events','Crimes, frauds, trials, disasters & protests that happened here, with what happened and how it ended (Wikidata + Wikipedia + UK court judgments)'],['hygiene','🍽️ Food hygiene ratings (UK)','Official FSA inspection scores for every café, restaurant & takeaway'],['heritage','🏛️ Heritage & planning (England)','Listed buildings, monuments, historic parks and planning applications']];
const _layerUI3=layerUI;layerUI=function(){_layerUI3();const box=$('layList');const h=document.createElement('div');h.style.cssText='grid-column:1/-1;font-weight:bold;margin-top:6px';h.textContent='🔎 Public records (places & events only, never private people)';box.appendChild(h);
 XLAY3.forEach(r=>{const b=document.createElement('button');b.className=LAY[r[0]]?'on':'';b.innerHTML=r[1]+'<br><small>'+r[2]+'</small>';b.style.textAlign='left';b.onclick=()=>{LAY[r[0]]=!LAY[r[0]];b.className=LAY[r[0]]?'on':'';applyLayer(r[0]);};box.appendChild(b);});};
const _apply3=applyLayer;applyLayer=function(k){_apply3(k);const on=LAY[k];if(k==='cases'&&on)loadCases();if(k==='hygiene'&&on)loadHygiene();if(k==='heritage'&&on)loadHeritage();};
