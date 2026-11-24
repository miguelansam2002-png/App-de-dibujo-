// Helpers puros: gestión de proyectos y ensamblajes. Sin dependencias del navegador.
export const STUDIO_VERSION=9;
export const MAX_PROJECTS=80;
export const uid=(prefix='proyecto')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
export function cleanProject(project){
 if(!project||project.format!=='trazo-tecnico-3d'||!Array.isArray(project.items))throw Error('Archivo Trazo Técnico 3D inválido');
 const items=project.items.map(x=>({...x}));
 if(items.length>500)throw Error('El proyecto tiene demasiados componentes');
 return {format:'trazo-tecnico-3d',version:STUDIO_VERSION,name:String(project.name||'Diseño sin nombre').slice(0,100),units:'mm',items,
 meta:{id:String(project.meta?.id||uid()),category:String(project.meta?.category||'General'),notes:String(project.meta?.notes||''),createdAt:String(project.meta?.createdAt||new Date().toISOString()),updatedAt:new Date().toISOString()}};
}
export function billOfMaterials(items,parts){
 const rows=new Map();for(const p of items){const type=p.type||'Desconocido',key=type+'|'+Object.entries(p.dims||{}).sort().map(([k,v])=>k+':'+v).join(',');
  const row=rows.get(key)||{type,description:parts(type)?.label||p.name||type,quantity:0,dimensions:structuredClone(p.dims||{}),assembly:p.assemblyName||'',tags:[]};
  row.quantity++;if(p.metadata?.equipmentTag)row.tags.push(String(p.metadata.equipmentTag));rows.set(key,row);
 }
 return [...rows.values()].sort((a,b)=>a.description.localeCompare(b.description,'es'));
}
export function csvCell(value){return '"'+String(value??'').replaceAll('"','""').replaceAll(/\r?\n/g,' ')+'"'}
export function bomToCsv(rows){return '\uFEFF'+[['N°','Componente','Descripción','Cantidad','Dimensiones (mm)','Conjunto','Tags'],...rows.map((r,i)=>[i+1,r.type,r.description,r.quantity,Object.entries(r.dimensions).map(([a,b])=>`${a}=${b}`).join('; '),r.assembly,r.tags.join(' / ')])].map(row=>row.map(csvCell).join(';')).join('\r\n')}
export function groupByAssembly(items){const map=new Map();for(const p of items){const key=p.assemblyId||'_libres';if(!map.has(key))map.set(key,{id:key,name:p.assemblyId?(p.assemblyName||'Ensamblaje'):'Piezas independientes',items:[]});map.get(key).items.push(p)}return [...map.values()]}
export function aabbGap(a,b){const delta=['x','y','z'].map(k=>Math.max(0,b.min[k]-a.max[k],a.min[k]-b.max[k]));return Math.hypot(...delta)}
export function uniqueItemIds(items){const seen=new Set();for(const item of items){if(!item.id||seen.has(item.id))return false;seen.add(item.id)}return true}
export function assemblySummary(items){return {pieces:items.length,assemblies:new Set(items.map(p=>p.assemblyId).filter(Boolean)).size,types:new Set(items.map(p=>p.type)).size,linked:items.filter(p=>p.joint?.targetId||p.constraint?.targetId).length}}