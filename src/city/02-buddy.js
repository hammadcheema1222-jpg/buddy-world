const pet={root:null,parts:null,x:1,y:0,z:5,ang:Math.PI,path:[],act:'wander',timer:3,arrived:false,hidden:false,carry:false,happy:0,waveT:0,say:'',sayT:0,chatT:16,yo:0,look:null};
function buildPet(){
 if(pet.root)scene.remove(pet.root);
 const cat=kind==='cat',cB=cat?'#f4b469':'#fbfaf5',cD=cat?'#d9893f':'#2c2c2c',cL=cat?'#fff3e2':'#ffffff',limbC=cat?cB:cD;
 const root=new THREE.Group(),P={};scene.add(root);
 P.torso=S(1,cB,0,0,0,root);P.chest=S(1,cat?cL:cD,0,0,0,root);
 P.head=grp(root);const h=P.head;S(0.26,cB,0,0,0,h);
 if(cat){[1,-1].forEach(s=>{const e=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.17,4),M(cB));e.position.set(0.14*s,0.22,0);e.rotation.z=-0.35*s;h.add(e);const ei=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.1,4),M('#f6a9a0'));ei.position.set(0.14*s,0.21,0.04);ei.rotation.z=-0.35*s;h.add(ei);});
  [-0.07,0,0.07].forEach(x=>B(0.025,0.06,0.02,cD,x,0.17,0.2,h));}
 else{[1,-1].forEach(s=>S(0.085,cD,0.17*s,0.2,-0.02,h));}
 P.eyes=grp(h);P.eyes.position.set(0,0.02,0.2);
 [1,-1].forEach(s=>{if(!cat){const pch=S(0.07,cD,0.095*s,-0.005,0.005,P.eyes,0.85,1.15,0.6);pch.rotation.z=0.5*s;}S(0.045,cat?'#2b2220':'#fbfbfb',0.095*s,0,0.03,P.eyes,1,1.15,0.7);S(0.025,cat?'#ffffff':'#1a1a1a',0.1*s,0.012,0.06,P.eyes);});
 S(0.1,cL,0,-0.08,0.2,h,1.2,0.8,0.6);S(0.03,cat?'#e8848a':'#1a1a1a',0,-0.04,0.26,h,1.2,0.9,0.8);
 [1,-1].forEach(s=>S(0.045,'#f39aa4',0.16*s,-0.06,0.19,h,1,0.6,0.4));
 P.legs=[];[[0.12,0.21],[-0.12,0.21],[0.12,-0.2],[-0.12,-0.2]].forEach(q=>{const lg=grp(root);lg.userData.base=q;C(0.065,0.26,limbC,0,-0.26,0,lg);S(0.075,limbC,0,-0.27,0.02,lg,1,0.8,1.2);P.legs.push(lg);});
 P.tail=grp(root);if(cat){for(let i=0;i<5;i++)S(0.055,i>3?cD:cB,0,i*0.08,-i*0.035,P.tail);}else S(0.08,'#fbfaf5',0,0,0,P.tail);
 P.book=B(0.22,0.28,0.05,'#5b8bd6',0,0,0,root);P.book.visible=false;
 const sh=new THREE.Mesh(new THREE.CircleGeometry(0.35,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.18,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=0.01;root.add(sh);P.shadow=sh;
 P.rod=grp(root);{const r=new THREE.Mesh(GC,M('#6b4a2b'));r.scale.set(0.02,1.3,0.02);r.position.set(0.1,0.95,0.75);r.rotation.x=1.0;P.rod.add(r);const ln=new THREE.Mesh(GC,M('#ffffff'));ln.scale.set(0.006,1.4,0.006);ln.position.set(0.1,0.65,1.32);P.rod.add(ln);S(0.05,'#d9534f',0.1,-0.05,1.32,P.rod);}P.rod.visible=false;P.umb=grp(root);C(0.015,1.1,'#555',0.18,0.55,0,P.umb);{const u=new THREE.Mesh(new THREE.ConeGeometry(0.62,0.32,10),M('#d9534f'));u.position.set(0.18,1.75,0);P.umb.add(u);}P.umb.visible=false;P.cone=grp(root);{const c=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.18,8),M('#d9a35a'));c.rotation.x=Math.PI;c.position.set(0.1,0.72,0.36);P.cone.add(c);S(0.07,'#f7c6d0',0.1,0.84,0.36,P.cone);}P.cone.visible=false;root.scale.setScalar(1.35);pet.root=root;pet.parts=P;
}
function setPose(pose,t,moving){
 const P=pet.parts,head=P.head,legs=P.legs;let blink=(t%4)<0.12||pet.happy>0||pose==='sleep'||pose==='eat';
 P.torso.visible=P.chest.visible=P.tail.visible=true;legs.forEach(l=>l.visible=true);P.book.visible=false;P.shadow.visible=true;head.rotation.set(0,0,0);
 if(pose==='head'){P.torso.visible=P.chest.visible=P.tail.visible=false;legs.forEach(l=>l.visible=false);P.shadow.visible=false;head.position.set(0,0.12+Math.sin(t*2)*0.02,0);head.rotation.z=Math.sin(t*1.5)*0.1;P.eyes.scale.y=blink?0.15:1;return;}
 if(pose==='sleep'){P.torso.position.set(0,0.2,0);P.torso.scale.set(0.32,0.2,0.4);P.chest.position.set(0,0.2,0.12);P.chest.scale.set(0.2,0.15,0.2);head.position.set(0.05,0.24,0.4);head.rotation.set(0.15,0,0.45);
  legs.forEach((l,i)=>{l.position.set(l.userData.base[0],0.2,l.userData.base[1]);l.rotation.set(-1.5,0,0);});P.tail.position.set(0.1,0.15,-0.38);P.tail.rotation.set(-1.4,0.9,0);P.eyes.scale.y=0.12;
  head.position.y+=Math.sin(t*1.6)*0.01;return;}
 const quad=pose==='walk'||pose==='run'||pose==='eat'||pose==='stand4';
 if(quad){const sp=pose==='run'?16:10,a=moving?Math.sin(t*sp)*0.55:0,bob=moving?Math.abs(Math.cos(t*sp))*0.03:0;
  P.torso.position.set(0,0.38+bob,0);P.torso.scale.set(0.27,0.24,0.4);P.chest.position.set(0,0.36+bob,0.15);
  if(kind==='cat')P.chest.scale.set(0.2,0.18,0.25);else{P.chest.scale.set(0.28,0.25,0.15);P.chest.position.z=0.12;}
  head.position.set(0,0.66+bob,0.36);if(pose==='eat'){head.position.set(0,0.42+Math.abs(Math.sin(t*5))*0.04,0.48);head.rotation.x=0.5;}
  legs.forEach((l,i)=>{const s=(i===0||i===3)?1:-1;l.position.set(l.userData.base[0],0.32+bob,l.userData.base[1]);l.rotation.set(a*s,0,0);});
  P.tail.position.set(0,0.48+bob,-0.38);P.tail.rotation.set(-0.3+Math.sin(t*3)*0.15,Math.sin(t*2)*0.2,0);P.eyes.scale.y=blink?0.15:1;return;}
 // upright poses: sit, stand2, play, dance, wave, read, swing, paint, piano
 let bob=0,spin=0;if(pose==='play'||pose==='dance')bob=Math.abs(Math.sin(t*6))*0.15;if(pose==='dance')spin=Math.sin(t*4)*0.5;
 P.torso.position.set(0,0.36+bob,-0.02);P.torso.scale.set(0.27,0.33,0.27);P.chest.position.set(0,0.4+bob,0.12);
 if(kind==='cat')P.chest.scale.set(0.19,0.24,0.18);else{P.chest.scale.set(0.28,0.12,0.28);P.chest.position.set(0,0.56+bob,-0.02);}
 head.position.set(0,0.86+bob,0.06);head.rotation.y=spin;if(pose==='stars'){head.rotation.x=-0.5;}
 const fr=legs[0],fl=legs[1],br=legs[2],bl=legs[3];
 br.position.set(0.15,0.18,0.02);bl.position.set(-0.15,0.18,0.02);br.rotation.set(-1.45,0,0);bl.rotation.set(-1.45,0,0);
 fr.position.set(0.11,0.5+bob,0.14);fl.position.set(-0.11,0.5+bob,0.14);fr.rotation.set(0,0,0);fl.rotation.set(0,0,0);
 if(pose==='stand2'||pose==='paint'||pose==='piano'||pose==='stars'||pose==='arcade'){const k=pose==='piano'||pose==='arcade'?Math.sin(t*10)*0.25:pose==='paint'?Math.sin(t*5)*0.3:0;fr.rotation.x=-1.2+k;fl.rotation.x=-1.2-k;if(pose==='stars')fr.rotation.x=fl.rotation.x=-2;}
 if(pose==='play'||pose==='dance'){fr.rotation.x=-2.4+Math.sin(t*6)*0.4;fl.rotation.x=-2.4-Math.sin(t*6)*0.4;}
 if(pose==='wave'){fr.rotation.x=-2.6;fr.rotation.z=Math.sin(t*12)*0.4;}
 if(pose==='read'){fr.rotation.x=fl.rotation.x=-1.1;P.book.visible=true;P.book.position.set(0,0.62,0.36);P.book.rotation.x=-0.4;head.rotation.x=0.25;}
 if(pose==='swing'){fr.rotation.x=fl.rotation.x=-2.8;}
 if(pet.carry){fr.rotation.x=fl.rotation.x=-2.9;}
 P.tail.position.set(0,0.1,-0.28);P.tail.rotation.set(-1.3,0.5+Math.sin(t*2)*0.2,0);
 P.eyes.scale.y=blink?0.15:1;
}
