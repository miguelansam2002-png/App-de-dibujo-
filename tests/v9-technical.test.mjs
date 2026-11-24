import test from 'node:test';
import assert from 'node:assert/strict';
import {V9_PRESETS,V9_REFERENCES,validateV9Config,buildV9Preset,normalizeV9Record,technicalRegisterCSV,subsystemGroups} from '../src3d/v9-technical.js';

const mock=(type,i)=>({id:`pieza-${i}-${Math.random().toString(36).slice(2,8)}`,type,name:type,pos:[0,0,0],rot:[0,0,0],dims:{length:200,diameter:120,shaft:90},color:'#999999'});

test('validación dimensional evita configuraciones imposibles y entradas NaN',()=>{
 assert.deepEqual(validateV9Config(),{stages:6,diameter:530,shaft:112,length:2500});
 assert.throws(()=>validateV9Config({stages:11}),/Etapas/);
 assert.throws(()=>validateV9Config({shaft:400,diameter:400}),/diámetro del eje/);
 assert.throws(()=>validateV9Config({length:900,diameter:1900,stages:10}),/Longitud insuficiente/);
 assert.throws(()=>validateV9Config({diameter:'abc'}),/Diámetro/);
});

test('plantillas V9 generan despieces de rotor por etapa e identificadores únicos',()=>{
 assert.equal(V9_PRESETS.length,3);
 for(const preset of V9_PRESETS){
  const model=buildV9Preset(preset.id,mock,{stages:6,diameter:540,shaft:110,length:2800});
  const types=model.items.map(x=>x.type);
  assert.equal(types.filter(x=>x==='v9_impeller_closed').length,6);
  assert.equal(types.filter(x=>x==='v9_diaphragm').length,5);
  assert.ok(types.includes('v9_casing_upper')&&types.includes('v9_casing_lower'));
  assert.ok(types.includes('v9_dry_gas_cartridge')&&types.includes('v9_balance_piston'));
  assert.equal(new Set(model.items.map(x=>x.metadata.equipmentTag)).size,model.items.length);
  assert.ok(model.items.every(x=>x.metadata.v9.validation==='CONCEPTUAL'));
  assert.ok(model.items.find(x=>x.type==='v9_casing_upper').hiddenByDefault);
  assert.ok(model.items.length<=70,'Mantener plantillas ligeras y editables');
  assert.ok(subsystemGroups(model.items).length>=6);
 }
});

test('modelo de una etapa conserva piezas y evita el salto axial NaN',()=>{
 const m=buildV9Preset('rotor-inspection',mock,{stages:1,diameter:420,shaft:85,length:1600});
 assert.equal(m.items.filter(x=>x.type==='v9_impeller_closed').length,1);
 assert.equal(m.items.filter(x=>x.type==='v9_diaphragm').length,0);
 assert.ok(m.items.every(x=>x.pos.every(Number.isFinite)));
});

test('registro técnico obliga a fuentes trazables para estado contrastado',()=>{
 assert.equal(normalizeV9Record({validation:'CONTRASTADO'}).validation,'DOCUMENTADO_SIN_VALIDAR');
 const valid=normalizeV9Record({partNumber:'A-01',drawingRef:'Plano 3 revisado',verifiedBy:'Revisor',verifiedOn:'2026-11-24',validation:'CONTRASTADO'});
 assert.equal(valid.validation,'CONTRASTADO');
 assert.equal(normalizeV9Record({sourceUrl:'javascript:alert(1)'}).sourceUrl,'');
 const csv=technicalRegisterCSV([{name:'Impulsor',metadata:{equipmentTag:'V9-01',v9:{partNumber:'=SUM(1,1)',drawingRef:'Folio 2',validation:'CONCEPTUAL'}}}]);
 assert.ok(csv.includes("'=SUM(1,1)"),'Protege exportación CSV ante fórmula inyectada');
 assert.ok(csv.includes('Folio 2'));
});

test('referencias públicas no contienen geometría ni datos de fabricante ficticios',()=>{
 assert.ok(V9_REFERENCES.every(x=>x.url.startsWith('https://')));
 const m=buildV9Preset('split-casing-inspection',mock,{stages:5,diameter:530,shaft:105,length:2500});
 assert.ok(m.items.every(x=>!x.metadata.v9.partNumber&&!x.metadata.v9.manufacturer));
 assert.ok(!m.items.some(x=>/Siemens|632-202-328/i.test(x.name)));
});