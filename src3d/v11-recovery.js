import {listRevisions,loadRevision,createRevision} from './project-store.js';
const element=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node};
export async function renderRecoveryPanel(parent,{projectId,getProject,checkpoint,replaceProject,restore,notify,refresh}){
 const section=element('section','studio-section');parent.append(section);section.append(element('h3','', 'Historial de recuperación · V11'),element('p','studio-muted','Crea puntos manuales y recupera hasta ocho versiones por proyecto. La recuperación reemplaza la escena actual, sin modificar los datos de otras copias.'));
 const save=element('button','studio-action primary','Crear punto de recuperación');save.type='button';section.append(save);
 save.onclick=async()=>{save.disabled=true;try{await createRevision(getProject(),'Punto de recuperación manual');notify('Punto de recuperación creado');refresh()}catch(error){notify('No se pudo guardar: '+error.message)}finally{save.disabled=false}};
 let versions=[];try{versions=await listRevisions(projectId)}catch(error){section.append(element('p','studio-warning','No se pudo cargar el historial: '+error.message));return}
 const list=element('div','studio-projects');section.append(list);
 for(const revision of versions){const row=element('article','studio-project-card');row.append(element('strong','',revision.label),element('span','',new Date(revision.savedAt).toLocaleString('es-ES')+' · '+revision.pieces+' piezas'));
 const button=element('button','studio-action','Restaurar esta versión');button.type='button';button.onclick=async()=>{if(!confirm('¿Restaurar esta versión? Se creará antes una copia del proyecto actual.'))return;button.disabled=true;try{const backup=getProject();await createRevision(backup,'Respaldo previo a restauración');const old=await loadRevision(revision.id);if(!old)throw Error('La revisión ya no está disponible');checkpoint();replaceProject(old);restore(old.meta);notify('Versión restaurada. Guarda el proyecto para conservarla.');refresh()}catch(error){notify('No se pudo restaurar: '+error.message)}finally{button.disabled=false}};row.append(button);list.append(row)}
 if(!versions.length)list.append(element('p','studio-muted','Todavía no hay puntos de recuperación. Crea uno antes de realizar cambios importantes.'));
}
