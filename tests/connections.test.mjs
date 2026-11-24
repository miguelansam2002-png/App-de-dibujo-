import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {portsFor,compatiblePorts,worldPort,calculateJointTransform,jointFromIds,bestJoint} from '../src3d/connections.js';
import {standardPart} from '../src3d/parts.js';

const near=(a,b,eps=.003)=>assert.ok(Math.abs(a-b)<eps,`Esperado ${a} ≈ ${b}`);
const vnear=(a,b)=>a.forEach((n,i)=>near(n,b[i]));
function aligned(moving,target,j){
 assert.ok(j,'Debe existir una unión geométrica');
 const next={...moving,pos:j.transform.pos,rot:j.transform.rot};
 const own=portsFor(next).find(p=>p.id===j.selfPort),other=portsFor(target).find(p=>p.id===j.targetPort);
 const wp=worldPort(next,own),wt=worldPort(target,other);
 vnear(wp.position.toArray(),wt.position.toArray());
 near(wp.normal.dot(wt.normal),own.kind==='end'?-1:1,1e-4);
}

test('tubería y codo: las bocas coinciden sin ajuste manual',()=>{
 const pipe=standardPart('pipe');pipe.pos=[0,0,0];
 const elbow=standardPart('elbow');elbow.pos=[2100,250,0];
 const j=jointFromIds(elbow,pipe,'A','B');
 aligned(elbow,pipe,j);
 near(j.transform.pos[0],600);
});
test('ensamblaje de varias piezas y orientación después de giro del objetivo',()=>{
 const pipe=standardPart('pipe');pipe.rot=[0,90,0];pipe.pos=[150,300,-200];
 const elbow=standardPart('elbow');const j=jointFromIds(elbow,pipe,'A','B');
 aligned(elbow,pipe,j);
 const attached={...elbow,pos:j.transform.pos,rot:j.transform.rot};
 const pipe2=standardPart('pipe');const next=jointFromIds(pipe2,attached,'A','B');
 aligned(pipe2,attached,next);
});
test('grapas con ajuste sobre el eje de tubería',()=>{
 const pipe=standardPart('pipe'),clamp=standardPart('clamp_u');
 const j=bestJoint(clamp,pipe);assert.equal(j.selfPort,'mount');assert.equal(j.targetPort,'axis');aligned(clamp,pipe,j);
 const omega=standardPart('clamp_omega');aligned(omega,pipe,bestJoint(omega,pipe));
});
test('protección ante diámetros incompatibles y piezas sin conector',()=>{
 const main=standardPart('pipe'),small=standardPart('pipe');small.dims.diameter=60.3;
 assert.equal(bestJoint(small,main),null);
 assert.deepEqual(portsFor(standardPart('box')),[]);
 const flange=standardPart('flange');
 assert.ok(bestJoint(flange,main));
});
test('puertos ocupados y compatibilidad no permiten uniones incorrectas',()=>{
 const main=standardPart('pipe'),second=standardPart('pipe');
 const used=bestJoint(second,main);
 assert.ok(used);
 const third=standardPart('pipe');
 const j=bestJoint(third,main,[used.targetPort]);
 assert.ok(j);assert.notEqual(j.targetPort,used.targetPort);
 assert.equal(bestJoint(third,main,['A','B','axis']),null);
 const p=portsFor(main)[0],mount=portsFor(standardPart('clamp_u'))[0];
 assert.equal(compatiblePorts(p,mount),false);
});
