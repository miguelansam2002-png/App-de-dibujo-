import {V9_PRESETS,V9_REFERENCES,V9_SUBSYSTEMS,validateV9Config,buildV9Preset,normalizeV9Record,technicalRegisterCSV,subsystemGroups} from './v9-technical.js';
import './v9-workshop.css';
const E=(name,cls='',text='')=>{const el=document.createElement(name);if(cls)el.className=cls;if(text)el.textContent=text;return el};
const text=(p,tag,cls,value)=>{const el=E(tag,cls,value);p.append(el);return el};
const button=(p,label,fn,cls='')=>{const el=E('button','v9-btn '+cls,label);el.type='button';el.onclick=fn;p.append(el);return el};
const input=(p,label,type,value,min=null,max=null)=>{const root=E('label','v9-field');text(root,'span','',label);const control=E('input');control.type=type;control.value=String(value??'');if(min!==null)control.min=String(min);if(max!==null)control.max=String(max);control.step=type==='number'?'any':'';root.append(control);p.append(root);return control};
const select=(p,label,items,value='')=>{const root=E('label','v9-field');text(root,'span','',label);const el=E('select');for(const [id,txt] of items){const opt=E('option','',txt);opt.value=String(id);el.append(opt)}el.value=String(value);root.append(el);p.append(root);return el};
const card=(p,title,desc='')=>{const c=E('section','studio-section v9-card');text(c,'h3','',title);if(desc)text(c,'p','v9-muted',desc);p.append(c);return c};
const fmt=x=>Number(x||0).toLocaleString('es-ES',{maximumFractionDigits:1});

/** Adds the compressor workshop to the existing Studio body. All modifications use the
 * shared editor data model so JSON/IndexedDB persist technical records without a new DB. */
export function renderV9Workshop(body,api,{explode=()=>{},restoreExploded=()=>{},close=()=>{}}={}){
 const state=body.__v9state||{preset:'split-casing-inspection',stages:6,diameter:530,shaft:112,length:2500,assemblyId:'',subsystem:'all',partId:''};
 const reRender=()=>{body.__v9state=state;renderV9Workshop(body,api,{explode,restoreExploded,close})};
 body.replaceChildren();body.classList.add('v9-workshop');
 const hero=E('header','v9-hero');hero.append(E('div','v9-eyebrow','MÁQUINAS ROTATIVAS / EDICIÓN V9'),E('h3','','Taller de compresión 3D'),E('p','','Crea conjuntos por etapas, desmonta los componentes y documenta sus datos sin necesidad de alinear cada pieza manualmente.'));body.append(hero);
 const metrics=E('div','v9-stats');for(const [big,label] of [[String(V9_PRESETS.length),'Plantillas'],['18','Modelos nuevos'],['mm','Unidades']]){const a=E('div','v9-stat');text(a,'strong','',big);text(a,'small','',label);metrics.append(a)}body.append(metrics);
 const forms=card(body,'1. Configurar un tren de compresión','Todas las medidas iniciales son conceptuales y editables; no son medidas de un fabricante.');
 const config=E('div','v9-config');forms.append(config);
 const kind=select(config,'Conjunto preconfigurado',V9_PRESETS.map(x=>[x.id,x.title]),state.preset);
 const stages=input(config,'Etapas (1–10)','number',state.stages,1,10);
 const diameter=input(config,'Diámetro impulsor (mm)','number',state.diameter,180,1900);
 const shaft=input(config,'Diámetro eje (mm)','number',state.shaft,25,450);
 const length=input(config,'Longitud rotor (mm)','number',state.length,900,8500);
 const actions=E('div','v9-actions');forms.append(actions);
 button(actions,'◈ Crear conjunto detallado',()=>{
  try{
   const cfg=validateV9Config({stages:stages.value,diameter:diameter.value,shaft:shaft.value,length:length.value});
   Object.assign(state,{preset:kind.value,...cfg});
   if(api.items().length+65>500)throw Error('Demasiadas piezas en el proyecto. Guarda otro archivo.');
   const current=api.items();const offset=current.length>1?[0,0,Math.max(3400,cfg.diameter*5)]:[0,0,0];
   const model=buildV9Preset(state.preset,api.standardPart,cfg,{offset});
   const previous=current.length===1&&current[0].type==='pipe'?[]:current;
   api.checkpoint();api.replaceItems([...previous,...model.items],previous.length?undefined:model.title);
   state.assemblyId=model.id;state.subsystem='all';state.partId=model.items.find(p=>p.type==='v9_impeller_closed')?.id||model.items[0].id;
   api.fitScene();api.notify(`Conjunto V9 creado: ${model.items.length} piezas · ${cfg.stages} etapas`);reRender();
  }catch(error){api.notify('Configuración no válida: '+error.message)}
 },'primary');
 const presets=E('div','v9-template-grid');forms.append(presets);
 for(const p of V9_PRESETS){const box=E('button','v9-template'+(state.preset===p.id?' active':''));box.type='button';text(box,'strong','',p.icon+' '+p.title);text(box,'span','',p.subtitle);box.onclick=()=>{state.preset=p.id;reRender()};presets.append(box)}
 const v9Parts=api.items().filter(p=>p.metadata?.v9);
 const assemblies=[...new Map(v9Parts.map(p=>[p.assemblyId,p.assemblyName||'Ensamblaje V9'])).entries()].filter(x=>x[0]);
 const inspector=card(body,'2. Despiece e inspección','Selecciona un subsistema o una etapa. Oculta o muestra las piezas sin eliminarlas de tu proyecto.');
 if(!assemblies.length){text(inspector,'p','v9-muted','Crea un conjunto V9 para habilitar el despiece, fichas y exportación técnica.');renderReferences();return;}
 if(!assemblies.some(a=>a[0]===state.assemblyId))state.assemblyId=assemblies[0][0];
 const chooser=E('div','v9-config');inspector.append(chooser);
 const assembly=select(chooser,'Conjunto V9',assemblies,state.assemblyId);assembly.onchange=()=>{state.assemblyId=assembly.value;state.subsystem='all';state.partId='';reRender()};
 const selected=api.items().filter(p=>p.assemblyId===state.assemblyId&&p.metadata?.v9);
 const subsel=select(chooser,'Subsistema',[['all','Todo el conjunto'],...V9_SUBSYSTEMS],state.subsystem);subsel.onchange=()=>{state.subsystem=subsel.value;state.partId='';reRender()};
 const filtered=selected.filter(p=>state.subsystem==='all'||p.metadata.v9.subsystem===state.subsystem);
 const toolbar=E('div','v9-actions');inspector.append(toolbar);
 button(toolbar,'Mostrar internos',()=>{api.checkpoint();for(const p of selected){p.hidden=false;p.hiddenByDefault=p.type==='v9_casing_upper'||p.type==='v9_bearing_housing'}api.refreshScene();reRender()},'');
 button(toolbar,'Ver todo',()=>{api.checkpoint();for(const p of selected){p.hidden=false;p.hiddenByDefault=false}api.refreshScene();reRender()});
 button(toolbar,'Despiece visual',()=>{const ordered=[...filtered].sort((a,b)=>(a.metadata?.v9?.stage||0)-(b.metadata?.v9?.stage||0));explode(ordered)});
 button(toolbar,'Rearmar',()=>restoreExploded());
 const list=E('div','v9-piece-list');inspector.append(list);
 for(const p of filtered){const row=E('div','v9-piece-row');const left=E('button','v9-piece-name');left.type='button';left.textContent=(p.hidden||p.hiddenByDefault?'◌ ':'◉ ')+(p.metadata?.equipmentTag||'')+' · '+p.name;left.onclick=()=>{state.partId=p.id;api.selectPart(p.id);api.focusSelected();reRender()};row.append(left);
  const stage=p.metadata?.v9?.stage;if(stage)text(row,'small','v9-stage','E'+stage);
  const toggle=button(row,p.hidden||p.hiddenByDefault?'Mostrar':'Ocultar',()=>{api.checkpoint();p.hidden=!(p.hidden||p.hiddenByDefault);p.hiddenByDefault=false;api.refreshScene();reRender()},'mini');
  list.append(row)}
 if(!filtered.length)text(list,'p','v9-muted','No hay piezas de este subsistema.');
 const fiches=card(body,'3. Ficha técnica de componente','Los campos de fabricante, P/N, S/N y planos se completan únicamente con documentación verificable.');
 if(!selected.some(p=>p.id===state.partId))state.partId=selected[0]?.id||'';
 const pieceSelector=select(fiches,'Pieza a documentar',selected.map(p=>[p.id,(p.metadata?.equipmentTag||'')+' · '+p.name]),state.partId);pieceSelector.onchange=()=>{state.partId=pieceSelector.value;reRender()};
 const part=selected.find(p=>p.id===state.partId),record=normalizeV9Record(part.metadata?.v9);
 const fields=E('div','v9-config');fiches.append(fields);
 const maker=input(fields,'Fabricante','text',record.manufacturer),pn=input(fields,'Número de parte P/N','text',record.partNumber),sn=input(fields,'Serial S/N','text',record.serialNumber),drawing=input(fields,'Plano / manual (referencia y página)','text',record.drawingRef),revision=input(fields,'Revisión de plano','text',record.revision),material=input(fields,'Material','text',record.material),verifiedBy=input(fields,'Contrastado por','text',record.verifiedBy),verifiedOn=input(fields,'Fecha de contraste','date',record.verifiedOn),source=input(fields,'URL pública del documento (HTTPS)','url',record.sourceUrl);
 const status=select(fields,'Nivel de verificación',[['CONCEPTUAL','Modelo conceptual / no contrastado'],['DOCUMENTADO_SIN_VALIDAR','Datos suministrados sin validar'],['CONTRASTADO','Datos contrastados con un documento']],record.validation);
 const note=E('label','v9-field wide');text(note,'span','','Observaciones de inspección');const textarea=E('textarea');textarea.value=record.observation;textarea.rows=4;textarea.maxLength=900;note.append(textarea);fields.append(note);
 const saveActions=E('div','v9-actions');fiches.append(saveActions);
 button(saveActions,'Guardar ficha técnica',()=>{const raw={...record,manufacturer:maker.value,partNumber:pn.value,serialNumber:sn.value,drawingRef:drawing.value,revision:revision.value,material:material.value,verifiedBy:verifiedBy.value,verifiedOn:verifiedOn.value,sourceUrl:source.value,validation:status.value,observation:textarea.value};const cleaned=normalizeV9Record(raw);api.checkpoint();part.metadata={...part.metadata,v9:cleaned};api.refreshScene();api.notify(cleaned.validation==='CONTRASTADO'?'Datos registrados como contrastados (no certificados)':'Ficha guardada · conserva evidencia documental');reRender()},'primary');
 button(saveActions,'Exportar registro técnico CSV',async()=>{try{const csv=technicalRegisterCSV(selected);await api.sendFile(new Blob([csv],{type:'text/csv;charset=utf-8'}),'registro-tecnico-compresion-v9.csv');api.notify('Registro técnico exportado')}catch(e){api.notify('No se pudo exportar: '+e.message)}});
 const warning=E('p','v9-warning','Aviso: la condición «Contrastado» requiere P/N, plano/documento, fecha y responsable. No implica certificación OEM, compatibilidad mecánica ni autorización para fabricar.');fiches.append(warning);
 renderReferences();
 function renderReferences(){const refs=card(body,'4. Referencias públicas de estudio','Documentación descriptiva para reconocer familias de compresores; NO aporta dimensiones exactas de los modelos.');for(const item of V9_REFERENCES){const row=E('div','v9-source');const a=E('a','',item.label);a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);text(row,'p','v9-muted',item.scope);refs.append(row)}refs.append(E('p','v9-warning','Los modelos de la biblioteca V9 son originales y conceptuales. Para reproducir una máquina identificable se necesitan planos CAD y permisos del fabricante.'))}
}