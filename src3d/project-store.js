import {MAX_PROJECTS} from './studio-core.js';
// Proyectos con IndexedDB: el contenido 3D no depende del límite de localStorage.
const NAME='trazo-tecnico-studio-v6';const STORE='projects';
function openDb(){return new Promise((resolve,reject)=>{if(!globalThis.indexedDB)return reject(new Error('IndexedDB no disponible'));
 const req=indexedDB.open(NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
}
async function transaction(mode,handler){const db=await openDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode);const store=tx.objectStore(STORE);handler(store,resolve,reject);tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
export async function listProjects(){const all=await transaction('readonly',(store,resolve,reject)=>{const q=store.getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});return all.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));}
export async function storeProject(project){if(!project.meta?.id)throw Error('Proyecto sin ID');const all=await listProjects();if(all.length>=MAX_PROJECTS&&!all.some(x=>x.id===project.meta.id))throw Error('Máximo de proyectos locales alcanzado');const now=new Date().toISOString();const row={id:project.meta.id,name:project.name,updatedAt:now,createdAt:project.meta.createdAt||now,pieces:project.items?.length||0,category:project.meta.category||'General',project};
 await transaction('readwrite',(store,resolve,reject)=>{const q=store.put(row);q.onsuccess=()=>resolve();q.onerror=()=>reject(q.error)});return row;}
export async function loadProject(id){return (await transaction('readonly',(store,resolve,reject)=>{const q=store.get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)}))?.project||null;}
export async function deleteProject(id){return transaction('readwrite',(store,resolve,reject)=>{const q=store.delete(id);q.onsuccess=()=>resolve();q.onerror=()=>reject(q.error)})}