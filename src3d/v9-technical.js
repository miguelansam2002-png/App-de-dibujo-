// Technical metadata and parametric compressor train decomposition.
// All geometries and default measures are illustrative, not OEM validated.
export const V9_PRESETS=Object.freeze([
 {id:'rotor-inspection',title:'Rotor y despiece por etapas',subtitle:'Eje, impulsores, diafragmas, balance, sellos y cojinetes',icon:'◉',description:'Inspección mecánica de rotor multietapa'},
 {id:'split-casing-inspection',title:'Compresor de carcasa partida',subtitle:'Media carcasa desmontable, tren interno y boquillas',icon:'◫',description:'Despiece de carcasa y rotor centrífugo'},
 {id:'compression-train-v9',title:'Tren de compresión integral',subtitle:'Motor, multiplicadora, acoples, compresor e instrumentación',icon:'⚙',description:'Layout industrial conceptual completo'}
]);
export const V9_SUBSYSTEMS=Object.freeze([
 ['casing','Carcasa / contención'],['rotor','Rotor / eje'],['stage','Etapas aerodinámicas'],['bearing','Cojinetes / empuje'],['seal','Sellos'],['coupling','Acoples / transmisión'],['auxiliary','Auxiliares / bancada'],['instrument','Instrumentación']
]);
export const V9_REFERENCES=Object.freeze([
 {label:'Siemens Energy — Single-shaft centrifugal compressors',url:'https://www.siemens-energy.com/global/en/home/products-services/product/single-shaft-centrifugal-compressors.html',scope:'Configuraciones generales, carcasas e impulsores; no dimensiones de piezas'},
 {label:'Siemens Energy — Dry gas seals',url:'https://www.siemens-energy.com/global/en/home/products-services/product/dry-gas-seals.html',scope:'Descripción general de cartuchos y elementos de sello; no despiece OEM'},
 {label:'API — Source Inspector study guide',url:'https://www.api.org/~/media/files/certification/icp/icp-certification-programs/si_suite_documents/sire/sire_study%20guide_20181002.pdf',scope:'Componentes, inspección y responsabilidades; consultar normas oficiales con licencia'}
]);
const text=(v,n=160)=>String(v??'').trim().slice(0,n);
const numeric=(v,min,max,name)=>{const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(`${name}: valor fuera de rango (${min}–${max})`);return n};
export function validateV9Config(raw={}){
 const stages=numeric(raw.stages??6,1,10,'Etapas'),diameter=numeric(raw.diameter??530,180,1900,'Diámetro de impulsor'),shaft=numeric(raw.shaft??112,25,450,'Diámetro del eje'),length=numeric(raw.length??2500,900,8500,'Longitud total');
 if(shaft>=diameter*.68)throw Error('El diámetro del eje debe ser menor que el 68% del impulsor');
 if(stages>1&&length/stages<diameter*.17)throw Error('Longitud insuficiente para el número de etapas');
 return {stages:Math.round(stages),diameter,shaft,length};
}
const freezePreset=()=>{};
const spec=(type,x,y,z,dims,subsystem,stage=0,role='')=>({type,pos:[x,y,z],dims,subsystem,stage,role});
const noOEM='CONCEPTUAL';
export function buildV9Preset(id,createStandard,config={},options={}){
 if(!V9_PRESETS.some(p=>p.id===id))throw Error('Plantilla de compresión V9 no reconocida');
 if(typeof createStandard!=='function')throw Error('Falta el constructor de piezas');
 const cfg=validateV9Config(config),offset=Array.isArray(options.offset)?options.offset.map(v=>Number.isFinite(Number(v))?Number(v):0):[0,0,0];
 const {stages,diameter:D,shaft:S,length:L}=cfg,at=options.origin||[0,0,0],loc=at.map((n,k)=>n+(offset[k]||0));
 const preset=V9_PRESETS.find(p=>p.id===id),groupId='v9-tren-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),entries=[];
 const add=(...args)=>entries.push(spec(...args));
 const y=120,C=D*2.1,caseL=L*.92,stageW=Math.max(55,Math.min(D*.24,L/stages*.33));
 const baseComp=()=>{
  add('v9_casing_lower',0,y,0,{length:caseL,diameter:C,wall:Math.max(30,C*.065),bolts:16},'casing');
  add('v9_casing_upper',0,y,0,{length:caseL,diameter:C,wall:Math.max(30,C*.065),bolts:16},'casing');
  add('v9_rotor_shaft',0,y,0,{length:L*.98,shaft:S,diameter:S*1.6,stages},'rotor');
  for(let i=0;i<stages;i++){
   const x=stages===1?0:-L*.35+i*L*.7/(stages-1);
   add('v9_impeller_closed',x,y,0,{diameter:D,width:stageW,shaft:S,blades:Math.min(24,12+Math.floor(i/2))},'stage',i+1,`Impulsor etapa ${i+1}`);
   if(i<stages-1){const nx=stages===1?0:x+L*.7/(stages-1)/2;add('v9_diaphragm',nx,y,0,{diameter:D*1.55,width:Math.min(stageW*.6,90),shaft:S,blades:16},'stage',i+1,`Diafragma entre etapas ${i+1}/${i+2}`)}
  }
  for(const side of [-1,1]){
   const a=side<0?'entrada':'salida';
   add('v9_tilting_bearing',side*L*.55,y,0,{diameter:S*2.8,length:D*.63,shaft:S,pads:5},'bearing',0,`Cojinete radial ${a}`);
   add('v9_dry_gas_cartridge',side*L*.65,y,0,{length:D*.55,diameter:S*2.6,shaft:S,segments:9},'seal',0,`Sello de gas seco ${a}`);
   add('v9_labyrinth',side*L*.48,y,0,{length:D*.3,diameter:S*2.1,shaft:S,segments:12},'seal',0,`Laberinto ${a}`);
   add('v9_bearing_housing',side*L*.56,y,0,{length:D*.74,diameter:S*4,shaft:S,bolts:10},'bearing',0,`Housing lado ${a}`);
  }
  add('v9_balance_piston',L*.42,y,0,{length:D*.43,diameter:D*.56,shaft:S},'rotor');
  add('v9_thrust_collar',L*.78,y,0,{diameter:D*.68,thickness:D*.13,shaft:S},'bearing');
  add('v9_inlet_vanes',-L*.41,y,0,{diameter:D*1.52,width:D*.24,shaft:S,blades:18},'stage');
 };
 if(id==='rotor-inspection'){
  add('train_base',0,-D*1.27,0,{length:L*1.72,width:D*2.8,height:D*.22},'auxiliary');
  baseComp();
 }else if(id==='split-casing-inspection'){
  add('train_base',0,-D*1.32,0,{length:L*1.45,width:D*2.6,height:D*.22},'auxiliary');
  baseComp();
  add('train_nozzle',-L*.22,D*1.2,0,{length:D*.9,diameter:D*.43,flange:D*.65},'casing');
  add('train_nozzle',L*.28,D*1.2,0,{length:D*.9,diameter:D*.43,flange:D*.65},'casing');
  add('v9_probe_axial',L*.71,y+D*.30,0,{length:D*.30,diameter:45},'instrument');
 }else{
  add('train_base',-L*.75,-D*1.33,0,{length:L*3.25,width:D*3.0,height:D*.25},'auxiliary');
  add('train_motor',-L*1.83,y,0,{length:L*.92,diameter:D*1.22,height:D*1.62},'coupling',0,'Accionamiento eléctrico');
  add('v9_diaphragm_coupling',-L*1.25,y,0,{length:D*.74,diameter:D*.55,shaft:S,bolts:12},'coupling',0,'Acople motor / caja');
  add('train_gearbox',-L*.87,y,0,{length:L*.47,width:D*1.31,height:D*1.6},'coupling',0,'Caja multiplicadora');
  add('v9_diaphragm_coupling',-L*.51,y,0,{length:D*.74,diameter:D*.55,shaft:S,bolts:12},'coupling',0,'Acople caja / compresor');
  baseComp();
  add('train_oil_skid',-L*1.15,-D*.77,D*2.32,{length:L*.75,width:D*1.45,height:D*1.15},'auxiliary');
  add('train_seal_panel',L*.48,-D*.25,D*2.47,{length:L*.52,width:D*.65,height:D*1.8},'auxiliary');
  add('train_cooler',L*.48,-D*.55,-D*2.42,{length:L*.59,diameter:D*.58,height:D*.9},'auxiliary');
  add('v9_probe_axial',L*.70,y+D*.35,0,{length:D*.28,diameter:45},'instrument');
 }
 const parts=entries.map((e,i)=>{
  const obj=createStandard(e.type,i);
  obj.name=e.role||obj.name;
  obj.pos=e.pos.map((v,k)=>Math.round((v+loc[k])*100)/100);
  obj.dims={...obj.dims,...e.dims};
  obj.assemblyId=groupId;obj.assemblyName=preset.title;
  obj.metadata={...(obj.metadata||{}),equipmentTag:`CT-V9-${String(i+1).padStart(3,'0')}`,system:'Tren de compresión',v9:{subsystem:e.subsystem,stage:e.stage,validation:noOEM,manufacturer:'',partNumber:'',serialNumber:'',drawingRef:'',revision:'',material:'',observation:'',sourceUrl:'',verifiedBy:'',verifiedOn:''},preset:id};
  if(e.type==='v9_casing_upper'||e.type==='v9_bearing_housing')obj.hiddenByDefault=true;
  return obj;
 });
 return {id:groupId,title:preset.title,items:parts,config:cfg,metadata:{validation:noOEM,description:preset.description}};
}
const FIELDS=['subsystem','stage','validation','manufacturer','partNumber','serialNumber','drawingRef','revision','material','observation','sourceUrl','verifiedBy','verifiedOn'];
export function normalizeV9Record(raw={}){
 const r={subsystem:'',stage:0,validation:'CONCEPTUAL',manufacturer:'',partNumber:'',serialNumber:'',drawingRef:'',revision:'',material:'',observation:'',sourceUrl:'',verifiedBy:'',verifiedOn:''};
 for(const k of FIELDS){if(k==='stage'){const n=Number(raw.stage);r.stage=Number.isInteger(n)&&n>=0&&n<=30?n:0}else if(k==='validation')r.validation=['CONCEPTUAL','DOCUMENTADO_SIN_VALIDAR','CONTRASTADO'].includes(raw.validation)?raw.validation:'CONCEPTUAL';else r[k]=text(raw[k],k==='observation'?900:180)}
 // 'CONTRASTADO' requires traceable evidence and identification, never implies OEM certification.
 if(r.validation==='CONTRASTADO'&&(!r.drawingRef||!r.verifiedBy||!r.verifiedOn||!r.partNumber))r.validation='DOCUMENTADO_SIN_VALIDAR';
 if(r.sourceUrl&&!/^https:\/\//i.test(r.sourceUrl))r.sourceUrl='';
 if(r.verifiedOn&&!/^\d{4}-\d{2}-\d{2}$/.test(r.verifiedOn))r.verifiedOn='';
 return r;
}
function safeCsv(value){const v=String(value??'').replace(/\r?\n/g,' ');const guarded=/^[\s]*[=+@-]/.test(v)?`'${v}`:v;return '"'+guarded.replaceAll('"','""')+'"'}
export function technicalRegisterCSV(items=[]){
 const header=['Conjunto','Etiqueta','Pieza','Subsistema','Etapa','Fabricante','P/N','Serial','Plano / Documento','Revisión','Material','Estado','Verificado por','Fecha','URL fuente','Observaciones'];
 const rows=items.map(p=>{const m=normalizeV9Record(p.metadata?.v9||{});return [p.assemblyName||'',p.metadata?.equipmentTag||'',p.name||'',m.subsystem,m.stage||'',m.manufacturer,m.partNumber,m.serialNumber,m.drawingRef,m.revision,m.material,m.validation,m.verifiedBy,m.verifiedOn,m.sourceUrl,m.observation]});
 return '\uFEFF'+[header,...rows].map(r=>r.map(safeCsv).join(';')).join('\r\n');
}
export function subsystemGroups(items=[]){const map=new Map();for(const p of items){const key=p.metadata?.v9?.subsystem||'other';if(!map.has(key))map.set(key,[]);map.get(key).push(p)}return [...map].map(([id,parts])=>({id,name:V9_SUBSYSTEMS.find(x=>x[0]===id)?.[1]||'Otros componentes',parts}));}