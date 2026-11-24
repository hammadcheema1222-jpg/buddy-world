
/* ===================== 23 · ACCESSIBILITY (WCAG 2.1 AA): names for icon buttons, visible focus, Escape to close, reduced motion, readable small text ===================== */
{const css=document.createElement('style');css.textContent=`
 :focus-visible{outline:3px solid #1f5fbf!important;outline-offset:2px!important;border-radius:8px}
 #attr{color:#1e140a!important;background:rgba(255,255,255,.9)!important}
 @media (max-width:760px){#attr{font-size:10px!important}}
 #nearP .nd{opacity:.85!important}
 .sr-only{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
 @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;document.head.appendChild(css);}
// every button gets a spoken name even when it only shows an emoji (phones), and a live region announces hints
function a11yNames(){document.querySelectorAll('button').forEach(b=>{const t=(b.dataset.full||b.title||b.textContent||'').replace(/\s+/g,' ').trim();if(t&&!b.getAttribute('aria-label')||(b.dataset.full&&b.getAttribute('aria-label')!==b.dataset.full))b.setAttribute('aria-label',(b.dataset.full||t).replace(/^[^\w£]+/u,'').trim()||t);if(b.classList.contains('on'))b.setAttribute('aria-pressed','true');else if(b.closest('#layList,#top'))b.setAttribute('aria-pressed','false');});
 [['#info','dialog'],['#layers','dialog'],['#places','dialog']].forEach(([s,r])=>{const e=document.querySelector(s);if(e){e.setAttribute('role',r);e.setAttribute('aria-modal','true');}});const h=$('hint');if(h){h.setAttribute('role','status');h.setAttribute('aria-live','polite');}const bb=$('bubble');if(bb)bb.setAttribute('aria-live','polite');
 const mm=$('mmC');if(mm){mm.setAttribute('role','button');mm.setAttribute('aria-label','Minimap: tap to fly to that spot');mm.tabIndex=0;}$('top')&&$('top').setAttribute('role','toolbar');$('top')&&$('top').setAttribute('aria-label','Main menu');$('nearP')&&$('nearP').setAttribute('aria-label','Nearby places');}
new MutationObserver(()=>{clearTimeout(a11yNames.t);a11yNames.t=setTimeout(a11yNames,150);}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});a11yNames();
// Nearby list items are keyboard-reachable
new MutationObserver(()=>document.querySelectorAll('#nearP .ni').forEach(n=>{if(n.tabIndex!==0){n.tabIndex=0;n.setAttribute('role','button');n.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();n.click();}};}})).observe(document.body,{subtree:true,childList:true});
// Escape closes the open card or panel and returns focus
let lastFocus=null;document.addEventListener('focusin',e=>{if(!e.target.closest('.over'))lastFocus=e.target;});
addEventListener('keydown',e=>{if(e.key!=='Escape')return;for(const id of ['info','layers','places']){const el=$(id);if(el&&getComputedStyle(el).display!=='none'){el.style.display='none';if(lastFocus&&lastFocus.focus)lastFocus.focus();e.preventDefault();return;}}if(FOLLOW)stopFollow();});
// when a card opens, move keyboard/screen-reader focus to it
new MutationObserver(()=>{const el=$('info');if(el&&el.style.display==='flex'){const t=$('iTitle');if(t&&document.activeElement&&!el.contains(document.activeElement)){t.tabIndex=-1;t.focus({preventScroll:true});}}}).observe($('info'),{attributes:true,attributeFilter:['style']});
