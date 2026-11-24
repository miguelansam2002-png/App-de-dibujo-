import * as THREE from 'three';

// Conectores geométricos para ensamblajes conceptuales, unidades en milímetros.
// Uniones "end" alinean dos bocas opuestas; "mount" acopla una abrazadera al eje de un tubo.
const P=(id,label,kind,position,normal,diameter=0)=>({id,label,kind,position,normal,diameter});
const vec=a=>new THREE.Vector3(...a);
const partQ=part=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...(part.rot||[0,0,0]).map(THREE.MathUtils.degToRad),'XYZ'));
const mk=(id,label,x,dir,diameter)=>P(id,label,'end',[x,0,0],[dir,0,0],diameter);

export function portsFor(part){
 const d=part?.dims||{},t=part?.type||'', L=Number(d.length||300),D=Number(d.diameter||114.3);
 const ends=(a=D,b=D)=>[mk('A','Boca A',-L/2,-1,a),mk('B','Boca B',L/2,1,b)];
 if(['pipe','pipe_nipple','pipe_insulated','pipe_spool','pipe_lined','pipe_doublewall','pipe_spool_bolted','pipe_repair_sleeve','pipe_miter','union','coupling','grooved_coupling','expansion_bellows','stub_end','valve','valve_ball','valve_butterfly','valve_check','strainer','valve_globe','valve_needle','valve_plug','valve_diaphragm','valve_actuated','valve_3way'].includes(t)){
  const out=ends(t==='coupling'?Number(d.bore||D):D);
  if(['pipe','pipe_spool','pipe_nipple','pipe_insulated','pipe_lined','pipe_doublewall','pipe_spool_bolted','pipe_repair_sleeve'].includes(t))out.push(P('axis','Eje para grapa','axis',[0,0,0],[1,0,0],D));
  return out;
 }
 if(['tee','tee_reducing','wye45','lateral45','weldolet'].includes(t))return [...ends(),P('branch','Ramal superior','end',[0,Number(d.branch||0),0],[0,1,0],t==='tee'?D:Number(d.branchDiameter||D))];
 if(t==='cross')return [...ends(),P('up','Ramal superior','end',[0,Number(d.branch||0)/2,0],[0,1,0],D),P('down','Ramal inferior','end',[0,-Number(d.branch||0)/2,0],[0,-1,0],D)];
 if(t==='reducer'||t==='reducer_ecc')return ends(Number(d.smallDiameter||D),D);
 if(['elbow','elbow45','elbow180','elbow_short','elbow_socket','elbow_thread'].includes(t)){
  const deg=t==='elbow45'?45:t==='elbow180'?180:90, a=deg*Math.PI/180, R=Number(d.radius||150);
  return [P('A','Entrada del codo','end',[0,0,0],[-1,0,0],D),P('B','Salida del codo','end',[R*Math.sin(a),0,R*(1-Math.cos(a))],[Math.cos(a),0,Math.sin(a)],D)];
 }
 if(['flange','flange_wn','flange_blind','gasket','flange_socket','flange_threaded','flange_lap','flange_orifice'].includes(t)){
  const diameter=Number(d.bore||114.3);
  const thick=Number(d.thickness||12),x=thick/2;
  return [mk('A','Cara A',-x,-1,diameter),mk('B','Cara B',x,1,diameter)];
 }
 if(['train_turbine','train_motor','train_gearbox','train_compressor','train_compressor_axial','train_coupling','train_rotor'].includes(t)){
  const y=t==='train_motor'?Number(d.height||1200)*.04:t.startsWith('train_compressor')?Number(d.height||1600)*.06:t==='train_turbine'?Number(d.height||1600)*.14:0;
  return [P('shaftA','Eje lado A','shaft',[-L/2,y,0],[-1,0,0],175),P('shaftB','Eje lado B','shaft',[L/2,y,0],[1,0,0],175)];
 }
 if(t==='train_nozzle')return [mk('A','Boca de boquilla',-L/2,-1,D),mk('B','Cara de brida',L/2,1,D)];
 if(t==='cap')return [P('A','Boca abierta','end',[-L*.515,0,0],[-1,0,0],D)];
 if(['clamp_u','clamp_u_saddle'].includes(t))return [P('mount','Centro de grapa','mount',[0,Number(d.height||205)/2-Number(d.width||132)/2,0],[0,0,1],Number(d.width||132))];
 if(['clamp_omega','clamp_band'].includes(t))return [P('mount','Centro de arco','mount',[0,-Number(d.height||115)*.35,0],[0,0,1],Number(d.width||132))];
 if(['clamp_split','clamp_saddle','clevis','pipe_shoe','clamp_rubber','clamp_hinged','clamp_riser','clamp_strut','support_guide','support_anchor'].includes(t))return [P('mount','Eje de soporte','mount',[0,0,0],[0,0,1],Number(d.diameter||150))];
 return [];
}

export function compatiblePorts(a,b){
 if(a.kind==='shaft'&&b.kind==='shaft')return Math.abs(a.diameter-b.diameter)<=Math.max(10,Math.max(a.diameter,b.diameter)*.35);
 if(a.kind==='end'&&b.kind==='end')return Math.abs(a.diameter-b.diameter)<=Math.max(4,Math.max(a.diameter,b.diameter)*.075);
 if(a.kind==='mount'&&b.kind==='axis')return a.diameter>=b.diameter*.9&&a.diameter<=b.diameter*2.5;
 if(a.kind==='axis'&&b.kind==='mount')return b.diameter>=a.diameter*.9&&b.diameter<=a.diameter*2.5;
 return false;
}

export function worldPort(part,port){
 const q=partQ(part);
 return {position:vec(part.pos||[0,0,0]).add(vec(port.position).applyQuaternion(q)),
  normal:vec(port.normal).applyQuaternion(q).normalize()};
}

export function calculateJointTransform(moving,own,target,other){
 if(!compatiblePorts(own,other))return null;
 const tw=worldPort(target,other),movingQ=partQ(moving);
 const movingNormal=vec(own.normal).applyQuaternion(movingQ).normalize();
 // En los anclajes de abrazaderas, el eje se alinea en el mismo sentido; para extremos, en el contrario.
 const desired=tw.normal.clone().multiplyScalar(['end','shaft'].includes(own.kind)?-1:1);
 const delta=new THREE.Quaternion().setFromUnitVectors(movingNormal,desired);
 const q=delta.multiply(movingQ).normalize();
 const pos=tw.position.clone().sub(vec(own.position).applyQuaternion(q));
 const euler=new THREE.Euler().setFromQuaternion(q,'XYZ');
 return {pos:pos.toArray().map(x=>Math.round(x*1000)/1000),rot:[euler.x,euler.y,euler.z].map(x=>Math.round(THREE.MathUtils.radToDeg(x)*1000)/1000)};
}

export function jointFromIds(moving,target,selfPort,targetPort){
 const a=portsFor(moving).find(p=>p.id===selfPort);
 const b=portsFor(target).find(p=>p.id===targetPort);
 if(!a||!b)return null;
 const t=calculateJointTransform(moving,a,target,b);
 return t?{targetId:target.id,selfPort:a.id,targetPort:b.id,transform:t}:null;
}

export function bestJoint(moving,target,usedTargetPorts=[]){
 if(!moving||!target||moving.id===target.id)return null;
 const choices=[];
 for(const a of portsFor(moving))for(const b of portsFor(target)){
  if(!compatiblePorts(a,b)||usedTargetPorts.includes(b.id))continue;
  const wa=worldPort(moving,a),wb=worldPort(target,b);
  const gap=wa.position.distanceTo(wb.position);
  // Distancia primero, preferencia por bocas de extremo sobre centros al editar tuberías.
  choices.push({a,b,gap,rank:gap+(a.kind==='axis'?500:0)});
 }
 choices.sort((x,y)=>x.rank-y.rank);
 const c=choices[0];if(!c)return null;
 const transform=calculateJointTransform(moving,c.a,target,c.b);
 return transform?{targetId:target.id,selfPort:c.a.id,targetPort:c.b.id,transform}:null;
}

export function jointIsValid(child,parent){
 if(!child?.joint||!parent)return false;
 return !!jointFromIds(child,parent,child.joint.selfPort,child.joint.targetPort);
}
