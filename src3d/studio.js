import * as THREE from 'three';
import {STUDIO_VERSION,uid,cleanProject,billOfMaterials,bomToCsv,groupByAssembly,aabbGap,assemblySummary} from './studio-core.js';
import {storeProject,listProjects,loadProject,deleteProject} from './project-store.js';
import {TRAIN_PRESETS,buildTrainPreset} from './train-presets.js';
import {importMeshFile,booleanPieces,canBoolean} from './mesh-tools.js';
import {createDrawingSVG,createReportHTML} from './drawings.js';
import './studio.css';
const by=id=>document.getElementById(id);
const elm=(tag,attrs={},text='')=>{const e=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>{if(k==='class')e.className=v;else if(k==='type')e.type=v;else e.setAttribute(k,v)});if(text)e.textContent=text;return e};
const safe=(v)=>String(v??'').slice(0,100);
const format=n=>Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:1});

export function createStudio(api){
 let current={id:uid(),category:'General',createdAt:new Date().toISOString(),notes:'',revision:'0'};
 let drawer=null,modal=null,timer=null,previewExplosion=null,measurePair=[],storeAvailable=true,activeProjectId=null;
 const root=by('viewportWrap');
 const backdrop=elm('div',{class:'studio-backdrop hidden',id:'studioBackdrop'});document.body.append(backdrop);
 const rail=elm('div',{class:'studio-rail',role:'toolbar','aria-label':'Herramientas de ingeniería'});
 const railActions=[['projects','▦','Proyectos'],['trains','⚙','Trenes'],['tools','⌘','Ingeniería'],['docs','▧','Planos']];
 const railButtons=new Map();for(const [id,icon,label] of railActions){const button=elm('button',{type:'button',class:'studio-rail-btn','aria-label':label});button.append(elm('span',{class:'studio-rail-icon'},icon),elm('span',{},label));rail.append(button);railButtons.set(id,button)}
 root.append(rail);
 const top=elm('button',{type:'button',class:'studio-project-button',title:'Abrir gestor de proyectos'},'▦  PROYECTOS');
 by('exportToggle')?.parentElement?.prepend(top);
 const selectBox=elm('div',{class:'studio-selection-hint hidden',id:'studioSelectionHint'});root.append(selectBox);
 const fileInput=elm('input',{type:'file',accept:'.stl,.glb,.gltf',style:'display:none'});document.body.append(fileInput);
 const showToast=s=>api.notify(s);
 const persist=async()=>{try{const proj=api.getProject();proj.meta={...current};await storeProject(proj);activeProjectId=current.id;storeAvailable=true;}catch(e){storeAvailable=false;api.status('Guardar proyecto JSON: el almacenamiento local no está disponible');}};
 function schedulePersist(){clearTimeout(timer);timer=setTimeout(()=>{persist()},1150)}
 function snapshotMeta(){return {...current,updatedAt:new Date().toISOString()}}
 function restore(meta){if(meta&&typeof meta==='object'){current={id:safe(meta.id)||uid(),category:safe(meta.category||'General'),notes:safe(meta.notes||''),createdAt:String(meta.createdAt||new Date().toISOString()),revision:String(meta.revision||'0')};}else current={id:uid(),category:'General',notes:'',createdAt:new Date().toISOString(),revision:'0'};schedulePersist();}
 function close(){if(drawer){drawer.remove();drawer=null}if(modal){modal.remove();modal=null}backdrop.classList.add('hidden');railButtons.forEach(b=>b.classList.remove('active'));}
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
 function changed(){renderSummary();if(drawer?.dataset.panel==='tree')renderTree(drawer.querySelector('.studio-panel-body'));schedulePersist()}
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
 }
 function openTrains(){const panel=newPanel('Trenes de compresión','Conjuntos paramétricos de estudio. Carcasa, rotor, transmisión, instrumentación y auxiliares.',true);panel.dataset.panel='trains';const body=elm('div',{class:'studio-panel-body'});panel.append(body);
  const hero=elm('div',{class:'studio-hero'});hero.append(elm('div',{class:'studio-eyebrow'},'BIBLIOTECA DE ENSAMBLAJES INDUSTRIALES'),elm('h3',{},'Modela equipos completos en minutos'),elm('p',{},'Modelos conceptuales originales, sin equivalencia certificada con equipos de fabricante. Puedes inspeccionar y editar todas sus piezas.'));body.append(hero);
  const cards=elm('div',{class:'studio-template-grid'});for(const t of TRAIN_PRESETS){const c=elm('div',{class:'studio-template-card'});c.append(elm('span',{class:'studio-template-icon'},t.icon),elm('strong',{},t.title),elm('p',{},t.subtitle),elm('small',{},`Envolvente de bancada: ${format(t.length)} mm`));action(c,'Insertar tren',async()=>{if(api.items().length>1&&!confirm('¿Añadir este tren al diseño actual? Puedes guardarlo antes.'))return;
   api.checkpoint();const preset=buildTrainPreset(t.id,api.standardPart,{offset:api.items().length>1?[0,0,-4800]:[0,0,0]});const preserved=api.items().length===1&&api.items()[0].type==='pipe'?[]:api.items();api.replaceItems([...preserved,...preset.items],by('projectName').value==='Nuevo diseño 3D'?preset.title:undefined);close();api.fitScene();showToast(`Tren añadido: ${preset.items.length} componentes`);
  },'studio-action primary');cards.append(c)}body.append(cards);
  const sub=section(body,'Explorar piezas individuales','Las familias nuevas están integradas en la biblioteca junto con los 99 componentes anteriores.');action(sub,'Abrir biblioteca 3D',()=>{close();by('libraryPanel').classList.add('open')});
 }
 function renderTree(body){if(!body)return;body.replaceChildren();const groups=groupByAssembly(api.items());for(const g of groups){const sec=section(body,`${g.name} · ${g.items.length}`,g.id==='_libres'?'Piezas independientes':'Conjunto manipulable de piezas');
  const list=elm('div',{class:'studio-tree-list'});for(const p of g.items){const row=elm('div',{class:'studio-tree-row'});const name=action(row,`${p.hidden?'◌':'◉'} ${p.joint?'🔗 ':''}${p.name}`,()=>{api.selectPart(p.id);api.focusSelected();renderSummary()},'studio-tree-select');row.append(elm('small',{},p.metadata?.equipmentTag||p.type));action(row,p.hidden?'Ver':'Ocultar',()=>toggleHidden(p.id),'studio-small');list.append(row)}sec.append(list);
  if(g.id!=='_libres'){const dx=elm('div',{class:'studio-inline'});const shift=input(dx,'Mover X (mm)','number','200');action(dx,'Desplazar conjunto',()=>{const value=Number(shift.value)||0;api.checkpoint();for(const p of g.items)p.pos[0]+=value;api.refreshScene();api.fitScene();showToast('Conjunto desplazado '+format(value)+' mm');},'studio-action');sec.append(dx);action(sec,'Vista explosionada',()=>explode(g.items),'studio-action');action(sec,'Volver a montar',restoreExploded,'studio-action');}}
 }
 function explode(pieces){if(previewExplosion)restoreExploded();previewExplosion=new Map();const ids=new Set(pieces.map(p=>p.id));let i=0;for(const p of pieces){const obj=api.models.get(p.id);if(!obj||!obj.visible)continue;previewExplosion.set(p.id,obj.position.clone());const offset=(i-Math.ceil(pieces.length/2))*Math.max(170,370);obj.position.x+=offset;obj.updateMatrixWorld();i++}api.render();showToast('Vista explosionada visual · no modifica las dimensiones del proyecto')}
 function restoreExploded(){if(previewExplosion){for(const [id,pos] of previewExplosion){const obj=api.models.get(id);if(obj)obj.position.copy(pos)}previewExplosion=null;api.render()}showToast('Conjunto rearmado visualmente')}
 function openTools(tab='tree'){
  const panel=newPanel('Herramientas de ingeniería','Selecciona, inspecciona y documenta conjuntos mecánicos.',true);panel.dataset.panel='tree';const nav=elm('div',{class:'studio-tool-tabs'});const body=elm('div',{class:'studio-panel-body'});panel.append(nav,body);
  const tabs=[['tree','Conjuntos'],['inspect','Inspección'],['cad','CAD experimental'],['measure','Medición']];
  function switchTab(key){nav.replaceChildren();for(const [id,label] of tabs){const b=action(nav,label,()=>switchTab(id),'studio-tab'+(id===key?' active':''));}body.replaceChildren();panel.dataset.panel=key;
   if(key==='tree'){renderTree(body);return}
   if(key==='inspect'){const c=section(body,'Inspección y desarme','Oculta carcasas, muestra piezas internas y separa módulos para revisión visual.');
    action(c,'Aislar pieza seleccionada',()=>{const current=api.current();if(!current){showToast('Selecciona una pieza');return}for(const p of api.items())p.hidden=p.id!==current.id;api.refreshScene();api.focusSelected()},'studio-action primary');
    action(c,'Mostrar todos',()=>{for(const p of api.items()){p.hidden=false;p.hiddenByDefault=false}api.refreshScene();showToast('Todas las piezas visibles')});
    action(c,'Transparencia de carcasa',()=>{const current=api.current();if(!current){showToast('Selecciona primero una carcasa');return}const group=api.models.get(current.id);if(!group)return;group.traverse(mesh=>{if(mesh.isMesh){const mat=mesh.material;mat.transparent=true;mat.opacity=mat.opacity===.24?1:.24;mat.depthWrite=mat.opacity===1}});api.render();showToast('Transparencia aplicada al visor; no altera el archivo')});
    action(c,'Vista explosionada del conjunto',()=>{const current=api.current();const peers=api.items().filter(p=>current?.assemblyId&&p.assemblyId===current.assemblyId);if(peers.length<2){showToast('Selecciona una pieza de un tren de compresión');return}explode(peers)});
    action(c,'Rearmar conjunto',restoreExploded);
    const note=input(c,'Hallazgo / observación','text',current.notes);note.addEventListener('change',()=>{current.notes=note.value;changed()});
    return;}
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
 async function openDocs(){const panel=newPanel('Planos y documentación','Exportación de láminas, listas de materiales e informes preliminares.',true);panel.dataset.panel='docs';const body=elm('div',{class:'studio-panel-body'});panel.append(body);
  const s=assemblySummary(api.items());const card=section(body,'Resumen del proyecto',`${s.pieces} piezas · ${s.assemblies} conjuntos · ${s.types} familias · ${s.linked} conexiones`);
  const rows=billOfMaterials(api.items(),api.partDefinition);const box=elm('div',{class:'studio-bom-table'});for(const row of rows.slice(0,50)){const r=elm('div');r.append(elm('strong',{},row.description),elm('span',{},'×'+row.quantity));box.append(r)}card.append(box);
  action(body,'Exportar plano A3 (SVG)',async()=>{try{restoreExploded();const svg=createDrawingSVG(api.items(),api.models,by('projectName').value,current);await api.sendFile(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),'trazo-plano-A3.svg');showToast('Lámina A3 exportada')}
    catch(e){showToast('Error al crear lámina: '+e.message)}},'studio-action primary');
  action(body,'Exportar lista de materiales CSV',async()=>{await api.sendFile(new Blob([bomToCsv(rows)],{type:'text/csv;charset=utf-8'}),'trazo-lista-materiales.csv')});
  action(body,'Exportar informe HTML para imprimir',async()=>{const report=createReportHTML(api.items(),by('projectName').value,current.notes,api.partDefinition);await api.sendFile(new Blob([report],{type:'text/html;charset=utf-8'}),'trazo-informe-tecnico.html')});
  action(body,'Guardar proyecto editable JSON',()=>api.exportFile('json'));
  body.append(elm('p',{class:'studio-warning'},'Las vistas son proyecciones visuales, no planos de fabricación con cotas y tolerancias homologadas.'));
 }
 fileInput.addEventListener('change',async()=>{const file=fileInput.files?.[0];if(!file)return;try{showToast('Procesando modelo 3D…');const imported=await importMeshFile(file,fileInput.dataset.units||'mm');const piece=api.standardPart('custom_mesh',api.items().length);piece.name=file.name.slice(0,75);piece.asset=imported.asset;piece.pos=imported.center;piece.dims=imported.dims;piece.metadata={sourceFile:file.name,sourceFormat:imported.sourceFormat,validation:'NO VERIFICADO'};api.checkpoint();api.appendPart(piece);api.selectPart(piece.id);api.focusSelected();showToast('Modelo STL/GLB importado. Revisa sus unidades y geometría.')}catch(e){console.error(e);showToast('Error de importación: '+e.message)}finally{fileInput.value=''}});
 railButtons.get('projects').onclick=openProjects;railButtons.get('trains').onclick=openTrains;railButtons.get('tools').onclick=()=>openTools('tree');railButtons.get('docs').onclick=openDocs;top.onclick=openProjects;
 window.addEventListener('keydown',e=>{if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();persist().then(()=>showToast('Proyecto guardado localmente'))}});
 renderSummary();return {snapshotMeta,restore,changed,openProjects,openTrains,openTools,openDocs,close,persist};
}