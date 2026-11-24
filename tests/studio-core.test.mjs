import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanProject,billOfMaterials,bomToCsv,groupByAssembly,aabbGap,uniqueItemIds,assemblySummary} from '../src3d/studio-core.js';
import {TRAIN_PRESETS,buildTrainPreset} from '../src3d/train-presets.js';

const part=(type,i)=>({id:`part-${i}`,type,name:type,dims:{length:100,diameter:90},pos:[0,0,0],rot:[0,0,0],color:'#8799aa'});
test('trenes de compresión contienen conjuntos identificados y sin duplicados',()=>{
 assert.equal(TRAIN_PRESETS.length,3);
 for(const preset of TRAIN_PRESETS){const result=buildTrainPreset(preset.id,part);assert.ok(result.items.length>=8);assert.ok(uniqueItemIds(result.items));assert.ok(result.items.every(x=>x.assemblyId===result.id&&x.metadata?.validation==='CONCEPTUAL'));assert.ok(result.items.some(p=>p.type==='train_compressor'));assert.ok(result.items.some(p=>p.type==='train_base'));}
});
test('proyectos antiguos siguen siendo compatibles y preservan metadatos',()=>{
 const original={format:'trazo-tecnico-3d',version:5,name:'Ensayo',items:[part('pipe',0)],meta:{id:'proyecto-a',category:'Compresión',notes:'Revisión'}};
 const clean=cleanProject(original);assert.equal(clean.version,9);assert.equal(clean.meta.id,'proyecto-a');assert.equal(clean.meta.category,'Compresión');assert.equal(clean.items[0].type,'pipe');
 assert.throws(()=>cleanProject({format:'other',items:[]}));
});
test('listas de materiales agrupan piezas por tipo y parámetros',()=>{
 const a=part('pipe',1),b=part('pipe',2),c=part('pipe',3);c.dims.length=210;
 const rows=billOfMaterials([a,b,c],type=>({label:'Tubería '+type}));assert.equal(rows.length,2);assert.equal(rows.find(x=>x.quantity===2).quantity,2);assert.ok(bomToCsv(rows).includes('Tubería'));
});
test('agrupación y distancias de envolventes',()=>{
 const a=part('pipe',1),b=part('flange',2);a.assemblyId=b.assemblyId='conjunto1';const groups=groupByAssembly([a,b]);assert.equal(groups.length,1);assert.equal(assemblySummary([a,b]).assemblies,1);
 const boxA={min:{x:0,y:0,z:0},max:{x:10,y:10,z:10}};
 const boxB={min:{x:15,y:0,z:0},max:{x:20,y:10,z:10}};assert.equal(aabbGap(boxA,boxB),5);
});