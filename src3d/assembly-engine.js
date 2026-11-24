/** Trazo Tecnico V8: geometry-driven rigid assembly constraints. Units: mm, angles: degrees. */
import * as THREE from 'three';
import {portsFor} from './connections.js';

const V=a=>new THREE.Vector3(...a);
const round=n=>Math.round(n*1e5)/1e5;
const cleanVec=v=>v.toArray().map(round);
const radians=THREE.MathUtils.degToRad;
const quat=p=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.rot||[0,0,0]).map(radians),'XYZ'));
const validNumber=n=>Number.isFinite(n)&&Math.abs(n)<=1000000;
const bounded=(n,limit=100000)=>Number.isFinite(Number(n))?Math.max(-limit,Math.min(limit,Number(n))):0;
export const CONSTRAINT_KINDS=Object.freeze([
 {id:'fixed',label:'Fijacion rigida',description:'Conserva posicion y rotacion relativas al conjunto.'},
 {id:'coaxial',label:'Ejes concentricos',description:'Alinea dos ejes, con separacion y giro axial configurables.'},
 {id:'face',label:'Caras coincidentes',description:'Alinea dos planos enfrentados, con separacion conocida.'},
 {id:'parallel',label:'Ejes paralelos',description:'Mantiene orientaciones paralelas y referencias coincidentes.'},
 {id:'distance',label:'Separacion fija',description:'Mantiene una distancia entre anclajes con orientacion estable.'},
 {id:'angle',label:'Angulo de montaje',description:'Inclina el eje del hijo respecto al eje del objetivo.'}
]);

/** Generic reference faces supplement real part connectors; not manufacturer-certified features. */
export function referenceAnchors(part){
 const d=part?.dims||{};
 const L=Math.max(1,Number(d.length)||200),H=Math.max(1,Number(d.height)||Number(d.diameter)||200),W=Math.max(1,Number(d.width)||Number(d.diameter)||200);
 const make=(id,label,position,normal,kind='plane',diameter=0)=>({id,label,position,normal,kind,diameter});
 const base=[
  make('ref:center','Origen local',[0,0,0],[1,0,0],'origin'),
  make('ref:x+','Cara +X',[L/2,0,0],[1,0,0]),
  make('ref:x-','Cara -X',[-L/2,0,0],[-1,0,0]),
  make('ref:y+','Cara +Y',[0,H/2,0],[0,1,0]),
  make('ref:y-','Cara -Y',[0,-H/2,0],[0,-1,0]),
  make('ref:z+','Cara +Z',[0,0,W/2],[0,0,1]),
  make('ref:z-','Cara -Z',[0,0,-W/2],[0,0,-1])
 ];
 for(const port of portsFor(part)){base.push({...port,id:'port:'+port.id,label:port.label+' · conector'})}
 return base;
}
export const anchorById=(part,id)=>referenceAnchors(part).find(a=>a.id===id);

function frameQuaternion(normal){
 const z=V(normal).normalize();
 let y=new THREE.Vector3(0,1,0).addScaledVector(z,-z.y);
 if(y.lengthSq()<1e-7)y=new THREE.Vector3(0,0,1).addScaledVector(z,-z.z);
 y.normalize();const x=y.clone().cross(z).normalize();y=z.clone().cross(x).normalize();
 return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
}
export function worldAnchor(part,anchor){
 const orientation=quat(part),position=V(part.pos||[0,0,0]).add(V(anchor.position).applyQuaternion(orientation));
 const normal=V(anchor.normal).applyQuaternion(orientation).normalize();
 return {position,normal,orientation:orientation.clone().multiply(frameQuaternion(anchor.normal))};
}
export function normalizeConstraint(data){
 if(!data||typeof data!=='object'||!CONSTRAINT_KINDS.some(x=>x.id===data.kind)||typeof data.targetId!=='string'||data.targetId.length>90)return undefined;
 const ownAnchor=String(data.ownAnchor||'ref:center').slice(0,60),targetAnchor=String(data.targetAnchor||'ref:center').slice(0,60);
 const result={kind:data.kind,targetId:data.targetId,ownAnchor,targetAnchor,offset:bounded(data.offset,50000),twist:bounded(data.twist,360),angle:bounded(data.angle,180)};
 if(data.kind==='fixed'||data.kind==='distance'){
  if(Array.isArray(data.relPos)&&data.relPos.length===3&&data.relPos.every(validNumber))result.relPos=data.relPos.map(round);
  if(Array.isArray(data.relQuat)&&data.relQuat.length===4&&data.relQuat.every(validNumber))result.relQuat=data.relQuat.map(round);
 }
 return result;
}
export function assertNoCycle(parts,childId,targetId){
 if(childId===targetId)throw Error('No se puede conectar una pieza consigo misma');
 const lookup=new Map(parts.map(p=>[p.id,p]));
 let p=lookup.get(targetId),steps=0;
 while(p&&steps++<=parts.length){if(p.id===childId)throw Error('La conexion crearia una dependencia circular');p=lookup.get(p.constraint?.targetId||p.joint?.targetId)}
 if(steps>parts.length)throw Error('El conjunto contiene un ciclo de dependencias');
}
/** Creates a persistent constraint object. A fixed mate captures an exact relative transform. */
export function createConstraint(parts,childId,targetId,{kind='coaxial',ownAnchor='ref:center',targetAnchor='ref:center',offset=0,twist=0,angle=0}={}){
 const child=parts.find(p=>p.id===childId),target=parts.find(p=>p.id===targetId);
 if(!child||!target)throw Error('Selecciona dos piezas existentes');
 assertNoCycle(parts,childId,targetId);
 const own=anchorById(child,ownAnchor),other=anchorById(target,targetAnchor);
 if(!own||!other)throw Error('El punto de referencia ya no existe');
 const constraint=normalizeConstraint({kind,targetId,ownAnchor,targetAnchor,offset,twist,angle});
 if(!constraint)throw Error('Tipo de restriccion desconocido');
 if(kind==='fixed'||kind==='distance'){
  const inverse=quat(target).invert();
  constraint.relPos=cleanVec(V(child.pos).sub(V(target.pos)).applyQuaternion(inverse));
  const q=inverse.multiply(quat(child)).normalize();constraint.relQuat=[q.x,q.y,q.z,q.w].map(round);
 }
 return constraint;
}

/** Solve child from parent, always in world coordinates; deterministic after reload. */
export function solveConstraint(child,parent,raw){
 const mate=normalizeConstraint(raw);if(!mate||mate.targetId!==parent.id)return null;
 const own=anchorById(child,mate.ownAnchor),target=anchorById(parent,mate.targetAnchor);
 if(!own||!target)return null;
 const parentQ=quat(parent);
 const qChild=new THREE.Quaternion();const worldTarget=worldAnchor(parent,target);
 if(mate.kind==='fixed'||mate.kind==='distance'){
  if(!mate.relPos||!mate.relQuat)return null;
  qChild.copy(parentQ).multiply(new THREE.Quaternion(...mate.relQuat)).normalize();
  const local=V(mate.relPos);
  const pos=V(parent.pos).add(local.applyQuaternion(parentQ));
  if(mate.kind==='distance'){
   // Signed clearance along the parent's reference normal. This value changes without drifting the original pose.
   pos.addScaledVector(worldTarget.normal,mate.offset);
  }
  return {pos:cleanVec(pos),rot:quatToEuler(qChild)};
 }
 const flip=(mate.kind==='parallel')?new THREE.Quaternion():new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
 const twist=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),radians(mate.twist));
 const tilt=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),radians(mate.kind==='angle'?mate.angle:0));
 const ownFrame=frameQuaternion(own.normal);
 qChild.copy(worldTarget.orientation).multiply(flip).multiply(tilt).multiply(twist).multiply(ownFrame.invert()).normalize();
 const point=worldTarget.position.clone().addScaledVector(worldTarget.normal,mate.offset);
 const pos=point.sub(V(own.position).applyQuaternion(qChild));
 return {pos:cleanVec(pos),rot:quatToEuler(qChild)};
}
function quatToEuler(q){const e=new THREE.Euler().setFromQuaternion(q,'XYZ');return [e.x,e.y,e.z].map(x=>round(THREE.MathUtils.radToDeg(x)))}

/** Mutates model coordinates consistently, rejecting missing targets or cycles. Does not delete persisted constraints. */
export function solveAssembly(parts){
 const lookup=new Map(parts.map(p=>[p.id,p])),visited=new Set(),visiting=new Set(),errors=[];
 function visit(p){
  if(visited.has(p.id))return;
  if(visiting.has(p.id)){errors.push(`Ciclo en ${p.name||p.id}`);return}
  visiting.add(p.id);
  if(p.constraint){const target=lookup.get(p.constraint.targetId);
   if(!target||target===p){errors.push(`Referencia no valida: ${p.name||p.id}`)}
   else if(visiting.has(target.id)){errors.push(`Ciclo de ensamblaje: ${p.name||p.id}`)}
   else{visit(target);const pose=solveConstraint(p,target,p.constraint);
    if(pose){p.pos=pose.pos;p.rot=pose.rot}else errors.push(`Restriccion incompatible: ${p.name||p.id}`)}
  }
  visiting.delete(p.id);visited.add(p.id);
 }
 parts.forEach(visit);return {parts,errors};
}
export function descendants(parts,id){const children=[],seen=new Set([id]);let changed=true;
 while(changed){changed=false;for(const p of parts){const parentId=p.constraint?.targetId||p.joint?.targetId;if(parentId&&seen.has(parentId)&&!seen.has(p.id)){seen.add(p.id);children.push(p);changed=true}}}
 return children;
}
export function shiftRigidGroup(parts,partId,delta,{includeAssembly=true}={}){
 const selected=parts.find(p=>p.id===partId);if(!selected)throw Error('Pieza no encontrada');
 const own=includeAssembly&&selected.assemblyId?parts.filter(p=>p.assemblyId===selected.assemblyId):[selected,...descendants(parts,partId)];
 const groupIds=new Set(own.map(x=>x.id));const roots=own.filter(p=>!groupIds.has(p.constraint?.targetId||p.joint?.targetId));
 if(!delta.every(x=>Number.isFinite(x)&&Math.abs(x)<=100000))throw Error('Desplazamiento no valido');
 for(const p of roots)p.pos=p.pos.map((v,i)=>round(v+delta[i]));
 // Free members in the same train have to move as a block, and linked children resolve from their parent.
 solveAssembly(parts);
 return own.length;
}