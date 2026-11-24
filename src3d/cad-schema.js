// Contrato puro de geometría B-Rep. Todos los valores se expresan en mm.
export const CAD_SCHEMA_VERSION=1;
export const CAD_SOLIDS={
 box:{label:'Bloque extruido',fields:['length','width','height'],defaults:{length:400,width:240,height:110}},
 cylinder:{label:'Cilindro extruido',fields:['diameter','height'],defaults:{diameter:180,height:280}},
 drilledPlate:{label:'Placa perforada',fields:['length','width','height','holeDiameter'],defaults:{length:420,width:260,height:24,holeDiameter:58}},
 pipe:{label:'Tubería hueca',fields:['diameter','wall','length'],defaults:{diameter:114.3,wall:6.02,length:600}},
};
const MAX=50000,MIN=.01;
export function validateCadSpec(spec){
 if(!spec||typeof spec!=='object'||!Object.hasOwn(CAD_SOLIDS,spec.kind))throw Error('Geometría CAD no reconocida');
 const desc=CAD_SOLIDS[spec.kind],result={kind:spec.kind};
 for(const k of desc.fields){const v=Number(spec[k]??desc.defaults[k]);if(!Number.isFinite(v)||v<MIN||v>MAX)throw Error(`${k}: introduce una medida entre 0,01 y 50.000 mm`);result[k]=v}
 if(result.holeDiameter&&result.holeDiameter>=Math.min(result.length,result.width)*.94)throw Error('El agujero excede el tamaño de la placa');
 if(result.wall&&result.wall>=result.diameter/2)throw Error('El espesor debe ser inferior al radio');
 return result;
}
export function validateCadPayload(job){
 if(!job||!['create','import','boolean','export'].includes(job.action))throw Error('Operación CAD no reconocida');
 if(job.action==='create')validateCadSpec(job.spec);
 if(job.action==='import'&&!(job.bytes instanceof ArrayBuffer))throw Error('Archivo STEP vacío');
 if(job.action==='boolean'&&!['fuse','cut','intersect'].includes(job.operation))throw Error('Operación B-Rep inválida');
 return true;
}
export function safeStepFilename(name='pieza.step'){
 const clean=String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,80).replace(/\.+/g,'.');
 return (clean||'pieza').replace(/\.(step|stp)$/i,'')+'.step';
}