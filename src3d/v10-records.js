// Trazo Tecnico 3D V10 -- metadatos, trazabilidad y observaciones de inspeccion.
// Ninguna condicion de aceptacion se infiere automaticamente de un modelo conceptual.
export const DOCUMENT_STATUSES=Object.freeze([
 ['BORRADOR','Borrador de trabajo'],['EN_REVISION','En revision tecnica'],['PRELIMINAR','Preliminar / para comentarios']
]);
export const INSPECTION_TYPES=Object.freeze([
 ['VISUAL','Inspeccion visual'],['DIMENSIONAL','Control dimensional'],['ALINEACION','Alineacion'],
 ['VIBRACION','Vibracion / medicion'],['SELLADO','Sellos / fugas'],['OTRO','Otro hallazgo']
]);
export const INSPECTION_OUTCOMES=Object.freeze([
 ['PENDIENTE','Pendiente de evaluacion'],['CONFORME','Conforme (declarado por inspector)'],
 ['NO_CONFORME','No conforme (declarado por inspector)'],['NO_APLICA','No aplica']
]);
const clipped=(v,limit=140)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,limit);
const numeric=(v)=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&Math.abs(n)<=1e9?n:null};
const pick=(value,rows,fallback)=>rows.some(([k])=>k===value)?value:fallback;
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
const saneDate=(v)=>{const d=clipped(v,10);if(!ISO_DATE.test(d))return '';const parsed=new Date(d+'T00:00:00Z');return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===d?d:''};
const imagePattern=/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalizeDocumentMeta(m={}){
 return {
  projectCode:clipped(m.projectCode,55),documentCode:clipped(m.documentCode,55),
  title:clipped(m.title,145)||'Plano del conjunto',revision:clipped(m.revision,16)||'0',
  preparedBy:clipped(m.preparedBy,90),reviewedBy:clipped(m.reviewedBy,90),
  approvedBy:clipped(m.approvedBy,90),issueDate:saneDate(m.issueDate)||new Date().toISOString().slice(0,10),
  status:pick(m.status,DOCUMENT_STATUSES,'BORRADOR'),notes:clipped(m.notes,1600),
  drawingSize:m.drawingSize==='A4'?'A4':'A3',sectionAxis:['x','y','z'].includes(m.sectionAxis)?m.sectionAxis:'x',
  sectionAt:numeric(m.sectionAt)??0,includeHidden:!!m.includeHidden,includeDimensions:m.includeDimensions!==false,
  showBalloons:m.showBalloons!==false,includeSection:m.includeSection!==false,
  showMeshEdges:m.showMeshEdges!==false,
 };
}
export function normalizeInspectionRecord(raw={}){
 const image=String(raw.photoDataUrl??'');
 return {
  id:clipped(raw.id,100)||`insp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,
  date:saneDate(raw.date)||new Date().toISOString().slice(0,10),
  inspector:clipped(raw.inspector,110),type:pick(raw.type,INSPECTION_TYPES,'VISUAL'),
  location:clipped(raw.location,220),finding:clipped(raw.finding,1300),
  measurement:numeric(raw.measurement),nominal:numeric(raw.nominal),lowerLimit:numeric(raw.lowerLimit),upperLimit:numeric(raw.upperLimit),
  unit:clipped(raw.unit,32)||'mm',reference:clipped(raw.reference,230),
  outcome:pick(raw.outcome,INSPECTION_OUTCOMES,'PENDIENTE'),
  recommendation:clipped(raw.recommendation,1300),
  photoDataUrl:imagePattern.test(image)&&image.length<=1800000?image:'',
  photoName:clipped(raw.photoName,120),
 };
}
export function addInspection(part,data){
 if(!part||typeof part!=='object')throw Error('Selecciona un componente');
 const rows=Array.isArray(part.metadata?.inspections)?part.metadata.inspections:[];
 if(rows.length>=100)throw Error('Limite de 100 registros por pieza; exporta y crea otra revision');
 const record=normalizeInspectionRecord(data);
 part.metadata={...(part.metadata||{}),inspections:[...rows,record]};
 return record;
}
export function removeInspection(part,id){
 if(!part||!Array.isArray(part.metadata?.inspections))return false;
 const old=part.metadata.inspections.length;
 part.metadata={...part.metadata,inspections:part.metadata.inspections.filter(x=>x?.id!==id)};
 return part.metadata.inspections.length<old;
}
export function compileInspectionRows(items=[]){
 const rows=[];
 for(const part of items){for(const raw of Array.isArray(part.metadata?.inspections)?part.metadata.inspections:[]){
  if(!raw||typeof raw!=='object')continue;
  rows.push({pieceId:part.id||'',piece:part.name||part.type||'',assembly:part.assemblyName||'',tag:part.metadata?.equipmentTag||'',...normalizeInspectionRecord(raw)});
 }}return rows;
}
// Protege CSV de inyeccion de formulas al abrir en Excel.
export function csvSafe(value){const v=String(value??'').replace(/\r?\n/g,' ');return '"'+(/^[\s]*[=+@-]/.test(v)?"'"+v:v).replaceAll('"','""')+'"'}
export function inspectionsCSV(items=[]){
 const rows=compileInspectionRows(items);
 const cols=['Fecha','Conjunto','Etiqueta','Componente','Tipo','Ubicacion','Hallazgo','Valor','Nominal','Minimo','Maximo','Unidad','Criterio/Referencia','Resultado','Inspector','Recomendacion','Foto'];
 const data=rows.map(x=>[x.date,x.assembly,x.tag,x.piece,x.type,x.location,x.finding,x.measurement??'',x.nominal??'',x.lowerLimit??'',x.upperLimit??'',x.unit,x.reference,x.outcome,x.inspector,x.recommendation,x.photoName]);
 return '\uFEFF'+[cols,...data].map(row=>row.map(csvSafe).join(';')).join('\r\n');
}
export function evidenceSummary(items=[]){
 let documented=0,contrasted=0,inspections=0,unverified=0;
 for(const p of items){
  if(p.metadata?.v9){const status=p.metadata.v9.validation;if(status==='CONTRASTADO')contrasted++;else if(status==='DOCUMENTADO_SIN_VALIDAR')documented++;else unverified++;}
  if(Array.isArray(p.metadata?.inspections))inspections+=p.metadata.inspections.length;
 }
 return {items:items.length,documented,contrasted,unverified,inspections};
}