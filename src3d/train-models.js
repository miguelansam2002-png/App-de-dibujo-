import * as THREE from 'three';
import {V9_PARTS,makeV9Model} from './v9-compressor-models.js';

// Geometria de equipos rotativos ORIGINAL para estudio, dimensiones en mm.
// Las proporciones NO representan planos certificados de fabricantes.
const P=(type,label,category,hint,dims,color='#8699aa')=>({type,label,category,icon:'⚙',hint,dims,color});
export const TRAIN_PARTS=[
 P('train_turbine','Turbina de gas industrial','Compresión','Carcasa escalonada, escape y bancada',{length:2600,diameter:1220,height:1750}),
 P('train_motor','Motor de alta potencia','Compresión','Estator aleteado, terminales y eje',{length:1800,diameter:980,height:1310}),
 P('train_gearbox','Caja multiplicadora','Compresión','Carcasa, ejes y tapas de inspección',{length:1120,width:980,height:1090}),
 P('train_compressor','Compresor centrífugo','Compresión','Carcasa partida y boquillas de proceso',{length:2200,diameter:1140,height:1620,stages:5}),
 P('train_compressor_axial','Compresor axial','Compresión','Cuerpo cilíndrico y etapas internas',{length:2100,diameter:1000,height:1450,stages:7}),
 P('train_coupling','Acople de diafragma','Compresión','Hubs, diafragmas y bulonería',{length:580,diameter:340,bolts:12}),
 P('train_rotor','Rotor de compresor multietapa','Compresión','Eje con impulsores y journals',{length:1760,diameter:520,stages:6,shaft:110}),
 P('train_impeller','Impulsor centrífugo','Compresión','Disco, cubo y álabes tridimensionales',{diameter:560,width:115,blades:14,shaft:96}),
 P('train_bearing_radial','Cojinete radial partido','Compresión','Carcasa, casquillo y bulones',{length:430,diameter:305,width:260}),
 P('train_bearing_thrust','Cojinete de empuje','Compresión','Zapatas segmentadas y collar',{diameter:390,thickness:110,pads:8}),
 P('train_mechanical_seal','Sello de gas seco / cartucho','Compresión','Carcasa y anillos de sellado',{length:360,diameter:270,shaft:100}),
 P('train_oil_skid','Unidad de lubricación','Auxiliares','Tanque, bombas y filtros',{length:2000,width:1200,height:1150}),
 P('train_seal_panel','Panel gas de sellos','Auxiliares','Regulación, instrumentos y tubing',{length:1350,width:420,height:1450}),
 P('train_cooler','Enfriador de aceite','Auxiliares','Haz tubular y boquillas',{length:1300,diameter:470,height:680}),
 P('train_base','Bancada / skid de compresión','Estructuras','Largueros y apoyos',{length:7400,width:1900,height:310}),
 P('train_pedestal','Pedestal mecanizado','Estructuras','Placa, estructura y anclajes',{length:800,width:730,height:620}),
 P('train_nozzle','Boquilla de proceso','Tuberías','Cuello bridado y pernos',{length:540,diameter:320,wall:16,flange:455}),
 P('train_instrument','Instrumento de vibración','Instrumentación','Proximitor con soporte y cable',{length:290,diameter:48,height:180}),
 P('solid_block','Sólido: bloque','Sólidos CAD','Primitiva apta para booleanas de malla',{length:450,width:320,height:240}),
 P('solid_cylinder','Sólido: cilindro','Sólidos CAD','Primitiva apta para booleanas de malla',{length:460,diameter:265}),
 P('solid_sphere','Sólido: esfera','Sólidos CAD','Primitiva apta para booleanas de malla',{diameter:330}),
 P('custom_mesh','Modelo importado','Personalizados','Geometría importada o de operación CSG',{length:200,width:200,height:200}),
 ...V9_PARTS
];

const DEG=Math.PI/180;
function material(hex='#8997a4',metalness=.73,roughness=.32){return new THREE.MeshStandardMaterial({color:hex,metalness,roughness,side:THREE.DoubleSide});}
function mesh(g,m,parent,xyz=[0,0,0]){const obj=new THREE.Mesh(g,m);obj.position.set(...xyz);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;}
function b(p,m,x,y,z,w,h,d){return mesh(new THREE.BoxGeometry(Math.max(.1,w),Math.max(.1,h),Math.max(.1,d)),m,p,[x,y,z]);}
function c(p,m,x,y,z,r,h,axis='x',seg=72){const o=mesh(new THREE.CylinderGeometry(Math.max(.3,r),Math.max(.3,r),Math.max(.5,h),seg),m,p,[x,y,z]);if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;return o;}
function cone(p,m,x,y,z,r0,r1,h){const o=mesh(new THREE.CylinderGeometry(r1,r0,h,56),m,p,[x,y,z]);o.rotation.z=Math.PI/2;return o;}
function ring(p,m,x,y,z,R,r,depth,axis='x'){const s=new THREE.Shape();s.absarc(0,0,R,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,r,0,Math.PI*2,true);s.holes.push(hole);const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:72});g.translate(0,0,-depth/2);if(axis==='x')g.rotateY(Math.PI/2);else if(axis==='y')g.rotateX(-Math.PI/2);return mesh(g,m,p,[x,y,z]);}
function hex(p,m,x,y,z,R,h,axis='x'){return c(p,m,x,y,z,R,h,axis,6)}
function bolts(p,m,n,r,x,axis='x',size=12){for(let i=0;i<n;i++){const a=i/n*2*Math.PI;const y=r*Math.sin(a),z=r*Math.cos(a);if(axis==='x')hex(p,m,x,y,z,size,size,'x');else hex(p,m,r*Math.cos(a),x,r*Math.sin(a),size,size,'y');}}
function feet(p,m,L,D,y){for(const x of [-L*.36,L*.36]){b(p,m,x,y,0,L*.14,D*.17,D*.75);for(const z of [-D*.27,D*.27])c(p,m,x,y-D*.08,z,D*.025,D*.17,'y',20)}}
function heatFins(p,m,L,R,count=21){for(let i=0;i<count;i++){const x=-L*.44+i*(L*.88/Math.max(1,count-1));ring(p,m,x,0,0,R*1.07,R*.88,Math.max(3,L*.008));}}
function flange(p,m,x,R,r,thick,boltn=12){ring(p,m,x,0,0,R,r,thick);bolts(p,material('#b8c9d4'),boltn,R*.88,x+thick*.48,'x',Math.max(4,R*.035));}
function nozzle(p,m,x,y,z,R,H,axis='y'){c(p,m,x,y+H/2,z,R,H,axis);ring(p,m,x,y+H,z,R*1.43,R*.74,R*.22,axis)}
function labels(p,m,L,H,D){b(p,m,0,H*.25,D*.51,Math.min(240,L*.32),Math.min(82,H*.13),10);}
function vanes(p,m,impR,count=12,x=0,width=75){for(let i=0;i<count;i++){const a=i/count*Math.PI*2;const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(impR*.18,impR*.13,impR*.56,impR*.25,impR*.83,impR*.63);shape.lineTo(impR*.86,impR*.75);shape.bezierCurveTo(impR*.62,impR*.26,impR*.22,impR*.21,0,impR*.1);shape.closePath();const geom=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,curveSegments:8});geom.translate(0,0,-width/2);geom.rotateY(Math.PI/2);const blade=mesh(geom,m,p,[x,0,0]);blade.rotation.x=a;}}
function gauge(p,m,x,y,z,R){c(p,m,x,y,z,R,R*.36,'z',48);c(p,material('#f5f6f3',.03,.89),x,y,z+R*.2,R*.82,2,'z',48);c(p,material('#162e48',.24,.4),x,y,z+R*.21,R*.07,4,'z',18);}
// Detalles visuales originales, sin pretender equivalencia OEM ni dimensiones verificadas.
function detailMotor(p,L,D,H,mat,metal,boltsMaterial){
 const y=H*.04;
 // Nervaduras longitudinales, caja de bornes, tapas de rodamiento y bases reforzadas.
 for(let i=0;i<20;i++){const angle=i*Math.PI*2/20;const yy=y+Math.sin(angle)*D*.412,zz=Math.cos(angle)*D*.412;
  const fin=b(p,mat,0,yy,zz,L*.72,Math.max(7,D*.018),Math.max(9,D*.026));
  fin.rotation.x=angle;
 }
 for(const end of [-1,1]){const x=end*L*.435;
  ring(p,metal,x,y,0,D*.36,D*.31,L*.018);
  for(let j=0;j<12;j++){const a=j*Math.PI/6;hex(p,boltsMaterial,x+end*L*.012,y+Math.sin(a)*D*.355,Math.cos(a)*D*.355,D*.013,D*.028)}
 }
 b(p,metal,0,H*.605,0,L*.29,H*.045,D*.47);
 for(let j=0;j<8;j++){const x=-L*.34+j*L*.095;b(p,metal,x,-H*.39,0,L*.023,H*.13,D*.65)}
}
function detailGearbox(p,L,H,W,metal,boltsMaterial){
 // Costuras de carcasa, pernos perimetrales y registros de inspección.
 for(let i=0;i<11;i++){const x=-L*.38+i*L*.076;
  for(const z of [-W*.425,W*.425])hex(p,boltsMaterial,x,H*.365,z,Math.max(5,H*.018),Math.max(5,H*.018),'y');
 }
 for(const z of [-W*.42,W*.42]){b(p,metal,0,H*.04,z,L*.44,H*.26,W*.025);
  for(const x of [-L*.25,L*.25])hex(p,boltsMaterial,x,H*.24,z,Math.max(4,H*.017),Math.max(5,W*.025),'z')}
}
function detailCompressor(p,L,D,H,metal,dark,boltsMaterial){
 const cy=H*.06;
 // Anillos de unión, costura partida y tornillería radial.
 for(const x of [-L*.34,-L*.06,L*.23,L*.35]){
  ring(p,metal,x,cy,0,D*.422,D*.399,L*.015);
  bolts(p,boltsMaterial,24,D*.445,x,'x',Math.max(4,D*.018));
 }
 for(const z of [-D*.40,D*.40]){b(p,dark,0,cy,z,L*.67,D*.020,D*.044);
  for(let i=0;i<12;i++)hex(p,boltsMaterial,-L*.31+i*L*.056,cy,z,D*.012,D*.022,'y');
 }
 for(const x of [-L*.22,L*.25]){c(p,metal,x,H*.52,0,D*.052,H*.12,'y',48);
  ring(p,dark,x,H*.58,0,D*.077,D*.041,D*.021,'y')}
}

export function makeTrainModel(type,p,d,color,source){if(!TRAIN_PARTS.some(x=>x.type===type))return false;
 if(makeV9Model(type,p,d,color,source))return true;
 const L=d.length||900,D=d.diameter||500,H=d.height||D,W=d.width||D,carbon=material(color),steel=material('#b4c1ce'),dark=material('#344657'),brass=material('#b19863'),rubber=material('#334e58',.05,.82),accent=material('#307e90'),bolt=material('#c7d4db');
 switch(type){
 case 'train_turbine':{
  c(p,carbon,0,H*.14,0,D*.35,L*.91);cone(p,steel,-L*.36,H*.14,0,D*.31,D*.43,L*.23);cone(p,carbon,L*.36,H*.14,0,D*.47,D*.32,L*.26);
  for(let i=0;i<8;i++)ring(p,steel,-L*.42+i*L*.12,H*.14,0,D*(.36+i*.005),D*(.325+i*.006),D*.026);
  for(const x of [-L*.43,L*.43])flange(p,dark,x,D*.48,D*.20,D*.04,16);
  feet(p,dark,L,D,-H*.32);nozzle(p,accent,-L*.1,H*.12,0,D*.075,H*.25);labels(p,bolt,L,H,D);break;
 }
 case 'train_motor':{
  c(p,carbon,0,H*.04,0,D*.40,L*.80);heatFins(p,steel,L*.82,D*.42,24);for(const x of [-L*.42,L*.42])flange(p,steel,x,D*.43,D*.22,D*.08,12);
  c(p,steel,L*.53,H*.04,0,D*.10,L*.24);c(p,dark,-L*.52,H*.04,0,D*.31,L*.14);b(p,carbon,0,H*.49,0,L*.31,H*.19,D*.43);feet(p,dark,L,D,-H*.35);detailMotor(p,L,D,H,accent,steel,bolt);break;
 }
 case 'train_gearbox':{
  b(p,carbon,0,0,0,L*.83,H*.74,W*.83);b(p,dark,0,H*.33,0,L*.90,H*.08,W*.88);
  for(const side of [-1,1]){c(p,steel,side*L*.46,0,0,W*.24,L*.09);c(p,steel,side*L*.56,0,0,W*.09,L*.19);flange(p,dark,side*L*.43,W*.31,W*.25,L*.04,12)}
  for(const x of [-L*.33,L*.33])for(const z of [-W*.33,W*.33]){b(p,dark,x,-H*.4,z,L*.10,H*.16,W*.11);hex(p,bolt,x,H*.37,z,H*.032,H*.03,'y')}
  b(p,steel,0,H*.4,0,L*.58,H*.025,W*.46);detailGearbox(p,L,H,W,steel,bolt);break;
 }
 case 'train_compressor':case 'train_compressor_axial':{
  c(p,carbon,0,H*.06,0,D*.41,L*.87);cone(p,carbon,-L*.31,H*.06,0,D*.36,D*.45,L*.14);cone(p,carbon,L*.31,H*.06,0,D*.45,D*.36,L*.14);
  for(const x of [-L*.43,-L*.18,0,L*.18,L*.43]){ring(p,steel,x,H*.06,0,D*.46,D*.36,D*.035);bolts(p,bolt,18,D*.43,x,'x',D*.025)}
  const nozzleR=D*.145;nozzle(p,steel,-L*.24,H*.35,0,nozzleR,H*.41);nozzle(p,steel,L*.23,H*.35,0,nozzleR,H*.39);
  c(p,steel,L*.49,H*.06,0,D*.12,L*.22);feet(p,dark,L,D,-H*.37);b(p,dark,0,-H*.49,0,L*.79,H*.055,D*.83);
  for(let i=0;i<Math.min(12,Math.max(3,d.stages||5));i++){const x=-L*.33+i*(L*.66/Math.max(1,(d.stages||5)-1));ring(p,dark,x,H*.06,0,D*.42,D*.40,D*.015)}
  labels(p,accent,L,H,D);detailCompressor(p,L,D,H,steel,dark,bolt);break;
 }
 case 'train_coupling':{
  c(p,dark,0,0,0,D*.18,L*.94);for(const x of [-L*.36,L*.36]){c(p,steel,x,0,0,D*.33,L*.19);ring(p,carbon,x,0,0,D*.46,D*.19,L*.08);bolts(p,bolt,Math.max(6,Math.min(24,d.bolts||12)),D*.41,x,'x',D*.037)}
  for(const x of [-L*.17,0,L*.17])ring(p,brass,x,0,0,D*.39,D*.22,D*.018);break;
 }
 case 'train_rotor':{
  const stages=Math.min(16,Math.max(1,Math.round(d.stages||6)));c(p,steel,0,0,0,(d.shaft||105)/2,L*.98);for(let i=0;i<stages;i++){const x=-L*.36+i*L*.72/Math.max(1,stages-1);c(p,carbon,x,0,0,D*.48,Math.min(34,L/stages*.15));vanes(p,accent,D*.45,10,x,L/stages*.27);c(p,steel,x,0,0,D*.18,L/stages*.46)}
  for(const x of [-L*.46,L*.46]){ring(p,brass,x,0,0,(d.shaft||105)*.65,(d.shaft||105)*.48,L*.065)}break;
 }
 case 'train_impeller':{c(p,steel,0,0,0,(d.shaft||95)*.55,d.width*.9);c(p,carbon,-d.width*.34,0,0,D*.47,d.width*.19);vanes(p,accent,D*.45,Math.min(30,Math.max(5,d.blades||14)),0,d.width*.55);c(p,carbon,d.width*.36,0,0,D*.39,d.width*.12);break;}
 case 'train_bearing_radial':{c(p,dark,0,0,0,D*.46,L*.70);ring(p,brass,0,0,0,D*.30,D*.20,L*.80);for(const x of [-L*.31,L*.31])ring(p,steel,x,0,0,D*.50,D*.32,L*.045);b(p,carbon,0,-D*.48,0,L*.94,D*.14,d.width*.9);for(const x of [-L*.36,L*.36])for(const z of [-d.width*.30,d.width*.30])hex(p,bolt,x,-D*.54,z,D*.038,D*.055,'y');break;}
 case 'train_bearing_thrust':{const pads=Math.min(16,Math.max(4,d.pads||8));ring(p,dark,0,0,0,D*.5,D*.20,d.thickness);for(let i=0;i<pads;i++){const a=2*Math.PI*i/pads;c(p,brass,d.thickness*.53,Math.sin(a)*D*.335,Math.cos(a)*D*.335,D*.09,d.thickness*.28,'x',10)}ring(p,steel,-d.thickness*.28,0,0,D*.28,D*.20,d.thickness*.18);break;}
 case 'train_mechanical_seal':{c(p,carbon,0,0,0,D*.36,L*.95);for(const x of [-L*.37,-L*.21,0,L*.21,L*.37])ring(p,steel,x,0,0,D*.47,D*.25,L*.06);c(p,brass,0,0,0,(d.shaft||100)*.56,L*1.02);for(const x of [-L*.47,L*.47])flange(p,dark,x,D*.49,D*.28,L*.07,12);break;}
 case 'train_oil_skid':{b(p,dark,0,-H*.44,0,L,H*.11,W);b(p,carbon,-L*.27,-H*.06,0,L*.37,H*.53,W*.68);for(const x of [L*.13,L*.35]){c(p,steel,x,H*.04,0,W*.16,H*.53,'y');c(p,brass,x,H*.36,0,W*.17,H*.12,'y');c(p,accent,x,-H*.19,W*.32,W*.08,L*.24,'z')}for(const x of [-L*.39,L*.39]){nozzle(p,steel,x,H*.24,0,W*.045,H*.24);gauge(p,steel,x,H*.5,W*.27,W*.075)}break;}
 case 'train_seal_panel':{for(const x of [-L*.47,L*.47])b(p,dark,x,0,0,38,H,38);for(const y of [-H*.47,H*.47])b(p,dark,0,y,0,L,34,42);b(p,carbon,0,0,0,L*.82,H*.78,35);for(let i=0;i<5;i++)gauge(p,steel,-L*.34+i*L*.17,H*.28,W*.09,45);for(let i=0;i<4;i++)c(p,brass,-L*.29+i*L*.20,-H*.10,W*.10,28,65,'z');break;}
 case 'train_cooler':{c(p,carbon,0,0,0,D*.46,L*.78);for(const x of [-L*.37,L*.37])flange(p,steel,x,D*.51,D*.37,L*.038,16);for(const z of [-D*.29,D*.29])b(p,dark,0,-H*.39,z,L*.67,H*.13,D*.10);nozzle(p,steel,-L*.16,D*.42,0,D*.12,H*.30);break;}
 case 'train_base':{for(const z of [-W*.44,W*.44]){b(p,dark,0,0,z,L,H*.60,W*.12);for(const x of [-L*.40,L*.40])b(p,steel,x,H*.36,z,L*.07,H*.17,W*.16)}for(let i=0;i<9;i++){const x=-L*.43+i*L*.86/8;b(p,carbon,x,H*.02,0,L*.018,H*.45,W*.95)}break;}
 case 'train_pedestal':{b(p,dark,0,-H*.42,0,L,H*.16,W);b(p,carbon,0,-H*.02,0,L*.69,H*.70,W*.73);b(p,steel,0,H*.38,0,L*.83,H*.10,W*.82);for(const x of [-L*.40,L*.40])for(const z of [-W*.40,W*.40])hex(p,bolt,x,-H*.47,z,25,32,'y');break;}
 case 'train_nozzle':{const r=D*.5,wall=Math.min(r*.6,d.wall||16);ring(p,carbon,0,0,0,r,r-wall,L*.91);flange(p,steel,L*.45,(d.flange||D*1.4)/2,r-wall,D*.11,12);break;}
 case 'train_instrument':{c(p,carbon,0,0,0,D*.5,L*.80);c(p,steel,L*.41,0,0,D*.65,L*.07);b(p,dark,0,-H*.48,0,D*.46,H*.44,D*.45);c(p,brass,L*.49,0,0,D*.2,L*.27);break;}
 case 'custom_mesh':{if(source?.asset?.geometry){const geo=new THREE.BufferGeometryLoader().parse(source.asset.geometry);mesh(geo,carbon,p)}else b(p,carbon,0,0,0,d.length||200,d.height||200,d.width||200);break;}
 case 'solid_block':b(p,carbon,0,0,0,L,H,W);break;
 case 'solid_cylinder':c(p,carbon,0,0,0,D*.5,L);break;
 case 'solid_sphere':mesh(new THREE.SphereGeometry(D*.5,48,28),carbon,p);break;
 }
 return true;
}