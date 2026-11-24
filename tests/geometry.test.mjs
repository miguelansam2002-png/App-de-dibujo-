import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,PIPE_SIZES,MATERIALS,partDefinition,standardPart,makePart,releasePart} from '../src3d/parts.js';

test('biblioteca extensa sin categorías ni tipos duplicados',()=>{
 assert.ok(CATALOG.length>=99,'debe incluir al menos 99 componentes');
 assert.equal(new Set(CATALOG.map(x=>x.type)).size,CATALOG.length);
 for(const c of CATALOG){assert.ok(c.category&&c.label&&c.icon);assert.ok(Object.values(c.dims).every(x=>Number.isFinite(x)&&x>0));assert.equal(partDefinition(c.type),c)}
});
test('generación geométrica de todos los componentes y sus variaciones',()=>{
 for(const c of CATALOG){
  const part=standardPart(c.type);const model=makePart(part);let count=0;
  model.traverse(o=>{if(!o.isMesh)return;count++;const geom=o.geometry;assert.ok(geom,'Falta geometría en '+c.type);assert.ok(geom.attributes.position.count>=3,'Sin vértices '+c.type);const values=geom.attributes.position.array;for(let i=0;i<values.length;i++)assert.ok(Number.isFinite(values[i]),`Coordenada inválida en ${c.type} índice ${i}`);geom.computeBoundingBox();const b=geom.boundingBox;assert.ok(Number.isFinite(b.min.x+b.max.y+b.min.z+b.max.z),`Límites inválidos en ${c.type}`)});
  assert.ok(count>0,`Sin mallas para ${c.type}`);releasePart(model);
 }
});
test('dimensiones comerciales y acabados industriales',()=>{
 assert.ok(PIPE_SIZES.length>=22);
 for(const p of PIPE_SIZES){assert.ok(p.od>0&&p.s40>0&&p.s80>p.s40&&p.s80<p.od/2);assert.ok(p.nps&&p.dn)}
 assert.ok(MATERIALS.length>=6);
 const pipe=makePart({...standardPart('pipe'),dims:{length:1800,diameter:114.3,wall:6.02}});
 let meshes=0;pipe.traverse(o=>{if(o.isMesh)meshes++});assert.ok(meshes>=1);releasePart(pipe);
});