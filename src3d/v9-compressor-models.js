import * as THREE from 'three';

// Original educational geometry. Millimetres; NOT OEM dimensions or approved fabrication CAD.
const spec=(type,label,category,hint,dims,color='#94a9b8')=>({type,label,category,icon:'⚙',hint,dims,color});
export const V9_PARTS=[
 spec('v9_casing_upper','Carcasa superior partida','Compresión','Media carcasa con pestañas, línea de partición y tornillería',{length:2100,diameter:1120,wall:66,bolts:16}),
 spec('v9_casing_lower','Carcasa inferior partida','Compresión','Media carcasa mecanizada, bridas y apoyos',{length:2100,diameter:1120,wall:66,bolts:16}),
 spec('v9_barrel_case','Carcasa barril de compresor','Compresión','Cilindro de presión con tapas y bridas',{length:2200,diameter:1280,wall:82,bolts:20}),
 spec('v9_diaphragm','Diafragma de etapa / difusor','Compresión','Anillo con geometría difusora y tabiques',{diameter:900,width:95,shaft:125,blades:18}),
 spec('v9_impeller_closed','Impulsor cerrado mecanizado','Compresión','Shrouds, cubo y álabes curvos',{diameter:530,width:110,shaft:108,blades:15}),
 spec('v9_impeller_open','Impulsor semiabierto','Compresión','Álabes curvos con cubierta posterior',{diameter:530,width:105,shaft:108,blades:15}),
 spec('v9_rotor_shaft','Eje escalonado de compresor','Compresión','Muñones, hombros y asientos de impulsores',{length:1900,shaft:112,diameter:150,stages:6}),
 spec('v9_labyrinth','Sello laberinto multianillo','Compresión','Dientes de sello y ranuras axiales',{length:195,diameter:246,shaft:116,segments:11}),
 spec('v9_balance_piston','Pistón de balance axial','Compresión','Pistón escalonado y anillos de sellado',{length:260,diameter:355,shaft:116}),
 spec('v9_thrust_collar','Plato de empuje','Compresión','Anillo plano, cubo, ranuras y superficie pulida',{diameter:375,thickness:85,shaft:114}),
 spec('v9_tilting_bearing','Cojinete radial de zapatas','Compresión','Zapatas oscilantes y superficie interior',{length:360,diameter:330,shaft:120,pads:5}),
 spec('v9_dry_gas_cartridge','Cartucho de sello de gas seco','Compresión','Carcasa, caras de sello y alojamientos',{length:330,diameter:305,shaft:115,segments:10}),
 spec('v9_diaphragm_coupling','Acople flexible de diafragma','Compresión','Dos cubos, paquete de diafragmas y pernos',{length:490,diameter:350,shaft:118,bolts:12}),
 spec('v9_coupling_guard','Guarda del acople','Compresión','Protección metálica semicircular y refuerzos',{length:720,diameter:540,wall:12}),
 spec('v9_bearing_housing','Housing de cojinete partido','Compresión','Cuerpo, tapas, línea de partición y pernos',{length:590,diameter:480,shaft:120,bolts:12}),
 spec('v9_probe_axial','Probeta axial de proximidad','Instrumentación','Sensor, cuerpo roscado y conector',{length:230,diameter:42,height:95}),
 spec('v9_inlet_vanes','Corona de álabes guía','Compresión','Anillo, álabes orientables y pernos',{diameter:690,width:160,shaft:125,blades:18}),
 spec('v9_split_flange','Pestaña de junta de carcasa','Compresión','Pestaña de unión con agujeros y pernos',{length:1150,width:160,thickness:42,bolts:14})
];
const col=(hex,metalness=.67,roughness=.31)=>new THREE.MeshStandardMaterial({color:hex,metalness,roughness,side:THREE.DoubleSide});
const MAX=(x,a)=>Math.max(a,Number(x)||a);
function add(p,g,m,pos=[0,0,0]){const obj=new THREE.Mesh(g,m);obj.position.set(...pos);obj.castShadow=true;obj.receiveShadow=true;p.add(obj);return obj}
const block=(p,m,w,h,d,x=0,y=0,z=0)=>add(p,new THREE.BoxGeometry(MAX(w,1),MAX(h,1),MAX(d,1)),m,[x,y,z]);
function cylinder(p,m,r,len,x=0,y=0,z=0,axis='x',seg=64){const obj=add(p,new THREE.CylinderGeometry(MAX(r,.5),MAX(r,.5),MAX(len,1),seg),m,[x,y,z]);if(axis==='x')obj.rotation.z=Math.PI/2;else if(axis==='z')obj.rotation.x=Math.PI/2;return obj}
function annulus(p,m,outer,inner,depth,x=0,y=0,z=0,axis='x'){const s=new THREE.Shape();s.absarc(0,0,MAX(outer,2),0,Math.PI*2,false);const h=new THREE.Path();h.absarc(0,0,Math.min(outer-1,MAX(inner,1)),0,Math.PI*2,true);s.holes.push(h);const g=new THREE.ExtrudeGeometry(s,{depth:MAX(depth,1),bevelEnabled:false,curveSegments:64});g.translate(0,0,-depth/2);if(axis==='x')g.rotateY(Math.PI/2);else if(axis==='y')g.rotateX(-Math.PI/2);return add(p,g,m,[x,y,z])}
function tube(p,m,major,minor,x,y,z,axis='x'){const t=add(p,new THREE.TorusGeometry(MAX(major,3),MAX(minor,.7),12,68),m,[x,y,z]);if(axis==='x')t.rotation.y=Math.PI/2;else if(axis==='y')t.rotation.x=-Math.PI/2;return t}
function bolt(p,m,x,y,z,r=11,len=16,axis='y'){cylinder(p,m,r,len,x,y,z,axis,6);return cylinder(p,m,r*.74,len*.7,x,y+(axis==='y'?len*.7:0),z,axis,12)}
function holePlate(p,m,w,d,thick,holes=[],y=0){const shape=new THREE.Shape();const a=w/2,b=d/2;shape.moveTo(-a,-b);shape.lineTo(a,-b);shape.lineTo(a,b);shape.lineTo(-a,b);shape.closePath();for(const [hx,hz,rad] of holes){const path=new THREE.Path();path.absarc(hx,hz,rad,0,2*Math.PI,true);shape.holes.push(path)}const g=new THREE.ExtrudeGeometry(shape,{depth:MAX(thick,2),bevelEnabled:false,curveSegments:20});g.translate(0,0,-thick/2);g.rotateX(-Math.PI/2);return add(p,g,m,[0,y,0])}
function halfShell(p,m,L,R,wall,upper){const steps=72,rs=2,faces=[],v=[];const start=upper?0:Math.PI,end=start+Math.PI,ri=R-wall;
  // Ring-sector extrusion along X with outer/inner surfaces and closed radial ends.
  for(let side=0;side<2;side++){const rad=side===0?R:ri;for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps;yza(rad,a)}}
  function yza(rad,a){v.push(-L/2,rad*Math.sin(a),rad*Math.cos(a),L/2,rad*Math.sin(a),rad*Math.cos(a))}
  const index=(side,i,k)=>side*(steps+1)*2+i*2+k;
  const quad=(a,b,c,d)=>{faces.push(a,b,c,a,c,d)};
  for(let i=0;i<steps;i++){quad(index(0,i,0),index(0,i,1),index(0,i+1,1),index(0,i+1,0));quad(index(1,i+1,0),index(1,i+1,1),index(1,i,1),index(1,i,0));}
  for(let i=0;i<steps;i++){quad(index(0,i,0),index(0,i+1,0),index(1,i+1,0),index(1,i,0));quad(index(0,i+1,1),index(0,i,1),index(1,i,1),index(1,i+1,1));}
  for(const i of [0,steps])quad(index(0,i,0),index(1,i,0),index(1,i,1),index(0,i,1));
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(faces);geo.computeVertexNormals();add(p,geo,m);}
function splitCasing(p,d,upper,M){const L=d.length,R=d.diameter/2,wall=Math.min(R*.40,d.wall||60),pitch=d.diameter*.42;
 halfShell(p,M.case,L,R,wall,upper);for(const x of [-L*.47,L*.47]){const rr=R*.965;for(let a=0;a<2;a++)annulus(p,M.ring,R*1.035,R*.90,Math.max(18,wall*.4),x,0,0)}
 for(const z of [-pitch,pitch]){block(p,M.case,L*.99,Math.max(20,wall*.50),Math.max(45,wall*.85),0,0,z);for(let i=0;i<Math.max(6,Math.min(26,d.bolts||16));i++){const x=-L*.46+i*L*.92/Math.max(1,(d.bolts||16)-1);bolt(p,M.bolt,x,upper?wall*.37:-wall*.37,z,Math.max(5,wall*.12),Math.max(12,wall*.2))}}
 if(!upper){for(const x of [-L*.35,L*.35]){block(p,M.dark,L*.22,R*.24,R*.75,x,-R*.88,0);holePlate(p,M.ring,L*.23,R*.78,18,[], -R*1.04)}}
}
function vaneRibbon(p,m,R,r0,width,angle,swirl=.72){const segments=15,thick=Math.max(4,R*.013),vs=[],ind=[];for(let i=0;i<=segments;i++){const t=i/segments,r=r0+(R-r0)*t,a=angle+swirl*t*t;for(const dx of [-width*.42,width*.42])for(const da of [-thick/(r+1),thick/(r+1)])vs.push(dx,r*Math.sin(a+da),r*Math.cos(a+da));}
 const quad=(a,b,c,d)=>{ind.push(a,b,c,a,c,d)};for(let i=0;i<segments;i++){const a=i*4,b=(i+1)*4;quad(a,a+1,b+1,b);quad(a+2,b+2,b+3,a+3);quad(a,a+2,b+2,b);quad(a+1,b+1,b+3,a+3)}quad(0,1,3,2);const q=segments*4;quad(q+2,q+3,q+1,q);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(ind);g.computeVertexNormals();add(p,g,m);}
function impeller(p,d,M,open){const R=d.diameter/2,w=MAX(d.width,30),shaft=Math.min(R*.60,MAX(d.shaft,20)),inner=shaft*.52,blades=Math.max(5,Math.min(28,Math.round(d.blades||14)));
 annulus(p,M.polished,R*.90,inner,w*.10,-w*.44);if(!open)annulus(p,M.polished,R*.98,inner*1.35,w*.075,w*.44);annulus(p,M.ring,inner*1.65,inner,w*.72);for(let i=0;i<blades;i++)vaneRibbon(p,M.blade,R*.91,inner*1.5,w*.80,i*Math.PI*2/blades,.88);
 for(const x of [-w*.45,w*.45])tube(p,M.bolt,inner*1.17,Math.max(1,R*.009),x,0,0);}
function stagesShaft(p,d,M){const L=d.length,r=MAX(d.shaft,75)/2,stages=Math.max(1,Math.min(16,Math.round(d.stages||6)));cylinder(p,M.polished,r*.86,L*.98);for(const x of [-L*.47,L*.47]){cylinder(p,M.ring,r*1.08,L*.09,x);cylinder(p,M.dark,r*.92,L*.075,x+(x<0?-L*.02:L*.02))}
 for(let i=0;i<stages;i++){const x=-L*.35+i*(L*.7/Math.max(1,stages-1));cylinder(p,M.ring,r*1.23,Math.min(25,L*.013),x);tube(p,M.bolt,r*1.18,Math.max(1,r*.06),x,0,0)}
 cylinder(p,M.dark,r*.65,L*.11,L*.51);}
function diaphragm(p,d,M){const R=d.diameter/2,w=MAX(d.width,40),ri=Math.min(R*.45,MAX(d.shaft,90)*.75),blades=Math.max(6,Math.min(30,Math.round(d.blades||18)));
 annulus(p,M.case,R,ri,w*.36);for(let i=0;i<blades;i++){const a=i*Math.PI*2/blades;cylinder(p,M.blade,R*.028,w*.52,0,Math.sin(a)*R*.73,Math.cos(a)*R*.73,'x',16)}
 for(const x of [-w*.40,w*.40])annulus(p,M.ring,R*.94,R*.84,w*.09,x);}
function labyrinth(p,d,M){const R=d.diameter/2,shaft=Math.min(R*.75,MAX(d.shaft,80)/2),L=d.length,n=Math.max(4,Math.min(24,Math.round(d.segments||10)));
 annulus(p,M.case,R,shaft*1.16,L*.89);for(let i=0;i<n;i++){const x=-L*.44+i*(L*.88/(n-1));annulus(p,M.polished,shaft*1.31,shaft*.97,Math.max(1.5,L*.026),x)}tube(p,M.ring,R*.93,Math.max(2,R*.022),-L*.40,0,0);}
function tiltingBearing(p,d,M){const R=d.diameter/2,L=d.length,n=Math.max(3,Math.min(10,Math.round(d.pads||5))),shaft=MAX(d.shaft,90)/2;
 annulus(p,M.case,R,R*.72,L*.86);for(let i=0;i<n;i++){const a=i*Math.PI*2/n;const x=0,y=Math.sin(a)*(shaft*1.15),z=Math.cos(a)*(shaft*1.15);cylinder(p,M.brass,R*.15,L*.67,x,y,z,'x',16)}for(const x of [-L*.44,L*.44])annulus(p,M.ring,R*.99,R*.81,Math.max(5,L*.045),x);}
function dryGas(p,d,M){const R=d.diameter/2,L=d.length,shaft=MAX(d.shaft,70)/2;cylinder(p,M.case,R*.95,L*.86);for(let i=0;i<Math.max(4,Math.min(18,d.segments||10));i++){const x=-L*.39+i*L*.78/Math.max(3,(d.segments||10)-1);annulus(p,i%2?M.brass:M.ring,R*.86,shaft*1.13,Math.max(2,L*.045),x)}annulus(p,M.dark,shaft*1.52,shaft*.92,L*.98);for(const x of [-L*.45,L*.45])annulus(p,M.polished,R*.97,R*.65,L*.065,x);}
function coupling(p,d,M){const R=d.diameter/2,L=d.length,shaft=MAX(d.shaft,70)/2,n=Math.max(6,Math.min(24,Math.round(d.bolts||12)));for(const x of [-L*.42,L*.42]){annulus(p,M.ring,R*.88,shaft*.72,L*.17,x);annulus(p,M.polished,R*.63,shaft*.84,L*.21,x)}cylinder(p,M.dark,shaft*.77,L*.82);for(const x of [-L*.22,0,L*.22])annulus(p,M.brass,R*.73,shaft*.94,Math.max(4,L*.012),x);for(let i=0;i<n;i++){const a=i*Math.PI*2/n;const y=Math.sin(a)*R*.76,z=Math.cos(a)*R*.76;cylinder(p,M.bolt,Math.max(3,R*.035),L*.64,0,y,z,'x',6)}}
function housing(p,d,M){const R=d.diameter/2,L=d.length,shaft=MAX(d.shaft,90)/2;halfShell(p,M.case,L,R,R*.35,true);halfShell(p,M.case,L,R,R*.35,false);for(const z of [-R*.88,R*.88]){block(p,M.ring,L*.94,R*.08,R*.27,0,0,z);for(let i=0;i<7;i++)bolt(p,M.bolt,-L*.43+i*L*.86/6,R*.06,z,Math.max(5,R*.04),Math.max(12,R*.1))}annulus(p,M.brass,R*.65,shaft,L*.73);for(const x of [-L*.44,L*.44])annulus(p,M.dark,R*.95,R*.60,L*.06,x)}
export function makeV9Model(type,p,d,color){if(!V9_PARTS.some(v=>v.type===type))return false;
 const M={case:col(color),polished:col('#bacad5',.87,.19),ring:col('#7b91a3'),dark:col('#243d50',.49,.40),bolt:col('#d6dde2',.86,.25),brass:col('#b59b60',.67,.28),blade:col('#4d9baf',.8,.30)};
 const L=d.length||650,D=d.diameter||510,R=D/2;
 switch(type){
 case 'v9_casing_upper':splitCasing(p,d,true,M);break;
 case 'v9_casing_lower':splitCasing(p,d,false,M);break;
 case 'v9_barrel_case':{annulus(p,M.case,R,R-Math.min(R*.25,d.wall||60),L*.90);for(const x of [-L*.46,L*.46]){annulus(p,M.ring,R*1.16,R*.82,L*.09,x);for(let i=0;i<(d.bolts||20);i++){const a=i*Math.PI*2/d.bolts;cylinder(p,M.bolt,R*.028,L*.14,x,Math.sin(a)*R*1.06,Math.cos(a)*R*1.06,'x',6)}}break}
 case 'v9_diaphragm':diaphragm(p,d,M);break;
 case 'v9_impeller_closed':case 'v9_impeller_open':impeller(p,d,M,type==='v9_impeller_open');break;
 case 'v9_rotor_shaft':stagesShaft(p,d,M);break;
 case 'v9_labyrinth':labyrinth(p,d,M);break;
 case 'v9_balance_piston':{cylinder(p,M.polished,MAX(d.shaft,75)*.55,L*.94);for(let i=0;i<7;i++){const x=-L*.36+i*L*.12;cylinder(p,M.case,R*(.9-.018*i),L*.11,x);tube(p,M.ring,R*(.9-.018*i),Math.max(2,R*.026),x,0,0)}break}
 case 'v9_thrust_collar':{annulus(p,M.polished,R,MAX(d.shaft,60)*.48,MAX(d.thickness,40)*.61);for(const x of [-d.thickness*.30,d.thickness*.30])annulus(p,M.ring,R*.78,R*.50,d.thickness*.10,x);for(let i=0;i<16;i++){const a=i*Math.PI*2/16;cylinder(p,M.bolt,R*.027,d.thickness*.8,0,Math.sin(a)*R*.89,Math.cos(a)*R*.89,'x',10)}break}
 case 'v9_tilting_bearing':tiltingBearing(p,d,M);break;
 case 'v9_dry_gas_cartridge':dryGas(p,d,M);break;
 case 'v9_diaphragm_coupling':coupling(p,d,M);break;
 case 'v9_coupling_guard':{halfShell(p,M.case,L,R,MAX(d.wall,10),true);halfShell(p,M.case,L,R,MAX(d.wall,10),false);for(const x of [-L*.42,L*.42])annulus(p,M.ring,R*1.03,R*.94,L*.035,x);for(let i=0;i<8;i++)block(p,M.dark,L*.022,R*.085,R*.09,-L*.43+i*L*.86/7,R*.57,0);break}
 case 'v9_bearing_housing':housing(p,d,M);break;
 case 'v9_probe_axial':{cylinder(p,M.bolt,D*.33,L*.73);cylinder(p,M.dark,D*.52,L*.13,L*.3);tube(p,M.polished,D*.43,D*.045,L*.35,0,0);cylinder(p,M.brass,D*.19,L*.25,-L*.43);break}
 case 'v9_inlet_vanes':{annulus(p,M.case,R,R*.80,MAX(d.width,50)*.88);const blades=Math.max(6,Math.min(28,d.blades||18));for(let i=0;i<blades;i++){const a=i*Math.PI*2/blades;vaneRibbon(p,M.blade,R*.92,R*.22,d.width*.65,a,.26)}break}
 case 'v9_split_flange':{const n=Math.max(4,Math.min(26,d.bolts||14)),holes=[];for(let i=0;i<n;i++)holes.push([-d.length*.44+i*d.length*.88/(n-1),0,Math.max(5,d.width*.08)]);holePlate(p,M.case,d.length,d.width,d.thickness,holes);for(const [x,,r] of holes)bolt(p,M.bolt,x,d.thickness*.55,0,r*.64,d.thickness*.65);break}
 }
 return true;
}