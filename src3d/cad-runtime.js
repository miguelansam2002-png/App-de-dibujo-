// Puente principal: aislamiento y cierre controlado del motor CAD WASM.
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {geometryAsAsset} from './mesh-tools.js';
import {validateCadSpec,safeStepFilename} from './cad-schema.js';
let worker=null,serial=0;const jobs=new Map();
function ensure(){
 if(worker)return worker;
 worker=new Worker(new URL('./cad-worker.js',import.meta.url),{type:'module'});
 worker.onmessage=event=>{const {id,ok,result,error}=event.data;const job=jobs.get(id);if(!job)return;jobs.delete(id);ok?job.resolve(result):job.reject(Error(error||'Error CAD'))};
 worker.onerror=error=>{for(const job of jobs.values())job.reject(Error(error.message||'Fallo del motor CAD'));jobs.clear();worker?.terminate();worker=null};
 return worker;
}
function send(action,payload={},timeout=180000){
 const id=++serial;return new Promise((resolve,reject)=>{const timeoutId=setTimeout(()=>{jobs.delete(id);worker?.terminate();worker=null;reject(Error('El motor CAD no respondió; prueba con un archivo más sencillo'))},timeout);
  jobs.set(id,{resolve:v=>{clearTimeout(timeoutId);resolve(v)},reject:e=>{clearTimeout(timeoutId);reject(e)}});
  try{ensure().postMessage({id,action,...payload})}catch(e){clearTimeout(timeoutId);jobs.delete(id);reject(e)}
 });
}
function encode(bytes){let parts=[];for(let i=0;i<bytes.length;i+=0x6000)parts.push(String.fromCharCode(...bytes.subarray(i,i+0x6000)));return btoa(parts.join(''))}
function decode(base64){const raw=atob(String(base64||'')),buf=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)buf[i]=raw.charCodeAt(i);return buf.buffer}
function toModel(result,source){
 if(!result.stl||!result.step)throw Error('No se recibieron geometrías CAD');
 const parsed=new STLLoader().parse(result.stl),mesh=geometryAsAsset(parsed,'mm');parsed.dispose();
 return {...mesh,sourceFormat:'STEP',stepSource:encode(new Uint8Array(result.step)),spec:source};
}
export async function cadCreate(spec){const clean=validateCadSpec(spec),result=await send('create',{spec:clean});return toModel(result,clean)}
export async function cadImport(file){if(!file||!(/\.(step|stp)$/i).test(file.name))throw Error('Selecciona un archivo STEP o STP');if(file.size>45*1024*1024)throw Error('STEP superior a 45 MB');return toModel(await send('import',{bytes:await file.arrayBuffer()}),{kind:'importSTEP',fileName:file.name})}
export async function cadBoolean(a,b,operation){if(!a?.cad?.stepSource||!b?.cad?.stepSource)throw Error('Selecciona dos piezas B-Rep creadas o importadas desde STEP');
 const payload={operation,left:{bytes:decode(a.cad.stepSource),transform:{pos:a.pos,rot:a.rot,center:a.cad.origin||[0,0,0]}},right:{bytes:decode(b.cad.stepSource),transform:{pos:b.pos,rot:b.rot,center:b.cad.origin||[0,0,0]}}};
 return toModel(await send('boolean',payload),{kind:'boolean',operation,inputs:[a.name,b.name]});
}
export async function cadExport(part){if(!part?.cad?.stepSource)throw Error('Esta pieza no contiene un B-Rep editable. Los modelos STL/GLB no son STEP');
 const result=await send('export',{bytes:decode(part.cad.stepSource),transform:{pos:part.pos,rot:part.rot,center:part.cad.origin||[0,0,0]}});
 return {blob:new Blob([result.step],{type:'application/step'}),name:safeStepFilename(part.name)};
}
export function cadStop(){worker?.terminate();worker=null;for(const job of jobs.values())job.reject(Error('Motor CAD reiniciado'));jobs.clear()}