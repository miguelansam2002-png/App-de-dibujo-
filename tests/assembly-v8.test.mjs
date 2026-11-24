import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceAnchors,worldAnchor,createConstraint,solveConstraint,solveAssembly,assertNoCycle,descendants,shiftRigidGroup,normalizeConstraint} from '../src3d/assembly-engine.js';
import {scanInterferences,clearanceFromBounds,connected} from '../src3d/interference-v8.js';

const part=(id,{type='pipe',pos=[0,0,0],rot=[0,0,0],assemblyId=''}={})=>({id,type,name:id,pos:[...pos],rot:[...rot],dims:{length:200,width:120,height:120,diameter:114.3,wall:6},assemblyId});
const near=(a,b,e=.01)=>assert.ok(Math.abs(a-b)<e,`Expected ${a} ~ ${b}`);
const nearVector=(a,b)=>a.forEach((v,i)=>near(v,b[i]));

test('puertos de tuberia y caras universales se identifican por ID',()=>{
 const p=part('p');const anchors=referenceAnchors(p);
 assert.ok(anchors.some(a=>a.id==='port:A'));
 assert.ok(anchors.some(a=>a.id==='port:axis'));
 assert.ok(anchors.some(a=>a.id==='ref:y-'));
 assert.equal(new Set(anchors.map(a=>a.id)).size,anchors.length);
});

test('coaxial: extremos alineados sin mover pieza manualmente y mantienen posicion tras desplazar base',()=>{
 const base=part('base',{pos:[400,110,-50],rot:[0,20,0]}),child=part('child',{pos:[1800,75,0]});
 const items=[base,child];child.constraint=createConstraint(items,'child','base',{kind:'coaxial',ownAnchor:'port:A',targetAnchor:'port:B',offset:5,twist:45});
 const result=solveAssembly(items);assert.deepEqual(result.errors,[]);
 const A=worldAnchor(child,referenceAnchors(child).find(a=>a.id==='port:A'));
 const B=worldAnchor(base,referenceAnchors(base).find(a=>a.id==='port:B'));
 nearVector(A.position.toArray(),B.position.clone().addScaledVector(B.normal,5).toArray());
 near(A.normal.dot(B.normal),-1,.0001);
 const original=[...child.pos];base.pos[0]+=240;base.pos[1]+=35;
 solveAssembly(items);near(child.pos[0]-original[0],240);near(child.pos[1]-original[1],35);
 assert.equal(child.constraint.twist,45);
});

test('fijacion rigida conserva vector y orientacion relativos',()=>{
 const base=part('gear',{pos:[100,200,300],rot:[0,10,0]}),child=part('motor',{pos:[300,240,290],rot:[0,90,0]});const items=[base,child];
 child.constraint=createConstraint(items,'motor','gear',{kind:'fixed'});
 const originalDistance=new THREE.Vector3(...child.pos).distanceTo(new THREE.Vector3(...base.pos));
 base.rot=[0,75,12];base.pos=[210,120,-80];const out=solveAssembly(items);
 assert.deepEqual(out.errors,[]);near(new THREE.Vector3(...child.pos).distanceTo(new THREE.Vector3(...base.pos)),originalDistance);
});

test('restricciones de plano, paralelismo, distancia y angulo generan transformaciones finitas',()=>{
 const base=part('base',{pos:[120,0,0]}),child=part('child',{pos:[0,100,80]});
 for(const kind of ['face','parallel','distance','angle']){
  const mate=createConstraint([base,child],'child','base',{kind,ownAnchor:'ref:x-',targetAnchor:'ref:x+',offset:12,twist:5,angle:20});
  const t=solveConstraint(child,base,mate);assert.ok(t,kind);assert.ok([...t.pos,...t.rot].every(Number.isFinite),kind);
  if(kind==='distance')assert.ok(t.pos[0]>child.pos[0]);
 }
});

test('bloquea relaciones circulares y las referencias perdidas no destruyen el proyecto',()=>{
 const a=part('a'),b=part('b'),c=part('c');const items=[a,b,c];
 b.constraint=createConstraint(items,'b','a',{kind:'fixed'});
 c.constraint=createConstraint(items,'c','b',{kind:'fixed'});
 assert.throws(()=>createConstraint(items,'a','c',{kind:'fixed'}),/circular/);
 assert.deepEqual(descendants(items,'a').map(p=>p.id),['b','c']);
 c.constraint.targetId='no-existe';const r=solveAssembly(items);assert.ok(r.errors.length>0);assert.equal(c.constraint.targetId,'no-existe');
});

test('mover conjunto completo conserva uniones y mueve los elementos independientes de bancada',()=>{
 const a=part('a',{assemblyId:'t1'}),b=part('b',{pos:[200,40,0],assemblyId:'t1'}),c=part('c',{pos:[400,10,0],assemblyId:'t1'});
 const items=[a,b,c];b.constraint=createConstraint(items,'b','a',{kind:'fixed'});
 const count=shiftRigidGroup(items,'a',[100,25,-50],{includeAssembly:true});
 assert.equal(count,3);nearVector(a.pos,[100,25,-50]);nearVector(b.pos,[300,65,-50]);nearVector(c.pos,[500,35,-50]);
});

test('limpia valores no finitos al importar restricciones V8',()=>{
 const clean=normalizeConstraint({kind:'coaxial',targetId:'part1',offset:Infinity,angle:999999,twist:-888888});
 assert.equal(clean.offset,0);assert.equal(clean.angle,180);assert.equal(clean.twist,-360);
 assert.equal(normalizeConstraint({kind:'nonsense',targetId:'part1'}),undefined);
});

test('BVH distingue cajas solapadas y separadas, y permite excluir relaciones de montaje',async()=>{
 const a=part('a',{type:'solid_box'}),b=part('b',{type:'solid_box'});
 const mA=new THREE.Group(),mB=new THREE.Group();const meshA=new THREE.Mesh(new THREE.BoxGeometry(100,100,100)),meshB=new THREE.Mesh(new THREE.BoxGeometry(100,100,100));
 mA.add(meshA);mB.add(meshB);mB.position.set(45,0,0);
 const map=new Map([['a',mA],['b',mB]]);
 const checked=await scanInterferences([a,b],map,{tolerance:.2});
 assert.equal(checked.collisions.length,1);assert.equal(checked.uncertain.length,0);
 const measurement=clearanceFromBounds(mA,mB);assert.ok(measurement.overlap);
 mB.position.set(250,0,0);
 const separated=await scanInterferences([a,b],map,{tolerance:.2});assert.equal(separated.collisions.length,0);
 b.constraint=createConstraint([a,b],'b','a',{kind:'fixed'});
 assert.ok(connected([a,b],'a','b'));
 mB.position.set(45,0,0);
 const filtered=await scanInterferences([a,b],map,{excludeConnected:true});assert.equal(filtered.collisions.length,0);
});