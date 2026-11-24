import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {STLExporter} from 'three/addons/exporters/STLExporter.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {Capacitor} from '@capacitor/core';
import {Filesystem,Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {CATALOG,PIPE_SIZES,MATERIALS,partDefinition,DIMENSION_NAMES,INTEGER_DIMS,makePart,releasePart,standardPart} from './parts.js';
import {portsFor,bestJoint,jointFromIds,worldPort} from './connections.js';
import {bindCatalogPreviews} from './catalog-previews.js';
import './ui.css';

const $=id=>document.getElementById(id);
const KEY='trazo-tecnico-3d-project-v3';
const LEGACY_KEY='trazo-tecnico-3d-project-v2';
let interactionMode='move',joinSource=null,snapMarker=null;
const root=$('viewport');
let renderer,scene,camera,controls,transform,modelRoot,grid,axes,raycaster;
let items=[],selected=null,activeCategory='Todos',history=[],future=[],models=new Map(),touchStart=null,toastTimeout=0;
const MAX_ITEMS=500;
const CATALOG_REVISION='V5';
function notify(message){const el=$('toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.add('hidden'),3200)}
function status(message){$('status').textContent=message}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(getProject()))}catch(e){status('Usa Guardar para preservar el proyecto')}}
function getProject(){return {format:'trazo-tecnico-3d',version:4,units:'mm',name:$('projectName').value.trim()||'Proyecto 3D',items:structuredClone(items)}}
function checkpoint(){history.push(JSON.stringify(items));if(history.length>45)history.shift();future=[];refreshUndo()}
function refreshUndo(){$('undoBtn').disabled=!history.length;$('redoBtn').disabled=!future.length}
function normalizePart(p,index){const def=partDefinition(p?.type);if(!def)throw Error('Componente no reconocido');const dims={};for(const [k,v] of Object.entries(def.dims)){const input=Number(p?.dims?.[k]);dims[k]=Number.isFinite(input)?Math.max(1,Math.min(INTEGER_DIMS.has(k)?32:15000,INTEGER_DIMS.has(k)?Math.round(input):input)):v}const pos=[0,1,2].map(i=>{const n=Number(p?.pos?.[i]);return Number.isFinite(n)?Math.max(-100000,Math.min(100000,n)):0});const rot=[0,1,2].map(i=>{const n=Number(p?.rot?.[i]);return Number.isFinite(n)?Math.max(-3600,Math.min(3600,n)):0});const color=/^#[\da-fA-F]{6}$/.test(p?.color)?p.color:def.color;return {id:(typeof p?.id==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(p.id))?p.id:'import-'+index+'-'+Math.random().toString(36).slice(2,9),type:def.type,name:String(p?.name||def.label).slice(0,80),dims,pos,rot,color,joint:(p?.joint&&typeof p.joint.targetId==='string'&&typeof p.joint.selfPort==='string'&&typeof p.joint.targetPort==='string')?{targetId:p.joint.targetId,selfPort:p.joint.selfPort,targetPort:p.joint.targetPort}:undefined}}
function resolveJoints(){
 const index=new Map(items.map(p=>[p.id,p])),done=new Set(),visiting=new Set();
 const visit=(child)=>{
  if(done.has(child.id))return;
  if(visiting.has(child.id)){delete child.joint;return}
  visiting.add(child.id);
  const j=child.joint;
  if(j){const parent=index.get(j.targetId);
   if(!parent||parent===child||visiting.has(parent.id))delete child.joint;
   else {visit(parent);const next=jointFromIds(child,parent,j.selfPort,j.targetPort);
    if(next){child.pos=next.transform.pos;child.rot=next.transform.rot}else delete child.joint}
  }
  visiting.delete(child.id);done.add(child.id);
 };
 items.forEach(visit);
}
function syncModels(){
 resolveJoints();
 for(const p of items){const group=models.get(p.id);if(!group)continue;group.position.fromArray(p.pos);group.rotation.set(...p.rot.map(THREE.MathUtils.degToRad));}
 render();
}
function usedPorts(targetId,exceptId){return items.filter(p=>p.id!==exceptId&&p.joint?.targetId===targetId).map(p=>p.joint.targetPort)}
function createJoint(child,target,portA,portB){
 if(!child||!target||child.id===target.id)return null;
 let ancestor=target;const visited=new Set();
 while(ancestor){if(ancestor.id===child.id)return null;if(visited.has(ancestor.id))return null;visited.add(ancestor.id);ancestor=items.find(p=>p.id===ancestor.joint?.targetId)}
 return portA&&portB?jointFromIds(child,target,portA,portB):bestJoint(child,target,usedPorts(target.id,child.id));
}
function connectParts(sourceId,targetId,portA,portB){
 const child=items.find(p=>p.id===sourceId),target=items.find(p=>p.id===targetId);
 if(!child||!target||child.id===target.id){notify('Selecciona dos piezas diferentes');return false}
 const joint=createJoint(child,target,portA,portB);
 if(!joint){notify('Sin bocas compatibles: comprueba diámetro y tipo de pieza');return false}
 checkpoint();child.joint={targetId:joint.targetId,selfPort:joint.selfPort,targetPort:joint.targetPort};
 child.pos=joint.transform.pos;child.rot=joint.transform.rot;joinSource=null;$('btnJoinTap').classList.remove('armed');$('joinBtn').classList.remove('armed');
 refreshScene();selectPart(child.id);focusSelected();
 notify('✓ '+child.name+' unida a '+target.name+' · ambas piezas están vinculadas');return true;
}
function refreshJoinUI(){
 const part=items.find(p=>p.id===selected),panel=$('joinPanel');
 if(!panel)return;
 panel.classList.toggle('hidden',!part);
 if(!part)return;
 const target=$('joinTarget'),before=target.value;
 target.replaceChildren();
 for(const other of items){if(other.id===part.id||!portsFor(other).length)continue;
  const opt=document.createElement('option');opt.value=other.id;opt.textContent=other.name;target.append(opt)}
 if([...target.options].some(x=>x.value===before))target.value=before;
 const parent=items.find(p=>p.id===target.value);
 const own=$('joinOwnPort'),dest=$('joinTargetPort');own.replaceChildren();dest.replaceChildren();
 for(const port of portsFor(part)){const opt=document.createElement('option');opt.value=port.id;opt.textContent=port.label;own.append(opt)}
 if(parent)for(const port of portsFor(parent)){const opt=document.createElement('option');opt.value=port.id;opt.textContent=port.label;dest.append(opt)}
 const suggested=parent&&createJoint(part,parent);
 if(suggested){own.value=suggested.selfPort;dest.value=suggested.targetPort}
 $('btnJoinNow').disabled=!parent;
 $('btnDetach').disabled=!part.joint;
 $('jointStatus').textContent=part.joint?'Vinculada a '+(items.find(p=>p.id===part.joint.targetId)?.name||'otra pieza'):'Sin unión · usa conexión automática o selecciona las bocas';
}
function refreshScene(){resolveJoints();if(transform)transform.detach();for(const group of models.values()){modelRoot.remove(group);releasePart(group)}models.clear();for(const part of items){const group=makePart(part);group.position.fromArray(part.pos);group.rotation.set(...part.rot.map(THREE.MathUtils.degToRad));modelRoot.add(group);models.set(part.id,group)}updateSelection();updateList();updateCount();refreshJoinUI();saveLocal();render()}
function updateCount(){$('elementCount').textContent=items.length;$('pieceCounter').textContent=items.length+' piezas'}
function updateList(){const list=$('objectList');list.replaceChildren();for(const part of items){const b=document.createElement('button');b.className=part.id===selected?'selected':'';const def=partDefinition(part.type);const title=document.createElement('strong');title.textContent=(part.joint?'🔗 ':'')+part.name;const type=document.createElement('span');type.textContent=def?.category||'';b.append(title,type);b.addEventListener('click',()=>{if(joinSource&&joinSource!==part.id){connectParts(joinSource,part.id);closePanels()}else{selectPart(part.id);closePanels()}});list.append(b)}}
function selectPart(id){selected=items.some(x=>x.id===id)?id:null;updateSelection();updateList();refreshJoinUI();render()}
function updateSelection(){const data=items.find(p=>p.id===selected);$('emptyState').classList.toggle('hidden',!!data);$('inspectorContent').classList.toggle('hidden',!data);if(transform)transform.detach();for(const [id,group] of models){group.traverse(x=>{if(x.isMesh&&x.material?.emissive)x.material.emissive.setHex(id===selected?0x09283c:0x000000)})}if(!data){$('pipePresets').classList.add('hidden');return;}
 $('selectedType').textContent=partDefinition(data.type).label.toUpperCase();$('pieceName').value=data.name;$('pieceColor').value=data.color;const fields=$('dimensionFields');fields.replaceChildren();for(const [key,value] of Object.entries(data.dims)){const label=document.createElement('label');label.className='field';const name=document.createElement('span');name.textContent=DIMENSION_NAMES[key]||key;const input=document.createElement('input');input.type='number';input.min='1';input.max=INTEGER_DIMS.has(key)?'32':'15000';input.step=INTEGER_DIMS.has(key)?'1':'0.1';input.value=value;input.addEventListener('change',()=>{const n=Number(input.value);if(!Number.isFinite(n)||n<=0||n>15000){input.value=data.dims[key];notify('Introduce una medida válida');return}checkpoint();data.dims[key]=INTEGER_DIMS.has(key)?Math.round(Math.min(n,32)):n;if(data.dims.wall&&data.dims.diameter&&data.dims.wall>=data.dims.diameter/2){data.dims.wall=Math.max(1,Math.round(data.dims.diameter*.2*100)/100);notify('Se corrigió el espesor para mantener el interior hueco')}refreshScene()});label.append(name,input);fields.append(label)}for(const [prefix,arr] of [['pos',data.pos],['rot',data.rot]])['X','Y','Z'].forEach((axis,i)=>$(prefix+axis).value=Math.round(arr[i]*100)/100);if(transform&&models.has(selected)&&interactionMode==='rotate'){transform.attach(models.get(selected));transform.visible=true}document.querySelectorAll('#materialSwatches button').forEach(b=>b.classList.toggle('selected',b.dataset.color===data.color));$('pipePresets').classList.toggle('hidden',!(data.dims.diameter&&data.dims.wall));}
function valueChanged(){const data=items.find(x=>x.id===selected);if(!data)return;const pos=['X','Y','Z'].map(a=>Number($('pos'+a).value));const rot=['X','Y','Z'].map(a=>Number($('rot'+a).value));if([...pos,...rot].some(n=>!Number.isFinite(n)||Math.abs(n)>100000)){notify('Coordenadas no válidas');return}checkpoint();data.name=$('pieceName').value.slice(0,80)||data.name;data.color=$('pieceColor').value;const moved=pos.some((n,i)=>Math.abs(n-data.pos[i])>.001)||rot.some((n,i)=>Math.abs(n-data.rot[i])>.001);if(moved)delete data.joint;data.pos=pos;data.rot=rot;refreshScene()}
function addPart(type){if(items.length>=MAX_ITEMS){notify('Límite de '+MAX_ITEMS+' componentes para proteger el rendimiento');return}
 checkpoint();const part=standardPart(type,items.length);const s=getSnap()||10;
 // Insertar junto a las piezas existentes, nunca oculto dentro de un tubo grande.
 if(items.length){const reference=models.get(selected)||modelRoot;const bounds=new THREE.Box3().setFromObject(reference);const temp=makePart(part);const pbox=new THREE.Box3().setFromObject(temp),size=pbox.getSize(new THREE.Vector3());releasePart(temp);
  const referenceCenter=bounds.getCenter(new THREE.Vector3());part.pos=[Math.ceil((bounds.max.x+size.x*.5+Math.max(50,s*3))/s)*s,Math.round(referenceCenter.y/s)*s,Math.round(referenceCenter.z/s)*s];
 }else{part.pos=[Math.round(controls.target.x/s)*s,Math.round(controls.target.y/s)*s,Math.round(controls.target.z/s)*s]}
 const target=items.find(x=>x.id===selected)||(items.length===1?items[0]:null);
 let joined=false;
 if(target&&$('autoConnect')?.checked){const j=createJoint(part,target);if(j){part.joint={targetId:j.targetId,selfPort:j.selfPort,targetPort:j.targetPort};part.pos=j.transform.pos;part.rot=j.transform.rot;joined=true}}
 items.push(part);refreshScene();selectPart(part.id);focusSelected();
 status(joined?'Conexión creada con '+target.name+' · sigue añadiendo accesorios':'Añadido: '+part.name+' · selecciona Unir para conectar a otra pieza');
 if(innerWidth<=950){$('libraryPanel').classList.remove('open');$('inspectorPanel').classList.add('open')}}
function populateCatalog(){const tabs=$('categoryTabs');tabs.replaceChildren();for(const cat of ['Todos',...new Set(CATALOG.map(x=>x.category))]){const btn=document.createElement('button');btn.textContent=cat;btn.className=cat===activeCategory?'active':'';btn.onclick=()=>{activeCategory=cat;populateCatalog()};tabs.append(btn)}const target=$('partCatalog');target.replaceChildren();const q=$('librarySearch').value.trim().toLocaleLowerCase('es');const filtered=CATALOG.filter(p=>(activeCategory==='Todos'||p.category===activeCategory)&&(p.label+' '+p.hint+' '+p.type).toLocaleLowerCase('es').includes(q));$('catalogCount').textContent=filtered.length+' de '+CATALOG.length+' componentes';for(const part of filtered){const button=document.createElement('button');button.className='part-card';button.dataset.partType=part.type;const icon=document.createElement('span');icon.className='part-icon';icon.textContent=part.icon;const label=document.createElement('strong');label.textContent=part.label;const hint=document.createElement('small');hint.textContent=part.hint;button.append(icon,label,hint);button.addEventListener('click',()=>addPart(part.type));target.append(button)}if(!target.children.length){const p=document.createElement('p');p.textContent='No se encontraron componentes';target.append(p)}else bindCatalogPreviews(target,makePart,releasePart,standardPart)}
function focusSelected(){if(!selected||!models.get(selected)){fitScene();return}const obj=models.get(selected);const bound=new THREE.Box3().setFromObject(obj);const center=bound.getCenter(new THREE.Vector3());const dist=Math.max(bound.getSize(new THREE.Vector3()).length()*1.65,330);const dir=camera.position.clone().sub(controls.target).normalize();controls.target.copy(center);camera.position.copy(center).addScaledVector(dir,dist);controls.update();render();}
function fitScene(){const bounds=new THREE.Box3().setFromObject(modelRoot);if(bounds.isEmpty()){controls.target.set(0,0,0);camera.position.set(1300,1050,1400)}else{const center=bounds.getCenter(new THREE.Vector3());const radius=bounds.getSize(new THREE.Vector3()).length();controls.target.copy(center);const length=Math.max(450,radius*1.05);camera.position.copy(center.clone().add(new THREE.Vector3(length,length*.76,length)))}camera.near=1;camera.far=300000;camera.updateProjectionMatrix();controls.update();render()}
function setView(name){const dist=Math.max(700,camera.position.distanceTo(controls.target));const dir={iso:[1,0.8,1],top:[0,1,0.001],front:[0,0,1],right:[1,0,0]}[name]||[1,1,1];camera.position.copy(controls.target).add(new THREE.Vector3(...dir).normalize().multiplyScalar(dist));camera.up.set(0,1,0);controls.update();document.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===name));render()}
function render(){if(renderer&&scene)renderer.render(scene,camera)}
function example(){if(items.length&&!confirm('¿Sustituir el diseño actual por el ejemplo de tuberías?'))return;checkpoint();const config=[['pipe',[0,150,0]],['elbow',[675,150,75]],['flange',[-625,150,0]],['clamp_u',[0,150,0]],['pipe_shoe',[0,-85,0]],['valve',[1060,150,0]],['support',[-390,-190,0]],['flange_wn',[415,150,0]]];items=config.map(([type,pos],i)=>{const o=standardPart(type,i);o.pos=pos;return o});selected=null;$('projectName').value='Montaje de tubería y soportes';refreshScene();fitScene();notify('Ejemplo 3D cargado')}
function undo(){if(!history.length)return;future.push(JSON.stringify(items));items=JSON.parse(history.pop());selected=null;refreshScene();refreshUndo()}
function redo(){if(!future.length)return;history.push(JSON.stringify(items));items=JSON.parse(future.pop());selected=null;refreshScene();refreshUndo()}
function fileName(extension){return ($('projectName').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,55)||'trazo-tecnico')+'.'+extension}
async function sendFile(blob,name){if(Capacitor.isNativePlatform()){try{const buf=await blob.arrayBuffer();const bytes=new Uint8Array(buf);let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));const out=await Filesystem.writeFile({path:name,data:btoa(str),directory:Directory.Cache});await Share.share({title:'Trazo Técnico 3D',url:out.uri,dialogTitle:'Guardar o compartir '+name});status('Archivo compartido: '+name);return}catch(e){console.error(e);notify('No se pudo compartir el archivo en Android');return}}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status('Archivo exportado: '+name)}
async function exportFile(format){$('exportMenu').classList.add('hidden');try{if(format==='json'){await sendFile(new Blob([JSON.stringify(getProject(),null,2)],{type:'application/json'}),fileName('json'));return}if(format==='png'){render();const blob=await new Promise((resolve,reject)=>renderer.domElement.toBlob(b=>b?resolve(b):reject(Error('No se pudo generar imagen')),'image/png'));await sendFile(blob,fileName('png'));return}if(!items.length){notify('Primero incorpora una pieza');return}if(format==='stl'){const text=new STLExporter().parse(modelRoot);await sendFile(new Blob([text],{type:'model/stl'}),fileName('stl'));return}if(format==='glb'){const metric=modelRoot.clone(true);metric.scale.setScalar(0.001);const bytes=await new Promise((resolve,reject)=>new GLTFExporter().parse(metric,resolve,reject,{binary:true,onlyVisible:true}));await sendFile(new Blob([bytes],{type:'model/gltf-binary'}),fileName('glb'));return}}catch(err){console.error(err);notify('Error al exportar '+format+': '+err.message)}}
async function importProject(file){if(!file)return;try{if(file.size>3*1024*1024)throw Error('Archivo demasiado grande');const data=JSON.parse(await file.text());if(data.format!=='trazo-tecnico-3d'||!Array.isArray(data.items)||data.items.length>MAX_ITEMS)throw Error('Formato JSON no compatible con Trazo Técnico 3D');const next=data.items.map(normalizePart);checkpoint();items=next;selected=null;$('projectName').value=String(data.name||'Proyecto importado').slice(0,90);refreshScene();fitScene();notify('Diseño importado correctamente')}catch(e){notify('No se pudo importar: '+e.message)}}

function getSnap(){return $('snapToggle').checked?Number($('snapStep').value):0}
function setMode(mode){interactionMode=mode;for(const [name,id] of [['move','moveBtn'],['orbit','orbitBtn'],['rotate','rotateBtn']])$(id).classList.toggle('active',name===mode);if(mode==='rotate'){transform.setMode('rotate');if(selected&&models.get(selected))transform.attach(models.get(selected))}else transform.detach();$('dockMove').classList.toggle('active',mode==='move');$('dockView').classList.toggle('active',mode==='orbit');status(mode==='move'?'Modo MOVER: arrastra directamente una pieza sobre el plano seleccionado':mode==='orbit'?'Modo VISTA: gira el modelo con el dedo o el mouse':'Modo GIRAR: utiliza los aros o introduce los grados');}
function moveJog(axis,sign){const part=items.find(p=>p.id===selected);if(!part){notify('Selecciona una pieza para desplazarla');return}checkpoint();delete part.joint;const step=getSnap()||1;const index='XYZ'.indexOf(axis);part.pos[index]=Math.round((part.pos[index]+sign*step)*100)/100;refreshScene();status('Movida '+axis+(sign<0?' − ':' + ')+step+' mm')}
function applyNps(){const part=items.find(p=>p.id===selected),entry=PIPE_SIZES.find(p=>p.nps===$('npsSelect').value);if(!part||!entry)return;checkpoint();part.dims.diameter=entry.od;part.dims.wall=entry[$('scheduleSelect').value]||entry.s40;refreshScene();notify('NPS '+entry.nps+' / DN '+entry.dn+' aplicado')}
function populatePresets(){const select=$('npsSelect');for(const p of PIPE_SIZES){const o=document.createElement('option');o.value=p.nps;o.textContent='NPS '+p.nps+' in · DN '+p.dn+' · Ø '+p.od+' mm';select.append(o)}const palette=$('materialSwatches');for(const item of MATERIALS){const b=document.createElement('button');b.type='button';b.title=item.name;b.dataset.color=item.color;b.style.background=item.color;b.setAttribute('aria-label',item.name);b.onclick=()=>{const part=items.find(p=>p.id===selected);if(!part)return;checkpoint();part.color=item.color;refreshScene();notify('Acabado: '+item.name)};palette.append(b)}}
function setupTouchDock(){const btns={dockJoin:()=>armJoin(),dockLibrary:()=>{$('libraryPanel').classList.toggle('open');$('inspectorPanel').classList.remove('open')},dockMove:()=>{setMode('move');closePanels()},dockView:()=>{setMode('orbit');closePanels()},dockInspect:()=>{$('inspectorPanel').classList.toggle('open');$('libraryPanel').classList.remove('open')}};for(const [id,fn] of Object.entries(btns))$(id).addEventListener('click',fn);for(const [id,mode] of [['dockMove','move'],['dockView','orbit']])$(id).classList.toggle('active',mode===interactionMode)}

function armJoin(){
 if(joinSource){joinSource=null;$('btnJoinTap').classList.remove('armed');$('joinBtn').classList.remove('armed');notify('Unión cancelada');return}
 const part=items.find(p=>p.id===selected);
 if(!part){notify('Selecciona primero la pieza que deseas unir');return}
 if(!portsFor(part).length){notify('Esta pieza no dispone de puntos de unión automáticos');return}
 joinSource=part.id;$('btnJoinTap').classList.add('armed');$('joinBtn').classList.add('armed');
 closePanels();notify('Toca ahora la tubería o pieza destino · se alinearán automáticamente');
 status('UNIR: toca una pieza de destino o selecciónala en Elementos');
}
function setupEvents(){
 $('joinBtn').onclick=armJoin;$('btnJoinTap').onclick=armJoin;
 $('joinTarget').onchange=refreshJoinUI;
 $('btnJoinNow').onclick=()=>{const part=items.find(p=>p.id===selected);if(!part)return;const target=items.find(p=>p.id===$('joinTarget').value);if(!target)return;
  const own=$('joinOwnPort').value,other=$('joinTargetPort').value;
  if(own&&other)connectParts(part.id,target.id,own,other);else connectParts(part.id,target.id);
 };
 $('btnDetach').onclick=()=>{const part=items.find(p=>p.id===selected);if(!part?.joint)return;checkpoint();delete part.joint;refreshScene();notify('Pieza separada; posición conservada')};
 $('librarySearch').addEventListener('input',populateCatalog);$('btnExample').onclick=example;$('btnFit').onclick=fitScene;$('btnFocus').onclick=focusSelected;$('undoBtn').onclick=undo;$('redoBtn').onclick=redo;$('btnSave').onclick=()=>exportFile('json');$('btnOpen').onclick=()=>$('fileOpen').click();$('fileOpen').onchange=e=>{importProject(e.target.files[0]);e.target.value=''};$('projectName').addEventListener('change',saveLocal);
 $('btnNew').onclick=()=>{if(items.length&&!confirm('¿Crear nuevo proyecto? El actual podrá recuperarse si lo guardaste como JSON.'))return;checkpoint();items=[];selected=null;$('projectName').value='Nuevo diseño 3D';refreshScene();fitScene()};
 $('exportToggle').onclick=()=>$('exportMenu').classList.toggle('hidden');document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>exportFile(b.dataset.export));document.addEventListener('pointerdown',e=>{if(!$('exportMenu').contains(e.target)&&e.target!==$('exportToggle'))$('exportMenu').classList.add('hidden')});
 $('pieceName').addEventListener('change',valueChanged);$('pieceColor').addEventListener('change',valueChanged);for(const prefix of ['pos','rot'])for(const axis of ['X','Y','Z'])$(prefix+axis).addEventListener('change',valueChanged);
 $('btnDuplicate').onclick=()=>{const orig=items.find(x=>x.id===selected);if(!orig||items.length>=MAX_ITEMS)return;checkpoint();const next=normalizePart(orig,items.length);next.id='part-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);delete next.joint;next.name=orig.name+' copia';next.pos[0]+=80;items.push(next);refreshScene();selectPart(next.id)};
 $('btnDelete').onclick=()=>{if(!selected)return;checkpoint();items=items.filter(x=>x.id!==selected);for(const p of items)if(p.joint?.targetId===selected)delete p.joint;selected=null;joinSource=null;refreshScene()};
 $('snapStep').onchange=()=>{const step=getSnap();$('jogInfo').textContent=(step||1)+' mm';transform.setTranslationSnap(step||null)};$('movePlane').onchange=()=>status('Plano de movimiento: '+$('movePlane').selectedOptions[0].textContent);$('applyNps').onclick=applyNps;document.querySelectorAll('[data-jog]').forEach(b=>b.onclick=()=>{const [axis,sig]=b.dataset.jog.split(':');moveJog(axis,Number(sig))});document.querySelectorAll('[data-quickrotate]').forEach(b=>b.onclick=()=>{const p=items.find(x=>x.id===selected);if(!p)return;const [axis,angle]=b.dataset.quickrotate.split(':');checkpoint();delete p.joint;p.rot['XYZ'.indexOf(axis)]=(p.rot['XYZ'.indexOf(axis)]+Number(angle))%360;refreshScene()});$('gridToggle').onchange=e=>{grid.visible=e.target.checked;render()};$('axesToggle').onchange=e=>{axes.visible=e.target.checked;render()};$('snapToggle').onchange=()=>{transform.setTranslationSnap(getSnap()||null);$('jogInfo').textContent=(getSnap()||1)+' mm'};
 $('moveBtn').onclick=()=>setMode('move');$('orbitBtn').onclick=()=>setMode('orbit');$('rotateBtn').onclick=()=>setMode('rotate');setMode('move');
 document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>setView(btn.dataset.view));
 $('libraryToggle').onclick=()=>{$('libraryPanel').classList.toggle('open');$('inspectorPanel').classList.remove('open')};$('libraryClose').onclick=()=>$('libraryPanel').classList.remove('open');$('inspectorToggle').onclick=()=>{$('inspectorPanel').classList.toggle('open');$('libraryPanel').classList.remove('open')};$('inspectorClose').onclick=()=>$('inspectorPanel').classList.remove('open');setupTouchDock();
 window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(e.key==='Delete'&&selected){$('btnDelete').click()}else if(e.key==='Escape'){joinSource=null;$('joinBtn').classList.remove('armed');$('btnJoinTap').classList.remove('armed');selectPart(null);closePanels()}});
}
function closePanels(){$('libraryPanel').classList.remove('open');$('inspectorPanel').classList.remove('open')}
function init3d(){scene=new THREE.Scene();scene.background=new THREE.Color('#132a3b');camera=new THREE.PerspectiveCamera(46,1,1,300000);camera.position.set(1400,1100,1600);renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<=950?1.45:1.75));renderer.setSize(root.clientWidth,root.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;root.append(renderer.domElement);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.12;controls.screenSpacePanning=true;controls.minDistance=40;controls.maxDistance=110000;controls.maxPolarAngle=Math.PI*.96;controls.addEventListener('change',render);
 scene.add(new THREE.HemisphereLight(0xf4f9ff,0x536b79,2.3));const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(850,1800,1200);scene.add(key);const rim=new THREE.DirectionalLight(0xaee5e3,.9);rim.position.set(-900,400,-600);scene.add(rim);grid=new THREE.GridHelper(10000,100,0x608a9f,0x38566a);grid.position.y=-250;grid.material.transparent=true;grid.material.opacity=.30;scene.add(grid);axes=new THREE.AxesHelper(500);axes.visible=false;scene.add(axes);modelRoot=new THREE.Group();scene.add(modelRoot);
 transform=new TransformControls(camera,renderer.domElement);transform.setSize(1.05);transform.setTranslationSnap(10);transform.addEventListener('dragging-changed',e=>{controls.enabled=!e.value});transform.addEventListener('objectChange',()=>{const data=items.find(p=>p.id===selected),group=models.get(selected);if(!data||!group)return;data.pos=group.position.toArray().map(v=>Math.round(v*10)/10);data.rot=[group.rotation.x,group.rotation.y,group.rotation.z].map(v=>Math.round(THREE.MathUtils.radToDeg(v)*10)/10);for(const prefix of ['pos','rot'])for(let i=0;i<3;i++)$(prefix+['X','Y','Z'][i]).value=data[prefix][i];render()});let original=null;transform.addEventListener('mouseDown',()=>{original=JSON.stringify(items);const part=items.find(p=>p.id===selected);if(part)delete part.joint});transform.addEventListener('mouseUp',()=>{if(original&&original!==JSON.stringify(items)){history.push(original);if(history.length>45)history.shift();future=[];saveLocal();refreshUndo()}original=null});scene.add(transform.getHelper());raycaster=new THREE.Raycaster();

 const canvas=renderer.domElement;let drag=null;const touches=new Set();
 snapMarker=new THREE.Mesh(new THREE.SphereGeometry(12,18,12),new THREE.MeshBasicMaterial({color:0x5ff4be,transparent:true,opacity:.85,depthTest:false}));
 snapMarker.visible=false;snapMarker.renderOrder=100;scene.add(snapMarker);
 function dragSnapCandidate(current,pos,rot){
  const preview={...current,pos,rot},worldPerPixel=camera.position.distanceTo(new THREE.Vector3(...pos))*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*2/Math.max(100,root.clientHeight);
  const maxDistance=Math.max(22,Math.min(230,worldPerPixel*42));
  let best=null,minimum=Infinity;
  for(const target of items){if(target.id===current.id)continue;
   const joint=createJoint(preview,target);if(!joint)continue;
   const a=portsFor(preview).find(p=>p.id===joint.selfPort),b=portsFor(target).find(p=>p.id===joint.targetPort);
   if(!a||!b)continue;
   const distance=worldPort(preview,a).position.distanceTo(worldPort(target,b).position);
   if(distance<minimum&&distance<maxDistance){minimum=distance;best={joint,target,point:worldPort(target,b).position}}
  }
  return best;
 }
 function pointerRay(e){const rect=canvas.getBoundingClientRect();const point=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(point,camera);return raycaster.ray}
 function hitPart(e){pointerRay(e);const hits=raycaster.intersectObjects(modelRoot.children,true);if(!hits.length)return null;let obj=hits[0].object;while(obj&&!obj.userData.partId)obj=obj.parent;return obj?.userData.partId||null}
 function planeFor(part){const normal={xz:[0,1,0],xy:[0,0,1],yz:[1,0,0]}[$('movePlane').value]||[0,1,0];const n=new THREE.Vector3(...normal);const view=camera.getWorldDirection(new THREE.Vector3());if(Math.abs(view.dot(n))<.12)n.copy(view).negate();return new THREE.Plane().setFromNormalAndCoplanarPoint(n,new THREE.Vector3(...part.pos))}
 canvas.addEventListener('pointerdown',e=>{
  touches.add(e.pointerId);if(touches.size>1){drag=null;controls.enabled=true;return}
  if(e.button!==0||!e.isPrimary)return;const id=hitPart(e);
  if(joinSource&&id&&id!==joinSource){connectParts(joinSource,id);drag=null;return}
  if(id&&id!==selected)selectPart(id);
  if(!id||interactionMode!=='move'){drag=null;return}
  const part=items.find(x=>x.id===id),group=models.get(id);if(!part||!group)return;
  const plane=planeFor(part),at=new THREE.Vector3();if(!pointerRay(e).intersectPlane(plane,at))return;
  drag={id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,original:JSON.stringify(items),start:group.position.clone(),originalRot:[...part.rot],offset:group.position.clone().sub(at),plane,moved:false,candidate:null};
  controls.enabled=false;try{canvas.setPointerCapture(e.pointerId)}catch(err){}
 });
 canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.pointerId!==e.pointerId||touches.size>1)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5)return;
  if(!drag.moved){drag.moved=true;const item=items.find(p=>p.id===drag.id);if(item)delete item.joint}const at=new THREE.Vector3();if(!pointerRay(e).intersectPlane(drag.plane,at))return;
  const next=at.add(drag.offset);const snap=getSnap();if(snap>0)next.set(Math.round(next.x/snap)*snap,Math.round(next.y/snap)*snap,Math.round(next.z/snap)*snap);
  const data=items.find(x=>x.id===drag.id),group=models.get(drag.id);if(!data||!group)return;
  const candidate=dragSnapCandidate(data,next.toArray(),drag.originalRot);drag.candidate=candidate;
  if(candidate){data.pos=candidate.joint.transform.pos;data.rot=candidate.joint.transform.rot;
   group.position.fromArray(data.pos);group.rotation.set(...data.rot.map(THREE.MathUtils.degToRad));
   snapMarker.position.copy(candidate.point);snapMarker.visible=true;
   status('◉ Encaje detectado · suelta para unir con '+candidate.target.name);
  }else{data.pos=next.toArray().map(v=>Math.round(v*100)/100);data.rot=[...drag.originalRot];group.position.copy(next);
   group.rotation.set(...data.rot.map(THREE.MathUtils.degToRad));snapMarker.visible=false;
   status('Moviendo · X '+data.pos[0]+' · Y '+data.pos[1]+' · Z '+data.pos[2]+' mm');
  }
  ['X','Y','Z'].forEach((axis,i)=>{ $('pos'+axis).value=data.pos[i];$('rot'+axis).value=data.rot[i]});if(items.some(x=>x.joint?.targetId===drag.id))syncModels();else render();
 });
 function endDrag(e){touches.delete(e.pointerId);if(!drag||drag.pointerId!==e.pointerId){if(!touches.size&&interactionMode!=='rotate')controls.enabled=true;return}
  const old=drag.original,moved=drag.moved,candidate=drag.candidate,id=drag.id;drag=null;controls.enabled=true;snapMarker.visible=false;
  if(moved){const data=items.find(p=>p.id===id);if(data&&candidate)data.joint={targetId:candidate.joint.targetId,selfPort:candidate.joint.selfPort,targetPort:candidate.joint.targetPort};
   if(old!==JSON.stringify(items)){history.push(old);if(history.length>45)history.shift();future=[];refreshUndo()}
   syncModels();updateList();refreshJoinUI();saveLocal();status(candidate?'Piezas unidas y vinculadas · puedes seguir editando':'Pieza ubicada · posición guardada')}
  render()}
 canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
 const resize=new ResizeObserver(()=>{const w=root.clientWidth,h=root.clientHeight;if(w<1||h<1)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);render()});resize.observe(root);
 (function tick(){requestAnimationFrame(tick);controls.update()})();
}
function start(){try{init3d()}catch(err){console.error(err);root.textContent='Este dispositivo necesita WebGL compatible para mostrar modelos 3D. Actualiza Android System WebView.';notify('No se pudo iniciar el visor 3D');return}setupEvents();populatePresets();populateCatalog();try{const saved=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||'null');if(saved?.format==='trazo-tecnico-3d'&&Array.isArray(saved.items)&&saved.items.length<=MAX_ITEMS){items=saved.items.map(normalizePart);$('projectName').value=String(saved.name||'Diseño 3D').slice(0,90)}}catch(e){console.warn('No se pudo recuperar el guardado local',e)}if(!items.length){const part=standardPart('pipe');part.pos=[0,0,0];items=[part]}selected=items.at(-1)?.id||null;refreshScene();fitScene();refreshUndo();status('Editor 3D V5 listo · 99 modelos con vista previa 3D')}
start();