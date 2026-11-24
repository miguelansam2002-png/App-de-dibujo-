import * as THREE from 'three';

// Original editable engineering-model library. All distances in mm.
// These are configurable conceptual geometries, NOT certified manufacturer models.
const P=(type,label,category,icon,hint,dims,color='#8fa2b4')=>({type,label,category,icon,hint,dims,color});
export const PREMIUM_PARTS=[
 P('pipe_lined','Tuberia revestida','Tuberías','◉','Revestimiento interior visible',{length:1100,diameter:114.3,wall:6.02,lining:8}),
 P('pipe_doublewall','Tuberia doble pared','Tuberías','◎','Tubo interior y camisa exterior',{length:1000,diameter:114.3,wall:6,insulation:24,outerWall:5}),
 P('pipe_spool_bolted','Spool con pernos','Tuberías','═','Bridas, pernos y empaque',{length:900,diameter:168.3,wall:7,flange:265,thickness:26,bolts:8}),
 P('pipe_miter','Codo segmentado','Tuberías','⌓','Segmentos con soldaduras visibles',{radius:210,diameter:168.3,wall:7,segments:4}),
 P('pipe_repair_sleeve','Camisa de reparacion','Tuberías','▤','Dos medias canas empernadas',{length:700,diameter:168.3,wall:7,thickness:10,bolts:6}),
 P('elbow_short','Codo 90° radio corto','Accesorios','◝','Curva R/D aproximada 1D',{radius:114.3,diameter:114.3,wall:6}),
 P('elbow_socket','Codo socket','Accesorios','◜','Dos extremos con receptaculo',{radius:170,diameter:114.3,wall:6,socket:30}),
 P('elbow_thread','Codo roscado','Accesorios','◜','Anillos de rosca conceptuales',{radius:130,diameter:60.3,wall:4}),
 P('wye45','Conexion Y 45°','Accesorios','⋔','Ramal diagonal y troncal',{length:560,branch:320,diameter:114.3,branchDiameter:88.9,wall:6}),
 P('lateral45','Conexion lateral 45°','Accesorios','⟗','Derivacion soldada a troncal',{length:580,branch:300,diameter:114.3,branchDiameter:76.2,wall:6}),
 P('weldolet','Derivacion weldolet','Accesorios','⊥','Refuerzo de derivacion',{length:470,branch:150,diameter:168.3,branchDiameter:60.3,wall:6}),
 P('stub_end','Stub end lap joint','Accesorios','⊟','Cuello corto con reborde',{length:245,diameter:114.3,wall:6,flange:170,thickness:16}),
 P('expansion_bellows','Junta de expansion','Accesorios','≋','Fuelle corrugado con tirantes',{length:500,diameter:168.3,wall:5,flange:260,bolts:8,convolutions:8}),
 P('grooved_coupling','Acople ranurado','Accesorios','⊞','Carcasa partida y tornilleria',{length:230,diameter:114.3,wall:6,bolts:2}),
 P('flange_socket','Brida socket weld','Bridas','◎','Receptaculo y agujeros',{diameter:228.6,bore:114.3,thickness:25,neck:42,bolts:8,boltHole:19,pitch:190}),
 P('flange_threaded','Brida roscada','Bridas','◉','Rosca interior ilustrativa',{diameter:228.6,bore:114.3,thickness:25,neck:38,bolts:8,boltHole:19,pitch:190}),
 P('flange_lap','Brida lap joint','Bridas','◍','Brida suelta y cara interior',{diameter:228.6,bore:114.3,thickness:24,bolts:8,boltHole:19,pitch:190}),
 P('flange_orifice','Brida de orificio','Bridas','⊙','Tomas de presion y pernos',{diameter:255,bore:114.3,thickness:34,bolts:8,boltHole:22,pitch:211}),
 P('blind_spectacle','Ciego ocho','Bridas','∞','Doble disco para linea',{diameter:228.6,bore:114.3,thickness:12}),
 P('valve_globe','Valvula globo','Válvulas','⍟','Cuerpo globular y volante',{length:330,diameter:114.3,height:345}),
 P('valve_needle','Valvula aguja','Válvulas','⍟','Cuerpo esbelto y bonete',{length:240,diameter:60.3,height:220}),
 P('valve_plug','Valvula macho','Válvulas','◈','Obturador y palanca',{length:300,diameter:114.3,height:150}),
 P('valve_diaphragm','Valvula diafragma','Válvulas','⌂','Bonete superior y volante',{length:345,diameter:114.3,height:270}),
 P('valve_actuated','Valvula con actuador','Válvulas','▣','Actuador neumatico',{length:345,diameter:114.3,height:330}),
 P('valve_3way','Valvula de 3 vias','Válvulas','⊣','Conexion lateral y palanca',{length:320,branch:150,diameter:114.3,height:180}),
 P('clamp_u_saddle','Grapa U con cuna','Grapas','∩','Cuna, varillas y placa perforada',{diameter:168.3,width:186,height:260,rod:14,plate:14}),
 P('clamp_rubber','Abrazadera acolchada','Grapas','◉','Forro elastomerico y pernos',{diameter:168.3,width:62,thickness:10,bolts:4}),
 P('clamp_hinged','Abrazadera bisagra','Grapas','⊙','Bisagra y cierre empernado',{diameter:168.3,width:55,thickness:9,bolts:2}),
 P('clamp_riser','Grapa montante','Grapas','♜','Orejas de soporte y tornilleria',{diameter:168.3,width:65,thickness:12,plate:15}),
 P('clamp_band','Abrazadera de banda','Grapas','◯','Cinta y cierre de tornillo',{diameter:114.3,width:28,thickness:3}),
 P('clamp_strut','Grapa para canal','Grapas','⌢','Canal perfilado y tornillo',{diameter:114.3,width:48,thickness:6,plate:8}),
 P('support_trapeze','Soporte trapecio','Soportes','⊓','Dos tirantes y perfil de soporte',{length:720,width:320,height:470,rod:16,thickness:12}),
 P('support_roller','Apoyo con rodillo','Soportes','◯','Rodillo sobre bancada',{length:450,width:340,height:190,diameter:140,thickness:15}),
 P('support_spring','Soporte de resorte','Soportes','♧','Carcasa, resorte y horquilla',{length:340,width:250,height:480,diameter:120,rod:15}),
 P('support_guide','Guia de tuberia','Soportes','⌗','Doble guia lateral y placa',{length:470,width:330,height:220,diameter:168.3,thickness:14}),
 P('support_anchor','Anclaje de tuberia','Soportes','⌑','Orejas, rigidizadores y base',{length:410,width:380,height:350,diameter:168.3,thickness:16}),
 P('support_bracket','Mensula triangular','Soportes','◺','Cartelas y anclajes',{length:450,width:240,height:330,thickness:18,bolts:4}),
 P('profile_t','Perfil T','Estructuras','⊤','Ala y alma metalica',{length:1080,width:140,height:170,thickness:13}),
 P('tube_round','Tubo estructural circular','Estructuras','◯','Seccion hueca estructural',{length:1050,diameter:140,thickness:9}),
 P('grating','Rejilla metalica','Estructuras','▦','Barras longitudinales y traviesas',{length:810,width:540,height:42,thickness:8}),
 P('gusset','Cartela triangular','Estructuras','◢','Cartela con orificios',{length:350,height:310,thickness:14,hole:25}),
 P('channel_strut','Canal ranurado','Estructuras','⊔','Perfil abierto con ranuras',{length:1020,width:76,height:50,thickness:5,hole:14}),
 P('stud_bolt','Espárrago y tuercas','Fijaciones','↕','Tuercas y arandelas dobles',{length:170,diameter:18,head:32}),
 P('bolt_anchor','Perno de anclaje','Fijaciones','↳','Perno doblado y tuercas',{length:330,diameter:20,head:38}),
 P('bolt_socket','Tornillo Allen','Fijaciones','⬡','Cabeza cilíndrica Allen',{length:125,diameter:18,head:34}),
 P('spacer','Casquillo distanciador','Fijaciones','▥','Separador tubular',{length:95,diameter:52,bore:23}),
 P('pin','Pasador con chaveta','Fijaciones','━','Perno transversal y arandela',{length:160,diameter:26,hole:8}),
 P('motor','Motor electrico','Equipos','▣','Aletas, patas y caja de bornes',{length:580,width:360,height:405,diameter:290}),
 P('gauge','Manometro','Equipos','◴','Caratula, bisel y toma',{diameter:145,thickness:35,neck:70}),
 P('filter','Filtro industrial','Equipos','▥','Vaso, cierre y conexiones',{length:450,diameter:260,height:550}),
 P('vessel_horizontal','Recipiente horizontal','Equipos','▰','Cabezales, patas y boquillas',{length:1180,diameter:450,wall:12,neck:160}),
 P('compressor','Compresor industrial','Equipos','▤','Carcasa, ejes y patines',{length:1050,width:600,height:540,diameter:280})
];

const std=(color='#98a8b6',metal=.7,rough=.32)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,side:THREE.DoubleSide});
const make=(g,geom,mat,pos=[0,0,0],rot)=>{const m=new THREE.Mesh(geom,mat);m.position.set(...pos);if(rot)m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
const B=(g,m,w,h,z,x=0,y=0,zz=0)=>make(g,new THREE.BoxGeometry(Math.max(1,w),Math.max(1,h),Math.max(1,z)),m,[x,y,zz]);
function C(g,m,r,len,x=0,y=0,z=0,axis='x',segs=72){const o=make(g,new THREE.CylinderGeometry(Math.max(.5,r),Math.max(.5,r),Math.max(.5,len),segs),m,[x,y,z]);if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;return o}
function K(g,m,rb,rt,len,x=0,y=0,z=0,axis='x'){const o=make(g,new THREE.CylinderGeometry(Math.max(.7,rt),Math.max(.7,rb),Math.max(.5,len),72),m,[x,y,z]);if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;return o}
function T(g,m,r,minor,x=0,y=0,z=0,axis='x'){const o=make(g,new THREE.TorusGeometry(Math.max(1,r),Math.max(.35,minor),16,80),m,[x,y,z]);if(axis==='x')o.rotation.y=Math.PI/2;else if(axis==='y')o.rotation.x=Math.PI/2;return o}
function H(g,m,L,OD,W,axis='x',x=0,y=0,z=0){const r=OD/2,inner=Math.max(.8,r-Math.min(W,r*.94)),len=Math.max(1,L);const p=[new THREE.Vector2(inner,-len/2),new THREE.Vector2(r,-len/2),new THREE.Vector2(r,len/2),new THREE.Vector2(inner,len/2),new THREE.Vector2(inner,-len/2)];const geo=new THREE.LatheGeometry(p,64);geo.rotateZ(-Math.PI/2);const o=make(g,geo,m,[x,y,z]);if(axis==='y')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.y=Math.PI/2;return o}
function R(g,m,OD,ID,depth,x=0,y=0,z=0,axis='x'){const s=new THREE.Shape(),o=OD/2;s.absarc(0,0,Math.max(1,o),0,Math.PI*2,false);if(ID>0){const h=new THREE.Path();h.absarc(0,0,Math.max(.5,Math.min(ID/2,o*.97)),0,Math.PI*2,true);s.holes.push(h)}const geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.5,depth),bevelEnabled:false,curveSegments:72});geo.translate(0,0,-depth/2);if(axis==='x')geo.rotateY(Math.PI/2);if(axis==='y')geo.rotateX(-Math.PI/2);return make(g,geo,m,[x,y,z])}
function diskHoles(g,m,OD,ID,depth,boltCount,holeOD,pcd,x=0){const s=new THREE.Shape();s.absarc(0,0,Math.max(10,OD)/2,0,Math.PI*2,false);if(ID>0){const h=new THREE.Path();h.absarc(0,0,Math.min(ID,OD*.88)/2,0,Math.PI*2,true);s.holes.push(h)}const maxPcd=Math.max(OD*.45,OD-holeOD*1.5);for(let i=0;i<Math.round(boltCount);i++){const a=i*2*Math.PI/boltCount,h=new THREE.Path(),r=Math.min(pcd,maxPcd)/2;h.absarc(r*Math.cos(a),r*Math.sin(a),Math.max(1,holeOD)/2,0,Math.PI*2,true);s.holes.push(h)}const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:36});geo.translate(0,0,-depth/2);geo.rotateY(Math.PI/2);return make(g,geo,m,[x,0,0])}
function hex(g,m,r,depth,x=0,y=0,z=0,axis='y'){return C(g,m,r,depth,x,y,z,axis,6)}
function bolt(g,m,x,y,z,axis='y',r=8){C(g,m,r,r*5,x,y,z,axis,20);hex(g,m,r*1.8,r*.95,x,y+r*2.7,z,axis);R(g,m,r*3.2,r*1.9,r*.4,x,y+r*1.6,z,axis)}
function screw(g,m,x,y,z,axis='x',d=14){C(g,m,d*.5,d*2,x,y,z,axis,24);hex(g,m,d*.92,d*.7,x,y,z,axis)}
function tubePath(g,m,points,OD,W,sections=56){const curve=new THREE.CatmullRomCurve3(points,false,'centripetal',.2),frames=curve.computeFrenetFrames(sections,false);const verts=[],norms=[],indices=[],radial=36,radii=[OD/2,Math.max(.7,OD/2-W)];for(let q=0;q<2;q++){const base=verts.length/3;for(let i=0;i<=sections;i++){const p=curve.getPointAt(i/sections);for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2,dir=new THREE.Vector3().addScaledVector(frames.normals[i],Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));verts.push(p.x+dir.x*radii[q],p.y+dir.y*radii[q],p.z+dir.z*radii[q]);const sign=q?-1:1;norms.push(dir.x*sign,dir.y*sign,dir.z*sign)}}for(let i=0;i<sections;i++)for(let j=0;j<radial;j++){const a=base+i*(radial+1)+j,b=a+radial+1;if(q)indices.push(a,b+1,b,a,a+1,b+1);else indices.push(a,b,b+1,a,b+1,a+1)}}for(const i of [0,sections])for(let j=0;j<radial;j++){const outer=i*(radial+1)+j,inner=(sections+1)*(radial+1)+outer;indices.push(outer,inner,inner+1,outer,inner+1,outer+1)}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norms,3));geometry.setIndex(indices);return make(g,geometry,m)}
function elbow(g,m,RADIUS,OD,W,angle=90){const a=angle*Math.PI/180,points=[];for(let i=0;i<=24;i++){const t=a*i/24;points.push(new THREE.Vector3(RADIUS*Math.sin(t),0,RADIUS*(1-Math.cos(t))))}return tubePath(g,m,points,OD,W,Math.max(36,Math.floor(64*angle/90)))}
function halfBand(g,m,inner,t,width,y=0,down=false){const s=new THREE.Shape(),outer=inner+t,N=50;for(let i=0;i<=N;i++){const a=Math.PI-i*Math.PI/N,x=Math.cos(a)*outer,yy=Math.sin(a)*outer*(down?-1:1)+y;i?s.lineTo(x,yy):s.moveTo(x,yy)}for(let i=N;i>=0;i--){const a=Math.PI-i*Math.PI/N;s.lineTo(Math.cos(a)*inner,Math.sin(a)*inner*(down?-1:1)+y)}s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:width,bevelEnabled:false,curveSegments:12});geo.translate(0,0,-width/2);return make(g,geo,m)}
function plateWithHoles(g,m,L,width,t,xs,rad,y=0){const sh=new THREE.Shape(),hx=L/2,hz=width/2;sh.moveTo(-hx,-hz);sh.lineTo(hx,-hz);sh.lineTo(hx,hz);sh.lineTo(-hx,hz);sh.closePath();for(const x of xs){const h=new THREE.Path();h.absarc(x,0,rad,0,Math.PI*2,true);sh.holes.push(h)}const geo=new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false,curveSegments:24});geo.translate(0,0,-t/2);geo.rotateX(-Math.PI/2);return make(g,geo,m,[0,y,0])}
function rod(g,m,points,r){return make(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(24,points.length*3),Math.max(.4,r),12,false),m)}
function qualityMaterials(color){return {body:std(color||'#91a5b5'),steel:std('#c3ced7',.78,.25),dark:std('#405367',.47,.48),rubber:std('#2b3843',.12,.82),brass:std('#c0a46c',.54,.36),paint:std('#2d6b8d',.38,.38),bolt:std('#d4dbe0',.81,.2),glass:std('#b9dce9',.08,.16)}}
function littleRims(g,m,OD,L){for(const x of [-L/2+1.2,L/2-1.2])T(g,m,OD/2-1,1.1,x,0,0)}
function pairedFlanges(g,m,steel,D,ID,FL,TH,bolts,L){for(const x of [-L/2+TH/2,L/2-TH/2]){diskHoles(g,m,FL,ID,TH,bolts,Math.max(12,TH*.65),FL*.76,x);R(g,steel,FL*.7,ID,3,x+Math.sign(x)*TH*.52);T(g,steel,FL*.475,1.3,x,0,0)}}
function branchAt(g,m,L,D,W,BR,BD,angle=90){H(g,m,L,D,W);const mesh=H(g,m,BR,BD,Math.min(W,BD*.2),'y',0,BR/2,0);mesh.rotation.z=-Math.PI/2+angle*Math.PI/180;return mesh}

export function makePremiumModel(type,g,d,color){const Q=qualityMaterials(color),m=Q.body,S=Q.steel,BM=Q.bolt,D=d.diameter||114.3,L=d.length||400,W=d.wall||6;
 switch(type){
 case 'pipe_lined':H(g,m,L,D,W);H(g,Q.brass,L*.97,D-2*W+2*d.lining,d.lining);littleRims(g,S,D,L);break;
 case 'pipe_doublewall':H(g,m,L,D,W);H(g,Q.paint,L*.89,D+2*d.insulation+2*d.outerWall,d.outerWall);for(const x of [-L*.42,L*.42])R(g,Q.dark,D+2*d.insulation+2*d.outerWall,D,7,x);break;
 case 'pipe_spool_bolted':H(g,m,L,D,W);pairedFlanges(g,m,S,D,D-2*W,d.flange,d.thickness,d.bolts,L);for(const x of [-L/2+d.thickness/2,L/2-d.thickness/2])for(let i=0;i<Math.min(16,d.bolts);i++){const a=i*2*Math.PI/d.bolts,r=d.flange*.38;const z=r*Math.cos(a),y=r*Math.sin(a);C(g,S,Math.max(4,d.thickness*.23),d.thickness*1.5,x,y,z);hex(g,BM,d.thickness*.34,d.thickness*.35,x+Math.sign(x)*d.thickness*.78,y,z,'x')}break;
 case 'pipe_miter':{const R=d.radius,sections=Math.max(2,Math.round(d.segments)),points=[];for(let i=0;i<=sections;i++){const a=i*Math.PI/2/sections;points.push(new THREE.Vector3(R*Math.sin(a),0,R*(1-Math.cos(a))))}tubePath(g,m,points,D,W,sections*14);for(let i=1;i<sections;i++){const a=i*Math.PI/2/sections;T(g,S,D/2,1.5,R*Math.sin(a),0,R*(1-Math.cos(a)),'y')}break}
 case 'pipe_repair_sleeve':H(g,S,L,D,W);{const dia=D+2*d.thickness;halfBand(g,m,dia/2,d.thickness,L*.89,0);halfBand(g,m,dia/2,d.thickness,L*.89,0,true);for(const sx of [-1,1])for(let i=0;i<Math.min(12,d.bolts);i++){const z=(i-(d.bolts-1)/2)*(L*.68/Math.max(1,d.bolts-1));B(g,S,d.thickness*3,d.thickness*2,d.thickness*2,sx*dia*.60,0,z);screw(g,BM,sx*dia*.60,0,z,'z',d.thickness)}break}
 case 'elbow_short':elbow(g,m,d.radius,D,W);T(g,S,D/2,1.3,0,0,0);break;
 case 'elbow_socket':case 'elbow_thread':{const R=d.radius;elbow(g,m,R,D,W);const a=R;H(g,S,Math.max(14,d.socket||D*.23),D*1.14,W,'x',0,0,0);H(g,S,Math.max(14,d.socket||D*.23),D*1.14,W,'z',a,0,a);if(type==='elbow_thread')for(let k=0;k<5;k++){T(g,Q.dark,D*.52,.55,4*k,0,0);T(g,Q.dark,D*.52,.55,a,0,a-4*k)}break}
 case 'wye45':case 'lateral45':case 'weldolet':{H(g,m,L,D,W);const BD=d.branchDiameter;const mesh=H(g,m,d.branch,BD,Math.min(W,BD*.15),'y',d.branch*.23,d.branch*.32,0);mesh.rotation.z=type==='weldolet'?0:-Math.PI/4;R(g,S,BD*1.16,BD-2*W,Math.max(4,W*.7),d.branch*.23,d.branch*.64,0,'y');if(type==='weldolet')R(g,Q.dark,D*1.23,D-W*2,W*1.5,0,0,0);littleRims(g,S,D,L);break}
 case 'stub_end':H(g,m,L,D,W);R(g,S,d.flange,D-2*W,d.thickness,L*.46);R(g,Q.dark,D*1.10,D-2*W,2,-L*.48);break;
 case 'expansion_bellows':{H(g,Q.dark,L,D,W);for(let i=0;i<Math.min(26,d.convolutions);i++){const x=-L*.38+i*(L*.76/Math.max(1,d.convolutions-1));T(g,m,D*.53,Math.max(2,D*.095),x)}pairedFlanges(g,S,BM,D,D-2*W,d.flange,26,d.bolts,L);for(const z of [-D*.65,D*.65])for(const y of [-D*.65,D*.65]){C(g,S,4,L*.85,0,y,z);for(const x of [-L*.40,L*.40])hex(g,BM,8,8,x,y,z,'x')}break}
 case 'grooved_coupling':H(g,m,L,D,W);for(const x of [-L*.37,L*.37])T(g,Q.dark,D/2-2,3,x);R(g,S,D*1.18,D-W*2,L*.62);for(const y of [-D*.61,D*.61]){B(g,S,L*.50,14,24,0,y,0);for(const x of [-L*.19,L*.19])screw(g,BM,x,y,0,'z',12)}break;
 case 'flange_socket':case 'flange_threaded':case 'flange_lap':case 'flange_orifice':{diskHoles(g,m,D,d.bore,d.thickness,d.bolts,d.boltHole,d.pitch);R(g,S,D*.65,d.bore,Math.max(3,d.thickness*.12),d.thickness*.53);T(g,Q.dark,D*.48,2,0);if(type!=='flange_lap')H(g,m,d.neck||d.thickness*.85,Math.max(d.bore*1.17,D*.46),Math.max(8,d.bore*.08),'x',-d.thickness*.48-(d.neck||d.thickness*.85)*.25);if(type==='flange_threaded')for(let i=0;i<7;i++)T(g,Q.dark,d.bore*.50,.8,-d.thickness*.6-i*3);if(type==='flange_orifice')for(const y of [-D*.31,D*.31]){C(g,S,9,75,0,y,0,'y');hex(g,BM,14,12,0,y*1.25,0)}break}
 case 'blind_spectacle':{const offset=D*.57;R(g,m,D,0,d.thickness,-offset);R(g,m,D,d.bore,d.thickness,offset);B(g,m,offset*2,D*.16,d.thickness,0,0,0);T(g,S,D*.46,1.8,-offset);T(g,S,D*.46,1.8,offset);break}
 case 'valve_globe':case 'valve_needle':case 'valve_plug':case 'valve_diaphragm':case 'valve_actuated':case 'valve_3way':{
 H(g,m,L,D,D*.13);for(const x of [-L*.39,L*.39])R(g,S,D*1.2,D-2*W,9,x);
 const h=d.height||D*2,bodyR=D*(type==='valve_needle'?.53:.66);
 if(type==='valve_3way')H(g,m,d.branch,D,D*.12,'y',0,d.branch/2);
 if(type==='valve_diaphragm'){C(g,m,D*.83,D*.43,0,D*.23,0,'y');R(g,S,D*1.36,D*.2,16,0,D*.46,0,'y')}
 else if(type==='valve_actuated'){C(g,m,bodyR,D*.9,0,D*.09,0,'y');B(g,Q.paint,D*1.14,h*.47,D*.9,0,h*.68,0);for(const z of [-D*.33,D*.33])C(g,S,6,h*.48,0,h*.7,z,'y')}
 else if(type==='valve_plug'){C(g,m,bodyR,D*.85,0,D*.07);C(g,S,12,h*.53,0,h*.36);B(g,S,D*.94,11,22,D*.34,h*.65)}
 else {C(g,m,bodyR,D*.78,0,D*.08);C(g,S,10,h*.62,0,h*.44);T(g,S,type==='valve_needle'?D*.31:D*.47,6,0,h*.78,0,'y');for(let k=0;k<4;k++){const a=k*Math.PI/2;const rim=B(g,S,D*.73,5,5,0,h*.78,0);rim.rotation.y=a}}
 for(let a=0;a<8;a++){const ang=2*Math.PI*a/8;const r=D*.36;hex(g,BM,6,7,r*Math.cos(ang),D*.44,r*Math.sin(ang))}break}
 case 'clamp_u_saddle':{const r=d.width/2,rr=d.rod/2,y0=d.height*.45-r,pts=[new THREE.Vector3(-r,-d.height*.5,0),new THREE.Vector3(-r,y0,0)];for(let i=0;i<=36;i++){const a=Math.PI-i*Math.PI/36;pts.push(new THREE.Vector3(r*Math.cos(a),y0+r*Math.sin(a),0))}pts.push(new THREE.Vector3(r,-d.height*.5,0));rod(g,m,pts,rr);halfBand(g,S,d.diameter/2,d.plate,62,-d.height*.26,true);plateWithHoles(g,S,d.width+d.rod*4,d.rod*4,d.plate,[-r,r],rr+1,-d.height*.30);for(const x of [-r,r])for(const sy of [-1,1]){const y=-d.height*.30+sy*(d.plate*.55+d.rod*.62);hex(g,BM,rr*1.88,d.rod*.8,x,y);R(g,Q.dark,d.rod*2.4,d.rod+.4,2,x,y-sy*d.rod*.53,0,'y')}break}
 case 'clamp_rubber':case 'clamp_hinged':case 'clamp_riser':{const r=D/2,t=d.thickness;halfBand(g,m,r+t*.4,t,d.width);halfBand(g,m,r+t*.4,t,d.width,0,true);if(type==='clamp_rubber'){halfBand(g,Q.rubber,r,t*.7,d.width*.88,0);halfBand(g,Q.rubber,r,t*.7,d.width*.88,0,true)}for(const sx of [-1,1]){const x=sx*(r+t*2);for(const sy of [-1,1]){B(g,S,t*2.8,t,d.width*1.15,x,sy*t*.68);screw(g,BM,x,0,0,'z',t)}if(type==='clamp_hinged'&&sx<0)C(g,S,t*.62,d.width*1.25,x,0,0,'z');if(type==='clamp_riser')B(g,S,d.plate*3,t*1.7,d.width*.9,x+sx*d.plate,0)}break}
 case 'clamp_band':{halfBand(g,m,D/2,d.thickness,d.width);halfBand(g,m,D/2,d.thickness,d.width,0,true);B(g,S,d.width*1.05,d.thickness*4,d.width*.9,D*.53,0);C(g,BM,d.thickness*1.1,d.width*1.1,D*.53,0,0,'z');for(let i=0;i<7;i++)T(g,Q.dark,D*.50,.45,0,0,(i-3)*d.width*.095,'y');break}
 case 'clamp_strut':{halfBand(g,m,D/2,d.thickness,d.width);B(g,S,D*1.55,d.plate,d.width,0,-D*.53,0);B(g,S,D*.83,d.plate*2,d.width*.7,0,-D*.67,0);for(const x of [-D*.55,D*.55])hex(g,BM,d.plate*.6,d.plate*.8,x,-D*.48,0);break}
 case 'support_trapeze':{const h=d.height;B(g,m,L,d.thickness,d.width,0,-h*.46);for(const x of [-L*.4,L*.4]){C(g,S,d.rod/2,h*.93,x,0,0,'y');hex(g,BM,d.rod*.85,d.rod*.72,x,-h*.44,0);R(g,Q.dark,d.rod*2,d.rod,2,x,-h*.38,0,'y')}B(g,Q.dark,L*.92,d.thickness*.55,d.width*.45,0,-h*.38);break}
 case 'support_roller':{B(g,Q.dark,L,d.thickness,d.width,0,-d.height*.43);for(const z of [-d.width*.30,d.width*.30]){B(g,S,d.thickness,d.height*.55,d.thickness*1.8,0,-d.height*.11,z);C(g,m,d.diameter/2,d.width*.67,0,d.height*.20,0,'z');T(g,S,d.diameter*.48,2,0,d.height*.2,z)}break}
 case 'support_spring':{B(g,Q.dark,L,d.width*.09,d.width,0,-d.height*.43);C(g,m,D*.50,d.height*.66,0,0,0,'y');C(g,Q.dark,D*.33,d.height*.60,0,0,0,'y');const N=12,pts=[];for(let i=0;i<=N*12;i++){const a=i*Math.PI/6;pts.push(new THREE.Vector3(D*.32*Math.cos(a),-d.height*.25+i*d.height*.50/(N*12),D*.32*Math.sin(a)))}rod(g,S,pts,Math.max(3,d.rod*.4));C(g,S,d.rod/2,d.height*.52,0,d.height*.44,0,'y');hex(g,BM,d.rod*1.15,d.rod*.6,0,d.height*.56);break}
 case 'support_guide':case 'support_anchor':{B(g,Q.dark,L,d.thickness,d.width,0,-d.height*.48);for(const x of [-D*.6,D*.6]){B(g,m,d.thickness*1.3,d.height*.70,d.width*.65,x,-d.height*.09);B(g,S,d.thickness*2.0,d.height*.32,d.width*.75,x,d.height*.22);if(type==='support_anchor')B(g,m,d.thickness,d.height*.6,d.width*.5,x*.7,-d.height*.14)}halfBand(g,S,D/2,d.thickness,d.width*.37,d.height*.30);break}
 case 'support_bracket':{B(g,m,d.thickness,d.height,d.width*.88,-L*.45,0);B(g,m,L,d.thickness,d.width*.82,0,d.height*.45);const shape=new THREE.Shape();shape.moveTo(-L*.44,-d.height*.43);shape.lineTo(L*.37,d.height*.43);shape.lineTo(-L*.44,d.height*.43);shape.closePath();const gg=new THREE.ExtrudeGeometry(shape,{depth:d.thickness,bevelEnabled:false});gg.translate(0,0,-d.thickness/2);make(g,gg,m);for(let i=0;i<Math.min(6,d.bolts);i++){const y=-d.height*.35+i*(d.height*.7/Math.max(1,d.bolts-1));bolt(g,S,-L*.47,y,0,'x',d.thickness*.38)}break}
 case 'profile_t':{B(g,m,L,d.thickness,d.width,0,d.height*.5-d.thickness*.5);B(g,m,L,d.height-d.thickness,d.thickness,0,-d.thickness*.5);break}
 case 'tube_round':H(g,m,L,D,d.thickness);littleRims(g,S,D,L);break;
 case 'grating':{const count=Math.min(24,Math.max(4,Math.round(d.width/45)));for(let i=0;i<count;i++){const z=-d.width*.5+i*d.width/Math.max(1,count-1);B(g,m,L,d.height,d.thickness,0,0,z)}for(let i=0;i<Math.min(20,Math.round(L/55));i++){const x=-L*.49+i*L/Math.max(1,Math.round(L/55)-1);B(g,S,d.thickness*.8,d.height*.37,d.width,x,0,0)}break}
 case 'gusset':{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(L,0);sh.lineTo(0,d.height);sh.closePath();for(const [x,y] of [[L*.17,d.height*.2],[L*.46,d.height*.16]]){const h=new THREE.Path();h.absarc(x,y,d.hole/2,0,Math.PI*2,true);sh.holes.push(h)}const geo=new THREE.ExtrudeGeometry(sh,{depth:d.thickness,bevelEnabled:false});geo.translate(-L/2,-d.height/2,-d.thickness/2);make(g,geo,m);break}
 case 'channel_strut':{B(g,m,L,d.thickness,d.width,0,-d.height*.45);for(const z of [-d.width*.48,d.width*.48])B(g,m,L,d.height,d.thickness,0,0,z);for(const z of [-d.width*.39,d.width*.39])B(g,m,L,d.thickness,d.width*.13,0,d.height*.45,z);for(let i=0;i<Math.min(16,Math.round(L/70));i++)C(g,Q.dark,d.hole*.52,d.thickness*.6,-L*.45+i*L/Math.max(1,Math.round(L/70)-1),-d.height*.47,0,'y');break}
 case 'stud_bolt':{C(g,m,D/2,L,0,0,0,'y');for(const y of [-L*.38,L*.38]){hex(g,S,d.head/2,d.head*.34,0,y);R(g,Q.dark,d.head*.94,D+1,3,0,y-d.head*.20,0,'y')}for(let i=0;i<14;i++){const y=-L*.49+i*L*.98/13;T(g,S,D/2,.43,0,y,0,'y')}break}
 case 'bolt_anchor':{const pts=[new THREE.Vector3(0,-L*.5,0),new THREE.Vector3(0,L*.33,0),new THREE.Vector3(D*.8,L*.46,0),new THREE.Vector3(D*1.7,L*.40,0)];rod(g,m,pts,D/2);for(const y of [-L*.31,-L*.21])hex(g,S,d.head*.5,d.head*.32,0,y);break}
 case 'bolt_socket':{C(g,m,D/2,L,0,0,0,'y');C(g,S,d.head*.54,d.head*.50,0,L*.5+d.head*.22,0,'y');hex(g,Q.dark,d.head*.23,d.head*.10,0,L*.5+d.head*.49,0,'y');break}
 case 'spacer':H(g,m,L,D,Math.max(2,(D-d.bore)/2));for(const x of [-L*.49,L*.49])R(g,S,D,d.bore,3,x);break;
 case 'pin':{C(g,m,D/2,L,0,0,0,'x');C(g,S,D*.68,D*.23,-L*.5,0,0,'x');C(g,Q.dark,d.hole/2,D*1.7,L*.40,0,0,'y');rod(g,S,[new THREE.Vector3(L*.40,-D*.6,0),new THREE.Vector3(L*.40,D*.55,0),new THREE.Vector3(L*.48,D*.72,0)],d.hole*.27);break}
 case 'motor':{B(g,Q.dark,L*.9,d.height*.08,d.width*.9,0,-d.height*.43);C(g,m,D/2,L*.72,0,d.height*.02,0,'x');C(g,S,D*.37,L*.12,-L*.44,d.height*.02,0,'x');C(g,Q.dark,D*.34,L*.14,L*.42,d.height*.02,0,'x');for(let i=0;i<12;i++){const x=-L*.29+i*L*.56/11;R(g,S,D*1.09,D*.95,Math.max(3,L*.006),x,d.height*.02,0,'x')}B(g,Q.paint,L*.27,d.height*.22,d.width*.43,0,d.height*.39,0);for(const x of [-L*.31,L*.29])for(const z of [-d.width*.3,d.width*.3])B(g,S,L*.14,d.height*.10,d.width*.12,x,-d.height*.34,z);break}
 case 'gauge':{C(g,m,D/2,d.thickness,0,0,0,'z');C(g,Q.dark,D*.47,d.thickness*.24,0,0,d.thickness*.62,'z');C(g,Q.glass,D*.43,2,0,0,d.thickness*.76,'z');T(g,S,D*.477,D*.025,0,0,d.thickness*.64,'z');const needle=B(g,Q.dark,D*.37,2,3,D*.10,0,d.thickness*.8);needle.rotation.z=Math.PI/6;for(let i=0;i<10;i++){const a=i*Math.PI/9;B(g,Q.dark,D*.065,3,3,D*.33*Math.cos(a),D*.33*Math.sin(a),d.thickness*.81)}C(g,S,d.neck*.19,d.neck,0,-D*.5-d.neck*.5,0,'y');hex(g,S,d.neck*.23,d.neck*.22,0,-D*.5-d.neck*.18);break}
 case 'filter':{C(g,m,D/2,d.height*.65,0,-d.height*.05,0,'y');R(g,S,D*1.15,D*.66,25,0,d.height*.27,0,'y');C(g,Q.dark,D*.42,42,0,d.height*.32,0,'y');for(let i=0;i<8;i++){const a=i*Math.PI/4,x=D*.48*Math.cos(a),z=D*.48*Math.sin(a);hex(g,S,8,16,x,d.height*.32,z)}H(g,S,L*.62,D*.37,7,'x',0,d.height*.28);C(g,Q.dark,D*.18,45,0,-d.height*.42,0,'y');break}
 case 'vessel_horizontal':{C(g,m,D/2,L*.79,0,0,0,'x');for(const x of [-L*.395,L*.395]){const o=make(g,new THREE.SphereGeometry(D/2,48,28,0,Math.PI*2,0,Math.PI/2),m,[x,0,0]);o.rotation.z=Math.PI/2*(x<0?-1:1);T(g,S,D*.48,1.7,x)}for(const x of [-L*.24,L*.24]){B(g,Q.dark,D*.35,D*.24,D*.85,x,-D*.61);B(g,S,D*.55,D*.05,D*.9,x,-D*.73)}H(g,S,d.neck,D*.30,10,'y',0,D*.53,0);R(g,S,D*.45,D*.25,13,0,D*.53+d.neck*.41,0,'y');break}
 case 'compressor':{B(g,Q.dark,L,d.height*.11,d.width,0,-d.height*.44);C(g,m,D*.47,L*.60,0,d.height*.02,0,'x');C(g,S,D*.36,L*.14,-L*.38,d.height*.02,0,'x');C(g,S,D*.30,L*.15,L*.36,d.height*.02,0,'x');for(const x of [-L*.25,L*.25])R(g,S,D*1.09,D*.72,26,x,d.height*.02,0,'x');for(const x of [-L*.30,L*.29]){B(g,Q.paint,L*.19,d.height*.45,d.width*.46,x,d.height*.20,0);for(let i=0;i<6;i++)B(g,S,8,6,d.width*.42,x,d.height*.03+i*d.height*.055,0)}H(g,S,d.height*.34,D*.42,11,'y',0,d.height*.39,0);break}
 default:return false;
 }return true;
}

// Refinement pass for original V1-V4 components. Avoid changing their editable dimensions.
export function enrichLegacyModel(type,g,d,color){const Q=qualityMaterials(color),m=Q.body,S=Q.steel,dk=Q.dark;const L=d.length||300,D=d.diameter||114.3,W=d.wall||6;
 if(['pipe','pipe_nipple','pipe_insulated','pipe_spool'].includes(type)){littleRims(g,S,D,L);if(type==='pipe_spool')for(const x of [-L*.46,L*.46])T(g,dk,D*.505,1.7,x);}
 if(['elbow','elbow45','elbow180'].includes(type)){T(g,S,D/2,1.2,0);const a=type==='elbow45'?Math.PI/4:type==='elbow180'?Math.PI:Math.PI/2;T(g,S,D/2,1.2,(d.radius||150)*Math.sin(a),0,(d.radius||150)*(1-Math.cos(a)),'y');}
 if(['tee','tee_reducing','cross'].includes(type)){littleRims(g,S,D,L);R(g,S,D*.86,D-2*W,2.8,0,d.branch||D,0,'y');}
 if(['flange','flange_wn','flange_blind'].includes(type)){T(g,dk,D*.48,Math.max(1,d.thickness*.045),-d.thickness*.48);if(type==='flange_blind')C(g,S,D*.26,3,d.thickness*.51,0,0,'x');else R(g,S,D*.66,Math.min(D*.62,d.bore||D*.36),3,d.thickness*.53);}
 if(type==='gasket'){T(g,Q.rubber,D*.46,Math.max(.6,d.thickness*.12),0);}
 if(['valve','valve_ball','valve_butterfly','valve_check','strainer'].includes(type)){for(const x of [-L*.38,L*.38])R(g,S,D*1.07,D*.78,4,x);for(let i=0;i<6;i++){const ang=i*Math.PI/3;hex(g,Q.bolt,Math.max(3,D*.034),Math.max(3,D*.042),Math.cos(ang)*D*.34,D*.34,Math.sin(ang)*D*.34)}}
 if(type==='clamp_u'){const r=d.width/2,y=-d.height*.34;for(const x of [-r,r])for(const sy of [-1,1]){R(g,dk,d.rod*2.8,d.rod+1.5,2.5,x,y+sy*(d.plate*.5+2),0,'y');hex(g,Q.bolt,d.rod*.92,d.rod*.58,x,y+sy*(d.plate/2+d.rod*.58))}}
 if(type==='clamp_omega'){const r=d.width/2,y=-d.height*.35;for(const x of [-(r+d.strap*.52),r+d.strap*.52]){C(g,dk,d.holes*.28,Math.max(6,d.thickness*2),x,y+d.thickness*.45,0,'y',24);hex(g,S,d.holes*.66,d.thickness*1.35,x,y+d.thickness*1.3)}}
 if(['clamp_split','clamp_saddle','clevis','pipe_shoe'].includes(type)){for(const x of [-D*.57,D*.57])hex(g,Q.bolt,Math.max(4,(d.thickness||8)*.75),Math.max(3,(d.thickness||8)*.6),x,0,(d.width||40)*.46,'z')}
 if(['support','profile','channel','angle','tube_square','frame'].includes(type)){const width=d.width||160;for(const z of [-width*.43,width*.43])B(g,dk,Math.min(L*.65,300),1.5,2.2,0,-(d.height||100)*.40,z)}
 if(['plate','baseplate'].includes(type))for(const x of [-L*.35,L*.35])for(const z of [-d.width*.31,d.width*.31])T(g,dk,d.hole*.54,1.2,x,d.thickness*.53,z,'y');
 if(type==='box'){for(const x of [-L*.46,L*.46])B(g,S,Math.max(4,d.wall*.22),d.height*.9,Math.max(4,d.wall*.20),x,0,d.width*.48)}
 if(type==='bolt'||type==='threaded_rod')for(let k=0;k<10;k++)T(g,S,(D||18)*.47,.48,0,-L*.42+k*L*.84/9,0,'y');
 if(type==='tank'){for(let k=0;k<4;k++)T(g,S,D*.495,1.7,0,-d.height*.40+k*d.height*.28,0,'y');B(g,dk,D*.37,26,45,0,d.height*.36,D*.43)}
 if(type==='shaft'){for(const x of [-L*.43,L*.43]){C(g,S,D*.65,16,x,0,0);T(g,dk,D*.47,1.1,x)}}
 if(type==='rotor'){const n=Math.max(1,Math.round(d.discs));for(let i=0;i<n;i++){const x=-L*.43+i*L*.86/Math.max(1,n-1);T(g,S,d.disc*.475,1.2,x)}}
 if(type==='pump'){for(const x of [-L*.35,L*.36])R(g,S,d.height*.41,d.height*.25,12,x,d.height*.05,0);for(const z of [-d.width*.37,d.width*.37])B(g,dk,L*.66,4,9,0,-d.height*.42,z)}
 return g;
}