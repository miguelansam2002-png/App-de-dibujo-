import {normalizeDocumentMeta,DOCUMENT_STATUSES,INSPECTION_TYPES,INSPECTION_OUTCOMES,normalizeInspectionRecord,addInspection,removeInspection,compileInspectionRows,inspectionsCSV,evidenceSummary,csvSafe} from './v10-records.js';
import {createEngineeringDrawingSVG,createDrawingDXF} from './v10-drawings.js';
import {createEngineeringReportHTML} from './v10-report.js';
import {billOfMaterials} from './studio-core.js';
import './v10-workspace.css';

const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const labelInput=(parent,label,value='',type='text',max=120)=>{
 const box=el('label','v10-field'),heading=el('span','',label),input=el('input');input.type=type;input.value=String(value??'');if(type==='text')input.maxLength=max;box.append(heading,input);parent.append(box);return input;
};
const labelSelect=(parent,label,options,value)=>{
 const box=el('label','v10-field'),heading=el('span','',label),select=el('select');for(const [v,t] of options){const opt=el('option','',t);opt.value=v;select.append(opt)}select.value=String(value??options[0]?.[0]??'');box.append(heading,select);parent.append(box);return select;
};
const textarea=(parent,label,value='',length=1600)=>{
 const root=el('label','v10-field full');root.append(el('span','',label));const a=el('textarea');a.rows=4;a.maxLength=length;a.value=String(value??'');root.append(a);parent.append(root);return a;
};
const button=(parent,text,callback,style='')=>{const b=el('button','v10-btn '+style,text);b.type='button';b.onclick=callback;parent.append(b);return b};
const card=(parent,title,desc='')=>{const c=el('section','v10-card');c.append(el('h3','',title));if(desc)c.append(el('p','v10-muted',desc));parent.append(c);return c};
const notice=(parent,text)=>parent.append(el('div','v10-warning',text));
const applyJson=x=>JSON.stringify(x||{});
function makeBomCSV(items,partDefinition){const rows=billOfMaterials(items,partDefinition);return '\uFEFF'+[['N°','Componente','Descripción','Cantidad','Conjunto','Dimensiones (mm)','Etiquetas'],...rows.map((x,i)=>[i+1,x.type,x.description,x.quantity,x.assembly,Object.entries(x.dimensions).map(([k,v])=>`${k}=${v}`).join(' / '),x.tags.join(', ')])].map(x=>x.map(csvSafe).join(';')).join('\r\n')}
function captureCanvasPhoto(file){
 if(!file)return Promise.resolve({data:'',name:''});
 if(!file.type.startsWith('image/'))return Promise.reject(Error('Selecciona una imagen JPEG, PNG o WebP'));
 if(file.size>15*1024*1024)return Promise.reject(Error('La fotografía supera el límite de 15 MB'));
 return new Promise((resolve,reject)=>{
  const image=new Image(),source=URL.createObjectURL(file);
  image.onload=()=>{
   try{const s=Math.min(1,1200/Math.max(1,image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*s));canvas.height=Math.max(1,Math.round(image.naturalHeight*s));
    canvas.getContext('2d',{alpha:false}).drawImage(image,0,0,canvas.width,canvas.height);
    const data=canvas.toDataURL('image/jpeg',.7);URL.revokeObjectURL(source);
    if(data.length>1800000)throw Error('Fotografía comprimida aún supera 1,8 MB');resolve({data,name:file.name.slice(0,120)});
   }catch(error){URL.revokeObjectURL(source);reject(error)}
  };
  image.onerror=()=>{URL.revokeObjectURL(source);reject(Error('No se pudo abrir la fotografía'))};image.src=source;
 });
}

export function renderEngineeringDocs(body,api,metadata,{notify=()=>{},restoreExploded=()=>{},explode=()=>{},persist=()=>{}}={}){
 const state=body.__v10state||{tab:'drawing',pieceId:api.current()?.id||'',includePhotos:true};
 body.__v10state=state;
 const refresh=()=>renderEngineeringDocs(body,api,metadata,{notify,restoreExploded,explode,persist});
 const saveDoc=doc=>{metadata.doc=normalizeDocumentMeta(doc);persist();};
 const doc=normalizeDocumentMeta(metadata.doc||{title:api.getProject().name,revision:metadata.revision||'0'});
 body.replaceChildren();body.classList.add('v10-docs');
 const intro=el('div','v10-hero');intro.append(el('div','v10-kicker','TRAZO TÉCNICO 3D · DOCUMENTACIÓN V10'),el('h3','','Planos, cortes e informes de ingeniería'),el('p','','Emite láminas, crea registros de inspección y organiza las referencias técnicas del conjunto. Los dibujos no sustituyen planos OEM certificados.'));body.append(intro);
 const subnav=el('div','v10-tabs');body.append(subnav);
 const panes=[['drawing','Planos y cortes'],['inspection','Inspección'],['report','Informes'],['bom','Materiales']];
 for(const [id,label] of panes){button(subnav,label,()=>{state.tab=id;refresh()},'tab'+(state.tab===id?' active':''))}
 const rows=compileInspectionRows(api.items()),summary=evidenceSummary(api.items());
 const stats=el('div','v10-metrics');for(const [v,t] of [[api.items().length,'Piezas'],[summary.inspections,'Inspecciones'],[summary.contrasted,'Datos contrastados'],[doc.revision,'Revisión']]){const c=el('div');c.append(el('b','',v),el('small','',t));stats.append(c)}body.append(stats);

 if(state.tab==='drawing'){
  const cfg=card(body,'1. Identificación del documento','Los códigos, responsables y revisión se conservarán con el proyecto para los siguientes informes.');
  const fields=el('div','v10-fields');cfg.append(fields);
  const projectCode=labelInput(fields,'Código de proyecto',doc.projectCode),code=labelInput(fields,'Código del plano',doc.documentCode),title=labelInput(fields,'Nombre del plano',doc.title),revision=labelInput(fields,'Revisión',doc.revision),prepared=labelInput(fields,'Elaborado por',doc.preparedBy),reviewed=labelInput(fields,'Revisado por',doc.reviewedBy),approved=labelInput(fields,'Aprobado por',doc.approvedBy),date=labelInput(fields,'Fecha de emisión',doc.issueDate,'date');
  const status=labelSelect(fields,'Estado',DOCUMENT_STATUSES,doc.status),size=labelSelect(fields,'Tamaño de hoja',[['A3','A3 horizontal'],['A4','A4 horizontal']],doc.drawingSize),axis=labelSelect(fields,'Plano de corte',[['x','X: normal al eje X'],['y','Y: normal al eje Y'],['z','Z: normal al eje Z']],doc.sectionAxis),at=labelInput(fields,'Coordenada del corte (mm)',doc.sectionAt,'number');
  const notes=textarea(cfg,'Observaciones generales del documento',doc.notes);
  const check=el('div','v10-checks');cfg.append(check);
  const makeCheck=(txt,value)=>{const lab=el('label'),box=el('input');box.type='checkbox';box.checked=value;lab.append(box,document.createTextNode(txt));check.append(lab);return box};
  const dims=makeCheck('Cotas generales',doc.includeDimensions),section=makeCheck('Vista seccionada',doc.includeSection),balloons=makeCheck('Referencias numeradas',doc.showBalloons),meshEdges=makeCheck('Aristas de mallas',doc.showMeshEdges),hidden=makeCheck('Incluir piezas ocultas',doc.includeHidden);
  const read=()=>normalizeDocumentMeta({projectCode:projectCode.value,documentCode:code.value,title:title.value,revision:revision.value,preparedBy:prepared.value,reviewedBy:reviewed.value,approvedBy:approved.value,issueDate:date.value,status:status.value,drawingSize:size.value,sectionAxis:axis.value,sectionAt:at.value,notes:notes.value,includeDimensions:dims.checked,includeSection:section.checked,showBalloons:balloons.checked,showMeshEdges:meshEdges.checked,includeHidden:hidden.checked});
  const commands=el('div','v10-actions');cfg.append(commands);button(commands,'Guardar datos de plano',()=>{saveDoc(read());notify('Datos del plano guardados en el proyecto')},'primary');
  const p=card(body,'2. Vista previa de la lámina','Planta, alzado, lateral, isométrica y corte geométrico de la malla. La escala se adapta automáticamente a la hoja.');
  const preview=el('div','v10-preview');p.append(preview);
  const message=el('p','v10-muted','Pulsa «Actualizar vista previa» para generar la lámina sin salir de la aplicación.');p.append(message);
  const create=()=>{const opts=read();saveDoc(opts);return createEngineeringDrawingSVG(api.items(),api.models,opts)};
  const show=()=>{try{const svg=create();const parsed=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;if(parsed.localName!=='svg'||parsed.querySelector('parsererror'))throw Error('No se pudo interpretar la lámina');preview.replaceChildren(document.importNode(parsed,true));message.textContent='Vista generada. Dimensiones expresadas en mm. Proyecciones no certificadas.';notify('Plano actualizado')}catch(error){notify('Error de dibujo: '+error.message)}};
  button(p,'Actualizar vista previa',show,'primary');
  const out=card(body,'3. Exportación de plano y corte','SVG vectorial, PDF A3/A4 o DXF preliminar; conserva copias JSON del proyecto.');const a=el('div','v10-actions');out.append(a);
  const busy=async(run,b)=>{b.disabled=true;try{await run()}catch(error){notify('Exportación: '+error.message)}finally{b.disabled=false}};
  const svgButton=button(a,'Exportar SVG',async()=>busy(async()=>{const svg=create();const d=read();await api.sendFile(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),`trazo-v10-${d.documentCode||'plano'}.svg`);notify('Plano SVG exportado')},svgButton),'primary');
  const pdfButton=button(a,'Exportar PDF vectorial',async()=>busy(async()=>{const d=read(),svg=create();const {drawingSVGtoPDF}=await import('./v10-pdf.js');const pdf=await drawingSVGtoPDF(svg,d.drawingSize);await api.sendFile(pdf,`trazo-v10-${d.documentCode||'plano'}.pdf`);notify('Plano PDF generado')},pdfButton));
  button(a,'Exportar DXF 2D',async()=>{try{const d=read();saveDoc(d);const x=createDrawingDXF(api.items(),api.models,d);await api.sendFile(new Blob([x],{type:'application/dxf'}),`trazo-v10-${d.documentCode||'plano'}.dxf`);notify('DXF de proyecciones exportado')}catch(error){notify('Error DXF: '+error.message)}});
  const explosion=card(body,'4. Vista explosionada','Separa visualmente los componentes del conjunto seleccionado para hacer una captura o exportar el plano. No modifica el archivo de piezas.');const ctl=el('div','v10-actions');explosion.append(ctl);
  button(ctl,'Preparar despiece visual',()=>{const part=api.current();const peers=api.items().filter(p=>part?.assemblyId&&p.assemblyId===part.assemblyId);if(peers.length<2){notify('Selecciona primero un equipo perteneciente a un conjunto');return}explode(peers);notify('Despiece visual activo. Actualiza la vista previa')});
  button(ctl,'Rearmar visualmente',()=>{restoreExploded();notify('Conjunto visualmente rearmado')});
  notice(body,'Láminas V10: las cotas generales se derivan de envolventes 3D. Los cortes son intersecciones de mallas, sin comprobación de líneas ocultas B-Rep. Revisa siempre dimensiones OEM y tolerancias.');
  return;
 }
 if(state.tab==='inspection'){
  const sec=card(body,'Registro de inspección por componente','Cada registro incorpora responsable, fecha, hallazgo, valor, referencia y resultado declarado. Se conserva en el proyecto.');
  const items=api.items();if(!items.length){notice(sec,'No hay piezas. Inserta componentes desde la biblioteca.');return}
  if(!items.some(x=>x.id===state.pieceId))state.pieceId=api.current()?.id||items[0].id;
  const chooser=labelSelect(sec,'Pieza a inspeccionar',items.map(p=>[p.id,`${p.metadata?.equipmentTag||'S/E'} · ${p.name||p.type}`]),state.pieceId);chooser.onchange=()=>{state.pieceId=chooser.value;refresh()};
  const box=el('div','v10-fields');sec.append(box);const inspectionDate=labelInput(box,'Fecha de inspección',new Date().toISOString().slice(0,10),'date'),inspector=labelInput(box,'Inspector / responsable',''),type=labelSelect(box,'Actividad',INSPECTION_TYPES,'VISUAL'),location=labelInput(box,'Ubicación / zona'),reference=labelInput(box,'Plano, procedimiento o criterio'),measurement=labelInput(box,'Valor observado','', 'number'),nominal=labelInput(box,'Valor nominal','', 'number'),minimum=labelInput(box,'Límite inferior','', 'number'),maximum=labelInput(box,'Límite superior','', 'number'),unit=labelInput(box,'Unidad','mm');
  const outcome=labelSelect(box,'Resultado declarado',INSPECTION_OUTCOMES,'PENDIENTE'),finding=textarea(sec,'Hallazgo y condición observada','',1200),recommendation=textarea(sec,'Recomendación / seguimiento','',1200);
  const photolab=el('label','v10-field full');photolab.append(el('span','','Fotografía opcional (se comprime y guarda offline con el proyecto)'));const photo=el('input');photo.type='file';photo.accept='image/jpeg,image/png,image/webp';photolab.append(photo);sec.append(photolab);
  const act=el('div','v10-actions');sec.append(act);
  const saveButton=button(act,'Guardar observación',async()=>{
   saveButton.disabled=true;
   try{const target=api.items().find(x=>x.id===state.pieceId);if(!target)throw Error('No se encontró la pieza');let attachment={data:'',name:''};if(photo.files?.length)attachment=await captureCanvasPhoto(photo.files[0]);
    api.checkpoint();const record=addInspection(target,{date:inspectionDate.value,inspector:inspector.value,type:type.value,location:location.value,reference:reference.value,measurement:measurement.value,nominal:nominal.value,lowerLimit:minimum.value,upperLimit:maximum.value,unit:unit.value,outcome:outcome.value,finding:finding.value,recommendation:recommendation.value,photoDataUrl:attachment.data,photoName:attachment.name});
    api.refreshScene();notify('Observación '+record.id+' guardada');refresh();
   }catch(error){notify('No se pudo guardar: '+error.message)}finally{saveButton.disabled=false}
  },'primary');
  const log=card(body,'Historial de observaciones','Los registros se conservan por pieza y aparecen en los informes y exportaciones.');
  const part=items.find(p=>p.id===state.pieceId),r=Array.isArray(part?.metadata?.inspections)?part.metadata.inspections:[];
  if(!r.length)log.append(el('p','v10-muted','No hay observaciones para esta pieza.'));
  for(const i of r){const row=el('div','v10-record');row.append(el('strong','',`${i.date} · ${i.type} · ${i.outcome}`),el('p','',i.finding||'Sin descripción'));
   const lower=el('div','v10-actions');row.append(lower);button(lower,'Eliminar registro',()=>{if(!confirm('¿Eliminar este registro de inspección?'))return;api.checkpoint();removeInspection(part,i.id);api.refreshScene();refresh()},'danger');log.append(row);
  }
  const out=card(body,'Exportar registros','Archivo CSV para análisis en Excel y consolidación de observaciones.');button(out,'Exportar inspecciones CSV',async()=>{try{await api.sendFile(new Blob([inspectionsCSV(api.items())],{type:'text/csv;charset=utf-8'}),'trazo-v10-inspecciones.csv');notify('Registros exportados')}catch(e){notify('Error CSV: '+e.message)}},'primary');
  notice(body,'El estado Conforme / No conforme lo registra expresamente el inspector. La aplicación no calcula aceptación, ni verifica materiales o tolerancias sin un criterio documentado.');
  return;
 }
 if(state.tab==='report'){
  const pane=card(body,'Informe técnico consolidado','Contiene portada, alcance, lista de materiales, trazabilidad, inspecciones y espacios para responsables.');
  pane.append(el('p','v10-muted',`El informe incluirá ${api.items().length} piezas y ${rows.length} registros de inspección.`));
  const acts=el('div','v10-actions');pane.append(acts);
  button(acts,'Exportar informe HTML',async()=>{try{const html=createEngineeringReportHTML(api.items(),doc,api.partDefinition,{includePhotos:true});await api.sendFile(new Blob([html],{type:'text/html;charset=utf-8'}),'trazo-v10-informe.html');notify('Informe HTML generado, listo para impresión')}catch(e){notify('Error informe: '+e.message)}},'primary');
  const pdfBtn=button(acts,'Exportar informe PDF',async()=>{pdfBtn.disabled=true;try{const {createEngineeringReportPDF}=await import('./v10-pdf.js');const blob=createEngineeringReportPDF(api.items(),doc,api.partDefinition);await api.sendFile(blob,'trazo-v10-informe.pdf');notify('Informe PDF generado')}catch(e){notify('Error PDF: '+e.message)}finally{pdfBtn.disabled=false}});
  const docinfo=card(body,'Control de emisión','El informe utiliza los datos del plano guardados en la pestaña «Planos y cortes».');
  for(const [label,v] of [['Proyecto',doc.projectCode||'—'],['Documento',doc.documentCode||'—'],['Revisión',doc.revision],['Estado',doc.status],['Elaboró',doc.preparedBy||'Pendiente'],['Revisó',doc.reviewedBy||'Pendiente']]){const r=el('p','v10-metadata');r.append(el('b','',label+': '),document.createTextNode(v));docinfo.append(r)}
  notice(body,'Los resultados son preliminares. Los informes pueden registrar una comprobación documental, pero no autorizan por sí mismos fabricar, instalar o liberar un compresor.');return;
 }
 const mat=card(body,'Lista de materiales','Resumen de componentes, cantidades y parámetros del modelo, agrupados por familia y dimensión.');const bom=billOfMaterials(api.items(),api.partDefinition);
 const table=el('div','v10-bom');mat.append(table);
 for(const x of bom){const row=el('div','v10-bom-row');row.append(el('strong','',x.description),el('small','',`${x.assembly||'Pieza libre'} · ${Object.entries(x.dimensions).slice(0,4).map(([k,v])=>k+' '+v).join(' / ')}`),el('b','',`×${x.quantity}`));table.append(row)}
 if(!bom.length)table.append(el('p','v10-muted','Aún no hay componentes.'));
 const actions=el('div','v10-actions');mat.append(actions);
 button(actions,'Exportar materiales CSV',async()=>{try{await api.sendFile(new Blob([makeBomCSV(api.items(),api.partDefinition)],{type:'text/csv;charset=utf-8'}),'trazo-v10-materiales.csv');notify('Lista de materiales exportada')}catch(error){notify('Error de exportación: '+error.message)}},'primary');
 button(actions,'Guardar proyecto editable JSON',()=>api.exportFile('json'));
 notice(body,'El volumen y las cantidades representan el modelo virtual y no una lista de compra verificada. Comprueba números de parte, especificaciones y materiales antes de emitir una orden.');
}