// Plantillas tridimensionales de trenes de compresión para estudio conceptual.
// Dimensiones en mm. No deben usarse como planos certificados.
export const TRAIN_PRESETS=[
 {id:'gas-turbine-train',title:'Tren turbina · caja · compresor',subtitle:'Accionamiento de turbina con multiplicadora y compresor centrífugo',icon:'⚙',length:9200},
 {id:'electric-drive-train',title:'Tren electromotor · compresor',subtitle:'Motor eléctrico, acople flexible y compresor sobre bancada',icon:'🔩',length:7000},
 {id:'tandem-train',title:'Tren de compresión en tándem',subtitle:'Accionamiento eléctrico con dos cuerpos de compresión',icon:'🔧',length:11800},
];
const specs={
 'gas-turbine-train':[
  ['train_base',[-200,-720,0],{length:9400,width:1750}],
  ['train_turbine',[-3230,80,0],{length:2400,diameter:1130}],
  ['train_coupling',[-1910,80,0],{length:360,diameter:290}],
  ['train_gearbox',[-1070,80,0],{length:1050}],
  ['train_coupling',[-290,80,0],{length:480,diameter:290}],
  ['train_compressor',[1340,80,0],{length:2240,diameter:1100,stages:5}],
  ['train_rotor',[1340,80,0],{length:1790,diameter:460,stages:5}],
  ['train_oil_skid',[-2500,-210,2180],{length:1980}],
  ['train_seal_panel',[2100,-20,1800],{length:1100}],
  ['train_cooler',[2300,-130,-1770],{length:1410}],
  ['train_instrument',[1900,800,0],{}]
 ],
 'electric-drive-train':[
  ['train_base',[-200,-700,0],{length:7200,width:1600}],
  ['train_motor',[-1920,70,0],{length:1670,diameter:910}],
  ['train_coupling',[-580,70,0],{length:580,diameter:290}],
  ['train_compressor',[1100,70,0],{length:2050,diameter:1010,stages:6}],
  ['train_rotor',[1100,70,0],{length:1650,diameter:410,stages:6}],
  ['train_oil_skid',[-1200,-200,1770],{length:1550}],
  ['train_seal_panel',[1980,-40,1500],{length:930}],
  ['train_cooler',[1750,-190,-1600],{length:1140}]
 ],
 'tandem-train':[
  ['train_base',[0,-700,0],{length:11900,width:1850}],
  ['train_motor',[-3920,70,0],{length:1830,diameter:1000}],
  ['train_coupling',[-2630,70,0],{length:450,diameter:300}],
  ['train_compressor',[-1130,70,0],{length:2010,diameter:1040,stages:4}],
  ['train_rotor',[-1130,70,0],{length:1610,diameter:420,stages:4}],
  ['train_coupling',[190,70,0],{length:470,diameter:320}],
  ['train_compressor',[1870,70,0],{length:2140,diameter:980,stages:7}],
  ['train_rotor',[1870,70,0],{length:1750,diameter:410,stages:7}],
  ['train_oil_skid',[-2400,-200,2020],{length:1900}],
  ['train_seal_panel',[3150,-40,1800],{length:1120}],
  ['train_cooler',[2500,-190,-1750],{length:1410}],
  ['train_bearing_radial',[-240,320,0],{length:360}],
 ],
};
export function buildTrainPreset(id,createStandard,options={}){
 if(typeof createStandard!=='function')throw Error('Se requiere una función constructora de piezas');
 const preset=TRAIN_PRESETS.find(x=>x.id===id);
 if(!preset)throw Error('Plantilla de tren no reconocida');
 const groupId='tren-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
 const offset=Array.isArray(options.offset)?options.offset:[0,0,0];
 const items=specs[id].map(([type,position,dims],index)=>{
  const part=createStandard(type,index);
  part.pos=position.map((v,k)=>v+(Number(offset[k])||0));
  part.dims={...part.dims,...dims};
  part.assemblyId=groupId;
  part.assemblyName=preset.title;
  part.metadata={system:'Tren de compresión',preset:id,role:part.name,validation:'CONCEPTUAL',equipmentTag:
   `${id==='gas-turbine-train'?'TG':id==='electric-drive-train'?'EM':'TD'}-${String(index+1).padStart(3,'0')}`};
  if(type==='train_rotor')part.hiddenByDefault=true;
  return part;
 });
 return {id:groupId,title:preset.title,items};
}