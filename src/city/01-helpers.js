const GB=new THREE.BoxGeometry(1,1,1),GS=new THREE.SphereGeometry(1,14,10),GC=new THREE.CylinderGeometry(1,1,1,12),MC={};
function M(c,e){const k=c+'|'+(e||'');if(!MC[k])MC[k]=new THREE.MeshLambertMaterial({color:c,emissive:e||0x000000});return MC[k];}
function B(w,h,d,c,x,y,z,p,e){const m=new THREE.Mesh(GB,typeof c==='string'?M(c,e):c);m.scale.set(w,h,d);m.position.set(x,y+h/2,z);(p||scene).add(m);return m;}
function S(r,c,x,y,z,p,sx,sy,sz,e){const m=new THREE.Mesh(GS,M(c,e));m.scale.set(r*(sx||1),r*(sy||1),r*(sz||1));m.position.set(x,y,z);(p||scene).add(m);return m;}
function C(r,h,c,x,y,z,p,e){const m=new THREE.Mesh(GC,M(c,e));m.scale.set(r,h,r);m.position.set(x,y+h/2,z);(p||scene).add(m);return m;}
function grp(p,act){const g=new THREE.Group();(p||scene).add(g);if(act){g.userData.act=act;TAPPABLE.push(g);}return g;}