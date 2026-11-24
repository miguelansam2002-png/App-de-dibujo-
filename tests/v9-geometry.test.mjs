import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {V9_PARTS} from '../src3d/v9-compressor-models.js';
import {TRAIN_PARTS,makeTrainModel} from '../src3d/train-models.js';
import {CATALOG,standardPart,makePart,releasePart} from '../src3d/parts.js';
import {buildV9Preset} from '../src3d/v9-technical.js';

test('biblioteca V9 contiene 18 modelos mecánicos registrados sin duplicaciones',()=>{
 assert.equal(V9_PARTS.length,18);
 assert.equal(CATALOG.length,139);
 assert.equal(CATALOG.filter(x=>x.type!=='custom_mesh').length,138);
 assert.equal(new Set(CATALOG.map(x=>x.type)).size,CATALOG.length);
 for(const def of V9_PARTS)assert.ok(TRAIN_PARTS.some(x=>x.type===def.type));
});

test('todos los 18 modelos V9 generan una geometría 3D válida',()=>{
 for(const def of V9_PARTS){
  const data=standardPart(def.type);
  const group=makePart(data);
  assert.ok(group instanceof THREE.Group,def.type);
  let count=0,vertices=0;
  group.traverse(obj=>{if(obj.isMesh){count++;const geo=obj.geometry;assert.ok(geo.getAttribute('position')?.count>0,def.type);vertices+=geo.getAttribute('position').count;
   const points=geo.getAttribute('position').array;for(let i=0;i<points.length;i++)assert.ok(Number.isFinite(points[i]),def.type+' contiene coordenadas no finitas');
  }});
  assert.ok(count>1,def.type+' sin suficientes detalles');assert.ok(vertices>=120,def.type+' con geometría insuficiente');
  const box=new THREE.Box3().setFromObject(group);
  assert.ok(!box.isEmpty(),def.type+' caja vacía');
  assert.ok(box.min.toArray().every(Number.isFinite)&&box.max.toArray().every(Number.isFinite));
  releasePart(group);
 }
});

test('un compresor V9 genera rotor, carcasas, cojinetes y etapas seleccionables',()=>{
 const model=buildV9Preset('split-casing-inspection',standardPart,{stages:4,diameter:530,shaft:112,length:2300});
 const types=model.items.map(p=>p.type);
 assert.equal(types.filter(t=>t==='v9_impeller_closed').length,4);
 assert.ok(types.includes('v9_casing_lower')&&types.includes('v9_casing_upper'));
 assert.ok(types.includes('v9_tilting_bearing'));
 assert.ok(model.items.every(p=>Array.isArray(p.pos)&&p.pos.length===3));
 for(const p of model.items.slice(0,14)){const g=makePart(p);assert.ok(!new THREE.Box3().setFromObject(g).isEmpty(),p.type);releasePart(g)}
});