import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_SOLIDS,validateCadSpec,validateCadPayload,safeStepFilename} from '../src3d/cad-schema.js';

test('cuatro sólidos B-Rep paramétricos con unidades explícitas',()=>{
 assert.deepEqual(Object.keys(CAD_SOLIDS),['box','cylinder','drilledPlate','pipe']);
 for(const [kind,def] of Object.entries(CAD_SOLIDS))assert.deepEqual(validateCadSpec({kind}),{kind,...def.defaults});
});
test('validación de taladro y pared',()=>{
 assert.throws(()=>validateCadSpec({kind:'drilledPlate',length:100,width:50,holeDiameter:60}),/agujero/);
 assert.throws(()=>validateCadSpec({kind:'pipe',diameter:100,wall:80}),/espesor/);
 assert.throws(()=>validateCadSpec({kind:'box',length:-1}),/Longitud|length/);
 assert.deepEqual(validateCadSpec({kind:'cylinder',diameter:20,height:100}),{kind:'cylinder',diameter:20,height:100});
});
test('operaciones y archivos STEP con nombres seguros',()=>{
 assert.equal(validateCadPayload({action:'create',spec:{kind:'box'}}),true);
 assert.throws(()=>validateCadPayload({action:'boolean',operation:'invalid'}),/inválida/);
 assert.equal(safeStepFilename('Compresor/Cojinete.prt.step'),'Compresor_Cojinete.prt.step');
});