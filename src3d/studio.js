import * as THREE from 'three';
import {STUDIO_VERSION,uid,cleanProject,billOfMaterials,bomToCsv,groupByAssembly,aabbGap,assemblySummary} from './studio-core.js';
import {storeProject,listProjects,loadProject,deleteProject} from './project-store.js';
import {TRAIN_PRESETS,buildTrainPreset} from './train-presets.js';
import {importMeshFile,booleanPieces,canBoolean} from './mesh-tools.js';
import {createDrawingSVG,createReportHTML} from './drawings.js';
import {CAD_SOLIDS,validateCadSpec} from './cad-schema.js';
import {cadCreate,cadImport,cadBoolean,cadExport,cadStop} from './cad-runtime.js';
import {CONSTRAINT_KINDS,referenceAnchors,createConstraint,solveAssembly,shiftRigidGroup,worldAnchor,descendants} from './assembly-engine.js';
import {scanInterferences,clearanceFromBounds} from './interference-v8.js';
import {renderV9Workshop} from './v9-workshop.js';
import {renderEngineeringDocs} from './v10-workspace.js';
import {normalizeDocumentMeta} from './v10-records.js';
import {renderRecoveryPanel} from './v11-recovery.js';
import './assembly-v8.css';
import './studio.css';
import './cad-ui.css';
const by=id=>document.getElementById(id);
const elm=(tag,attrs={},text='')=>{const e=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>{if(k==='class')e.className=v;else if(k==='type')e.type=v;else e.setAttribute(k,v)});if(text)e.textContent=text;return e};
const safe=(v)=>String(v??'').slice(0,100);
const format=n=>Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:1});

export function createStudio(api){
 let current={id:uid(),category:'General',createdAt:new Date().toISOString(),notes:'',revision:'0',doc:null};
 let drawer=null,modal=null,timer=null,previewExplosion=null,measurePair=[],storeAvailable=true,activeProjectId=null,showRefs=false,refGroup=null;
 const root=by('viewportWrap');
 const backdrop=elm('div',{class:'studio-backdrop hidden',id:'studioBackdrop'});document.body.append(backdrop);
 const rail=elm('div',{class:'studio-rail',role:'toolbar','aria-label':'Herramientas de ingeniería'});
 const railActions=[['projects','▦','Proyectos'],['trains','⚙','Trenes'],['assembly','⇄','Montaje'],['workshop','◈','Equipos'],['tools','⌘','Ingeniería'],['docs','▧','Planos']];
 const railButtons=new Map();for(const [id,icon,label] of railActions){const button=elm('button',{type:'button',class:'studio-rail-btn','aria-label':label});button.append(elm('span',{class:'studio-rail-icon'},icon),elm('span',{},label));rail.append(button);railButtons.set(id,button)}
 root.append(rail);
 const top=elm('button',{type:'button',class:'studio-project-button',title:'Abrir gestor de proyectos'},'▦  PROYECTOS');
 by('exportToggle')?.parentElement?.prepend(top);
 const selectBox=elm('div',{class:'studio-selection-hint hidden',id:'studioSelectionHint'});root.append(selectBox);
 const fileInput=elm('input',{type:'file',accept:'.stl,.glb,.gltf',style:'display:none'});document.body.append(fileInput);
 const stepInput=elm('input',{type:'file',accept:'.step,.stp',style:'display:none'});document.body.append(stepInput);
 const showToast=s=>api.notify(s);
 const persist=async()=>{try{const proj=api.getProject();proj.meta={...current};await storeProject(proj);activeProjectId=current.id;storeAvailable=true;}catch(e){storeAvailable=false;api.status('Guardar proyecto JSON: el almacenamiento local no está disponible');}};
 function schedulePersist(){clearTimeout(timer);timer=setTimeout(()=>{persist()},1150)}
 function snapshotMeta(){return {...current,updatedAt:new Date().toISOString()}}
 function restore(meta){if(meta&&typeof meta==='object'){current={id:safe(meta.id)||uid(),category:safe(meta.category||'General'),notes:safe(meta.notes||''),createdAt:String(meta.createdAt||new Date().toISOString()),revision:String(meta.revision||'0'),doc:meta.doc&&typeof meta.doc==='object'?normalizeDocumentMeta(meta.doc):null};}else current={id:uid(),category:'General',notes:'',createdAt:new Date().toISOString(),revision:'0',doc:null};schedulePersist();}
 function close(){if(refGroup&&!showRefs)disposeReferences();if(drawer){drawer.remove();drawer=null}if(modal){modal.remove();modal=null}backdrop.classList.add('hidden');railButtons.forEach(b=>b.classList.remove('active'));}
 backdrop.addEventListener('click',close);
 const newPanel=(title,subtitle,wide=false)=>{
  close();backdrop.classList.remove('hidden');const panel=elm('section',{class:`studio-drawer ${wide?'studio-wide':''}`,role:'dialog','aria-modal':'true','aria-label':title});
  const head=elm('div',{class:'studio-panel-head'});const caption=elm('div');caption.append(elm('div',{class:'studio-eyebrow'},'TRAZO TÉCNICO 3D  ·  ESTUDIO INDUSTRIAL'),elm('h2',{},title),elm('p',{},subtitle));
  const x=elm('button',{class:'studio-close','aria-label':'Cerrar'},'✕');x.onclick=close;head.append(caption,x);panel.append(head);document.body.append(panel);drawer=panel;return panel;
 };
 function section(parent,title,desc){const card=elm('section',{class:'studio-section'});card.append(elm('h3',{},title));if(desc)card.append(elm('p',{class:'studio-muted'},desc));parent.append(card);return card}
 function action(parent,label,callback,cls='studio-action'){const b=elm('button',{type:'button',class:cls},label);b.addEventListener('click',callback);parent.append(b);return b}
 function input(parent,label,type='text',value=''){const wrap=elm('label',{class:'studio-field'});wrap.append(elm('span',{},label));const e=elm('input',{type});e.value=String(value);wrap.append(e);parent.append(wrap);return e}
 function select(parent,label,options){const wrap=elm('label',{class:'studio-field'});wrap.append(elm('span',{},label));const e=elm('select');for(const opt of options){const o=elm('option',{value:String(opt[0])},String(opt[1]));e.append(o)}wrap.append(e);parent.append(wrap);return e}
 function renderSummary(){const s=assemblySummary(api.items());const top=by('studioSelectionHint');if(!top)return;const selected=api.current();top.classList.toggle('hidden',!selected);if(selected){top.replaceChildren(elm('span',{},`◎ ${selected.name}`));const focus=action(top,'Centrar',api.focusSelected);focus.classList.add('compact');const hide=action(top,selected.hidden?'Mostrar':'Ocultar',()=>toggleHidden(selected.id));hide.classList.add('compact');}}
 function changed(){renderSummary();if(drawer?.dataset.panel==='tree')renderTree(drawer.querySelector('.studio-panel-body'));if(showRefs)refreshReferences();schedulePersist()}
 function toggleHidden(id){const p=api.items().find(x=>x.id===id);if(!p)return;api.checkpoint();p.hidden=!p.hidden;if(p.hiddenByDefault){p.hiddenByDefault=false}api.refreshScene();changed()}
 async function openProjects(){const panel=newPanel('Mis proyectos','Diseños locales almacenados en la tableta. Exporta archivos JSON como respaldo.',true);panel.dataset.panel='projects';
  const body=elm('div',{class:'studio-panel-body'});panel.append(body);
  const currentCard=section(body,'Proyecto actual','Guárdalo antes de cambiar de proyecto.');
  const title=input(currentCard,'Nombre del proyecto', 'text',by('projectName').value);
  const note=input(currentCard,'Observaciones / referencia técnica','text',current.notes);
  const cat=select(currentCard,'Tipo de proyecto',[['General','General'],['Compresión','Compresión'],['Tuberías','Tuberías'],['Estructuras','Estructuras'],['Inspección','Inspección']]);cat.value=current.category;
  action(currentCard,'Guardar proyecto actual',async()=>{by('projectName').value=title.value.trim().slice(0,90)||'Diseño sin nombre';current.notes=note.value.slice(0,600);current.category=cat.value;await persist();showToast('Proyecto guardado localmente');openProjects()},'studio-action primary');
  action(currentCard,'Nuevo proyecto',async()=>{if(!confirm('¿Crear otro proyecto? Se guardará una copia del actual.'))return;await persist();api.replaceItems([],'Nuevo diseño 3D');restore(null);close();showToast('Nuevo proyecto creado')});
  const saved=section(body,'Proyectos disponibles','Selecciona un diseño para recuperarlo, duplicarlo o eliminarlo.');
  let entries=[];try{entries=await listProjects()}catch(e){saved.append(elm('p',{class:'studio-warning'},'No está disponible IndexedDB. Utiliza exportación JSON.'))}
  const grid=elm('div',{class:'studio-projects'});for(const entry of entries){const c=elm('article',{class:'studio-project-card'});const date=new Date(entry.updatedAt).toLocaleDateString('es-ES');c.append(elm('div',{class:'studio-card-icon'},'▦'),elm('strong',{},entry.name),elm('span',{},`${entry.pieces} piezas · ${entry.category} · ${date}`));
   const actions=elm('div',{class:'studio-card-actions'});action(actions,'Abrir',async()=>{if(entry.id!==current.id){await persist();const loaded=await loadProject(entry.id);if(loaded){api.replaceProject(loaded);restore(loaded.meta);showToast('Proyecto recuperado: '+entry.name)}}close()},'studio-action primary');
   action(actions,'Copiar',async()=>{const src=await loadProject(entry.id);if(!src)return;src.meta={...src.meta,id:uid(),createdAt:new Date().toISOString()};src.name+=' · copia';await storeProject(src);openProjects()});
   action(actions,'Eliminar',async()=>{if(!confirm('¿Eliminar de esta tableta el proyecto «'+entry.name+'»?'))return;await deleteProject(entry.id);openProjects()},'studio-danger');c.append(actions);grid.append(c)}
  if(!entries.length)grid.append(elm('p',{class:'studio-muted'},'Sin proyectos adicionales. Guarda el actual para incorporarlo a la lista.'));saved.append(grid);
  await renderRecoveryPanel(body,{projectId:current.id,getProject:api.getProject,checkpoint:api.checkpoint,replaceProject:api.replaceProject,restore,notify:showToast,refresh:openProjects});
 }
 async function openProjectFromHome(id){
  await persist();const loaded=await loadProject(id);if(!loaded)throw Error('Proyecto no encontrado');
  api.replaceProject(loaded);restore(loaded.meta);close();api.fitScene();showToast('Proyecto abierto: '+loaded.name);
 }
 function insertTrainPresetFromHome(id){
  const t=TRAIN_PRESETS.find(x=>x.id===id);if(!t)throw Error('Tren de compresión no encontrado');
  const currentItems=api.items(),preserved=currentItems.length===1&&currentItems[0].type==='pipe'?[]:currentItems;
  const preset=buildTrainPreset(id,api.standardPart,{offset:preserved.length?[0,0,-4800]:[0,0,0]});
  if(preserved.length+preset.items.length>500)throw Error('El proyecto superaría el máximo de componentes');
  api.checkpoint();api.replaceItems([...preserved,...preset.items],preserved.length?undefined:t.title);
  close();api.fitScene();showToast('Plantilla insertada: '+t.title);
 }
 function openTrains(){const panel=newPanel('Trenes de compresión','Conjuntos paramétricos de estudio. Carcasa, rotor, transmisión, instrumentación y auxiliares.',true);panel.dataset.panel='trains';const body=elm('div',{class:'studio-panel-body'});panel.append(body);
  const hero=elm('div',{class:'studio-hero'});hero.append(elm('div',{class:'studio-eyebrow'},'BIBLIOTECA DE ENSAMBLAJES INDUSTRIALES'),elm('h3',{},'Modela equipos completos en minutos'),elm('p',{},'Modelos conceptuales originales, sin equivalencia certificada con equipos de fabricante. Puedes inspeccionar y editar todas sus piezas.'));body.append(hero);
  const cards=elm('div',{class:'studio-template-grid'});for(const t of TRAIN_PRESETS){const c=elm('div',{class:'studio-template-card'});c.append(elm('span',{class:'studio-template-icon'},t.icon),elm('strong',{},t.title),elm('p',{},t.subtitle),elm('small',{},`Envolvente de bancada: ${format(t.length)} mm`));action(c,'Insertar tren',async()=>{if(api.items().length>1&&!confirm('¿Añadir este tren al diseño actual? Puedes guardarlo antes.'))return;
   api.checkpoint();const preset=buildTrainPreset(t.id,api.standardPart,{offset:api.items().length>1?[0,0,-4800]:[0,0,0]});const preserved=api.items().length===1&&api.items()[0].type==='pipe'?[]:api.items();api.replaceItems([...preserved,...preset.items],by('projectName').value==='Nuevo diseño 3D'?preset.title:undefined);close();api.fitScene();showToast(`Tren añadido: ${preset.items.length} componentes`);
  },'studio-action primary');cards.append(c)}body.append(cards);
  const sub=section(body,'Explorar piezas individuales','Las familias nuevas están integradas en la biblioteca junto con los 99 componentes anteriores.');action(sub,'Abrir biblioteca 3D',()=>{close();by('libraryPanel').classList.add('open')});action(sub,'Taller V9 · despiece y fichas',()=>openTools('workshop'),'studio-action primary');
 }
 function renderTree(body){if(!body)return;body.replaceChildren();const groups=groupByAssembly(api.items());for(const g of groups){const sec=section(body,`${g.name} · ${g.items.length}`,g.id==='_libres'?'Piezas independientes':'Conjunto manipulable de piezas');
  const list=elm('div',{class:'studio-tree-list'});for(const p of g.items){const row=elm('div',{class:'studio-tree-row'});const name=action(row,`${p.hidden?'◌':'◉'} ${(p.joint||p.constraint)?'🔗 ':''}${p.name}`,()=>{api.selectPart(p.id);api.focusSelected();renderSummary()},'studio-tree-select');row.append(elm('small',{},p.metadata?.equipmentTag||p.type));action(row,p.hidden?'Ver':'Ocultar',()=>toggleHidden(p.id),'studio-small');list.append(row)}sec.append(list);
  if(g.id!=='_libres'){const dx=elm('div',{class:'studio-inline'});const shift=input(dx,'Mover X (mm)','number','200');action(dx,'Desplazar conjunto',()=>{const value=Number(shift.value)||0;api.checkpoint();for(const p of g.items)p.pos[0]+=value;api.refreshScene();api.fitScene();showToast('Conjunto desplazado '+format(value)+' mm');},'studio-action');sec.append(dx);action(sec,'Vista explosionada',()=>explode(g.items),'studio-action');action(sec,'Volver a montar',restoreExploded,'studio-action');}}
 }
 function explode(pieces){if(previewExplosion)restoreExploded();previewExplosion=new Map();const ids=new Set(pieces.map(p=>p.id));let i=0;for(const p of pieces){const obj=api.models.get(p.id);if(!obj||!obj.visible)continue;previewExplosion.set(p.id,obj.position.clone());const offset=(i-Math.ceil(pieces.length/2))*Math.max(170,370);obj.position.x+=offset;obj.updateMatrixWorld();i++}api.render();showToast('Vista explosionada visual · no modifica las dimensiones del proyecto')}
 function restoreExploded(){if(previewExplosion){for(const [id,pos] of previewExplosion){const obj=api.models.get(id);if(obj)obj.position.copy(pos)}previewExplosion=null;api.render()}showToast('Conjunto rearmado visualmente')}

 function disposeReferences(){
  if(!refGroup)return;
  refGroup.traverse(node=>{node.geometry?.dispose?.();if(node.material){if(Array.isArray(node.material))node.material.forEach(x=>x.dispose?.());else node.material.dispose?.()}});
  api.scene.remove(refGroup);refGroup=null;
 }
 function refreshReferences(partIds=null){
  disposeReferences();if(!showRefs)return;
  const active=partIds||[api.current()?.id].filter(Boolean);
  refGroup=new THREE.Group();refGroup.name='Referencias de montaje V8';
  for(const id of active){const part=api.items().find(x=>x.id===id);if(!part)continue;
   const model=api.models.get(id);if(!model||!model.visible)continue;
   const size=Math.max(15,Math.min(55,Number(part.dims?.diameter||part.dims?.width||part.dims?.length||140)*.10));
   for(const anchor of referenceAnchors(part)){
    if(anchor.id.startsWith('ref:')&&anchor.id!=='ref:center')continue;
    const a=worldAnchor(part,anchor);
    const marker=new THREE.Mesh(new THREE.SphereGeometry(size*.18,10,8),new THREE.MeshBasicMaterial({color:anchor.kind==='shaft'?0x2be2c6:anchor.kind==='end'?0xe5ad62:0x61b9f0,depthTest:false}));
    marker.position.copy(a.position);marker.renderOrder=800;refGroup.add(marker);
    const arrow=new THREE.ArrowHelper(a.normal,a.position,size,0x63e2d3,size*.21,size*.13);arrow.renderOrder=800;refGroup.add(arrow);
   }
  }
  api.scene.add(refGroup);api.render();
 }
 function renderAssemblyPanel(body){
  const pieces=api.items(),card=section(body,'Restricciones mecánicas','Selecciona dos piezas. Montaje calcula la alineación y la mantiene cuando cambia el equipo principal. Unidades: mm y grados.');
  if(pieces.length<2){card.append(elm('p',{class:'studio-warning'},'Inserta dos piezas o abre una plantilla de tren de compresión antes de crear una unión.'));return;}
  const opts=pieces.map(p=>[p.id,p.name]);
  const child=select(card,'Pieza que se desplazará',opts),parent=select(card,'Pieza principal / referencia',opts);child.id='assemblyChild';parent.id='assemblyParent';
  const current=api.current();if(current)child.value=current.id;
  if(parent.value===child.value){const next=pieces.find(p=>p.id!==child.value);if(next)parent.value=next.id}
  const rule=select(card,'Tipo de relación',CONSTRAINT_KINDS.map(x=>[x.id,x.label]));rule.id='assemblyType';
  const desc=elm('p',{class:'studio-muted'});card.append(desc);
  const anchors=elm('div',{class:'studio-constraint-anchors'});card.append(anchors);
  let ownControl=null,targetControl=null;
  function updateAnchors(){anchors.replaceChildren();
   const c=pieces.find(x=>x.id===child.value),p=pieces.find(x=>x.id===parent.value);
   if(!c||!p)return;
   ownControl=select(anchors,'Referencia de la pieza',referenceAnchors(c).map(a=>[a.id,a.label]));ownControl.id='assemblyOwnAnchor';
   targetControl=select(anchors,'Referencia del objetivo',referenceAnchors(p).map(a=>[a.id,a.label]));targetControl.id='assemblyTargetAnchor';
   const candidates=referenceAnchors(c).filter(a=>a.id.startsWith('port:')&&(['shaft','end','axis'].includes(a.kind)));
   const targets=referenceAnchors(p).filter(a=>a.id.startsWith('port:')&&(['shaft','end','axis'].includes(a.kind)));
   if(candidates.length&&targets.length&&rule.value==='coaxial'){ownControl.value=candidates[0].id;targetControl.value=targets[targets.length-1].id}
   else if(rule.value==='face'){ownControl.value='ref:x-';targetControl.value='ref:x+'}
   else{ownControl.value='ref:center';targetControl.value='ref:center'}
   desc.textContent=CONSTRAINT_KINDS.find(x=>x.id===rule.value)?.description||'';
  }
  child.onchange=updateAnchors;parent.onchange=updateAnchors;rule.onchange=updateAnchors;updateAnchors();
  const controls=elm('div',{class:'studio-constraint-values'});card.append(controls);
  const offset=input(controls,'Separación (mm)','number',0),twist=input(controls,'Giro sobre eje (°)','number',0),angle=input(controls,'Inclinación (°)','number',0);offset.id='assemblyOffset';twist.id='assemblyTwist';angle.id='assemblyAngle';
  [offset,twist,angle].forEach(x=>{x.step='0.5';x.min='-50000';x.max='50000'});angle.max='180';
  const actions=elm('div',{class:'studio-inline studio-v8-actions'});card.append(actions);
  action(actions,'Crear restricción',()=>{try{
    const moving=pieces.find(p=>p.id===child.value),base=pieces.find(p=>p.id===parent.value);
    if(!moving||!base||moving.id===base.id)throw Error('Selecciona piezas diferentes');
    const mate=createConstraint(api.items(),moving.id,base.id,{kind:rule.value,ownAnchor:ownControl.value,targetAnchor:targetControl.value,offset:Number(offset.value),twist:Number(twist.value),angle:Number(angle.value)});
    api.checkpoint();delete moving.joint;moving.constraint=mate;
    const solved=solveAssembly(api.items());if(solved.errors.length)throw Error(solved.errors.join('; '));
    api.refreshScene();api.selectPart(moving.id);api.focusSelected();showToast('Montaje '+rule.value+' aplicado · dependencia guardada');openTools('assembly');
   }catch(err){showToast('No se creó la restricción: '+err.message)}},'studio-action primary');
  action(actions,'Mostrar referencias 3D',()=>{showRefs=!showRefs;refreshReferences([child.value,parent.value]);showToast(showRefs?'Referencias 3D visibles':'Referencias ocultas')});
  const list=section(body,'Relaciones activas','Las piezas dependientes siguen a su referencia. Puedes separarlas sin eliminar los sólidos.');
  let total=0;for(const p of pieces){if(!p.constraint)continue;total++;
   const target=pieces.find(x=>x.id===p.constraint.targetId),row=elm('div',{class:'studio-v8-relation'});
   const title=elm('div',{class:'studio-v8-relation-main'});
   title.append(elm('strong',{},p.name),elm('small',{},`${CONSTRAINT_KINDS.find(x=>x.id===p.constraint.kind)?.label||p.constraint.kind} → ${target?.name||'Referencia no encontrada'}`));row.append(title);
   action(row,'Ver',()=>{api.selectPart(p.id);api.focusSelected();refreshReferences([p.id,target?.id].filter(Boolean))},'studio-action');
   action(row,'Separar',()=>{api.checkpoint();delete p.constraint;api.refreshScene();showToast('Pieza desvinculada sin perder su posición');openTools('assembly')},'studio-danger');list.append(row);
  }
  if(!total)list.append(elm('p',{class:'studio-muted'},'Todavía no hay restricciones. Puedes conectar un eje de motor con el eje de una caja multiplicadora.'));
  const mover=section(body,'Desplazar conjunto rígido','Mueve la bancada o el equipo principal y las piezas vinculadas seguirán su posición.');
  const moving=select(mover,'Pieza raíz',opts);if(current)moving.value=current.id;
  const dims=elm('div',{class:'studio-constraint-values'});mover.append(dims);
  const dx=input(dims,'X (mm)','number',200),dy=input(dims,'Y (mm)','number',0),dz=input(dims,'Z (mm)','number',0);
  const whole=elm('label',{class:'studio-v8-checkbox'});const check=elm('input',{type:'checkbox'});check.checked=true;whole.append(check,elm('span',{},'Mover todo el tren si pertenece a un conjunto'));mover.append(whole);
  action(mover,'Desplazar y conservar restricciones',()=>{try{api.checkpoint();const count=shiftRigidGroup(api.items(),moving.value,[Number(dx.value),Number(dy.value),Number(dz.value)],{includeAssembly:check.checked});api.refreshScene();api.fitScene();showToast(count+' componentes desplazados')}catch(e){showToast(e.message)}},'studio-action primary');
  const info=section(body,'Alcance técnico','Las referencias genéricas representan ejes y caras ideales. Las restricciones se guardan en el archivo JSON; no realizan cálculos de carga, flexión o tolerancia mecánica.');
  info.append(elm('p',{class:'studio-muted'},'La V8 resuelve árboles de relaciones rígidas. Las libertades de movimiento dinámico, engranes y mecanismos articulados completos quedan para una etapa posterior.'));
 }
 async function renderCollisionPanel(body){
  const opts=section(body,'Interferencias entre superficies','Busca cruces geométricos triangulares con aceleración BVH. Usa una comprobación de cajas solo para descartar pares lejanos.');
  const tolerance=input(opts,'Tolerancia mínima para ignorar contacto superficial (mm)','number',1);tolerance.id='interferenceTolerance';tolerance.min='0';tolerance.max='100';tolerance.step='.25';
  const chk=elm('label',{class:'studio-v8-checkbox'});const skip=elm('input',{type:'checkbox'});skip.checked=true;chk.append(skip,elm('span',{},'No evaluar piezas ya conectadas por una unión o restricción'));opts.append(chk);
  const chk2=elm('label',{class:'studio-v8-checkbox'});const same=elm('input',{type:'checkbox'});same.checked=false;chk2.append(same,elm('span',{},'Ignorar pares del mismo tren de compresión'));opts.append(chk2);
  const status=elm('p',{class:'studio-v8-progress',role:'status',id:'interferenceStatus'},'Listo para analizar las piezas visibles.');opts.append(status);
  const result=section(body,'Resultados','Cruces de superficies confirmados y casos que requieren revisión por contención o por límites de cálculo.');
  action(opts,'Analizar interferencias 3D',async()=>{
   status.textContent='Explorando geometría del ensamblaje…';result.replaceChildren(elm('h3',{},'Resultados'));
   const button=opts.querySelector('button');if(button)button.disabled=true;
   try{const report=await scanInterferences(api.items(),api.models,{tolerance:Math.max(0,Number(tolerance.value)||0),excludeConnected:skip.checked,excludeSameAssembly:same.checked,maxPairs:25000,maxNarrowTests:900,
    onProgress:p=>status.textContent=`Analizadas ${p.seen}/${p.total} parejas · ${p.collisions} cruces · ${p.uncertain} pendientes`});
    status.textContent=`${report.collisions.length} cruces de superficies · ${report.uncertain.length} casos por revisar · ${report.skipped} pares omitidos${report.truncated?' · informe parcial por límite':''}.`;
    function showRows(rows,label,tone){result.append(elm('h4',{class:tone},label+' · '+rows.length));
     if(!rows.length){result.append(elm('p',{class:'studio-muted'},'Sin resultados en esta categoría.'));return}
     for(const row of rows.slice(0,70)){const item=elm('div',{class:'studio-v8-collision'});
      const data=elm('div');data.append(elm('strong',{},row.nameA+' × '+row.nameB),elm('small',{},`Profundidad aprox. de envolventes: ${row.depth} mm · ${row.level}`));item.append(data);
      action(item,'Ver A',()=>{api.selectPart(row.a);api.focusSelected()},'studio-action');
      action(item,'Ver B',()=>{api.selectPart(row.b);api.focusSelected()},'studio-action');result.append(item)}
    }
    showRows(report.collisions,'Cruces de mallas','studio-v8-severe');showRows(report.uncertain,'Revisión pendiente','studio-v8-caution');
   }catch(e){status.textContent='No se pudo completar: '+e.message;showToast(status.textContent)}finally{if(button)button.disabled=false}
  },'studio-action primary');
  const limitations=section(body,'Cómo interpretar la inspección','El cruce de triángulos detecta interferencias de superficies. Puede no detectar un sólido totalmente contenido dentro de otro, superficies abiertas o colisiones menores que la tolerancia.');
  limitations.append(elm('p',{class:'studio-muted'},'No equivale a una validación dimensional, a una revisión de tolerancias o a una intersección volumétrica B-Rep. Se recomienda confirmar físicamente o mediante CAD exacto los resultados relevantes.'));
 }

 function openTools(tab='tree'){
  const panel=newPanel('Herramientas de ingeniería','Selecciona, inspecciona y documenta conjuntos mecánicos.',true);panel.dataset.panel='tree';const nav=elm('div',{class:'studio-tool-tabs'});const body=elm('div',{class:'studio-panel-body'});panel.append(nav,body);
  const tabs=[['workshop','Compresión V9'],['tree','Conjuntos'],['assembly','Montaje'],['collision','Interferencias'],['inspect','Inspección'],['brep','CAD exacto'],['cad','CAD malla'],['measure','Medición']];
  function switchTab(key){nav.replaceChildren();for(const [id,label] of tabs){const b=action(nav,label,()=>switchTab(id),'studio-tab'+(id===key?' active':''));}body.replaceChildren();panel.dataset.panel=key;
   if(key==='workshop'){renderV9Workshop(body,api,{explode,restoreExploded,close});return}
   if(key==='tree'){renderTree(body);return}
   if(key==='assembly'){renderAssemblyPanel(body);return}
   if(key==='collision'){renderCollisionPanel(body);return}
   if(key==='inspect'){const c=section(body,'Inspección y desarme','Oculta carcasas, muestra piezas internas y separa módulos para revisión visual.');
    action(c,'Aislar pieza seleccionada',()=>{const current=api.current();if(!current){showToast('Selecciona una pieza');return}for(const p of api.items())p.hidden=p.id!==current.id;api.refreshScene();api.focusSelected()},'studio-action primary');
    action(c,'Mostrar todos',()=>{for(const p of api.items()){p.hidden=false;p.hiddenByDefault=false}api.refreshScene();showToast('Todas las piezas visibles')});
    action(c,'Transparencia de carcasa',()=>{const current=api.current();if(!current){showToast('Selecciona primero una carcasa');return}const group=api.models.get(current.id);if(!group)return;group.traverse(mesh=>{if(mesh.isMesh){const mat=mesh.material;mat.transparent=true;mat.opacity=mat.opacity===.24?1:.24;mat.depthWrite=mat.opacity===1}});api.render();showToast('Transparencia aplicada al visor; no altera el archivo')});
    action(c,'Vista explosionada del conjunto',()=>{const current=api.current();const peers=api.items().filter(p=>current?.assemblyId&&p.assemblyId===current.assemblyId);if(peers.length<2){showToast('Selecciona una pieza de un tren de compresión');return}explode(peers)});
    action(c,'Rearmar conjunto',restoreExploded);
    const note=input(c,'Hallazgo / observación','text',current.notes);note.addEventListener('change',()=>{current.notes=note.value;changed()});
    return;}
   if(key==='brep'){
    const intro=section(body,'Motor B-Rep · OpenCascade','Construye sólidos matemáticos y archivos STEP sin convertir previamente una malla triangular. Ejecuta el cálculo en un Web Worker independiente.');
    const state=elm('p',{class:'studio-cad-status','role':'status'},'Motor bajo demanda · al crear una pieza se cargará OpenCascade WebAssembly por primera vez.');intro.append(state);
    const forms=section(body,'Croquis paramétricos y extrusión','Elige una geometría y modifica las medidas en milímetros.');
    const kind=select(forms,'Tipo de sólido',Object.entries(CAD_SOLIDS).map(([id,d])=>[id,d.label]));
    const fields=elm('div',{class:'studio-cad-fields'});forms.append(fields);
    const cadFieldNames={length:'Longitud (mm)',width:'Anchura (mm)',height:'Altura / espesor (mm)',diameter:'Diámetro exterior (mm)',holeDiameter:'Diámetro del taladro (mm)',wall:'Espesor de pared (mm)'};
    const inputRefs={};
    function updateFields(){fields.replaceChildren();for(const k of Object.keys(inputRefs))delete inputRefs[k];const spec=CAD_SOLIDS[kind.value];for(const key of spec.fields){const e=input(fields,cadFieldNames[key]||key,'number',spec.defaults[key]);e.min='.01';e.max='50000';e.step='.01';inputRefs[key]=e}}
    kind.onchange=updateFields;updateFields();
    function getSpec(){const spec={kind:kind.value};for(const [name,control] of Object.entries(inputRefs))spec[name]=Number(control.value);return validateCadSpec(spec)}
    const run=async(cb)=>{state.textContent='Calculando sólido B-Rep; el visor permanece disponible…';try{await cb();state.textContent='Operación completada. La pieza conserva su definición STEP exacta.';}catch(error){state.textContent='Error: '+error.message;showToast('CAD exacto: '+error.message)} };
    function insertBrep(model,label,source){const piece=api.standardPart('custom_mesh',api.items().length);piece.name=label.slice(0,80);piece.asset=model.asset;piece.pos=model.center;piece.dims=model.dims;piece.cad={kind:'brep',stepSource:model.stepSource,origin:model.center,spec:source};piece.metadata={source:'OpenCascade B-Rep',validation:'CONCEPTUAL SIN CERTIFICACIÓN',format:'STEP',unit:'mm'};api.checkpoint();api.appendPart(piece);api.selectPart(piece.id);api.focusSelected();showToast('Sólido B-Rep exacto creado · puedes exportarlo en STEP')}
    action(forms,'Crear sólido B-Rep',()=>run(async()=>{const spec=getSpec();const result=await cadCreate(spec);insertBrep(result,CAD_SOLIDS[spec.kind].label,spec)}),'studio-action primary');
    const current=api.current();
    if(current?.cad?.spec&&Object.hasOwn(CAD_SOLIDS,current.cad.spec.kind)){
     action(forms,'Cargar parámetros de pieza seleccionada',()=>{kind.value=current.cad.spec.kind;updateFields();for(const [key,e] of Object.entries(inputRefs))e.value=String(current.cad.spec[key]??CAD_SOLIDS[kind.value].defaults[key]);showToast('Parámetros de la pieza cargados')});
     action(forms,'Regenerar pieza seleccionada',()=>run(async()=>{const result=await cadCreate(getSpec());api.checkpoint();current.asset=result.asset;current.dims=result.dims;current.cad={kind:'brep',stepSource:result.stepSource,origin:result.center,spec:getSpec()};current.pos=result.center;delete current.joint;api.refreshScene();api.selectPart(current.id);api.focusSelected()}));
    }
    const formats=section(body,'Intercambio CAD STEP','STEP conserva la geometría B-Rep. Las mallas STL/GLB antiguas no pueden convertirse automáticamente en sólidos STEP exactos.');
    action(formats,'Importar modelo STEP / STP',()=>stepInput.click(),'studio-action primary');
    action(formats,'Exportar pieza B-Rep seleccionada (.step)',()=>run(async()=>{const p=api.current(),data=await cadExport(p);await api.sendFile(data.blob,data.name);showToast('Archivo STEP exportado correctamente')}));
    const exact=api.items().filter(x=>x.cad?.stepSource);
    const bools=section(body,'Booleanas B-Rep exactas','Unir, restar e intersectar. Sólo piezas con definición STEP; deben tener rotación 0° para esta versión.');
    if(exact.length<2)bools.append(elm('p',{class:'studio-warning'},'Necesitas dos sólidos CAD exactos. Crea bloques, cilindros o importa archivos STEP.'));
    const opts=exact.map(p=>[p.id,p.name]);const first=select(bools,'Sólido A',opts),second=select(bools,'Sólido B',opts);if(opts.length>1)second.selectedIndex=1;
    const operation=select(bools,'Operación',[['fuse','Unión B-Rep'],['cut','Restar B de A'],['intersect','Intersección B-Rep']]);
    action(bools,'Ejecutar booleana exacta',()=>run(async()=>{const a=api.items().find(p=>p.id===first.value),b=api.items().find(p=>p.id===second.value);if(!a||!b||a.id===b.id)throw Error('Elige dos sólidos distintos');const result=await cadBoolean(a,b,operation.value);insertBrep(result,'B-Rep '+operation.value+' · '+a.name,{kind:'boolean',operation:operation.value,sourceIds:[a.id,b.id]})}),'studio-action primary');
    const limitations=section(body,'Alcance de V7','El sólido STEP se genera con OpenCascade. La visualización sigue siendo una malla tessellada; los objetos industriales anteriores no se convierten automáticamente a B-Rep. El archivo STEP exporta una pieza, no el ensamblaje entero.');
    limitations.append(elm('p',{class:'studio-muted'},'Registra las tolerancias, materiales y verificaciones de fabricante antes de utilizar las piezas en documentación de fabricación.'));
    return;
   }
   if(key==='cad'){const c=section(body,'Operaciones de sólidos de malla','Unión, corte e intersección sobre primitivas herméticas. Experimental; NO es un motor B-Rep ni exporta STEP.');
    const primitives=api.items().filter(canBoolean);if(primitives.length<2){c.append(elm('p',{class:'studio-warning'},'Añade al menos dos sólidos: bloque, cilindro o esfera, desde Biblioteca → Sólidos CAD.'));}
    const opts=primitives.map(p=>[p.id,p.name]);const a=select(c,'Sólido A',opts),b=select(c,'Sólido B',opts);if(opts.length>1)b.selectedIndex=1;
    const op=select(c,'Operación',[['union','Unir sólidos (malla)'],['subtract','Restar B de A'],['intersect','Intersección']]);
    action(c,'Ejecutar operación CSG',()=>{try{const left=api.items().find(p=>p.id===a.value),right=api.items().find(p=>p.id===b.value);if(!left||!right||left.id===right.id)throw Error('Selecciona dos sólidos distintos');const r=booleanPieces(left,right,api.models.get(left.id),api.models.get(right.id),op.value);
      const piece=api.standardPart('custom_mesh',api.items().length);piece.asset=r.asset;piece.name=`${left.name} · ${op.value}`;piece.pos=r.center;piece.dims=r.dims;piece.metadata={system:'CAD experimental',validation:'MALLA',source:'CSG'};api.checkpoint();api.appendPart(piece);api.selectPart(piece.id);api.focusSelected();showToast('Malla booleana generada · comprueba la geometría antes de exportar');}
     catch(e){showToast('Operación no completada: '+e.message)}},'studio-action primary');
    const text=section(body,'Importación de modelos CAD','Admite STL/GLB. Para STEP/IGES hará falta instalar un núcleo B-Rep con conversión y revisión de unidades.');
    const units=select(text,'Unidades del archivo',[['mm','Milímetros'],['m','Metros'],['cm','Centímetros'],['in','Pulgadas']]);
    action(text,'Importar STL o GLB',()=>{fileInput.dataset.units=units.value;fileInput.click()},'studio-action primary');
    return;}
   if(key==='measure'){const c=section(body,'Medición entre equipos','Distancia libre entre cajas envolventes alineadas a ejes XYZ. Puede diferir de la distancia real entre superficies.');const opts=api.items().map(p=>[p.id,p.name]);const a=select(c,'Primera pieza',opts),b=select(c,'Segunda pieza',opts);if(opts.length>1)b.selectedIndex=1;const result=elm('div',{class:'studio-measure-result'},'Selecciona dos componentes y pulsa Medir.');c.append(result);
    action(c,'Medir distancia',()=>{const g1=api.models.get(a.value),g2=api.models.get(b.value);if(!g1||!g2||g1===g2){result.textContent='Selecciona dos piezas distintas';return}const A=new THREE.Box3().setFromObject(g1),B=new THREE.Box3().setFromObject(g2),gap=aabbGap(A,B),center=A.getCenter(new THREE.Vector3()).distanceTo(B.getCenter(new THREE.Vector3()));result.textContent=`Distancia mínima aproximada: ${format(gap)} mm · Entre centros: ${format(center)} mm`},'studio-action primary');
    const r=section(body,'Detección preliminar de interferencias','Intersección de cajas envolventes; falsos positivos para piezas cóncavas o huecas.');action(r,'Revisar envolventes',()=>{let count=0,pairs=[];const valid=api.items().filter(p=>!p.hidden);for(let i=0;i<valid.length;i++)for(let j=i+1;j<valid.length;j++){const A=api.models.get(valid[i].id),B=api.models.get(valid[j].id);if(A&&B&&new THREE.Box3().setFromObject(A).intersectsBox(new THREE.Box3().setFromObject(B))){count++;if(pairs.length<8)pairs.push(valid[i].name+' / '+valid[j].name)}}const p=elm('p',{class:'studio-warning'},`${count} pares de envolventes superpuestas. ${pairs.join('; ')}`);r.append(p);},'studio-action');
   }
  }
  switchTab(tab);
 }
 async function openDocs(){
  const panel=newPanel('Planos, cortes e informes · V10','Documentación técnica, registros de inspección, listas de materiales y planos SVG/PDF/DXF.',true);
  panel.dataset.panel='docs';const body=elm('div',{class:'studio-panel-body'});panel.append(body);
  renderEngineeringDocs(body,api,current,{notify:showToast,restoreExploded,explode,persist:schedulePersist});
 }
 stepInput.addEventListener('change',async()=>{const file=stepInput.files?.[0];if(!file)return;try{showToast('Importando B-Rep STEP…');const result=await cadImport(file);const part=api.standardPart('custom_mesh',api.items().length);part.name=file.name.replace(/\.(step|stp)$/i,'').slice(0,80);part.asset=result.asset;part.pos=result.center;part.dims=result.dims;part.cad={kind:'brep',stepSource:result.stepSource,origin:result.center,spec:{kind:'importSTEP',fileName:file.name}};part.metadata={sourceFile:file.name,sourceFormat:'STEP B-Rep',validation:'SIN VERIFICAR',unit:'mm'};api.checkpoint();api.appendPart(part);api.selectPart(part.id);api.focusSelected();showToast('STEP cargado en formato B-Rep · exportación disponible');close();}catch(e){console.error(e);showToast('Error STEP: '+e.message)}finally{stepInput.value=''}});
 fileInput.addEventListener('change',async()=>{const file=fileInput.files?.[0];if(!file)return;try{showToast('Procesando modelo 3D…');const imported=await importMeshFile(file,fileInput.dataset.units||'mm');const piece=api.standardPart('custom_mesh',api.items().length);piece.name=file.name.slice(0,75);piece.asset=imported.asset;piece.pos=imported.center;piece.dims=imported.dims;piece.metadata={sourceFile:file.name,sourceFormat:imported.sourceFormat,validation:'NO VERIFICADO'};api.checkpoint();api.appendPart(piece);api.selectPart(piece.id);api.focusSelected();showToast('Modelo STL/GLB importado. Revisa sus unidades y geometría.')}catch(e){console.error(e);showToast('Error de importación: '+e.message)}finally{fileInput.value=''}});
 railButtons.get('projects').onclick=openProjects;railButtons.get('trains').onclick=openTrains;railButtons.get('assembly').onclick=()=>openTools('assembly');railButtons.get('workshop').onclick=()=>openTools('workshop');railButtons.get('tools').onclick=()=>openTools('tree');railButtons.get('docs').onclick=openDocs;top.onclick=openProjects;
 window.addEventListener('keydown',e=>{if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();persist().then(()=>showToast('Proyecto guardado localmente'))}});
 renderSummary();return {snapshotMeta,restore,changed,openProjects,openTrains,openTools,openDocs,close,persist,openProjectFromHome,insertTrainPresetFromHome};
}