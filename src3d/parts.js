import * as THREE from 'three';

// Geometrías originales y paramétricas. Todas las dimensiones se expresan en milímetros.
export const CATALOG = [
 {type:'pipe',label:'Tubería recta',category:'Tuberías',icon:'━',hint:'Tubo hueco',dims:{length:900,diameter:160,wall:8},color:'#81bbd5'},
 {type:'elbow',label:'Codo 90°',category:'Tuberías',icon:'⌒',hint:'Curva 90°',dims:{radius:220,diameter:160},color:'#90c5de'},
 {type:'tee',label:'Conexión T',category:'Tuberías',icon:'⊥',hint:'Unión conceptual',dims:{length:580,branch:360,diameter:120},color:'#8fb9d1'},
 {type:'flange',label:'Brida',category:'Tuberías',icon:'◉',hint:'Con tornillería',dims:{diameter:245,bore:140,thickness:25,bolts:8},color:'#b2c3d3'},
 {type:'valve',label:'Válvula',category:'Tuberías',icon:'⊗',hint:'Válvula manual',dims:{length:310,diameter:115,height:230},color:'#6dbba9'},
 {type:'clamp_u',label:'Grapa tipo U',category:'Fijaciones',icon:'∩',hint:'Varilla y tuercas',dims:{width:190,height:260,rod:16},color:'#c0cddb'},
 {type:'clamp_omega',label:'Grapa omega',category:'Fijaciones',icon:'Ω',hint:'Abrazadera',dims:{width:190,height:135,rod:18},color:'#becdde'},
 {type:'bolt',label:'Perno y tuerca',category:'Fijaciones',icon:'⚙',hint:'Fijación',dims:{length:140,diameter:22,head:38},color:'#c3ccd5'},
 {type:'support',label:'Soporte tubería',category:'Estructuras',icon:'⊓',hint:'Base y columnas',dims:{width:400,height:350,depth:280,plate:18},color:'#8da7be'},
 {type:'profile',label:'Perfil I',category:'Estructuras',icon:'Ⅰ',hint:'Viga metálica',dims:{length:850,height:220,width:120,thickness:14},color:'#7f9fbb'},
 {type:'plate',label:'Placa perforada',category:'Estructuras',icon:'▤',hint:'4 perforaciones',dims:{length:430,width:280,thickness:22,hole:28},color:'#b6c8d2'},
 {type:'box',label:'Caja industrial',category:'Estructuras',icon:'▣',hint:'Caja sin tapa',dims:{length:1150,width:600,height:460,wall:22},color:'#bc9469'},
 {type:'tank',label:'Tanque vertical',category:'Equipos',icon:'◯',hint:'Recipiente básico',dims:{diameter:550,height:1100},color:'#8cb0c3'},
 {type:'shaft',label:'Eje mecánico',category:'Equipos',icon:'═',hint:'Eje cilíndrico',dims:{length:1250,diameter:95},color:'#b1becd'},
 {type:'rotor',label:'Rotor 10 discos',category:'Equipos',icon:'≡',hint:'10 impulsores',dims:{length:1250,shaft:80,disc:360,discs:10},color:'#b1c2cf'},
 {type:'pump',label:'Bomba simple',category:'Equipos',icon:'⬡',hint:'Bloque conceptual',dims:{length:460,width:270,height:300},color:'#84a7ba'}
];
export const DIMENSION_NAMES={length:'Longitud',diameter:'Diámetro exterior',wall:'Espesor',radius:'Radio central',branch:'Ramal',bore:'Diámetro interior',thickness:'Espesor',bolts:'Nº pernos',width:'Ancho',height:'Alto',rod:'Diámetro varilla',head:'Cabeza',depth:'Fondo',plate:'Espesor placa',hole:'Diámetro agujero',shaft:'Diámetro eje',disc:'Diámetro discos',discs:'Nº de discos'};
export const INTEGER_DIMS = new Set(['bolts','discs']);
export function partDefinition(type){return CATALOG.find(p=>p.type===type)}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(v))?Number(v):min));
function box(g,mat,parent,w,h,d,x=0,y=0,z=0){const o=new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,.5),Math.max(h,.5),Math.max(d,.5)),mat);o.position.set(x,y,z);parent.add(o);return o}
function cyl(g,mat,parent,r,h,x=0,y=0,z=0,axis='y',radial=24){const o=new THREE.Mesh(new THREE.CylinderGeometry(Math.max(r,.5),Math.max(r,.5),Math.max(h,.5),radial),mat);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;o.position.set(x,y,z);parent.add(o);return o}
function lineTube(parent,points,r,mat){const curve=new THREE.CatmullRomCurve3(points);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(18,points.length*4),Math.max(1,r),12,false),mat);parent.add(mesh);return mesh}
function hollowPipe(parent,L,D,W,mat){const R=Math.max(2,D/2),inside=Math.max(.5,R-Math.min(W,R*.9));const points=[new THREE.Vector2(inside,-L/2),new THREE.Vector2(R,-L/2),new THREE.Vector2(R,L/2),new THREE.Vector2(inside,L/2),new THREE.Vector2(inside,-L/2)];const geo=new THREE.LatheGeometry(points,32);geo.rotateZ(-Math.PI/2);const mesh=new THREE.Mesh(geo,mat);parent.add(mesh);return mesh}
function ring(parent,R,inner,thickness,mat,boltCount=0,holeRadius=0){const shape=new THREE.Shape();shape.absarc(0,0,R,0,Math.PI*2,false);const center=new THREE.Path();center.absarc(0,0,Math.max(1,inner),0,Math.PI*2,true);shape.holes.push(center);if(boltCount){const pitch=(R+inner)/2;for(let i=0;i<boltCount;i++){const a=i*Math.PI*2/boltCount;const p=new THREE.Path();p.absarc(Math.cos(a)*pitch,Math.sin(a)*pitch,Math.min(holeRadius,(R-inner)*.22),0,Math.PI*2,true);shape.holes.push(p)}}const geo=new THREE.ExtrudeGeometry(shape,{depth:Math.max(1,thickness),bevelEnabled:false,curveSegments:32});geo.translate(0,0,-thickness/2);geo.rotateY(Math.PI/2);const m=new THREE.Mesh(geo,mat);parent.add(m);return m}
function hex(parent,r,length,mat,axis='y',x=0,y=0,z=0){return cyl(null,mat,parent,r,length,x,y,z,axis,6)}
export function makePart(data){const def=partDefinition(data.type);if(!def)throw new Error('Componente no soportado: '+data.type);const d={...def.dims,...data.dims};for(const k of Object.keys(d))d[k]=clamp(d[k],INTEGER_DIMS.has(k)?1:1,INTEGER_DIMS.has(k)?32:15000);const L=d.length||300,D=d.diameter||100;const group=new THREE.Group();group.name=data.name||def.label;group.userData.partId=data.id;const mat=new THREE.MeshStandardMaterial({color:data.color||def.color,metalness:.55,roughness:.38,side:THREE.DoubleSide});const dark=new THREE.MeshStandardMaterial({color:'#263949',metalness:.48,roughness:.58});const silver=new THREE.MeshStandardMaterial({color:'#dae1e6',metalness:.62,roughness:.3});
 switch(data.type){
 case 'pipe': hollowPipe(group,L,D,d.wall,mat);break;
 case 'elbow':{const points=[];for(let i=0;i<=22;i++){const a=Math.PI*.5*i/22;points.push(new THREE.Vector3(d.radius*Math.sin(a),0,d.radius*(1-Math.cos(a))))}lineTube(group,points,D/2,mat);break}
 case 'tee':hollowPipe(group,L,D,Math.max(4,D*.09),mat);{const pipe=hollowPipe(group,d.branch,D,Math.max(4,D*.09),mat);pipe.rotation.z=Math.PI/2;pipe.position.y=d.branch/2;}break;
 case 'flange':ring(group,D/2,d.bore/2,d.thickness,mat,Math.round(d.bolts),Math.max(4,d.thickness*.28));break;
 case 'valve':hollowPipe(group,L,D,Math.max(5,D*.1),mat);cyl(null,mat,group,D*.63,D*.72,0,0,0);cyl(null,silver,group,12,d.height*.65,0,d.height*.38,0);{const wheel=new THREE.Mesh(new THREE.TorusGeometry(D*.45,8,10,32),silver);wheel.rotation.x=Math.PI/2;wheel.position.y=d.height*.74;group.add(wheel)}break;
 case 'clamp_u':{const r=d.width/2;const arr=[new THREE.Vector3(-r,-d.height/2,0),new THREE.Vector3(-r,d.height*.07,0)];for(let i=0;i<=16;i++){const a=Math.PI-i*Math.PI/16;arr.push(new THREE.Vector3(r*Math.cos(a),d.height*.07+r*Math.sin(a),0))}arr.push(new THREE.Vector3(r,-d.height/2,0));lineTube(group,arr,d.rod/2,mat);for(const x of [-r,r]){hex(group,d.rod*.9,d.rod*.9,silver,'y',x,-d.height*.32,0);cyl(null,dark,group,d.rod*.9,5,x,-d.height*.39,0)}break}
 case 'clamp_omega':{const r=d.width/2;const arr=[new THREE.Vector3(-r*1.4,-d.height*.5,0),new THREE.Vector3(-r,-d.height*.5,0)];for(let i=0;i<=16;i++){const a=Math.PI-i*Math.PI/16;arr.push(new THREE.Vector3(r*Math.cos(a),-d.height*.5+r*Math.sin(a),0))}arr.push(new THREE.Vector3(r*1.4,-d.height*.5,0));lineTube(group,arr,d.rod/2,mat);for(const x of [-r*1.22,r*1.22])cyl(null,dark,group,d.rod*.6,d.rod*.8,x,-d.height*.5,0,'z');break}
 case 'bolt':cyl(null,mat,group,d.diameter/2,d.length);hex(group,d.head/2,d.head*.45,silver,'y',0,d.length/2+d.head*.22,0);hex(group,d.head*.52,d.head*.45,dark,'y',0,-d.length*.3,0);break;
 case 'support':box(null,mat,group,d.width,d.plate,d.depth,0,-d.height/2,0);for(const x of [-d.width*.35,d.width*.35])box(null,mat,group,d.plate,d.height-d.plate,d.plate,x,0,0);box(null,mat,group,d.width*.83,d.plate*1.5,d.depth*.5,0,d.height/2-d.plate,0);break;
 case 'profile':{box(null,mat,group,L,d.thickness,d.width,0,-d.height/2+d.thickness/2,0);box(null,mat,group,L,d.height-d.thickness*2,d.thickness);box(null,mat,group,L,d.thickness,d.width,0,d.height/2-d.thickness/2,0);break}
 case 'plate':{const S=new THREE.Shape();const l=L/2,w=d.width/2;S.moveTo(-l,-w);S.lineTo(l,-w);S.lineTo(l,w);S.lineTo(-l,w);S.closePath();for(const x of [-L*.35,L*.35])for(const z of [-d.width*.3,d.width*.3]){const hole=new THREE.Path();hole.absarc(x,z,d.hole/2,0,Math.PI*2,true);S.holes.push(hole)}const geo=new THREE.ExtrudeGeometry(S,{depth:d.thickness,bevelEnabled:false});geo.translate(0,0,-d.thickness/2);geo.rotateX(-Math.PI/2);group.add(new THREE.Mesh(geo,mat));break}
 case 'box':{const W=d.width,H=d.height,t=Math.min(d.wall,W*.2,H*.2);box(null,mat,group,L,t,W,0,-H/2+t/2,0);for(const x of [-L/2+t/2,L/2-t/2])box(null,mat,group,t,H,W,x,0,0);for(const z of [-W/2+t/2,W/2-t/2])box(null,mat,group,L-2*t,H,t,0,0,z);break}
 case 'tank':cyl(null,mat,group,D/2,d.height);cyl(null,dark,group,D*.28,25,0,-d.height*.5,0);cyl(null,mat,group,D*.22,33,0,d.height*.5,0);break;
 case 'shaft':cyl(null,mat,group,D/2,L,0,0,0,'x');break;
 case 'rotor':{cyl(null,silver,group,d.shaft/2,L,0,0,0,'x');const N=Math.round(d.discs);for(let i=0;i<N;i++){const x=-L*.42+i*(L*.84/Math.max(1,N-1));cyl(null,mat,group,d.disc/2,Math.min(35,L/N*.28),x,0,0,'x')}break}
 case 'pump':box(null,dark,group,L,d.height*.18,d.width,0,-d.height*.48,0);cyl(null,mat,group,d.height*.35,L*.7,0,d.height*.08,0,'x');box(null,mat,group,L*.3,d.height*.46,d.width*.65,L*.25,d.height*.02,0);cyl(null,silver,group,d.height*.1,L*.25,-L*.49,d.height*.08,0,'x');break;
 }
 group.userData.parametric=true;return group;
}
export function releasePart(group){group.traverse(obj=>{if(obj.isMesh){obj.geometry?.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material?.dispose()}})}
export function standardPart(type,index=0){const def=partDefinition(type);return {id:'part-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),type,name:def.label,dims:{...def.dims},pos:[Math.round(index%3)*370,0,Math.floor(index/3)*300],rot:[0,0,0],color:def.color}}