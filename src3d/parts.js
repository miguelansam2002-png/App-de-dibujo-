import * as THREE from 'three';

// Biblioteca geométrica original de Trazo Técnico. Unidades en milímetros.
// Los modelos son representaciones CAD conceptuales parametrizables, no piezas certificadas.
const P=(type,label,category,icon,hint,dims,color='#869aaa')=>({type,label,category,icon,hint,dims,color});
export const CATALOG=[
 P('pipe','Tubería recta','Tuberías','━','Hueca · espesor real',{length:1200,diameter:114.3,wall:6.02}),
 P('pipe_spool','Tramo bridado','Tuberías','═','Tubo + 2 bridas',{length:900,diameter:114.3,wall:6.02,flange:210,thickness:24,bolts:8}),
 P('pipe_nipple','Niple roscado','Tuberías','≡','Extremos roscados',{length:250,diameter:60.3,wall:3.91}),
 P('pipe_insulated','Tubería aislada','Tuberías','▰','Camisa de aislamiento',{length:1000,diameter:114.3,wall:6,insulation:35}),
 P('elbow','Codo 90° LR','Accesorios','⌒','Hueco · radio largo',{radius:152.4,diameter:114.3,wall:6.02}),
 P('elbow45','Codo 45°','Accesorios','◜','Hueco · curva suave',{radius:152.4,diameter:114.3,wall:6.02}),
 P('elbow180','Retorno 180°','Accesorios','∩','Retorno tubular',{radius:190,diameter:114.3,wall:6.02}),
 P('tee','Tee igual','Accesorios','⊥','Troncal + derivación',{length:520,branch:260,diameter:114.3,wall:6.02}),
 P('tee_reducing','Tee reductora','Accesorios','⊤','Diámetro de ramal menor',{length:520,branch:265,diameter:114.3,branchDiameter:76,wall:6}),
 P('cross','Cruz 4 vías','Accesorios','✛','Cuatro bocas',{length:460,branch:460,diameter:114.3,wall:6}),
 P('reducer','Reducción concéntrica','Accesorios','◁','Dos diámetros',{length:260,diameter:168.3,smallDiameter:114.3,wall:6}),
 P('reducer_ecc','Reducción excéntrica','Accesorios','◪','Cara inferior alineada',{length:260,diameter:168.3,smallDiameter:114.3,wall:6}),
 P('coupling','Manguito unión','Accesorios','▣','Conector de tubo',{length:170,diameter:130,bore:114.3,wall:7}),
 P('union','Unión desmontable','Accesorios','⬡','Tuerca central hexagonal',{length:240,diameter:114.3,wall:6}),
 P('cap','Tapón de tubería','Accesorios','◖','Cierre de extremo',{length:160,diameter:114.3,wall:7}),
 P('flange','Brida slip-on','Bridas','◎','Agujeros pasantes',{diameter:228.6,bore:115,thickness:24,bolts:8,boltHole:19,pitch:190}),
 P('flange_wn','Brida cuello soldar','Bridas','◉','Cuello cónico y taladros',{diameter:228.6,bore:103,thickness:24,bolts:8,boltHole:19,pitch:190,neck:75}),
 P('flange_blind','Brida ciega','Bridas','●','Cierre sin perforación central',{diameter:228.6,thickness:24,bolts:8,boltHole:19,pitch:190}),
 P('gasket','Empaque anular','Bridas','○','Junta delgada',{diameter:170,bore:115,thickness:4},'#505c63'),
 P('valve','Válvula compuerta','Válvulas','⊗','Vástago y volante',{length:320,diameter:114.3,height:280}),
 P('valve_ball','Válvula de bola','Válvulas','◉','Cuerpo y palanca',{length:270,diameter:114.3,height:160}),
 P('valve_butterfly','Válvula mariposa','Válvulas','⋈','Disco y accionamiento',{length:140,diameter:168.3,height:215}),
 P('valve_check','Válvula retención','Válvulas','▷','Cuerpo con tapa',{length:310,diameter:114.3,height:155}),
 P('strainer','Filtro tipo Y','Válvulas','⌁','Cámara y limpieza',{length:390,diameter:114.3,branch:220}),
 P('clamp_u','Grapa tipo U','Grapas','∩','Arco, 2 patas, tuercas',{width:132,height:205,rod:12,plate:12}),
 P('clamp_omega','Grapa omega','Grapas','Ω','Banda curvada con orejas',{width:132,height:115,strap:35,thickness:4,holes:12}),
 P('clamp_split','Abrazadera partida','Grapas','⊙','2 mitades atornilladas',{diameter:150,width:46,thickness:9,bolts:2}),
 P('clamp_saddle','Abrazadera con apoyo','Grapas','⌢','Media caña y placa base',{diameter:150,length:280,width:65,thickness:12}),
 P('clevis','Colgador horquilla','Grapas','∪','Colgador y tirante',{diameter:165,width:55,rod:16,height:310}),
 P('pipe_shoe','Patín de tubería','Soportes','⌔','Silla y base de apoyo',{length:320,diameter:168,width:210,height:180,thickness:12}),
 P('support','Soporte estructural','Soportes','⊓','Placa, columnas y travesaño',{width:460,height:380,depth:280,plate:18}),
 P('profile','Perfil I / H','Estructuras','Ⅰ','Alas y alma de acero',{length:1200,height:240,width:140,thickness:12}),
 P('channel','Canal U','Estructuras','⊔','Perfil canal',{length:1200,height:120,width:65,thickness:8}),
 P('angle','Ángulo L','Estructuras','⌞','Perfil angular',{length:950,height:100,width:100,thickness:9}),
 P('tube_square','Tubo rectangular','Estructuras','▢','Sección estructural hueca',{length:900,height:110,width:70,thickness:6}),
 P('plate','Placa perforada','Estructuras','▦','Cuatro agujeros reales',{length:430,width:280,thickness:22,hole:28}),
 P('baseplate','Placa ranurada','Estructuras','▤','Ranuras de anclaje',{length:390,width:300,thickness:18,hole:30}),
 P('box','Caja abierta','Estructuras','▣','Paredes y fondo',{length:1250,width:700,height:470,wall:20},'#a2a9b0'),
 P('frame','Bastidor metálico','Estructuras','▥','Travesaños y columnas',{length:1100,width:650,height:550,thickness:45}),
 P('bolt','Perno hexagonal','Fijaciones','⬡','Cabeza y tuerca',{length:140,diameter:22,head:38}),
 P('nut','Tuerca hexagonal','Fijaciones','⬢','Taladro central',{diameter:34,bore:19,thickness:20}),
 P('washer','Arandela','Fijaciones','◎','Orificio central',{diameter:46,bore:22,thickness:4}),
 P('threaded_rod','Espárrago','Fijaciones','╍','Varilla roscada conceptual',{length:280,diameter:18}),
 P('tank','Tanque vertical','Equipos','◯','Carcasa y bocas',{diameter:580,height:1150}),
 P('shaft','Eje mecánico','Equipos','═','Eje macizo',{length:1200,diameter:95}),
 P('rotor','Rotor 10 discos','Equipos','≡','Eje y discos',{length:1280,shaft:80,disc:350,discs:10}),
 P('pump','Bomba centrífuga','Equipos','⬟','Voluta, bocas y bancada',{length:490,width:300,height:330})
];
export const DIMENSION_NAMES={length:'Longitud',diameter:'Diámetro exterior',wall:'Espesor de pared',radius:'Radio al eje',branch:'Longitud ramal',branchDiameter:'Ø ramal',smallDiameter:'Ø menor',insulation:'Aislamiento',flange:'Ø brida',bore:'Diámetro interior',thickness:'Espesor',bolts:'Número de pernos',boltHole:'Ø agujero perno',pitch:'Círculo de pernos',neck:'Longitud del cuello',width:'Ancho / separación',height:'Altura',rod:'Ø varilla',head:'Ancho cabeza',depth:'Fondo',plate:'Espesor de placa',hole:'Ø agujero',holes:'Ø agujero',strap:'Ancho banda',shaft:'Ø eje',disc:'Ø disco',discs:'Número de discos'};
export const INTEGER_DIMS=new Set(['bolts','discs']);
export const PIPE_SIZES=[
 {nps:'1/2',dn:15,od:21.34,s40:2.77,s80:3.73},{nps:'3/4',dn:20,od:26.67,s40:2.87,s80:3.91},{nps:'1',dn:25,od:33.4,s40:3.38,s80:4.55},
 {nps:'1 1/4',dn:32,od:42.16,s40:3.56,s80:4.85},{nps:'1 1/2',dn:40,od:48.26,s40:3.68,s80:5.08},{nps:'2',dn:50,od:60.33,s40:3.91,s80:5.54},
 {nps:'2 1/2',dn:65,od:73.03,s40:5.16,s80:7.01},{nps:'3',dn:80,od:88.9,s40:5.49,s80:7.62},{nps:'4',dn:100,od:114.3,s40:6.02,s80:8.56},
 {nps:'5',dn:125,od:141.3,s40:6.55,s80:9.53},{nps:'6',dn:150,od:168.28,s40:7.11,s80:10.97},{nps:'8',dn:200,od:219.08,s40:8.18,s80:12.7},
 {nps:'10',dn:250,od:273.05,s40:9.27,s80:15.09},{nps:'12',dn:300,od:323.85,s40:10.31,s80:17.48}
];
export const MATERIALS=[{id:'carbon',name:'Acero carbono',color:'#8799aa'},{id:'inox',name:'Acero inoxidable',color:'#b7c5cf'},{id:'galv',name:'Galvanizado',color:'#9eabb3'},{id:'blue',name:'Azul industrial',color:'#30709d'},{id:'green',name:'Verde válvula',color:'#397e72'},{id:'safety',name:'Amarillo seguridad',color:'#d5a744'},{id:'dark',name:'Grafito',color:'#485868'},{id:'rubber',name:'Caucho',color:'#30343a'},{id:'wood',name:'Madera',color:'#bd9368'}];
export const partDefinition=type=>CATALOG.find(p=>p.type===type);
const n=(x,fallback=1)=>Number.isFinite(Number(x))?Number(x):fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,n(v,a)));
const T=(v,min=1,max=18000)=>clamp(v,min,max);
function mat(color,metal=.68,rough=.33){return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,side:THREE.DoubleSide})}
function add(parent,geo,material,pos=[0,0,0],rot){const mesh=new THREE.Mesh(geo,material);mesh.position.set(...pos);if(rot)mesh.rotation.set(...rot);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function box(parent,material,w,h,d,x=0,y=0,z=0){return add(parent,new THREE.BoxGeometry(Math.max(.4,w),Math.max(.4,h),Math.max(.4,d)),material,[x,y,z])}
function cyl(parent,material,r,height,x=0,y=0,z=0,axis='y',segments=48){const mesh=add(parent,new THREE.CylinderGeometry(Math.max(.3,r),Math.max(.3,r),Math.max(.4,height),segments),material,[x,y,z]);if(axis==='x')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.x=Math.PI/2;return mesh}
function cone(parent,material,r1,r2,height,x=0,y=0,z=0,axis='x'){const mesh=add(parent,new THREE.CylinderGeometry(Math.max(.2,r1),Math.max(.2,r2),Math.max(.4,height),64),material,[x,y,z]);if(axis==='x')mesh.rotation.z=Math.PI/2;return mesh}
function torus(parent,material,major,minor,x=0,y=0,z=0,rotate='y'){const m=add(parent,new THREE.TorusGeometry(major,minor,12,72),material,[x,y,z]);if(rotate==='x')m.rotation.y=Math.PI/2;if(rotate==='y')m.rotation.x=Math.PI/2;return m}
function rod(parent,points,r,material){return add(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(26,points.length*6),Math.max(.3,r),16,false),material)}
function hollow(parent,length,od,wall,material,axis='x',x=0,y=0,z=0){const R=Math.max(1,od/2),ir=Math.max(.5,R-Math.min(wall,R*.92));const pts=[new THREE.Vector2(ir,-length/2),new THREE.Vector2(R,-length/2),new THREE.Vector2(R,length/2),new THREE.Vector2(ir,length/2),new THREE.Vector2(ir,-length/2)];const geo=new THREE.LatheGeometry(pts,64);geo.rotateZ(-Math.PI/2);const mesh=add(parent,geo,material,[x,y,z]);if(axis==='y')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.y=Math.PI/2;return mesh}
// Superficie tubular hueca curvada: pared exterior, interior y dos coronas anulares en los extremos.
function swept(parent,points,od,wall,material,sections=56){const curve=new THREE.CatmullRomCurve3(points,false,'centripetal',.25);const radial=32,R=od/2,r=Math.max(.7,R-wall);const frames=curve.computeFrenetFrames(sections,false),verts=[],normals=[],indices=[];
 function surface(radius,inner){const base=verts.length/3;for(let i=0;i<=sections;i++){const p=curve.getPointAt(i/sections);for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2,dir=new THREE.Vector3().addScaledVector(frames.normals[i],Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));verts.push(p.x+dir.x*radius,p.y+dir.y*radius,p.z+dir.z*radius);const s=inner?-1:1;normals.push(dir.x*s,dir.y*s,dir.z*s)}}for(let i=0;i<sections;i++)for(let j=0;j<radial;j++){const a=base+i*(radial+1)+j,b=a+radial+1;if(inner)indices.push(a,b+1,b,a,a+1,b+1);else indices.push(a,b,b+1,a,b+1,a+1)}return base}
 const outer=surface(R,false),inner=surface(r,true);for(const i of [0,sections])for(let j=0;j<radial;j++){const u=outer+i*(radial+1)+j,v=inner+i*(radial+1)+j;indices.push(u,v,v+1,u,v+1,u+1)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setIndex(indices);return add(parent,geo,material)}
function arcPoints(radius,degrees){const pts=[];const count=Math.max(12,Math.round(40*degrees/90));for(let i=0;i<=count;i++){const a=degrees*Math.PI/180*i/count;pts.push(new THREE.Vector3(radius*Math.sin(a),0,radius*(1-Math.cos(a))))}return pts}
function flange(parent,od,bore,thickness,bolts,boltHole,pitch,material,x=0,blind=false){const shape=new THREE.Shape();shape.absarc(0,0,od/2,0,2*Math.PI,false);if(!blind){const center=new THREE.Path();center.absarc(0,0,Math.min(bore,od*.90)/2,0,2*Math.PI,true);shape.holes.push(center)}const nBolts=Math.max(0,Math.min(32,Math.round(bolts)));const bc=Math.min(pitch,od-boltHole-5)/2;for(let i=0;i<nBolts;i++){const a=i*2*Math.PI/nBolts;const hole=new THREE.Path();hole.absarc(Math.cos(a)*bc,Math.sin(a)*bc,boltHole/2,0,2*Math.PI,true);shape.holes.push(hole)}const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,curveSegments:56});geo.translate(0,0,-thickness/2);geo.rotateY(Math.PI/2);return add(parent,geo,material,[x,0,0])}
function ring(parent,od,bore,thick,material,axis='x',x=0,y=0,z=0){const shape=new THREE.Shape();shape.absarc(0,0,od/2,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,Math.max(.4,bore/2),0,Math.PI*2,true);shape.holes.push(hole);const geo=new THREE.ExtrudeGeometry(shape,{depth:thick,bevelEnabled:false,curveSegments:56});geo.translate(0,0,-thick/2);if(axis==='x')geo.rotateY(Math.PI/2);if(axis==='y')geo.rotateX(-Math.PI/2);return add(parent,geo,material,[x,y,z])}
function hex(parent,r,h,material,x=0,y=0,z=0,axis='y',bore=0){if(bore>0){const s=new THREE.Shape();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?s.lineTo(px,py):s.moveTo(px,py)}s.closePath();const hole=new THREE.Path();hole.absarc(0,0,bore/2,0,Math.PI*2,true);s.holes.push(hole);const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.translate(0,0,-h/2);if(axis==='y')g.rotateX(-Math.PI/2);if(axis==='x')g.rotateY(Math.PI/2);return add(parent,g,material,[x,y,z])}return cyl(parent,material,r,h,x,y,z,axis,6)}
function perforatedTab(parent,material,length,width,thickness,holeD,x,y,z){const sh=new THREE.Shape(),a=length/2,b=width/2;sh.moveTo(-a,-b);sh.lineTo(a,-b);sh.lineTo(a,b);sh.lineTo(-a,b);sh.closePath();const hole=new THREE.Path();hole.absarc(0,0,Math.min(holeD/2,a*.7,b*.7),0,Math.PI*2,true);sh.holes.push(hole);const g=new THREE.ExtrudeGeometry(sh,{depth:thickness,bevelEnabled:false,curveSegments:30});g.translate(0,0,-thickness/2);g.rotateX(-Math.PI/2);return add(parent,g,material,[x,y,z])}
function halfBand(parent,inner,wall,band,material,yBase=0,angle=Math.PI){const outer=inner+wall,nSegments=48,shape=new THREE.Shape();for(let i=0;i<=nSegments;i++){const a=Math.PI-i/nSegments*angle;const xx=Math.cos(a)*outer,yy=Math.sin(a)*outer+yBase;i?shape.lineTo(xx,yy):shape.moveTo(xx,yy)}for(let i=nSegments;i>=0;i--){const a=Math.PI-i/nSegments*angle;shape.lineTo(Math.cos(a)*inner,Math.sin(a)*inner+yBase)}shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:band,bevelEnabled:false,curveSegments:16});g.translate(0,0,-band/2);return add(parent,g,material)}
function drilledPlate(parent,material,length,depth,thick,rodCenters,holeRadius,y=0){
 const sh=new THREE.Shape(),h=depth/2,l=length/2;
 sh.moveTo(-l+3,-h);sh.lineTo(l-3,-h);sh.quadraticCurveTo(l,-h,l,-h+3);
 sh.lineTo(l,h-3);sh.quadraticCurveTo(l,h,l-3,h);sh.lineTo(-l+3,h);
 sh.quadraticCurveTo(-l,h,-l,h-3);sh.lineTo(-l,-h+3);sh.quadraticCurveTo(-l,-h,-l+3,-h);sh.closePath();
 for(const x of rodCenters){const hole=new THREE.Path();hole.absarc(x,0,holeRadius,0,Math.PI*2,true);sh.holes.push(hole)}
 const g=new THREE.ExtrudeGeometry(sh,{depth:thick,bevelEnabled:false,curveSegments:24});
 g.translate(0,0,-thick/2);g.rotateX(-Math.PI/2);return add(parent,g,material,[0,y,0]);
}
function materialSet(data){const base=mat(data.color||'#8c9ca8');return {base,steel:mat('#b8c6d1'),dark:mat('#405061',.5,.46),rubber:mat('#323941',.12,.83),brass:mat('#ad996c',.55,.38),paint:mat('#34788c',.42,.4)}}
export function makePart(data){const def=partDefinition(data.type);if(!def)throw new Error('Pieza desconocida: '+data.type);const d={...def.dims,...data.dims};for(const k in d)d[k]=T(d[k],INTEGER_DIMS.has(k)?1:.5,INTEGER_DIMS.has(k)?32:18000);const L=d.length||300,D=d.diameter||114.3,W=d.wall||6;const group=new THREE.Group();group.name=data.name||def.label;group.userData.partId=data.id;const M=materialSet(data),m=M.base;
 switch(data.type){
 case 'pipe':{
  hollow(group,L,D,W,m);
  // Perfiles de borde suaves para apreciar el diámetro y el espesor exterior.
  for(const x of [-L/2+.7,L/2-.7])torus(group,M.steel,D/2-.9,Math.min(1.15,W*.17),x,0,0,'x');
  break}
 case 'pipe_nipple':hollow(group,L,D,W,m);for(const x of [-L*.4,L*.4])for(let i=0;i<5;i++)torus(group,M.steel,D/2,Math.min(1.3,W*.13),x+(i-2)*3,0,0,'x');break;
 case 'pipe_insulated':hollow(group,L,D,W,M.steel);hollow(group,L*.90,D+2*d.insulation,d.insulation,M.brass);break;
 case 'pipe_spool':hollow(group,L,D,W,m);for(const x of [-L/2+18,L/2-18])flange(group,d.flange,D-W*2,d.thickness,d.bolts,Math.max(12,d.thickness*.7),d.flange*.78,M.steel,x);break;
 case 'elbow':case 'elbow45':case 'elbow180':swept(group,arcPoints(d.radius,data.type==='elbow45'?45:data.type==='elbow180'?180:90),D,W,m,data.type==='elbow180'?96:56);break;
 case 'tee':case 'tee_reducing':{
  const bd=data.type==='tee'?D:d.branchDiameter;
  hollow(group,L,D,W,m);hollow(group,d.branch,bd,Math.min(W,bd*.16),m,'y',0,d.branch/2,0);
  ring(group,D*1.045,Math.max(1,D-W*2),Math.min(5,W*.5),M.steel,'x',-L/2+4);
  ring(group,D*1.045,Math.max(1,D-W*2),Math.min(5,W*.5),M.steel,'x',L/2-4);
  ring(group,bd*1.045,Math.max(1,bd-2*W),Math.min(5,W*.5),M.steel,'y',0,d.branch-4,0);
  break}
 case 'cross':hollow(group,L,D,W,m);hollow(group,d.branch,D,W,m,'y');break;
 case 'reducer':case 'reducer_ecc':{const D1=D,D2=Math.min(d.smallDiameter,D*.96),p=[new THREE.Vector2(Math.max(.5,D2/2-W),-L/2),new THREE.Vector2(D2/2,-L/2),new THREE.Vector2(D1/2,L/2),new THREE.Vector2(Math.max(.5,D1/2-W),L/2),new THREE.Vector2(Math.max(.5,D2/2-W),-L/2)];const g=new THREE.LatheGeometry(p,64);g.rotateZ(-Math.PI/2);const o=add(group,g,m);if(data.type==='reducer_ecc')o.position.y=(D1-D2)/4;break}
 case 'coupling':hollow(group,L,D,d.wall||8,m);for(const x of [-L*.31,L*.31])ring(group,D*1.07,d.bore,7,M.steel,'x',x);break;
 case 'union':hollow(group,L,D,W,m);hex(group,D*.74,L*.24,M.steel,0,0,0,'x',D-W*2);for(const x of [-L*.35,L*.35])ring(group,D*1.16,D-W*2,10,M.steel,'x',x);break;
 case 'cap':hollow(group,L*.57,D,W,m,'x',-L*.23);cyl(group,m,D/2,W+5,L*.08,0,0,'x');add(group,new THREE.SphereGeometry(D/2,40,22,0,2*Math.PI,0,Math.PI/2),m,[L*.08,0,0],[0,0,-Math.PI/2]);break;
 case 'flange':case 'flange_wn':case 'flange_blind':{
  const blind=data.type==='flange_blind';
  flange(group,D,blind?0:d.bore,d.thickness,d.bolts,d.boltHole,d.pitch,m,0,blind);
  const face=Math.max(8,Math.min(D*.78,d.pitch-d.boltHole*1.8));
  if(blind)cyl(group,M.steel,face*.5,2.8,d.thickness/2+1.2,0,0,'x',80);
  else ring(group,face,d.bore,2.8,M.steel,'x',d.thickness/2+1.2);
  if(data.type==='flange_wn'){
   cone(group,m,Math.max(d.bore*.54,10),D*.34,d.neck,d.thickness*.5+d.neck*.5,0,0);
   ring(group,Math.max(d.bore*1.11,12),d.bore,3,M.steel,'x',d.thickness/2+d.neck-2);
  }
  torus(group,M.dark,D*.485,Math.max(1.2,d.thickness*.055),-d.thickness/2+1.4,0,0,'x');
  break}
 case 'gasket':ring(group,D,d.bore,d.thickness,M.rubber);break;
 case 'valve':case 'valve_ball':case 'valve_butterfly':case 'valve_check':{const bodyD=D*(data.type==='valve_butterfly'?1.18:1.03);hollow(group,L,D,Math.max(5,D*.15),m);if(data.type==='valve_butterfly'){cyl(group,m,bodyD*.64,L*.52);cyl(group,M.steel,D*.45,11,0,0,0,'x')}else if(data.type==='valve_ball'){add(group,new THREE.SphereGeometry(D*.7,36,24),m);cyl(group,M.steel,9,d.height*.43,0,d.height*.35,0);box(group,M.steel,D*.95,12,20,D*.32,d.height*.58,0)}else if(data.type==='valve_check'){cyl(group,m,D*.59,D*.55,0,D*.18,0);cyl(group,M.steel,D*.52,22,0,D*.72,0)}else{cyl(group,m,D*.69,D*.85);cyl(group,M.steel,11,d.height*.66,0,d.height*.43,0);torus(group,M.steel,D*.49,8,0,d.height*.76,0,'y');for(let a=0;a<4;a++){const ang=a*Math.PI/2;box(group,M.steel,5,5,D*.85,0,d.height*.76,0).rotation.y=ang}}break}
 case 'strainer':hollow(group,L,D,D*.11,m);{const mesh=cyl(group,m,D*.39,d.branch,0,-d.branch*.34,0);mesh.rotation.z=-Math.PI/3;cyl(group,M.steel,D*.43,18,d.branch*.20,-d.branch*.80,0,'x')}break;
 case 'clamp_u':{
  const r=d.width/2,rodR=d.rod/2,arcY=d.height/2-r;
  const pts=[new THREE.Vector3(-r,-d.height/2,0),new THREE.Vector3(-r,arcY,0)];
  for(let i=0;i<=48;i++){const a=Math.PI-i*Math.PI/48;pts.push(new THREE.Vector3(r*Math.cos(a),arcY+r*Math.sin(a),0))}
  pts.push(new THREE.Vector3(r,-d.height/2,0));rod(group,pts,rodR,m);
  const plateY=-d.height*.34;drilledPlate(group,M.steel,d.width+4*d.rod,d.rod*3.2,d.plate,[-r,r],rodR+1.1,plateY);
  for(const x of [-r,r]){
   for(const sign of [-1,1]){
    const washerY=plateY+sign*(d.plate/2+1.6),nutY=plateY+sign*(d.plate/2+d.rod*.56+3);
    ring(group,d.rod*2.55,d.rod+1.1,2.8,M.dark,'y',x,washerY,0);
    hex(group,rodR*2.0,d.rod*.90,M.steel,x,nutY,0,'y',d.rod+1.1);
   }
   for(let i=0;i<9;i++)torus(group,M.steel,rodR*.96,.48,x,-d.height*.475+i*2.25,0,'y');
  }break}
 case 'clamp_omega':{
  const r=d.width/2,y0=-d.height*.35;
  halfBand(group,r,d.thickness,d.strap,m,y0);
  for(const sx of [-1,1]){
   const x=sx*(r+d.strap*.53);
   perforatedTab(group,m,d.strap*1.25,d.strap,d.thickness,d.holes,x,y0,0);
   ring(group,d.holes*1.95,d.holes,2.4,M.steel,'y',x,y0+d.thickness*.65,0);
   cyl(group,M.dark,d.holes*.33,d.thickness*2.6,x,y0+d.thickness*.48,0,'y',24);
   hex(group,d.holes*.83,Math.max(4,d.thickness*1.15),M.steel,x,y0+d.thickness*1.35,0);
   torus(group,M.steel,d.holes*.92,.8,x,y0-d.thickness*.6,0,'y');
  }break}
 case 'clamp_split':{
  const r=D/2+d.thickness*.28;
  halfBand(group,r,d.thickness,d.width,m,0,Math.PI);
  const down=new THREE.Group();halfBand(down,r,d.thickness,d.width,m,0,Math.PI);down.rotation.z=Math.PI;group.add(down);
  for(const sx of [-1,1]){
   const x=sx*(r+d.thickness*1.5);
   for(const sy of [-1,1]){box(group,M.steel,d.thickness*2.7,d.thickness*.8,d.width*1.18,x,sy*d.thickness*.8,0);
    const y=sy*d.thickness*.8;hex(group,d.thickness*.9,d.width*.15,M.steel,x,y,sy*d.width*.63,'z');
   }
   cyl(group,M.dark,d.thickness*.43,d.width*1.4,x,0,0,'z');
  }
  break}
 case 'clamp_saddle':halfBand(group,D/2,d.thickness,d.width,m,0,Math.PI);box(group,M.steel,d.length,d.thickness,d.width,0,-D*.15,0);for(const x of [-d.length*.40,d.length*.40])cyl(group,M.dark,d.thickness*.6,d.thickness*.7,x,-D*.15,0,'y');break;
 case 'clevis':{const r=D/2;const pts=[new THREE.Vector3(-r-d.rod,-d.height*.08,0),new THREE.Vector3(-r-d.rod,0,0)];for(let i=0;i<=24;i++){const a=Math.PI+i*Math.PI/24;pts.push(new THREE.Vector3((r+d.rod)*Math.cos(a),(r+d.rod)*Math.sin(a),0))}pts.push(new THREE.Vector3(r+d.rod,-d.height*.08,0));rod(group,pts,d.rod*.42,m);for(const x of [-r-d.rod,r+d.rod]){box(group,M.steel,d.rod*1.2,d.height*.55,d.width*.45,x,d.height*.26,0);cyl(group,M.dark,d.rod*.45,d.width,x,d.height*.35,0,'z')}cyl(group,M.steel,d.rod/2,d.height*.7,0,d.height*.5,0);break}
 case 'pipe_shoe':{halfBand(group,D/2,d.thickness,d.width,m,0);box(group,M.steel,d.length,d.thickness,d.width,0,-d.height*.65,0);for(const x of [-d.length*.27,d.length*.27])box(group,m,d.thickness,d.height*.65,d.width*.65,x,-d.height*.32,0);break}
 case 'support':box(group,m,d.width,d.plate,d.depth,0,-d.height/2,0);for(const x of [-d.width*.37,d.width*.37])box(group,m,d.plate,d.height-d.plate,d.plate,x,0,0);box(group,m,d.width*.86,d.plate*1.4,d.depth*.5,0,d.height/2-d.plate,0);break;
 case 'profile':box(group,m,L,d.thickness,d.width,0,-d.height/2+d.thickness/2,0);box(group,m,L,d.height-2*d.thickness,d.thickness);box(group,m,L,d.thickness,d.width,0,d.height/2-d.thickness/2,0);break;
 case 'channel':box(group,m,L,d.thickness,d.width,0,-d.height/2+d.thickness/2,0);for(const z of [-d.width/2+d.thickness/2,d.width/2-d.thickness/2])box(group,m,L,d.height,d.thickness,0,0,z);break;
 case 'angle':box(group,m,L,d.thickness,d.width,0,-d.height/2,0);box(group,m,L,d.height,d.thickness,0,0,-d.width/2+d.thickness/2);break;
 case 'tube_square':{const h=d.height,w=d.width,t=Math.min(d.thickness,h*.3,w*.3);for(const y of [-h/2+t/2,h/2-t/2])box(group,m,L,t,w,0,y,0);for(const z of [-w/2+t/2,w/2-t/2])box(group,m,L,h-2*t,t,0,0,z);break}
 case 'plate':case 'baseplate':{const sh=new THREE.Shape();const w=d.width/2;sh.moveTo(-L/2,-w);sh.lineTo(L/2,-w);sh.lineTo(L/2,w);sh.lineTo(-L/2,w);sh.closePath();for(const x of [-L*.35,L*.35])for(const z of [-d.width*.31,d.width*.31]){const h=new THREE.Path();h.absarc(x,z,d.hole/2,0,Math.PI*2,true);sh.holes.push(h)}const g=new THREE.ExtrudeGeometry(sh,{depth:d.thickness,bevelEnabled:false,curveSegments:40});g.translate(0,0,-d.thickness/2);g.rotateX(-Math.PI/2);add(group,g,m);break}
 case 'box':{const H=d.height,t=Math.min(d.wall,d.width*.20,H*.20);box(group,m,L,t,d.width,0,-H/2+t/2,0);for(const x of [-L/2+t/2,L/2-t/2])box(group,m,t,H,d.width,x,0,0);for(const z of [-d.width/2+t/2,d.width/2-t/2])box(group,m,L-2*t,H,t,0,0,z);break}
 case 'frame':{const t=d.thickness;for(const x of [-L/2+t/2,L/2-t/2])for(const z of [-d.width/2+t/2,d.width/2-t/2])box(group,m,t,d.height,t,x,0,z);for(const y of [-d.height/2+t/2,d.height/2-t/2]){for(const z of [-d.width/2+t/2,d.width/2-t/2])box(group,m,L,t,t,0,y,z);for(const x of [-L/2+t/2,L/2-t/2])box(group,m,t,t,d.width,x,y,0)}break}
 case 'bolt':cyl(group,m,D/2,L);hex(group,d.head/2,d.head*.45,M.steel,0,L/2+d.head*.22,0);hex(group,d.head*.52,d.head*.45,M.dark,0,-L*.27,0);break;
 case 'nut':hex(group,D/2,d.thickness,m,0,0,0,'y',d.bore);break;
 case 'washer':ring(group,D,d.bore,d.thickness,m,'y');break;
 case 'threaded_rod':cyl(group,m,D/2,L);for(let i=0;i<16;i++)torus(group,M.steel,D/2,.55,0,-L*.45+i*(L*.9/15),0,'y');break;
 case 'tank':cyl(group,m,D/2,d.height);cyl(group,M.steel,D*.21,32,0,d.height/2,0);cyl(group,M.dark,D*.28,36,0,-d.height/2,0);break;
 case 'shaft':cyl(group,m,D/2,L,0,0,0,'x');break;
 case 'rotor':{cyl(group,M.steel,d.shaft/2,L,0,0,0,'x');const N=Math.round(d.discs);for(let i=0;i<N;i++){const x=-L*.43+i*L*.86/Math.max(1,N-1);cyl(group,m,d.disc/2,Math.max(12,L/N*.20),x,0,0,'x')}break}
 case 'pump':box(group,M.dark,L,d.height*.14,d.width,0,-d.height*.43,0);cyl(group,m,d.height*.30,L*.45,0,d.height*.06,0,'x');cyl(group,M.steel,d.height*.2,L*.10,-L*.27,d.height*.06,0,'x');cyl(group,m,d.height*.22,L*.17,L*.26,d.height*.1,0,'x');cyl(group,M.steel,d.height*.14,38,-L*.08,d.height*.43,0);break;
 default:box(group,m,L,50,50);
 }
 group.userData.parametric=true;return group;
}
export function releasePart(group){group.traverse(x=>{if(x.isMesh){x.geometry?.dispose();if(Array.isArray(x.material))x.material.forEach(m=>m.dispose());else x.material?.dispose()}})}
export function standardPart(type,index=0){const def=partDefinition(type);if(!def)throw Error('No existe la pieza '+type);return {id:'pieza-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),type,name:def.label,dims:{...def.dims},pos:[(index%3)*320,0,Math.floor(index/3)*250],rot:[0,0,0],color:def.color}}