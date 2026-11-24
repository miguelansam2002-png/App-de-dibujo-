// Motor B-Rep en Worker: no bloquea los gestos del visor.
// Representación matemática de sólidos OCCT; la malla STL sólo sirve para previsualizar.
import initOpenCascade from 'replicad-opencascadejs/src/replicad_single.js';
import wasmURL from 'replicad-opencascadejs/src/replicad_single.wasm?url';
import * as CAD from 'replicad';
import {validateCadSpec,validateCadPayload} from './cad-schema.js';
let bootPromise=null;
async function boot(){
 if(!bootPromise)bootPromise=initOpenCascade({locateFile:()=>wasmURL}).then(oc=>{CAD.setOC(oc);return true}).catch(e=>{bootPromise=null;throw e});
 return bootPromise;
}
const asBlob=bytes=>new Blob([bytes],{type:'model/step'});
function makeSolid(raw){
 const d=validateCadSpec(raw);let solid;
 if(d.kind==='box')solid=CAD.makeBaseBox(d.length,d.width,d.height);
 if(d.kind==='cylinder')solid=CAD.makeCylinder(d.diameter/2,d.height);
 if(d.kind==='drilledPlate'){
  const a=CAD.makeBaseBox(d.length,d.width,d.height);
  const tool=CAD.makeCylinder(d.holeDiameter/2,d.height+2).translate([d.length/2,d.width/2,-1]);
  solid=a.cut(tool);a.delete?.();tool.delete?.();
 }
 if(d.kind==='pipe'){
  const outer=CAD.makeCylinder(d.diameter/2,d.length);
  const inner=CAD.makeCylinder(d.diameter/2-d.wall,d.length+2).translate([0,0,-1]);
  solid=outer.cut(inner);outer.delete?.();inner.delete?.();
 }
 if(!solid)throw Error('No se ha podido generar el sólido');return solid;
}
async function readSolid(raw){
 if(!raw||!raw.byteLength)throw Error('STEP vacío');
 return CAD.importSTEP(asBlob(raw));
}
function translateToWorld(shape,transform){
 if(!transform)return shape;
 const {center=[0,0,0],pos=[0,0,0],rot=[0,0,0]}=transform;
 if(rot.some(x=>Math.abs(x)>1e-6))throw Error('Para operaciones entre sólidos STEP, coloca rotación XYZ en 0°; la rotación B-Rep será la siguiente mejora');
 const offset=pos.map((x,i)=>Number(x||0)-Number(center[i]||0));
 return shape.translate(offset);
}
async function serializeShape(shape,includeStep=true){
 // STEP conserva B-Rep. STL binario se usa sólo como representación de pantalla.
 const stl=shape.blobSTL({binary:true,tolerance:.18,angularTolerance:12});
 const step=includeStep?shape.blobSTEP():null;
 const stlBuffer=await stl.arrayBuffer();const stepBuffer=step?await step.arrayBuffer():null;
 if(!stlBuffer.byteLength||stepBuffer&&!stepBuffer.byteLength)throw Error('El sólido CAD no produjo datos exportables');
 return {stl:stlBuffer,step:stepBuffer,hasExactBRep:!!stepBuffer};
}
async function evaluate(job){
 validateCadPayload(job);await boot();
 if(job.action==='create'){const shape=makeSolid(job.spec);try{return await serializeShape(shape)}finally{shape.delete?.()}}
 if(job.action==='import'){const shape=await readSolid(job.bytes);try{return await serializeShape(shape)}finally{shape.delete?.()}}
 if(job.action==='export'){
  // No se exporta desde triángulos. Se reabre el B-Rep STEP almacenado.
  const s=await readSolid(job.bytes);
  try{const transformed=translateToWorld(s,job.transform);const out=await transformed.blobSTEP().arrayBuffer();if(transformed!==s)transformed.delete?.();return {step:out}}
  finally{s.delete?.()}
 }
 if(job.action==='boolean'){
  const a=await readSolid(job.left.bytes),b=await readSolid(job.right.bytes);
  let left=a,right=b,merged=null;
  try{
   left=translateToWorld(a,job.left.transform);right=translateToWorld(b,job.right.transform);
   merged=job.operation==='fuse'?left.fuse(right):job.operation==='cut'?left.cut(right):left.intersect(right);
   return await serializeShape(merged);
  }finally{merged?.delete?.();if(left!==a)left.delete?.();if(right!==b)right.delete?.();a.delete?.();b.delete?.()}
 }
 throw Error('Operación CAD desconocida');
}
self.onmessage=async e=>{
 const {id,...job}=e.data||{};
 try{
  const result=await evaluate(job),transfer=[];
  if(result.stl)transfer.push(result.stl);
  if(result.step)transfer.push(result.step);
  self.postMessage({id,ok:true,result},transfer);
 }catch(error){self.postMessage({id,ok:false,error:String(error?.message||error)})}
};