import * as THREE from 'three';

// A single lightweight WebGL context supplies small, lazy 3D previews.
// No external thumbnails, requests or unlicensed CAD files are required.
let renderer=null,scene=null,camera=null,observer=null,run=false;
const cache=new Map(),queue=[];
const MAX_PREVIEW_CACHE=100;
function setup(){
 if(renderer)return true;
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
  renderer.setPixelRatio(1);renderer.setSize(192,125,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();scene.background=new THREE.Color('#f1f6f9');
  camera=new THREE.PerspectiveCamera(35,192/125,.1,500000);
  scene.add(new THREE.HemisphereLight(0xf6fdff,0x8092a2,3));
  const l=new THREE.DirectionalLight(0xffffff,3.2);l.position.set(300,600,450);scene.add(l);
  const l2=new THREE.DirectionalLight(0xdceeff,1.1);l2.position.set(-300,-100,-400);scene.add(l2);
  return true;
 }catch(err){console.warn('Vista previa 3D no disponible:',err);renderer?.dispose();renderer=null;return false}
}
function renderPreview(type,makePart,releasePart,standardPart){
 if(cache.has(type))return cache.get(type);
 if(!setup())return null;
 let g;
 try{
  g=makePart(standardPart(type));scene.add(g);
  g.updateMatrixWorld(true);
  const bound=new THREE.Box3().setFromObject(g);
  const center=bound.getCenter(new THREE.Vector3()),size=bound.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.length())||size.length()<.01)throw Error('Modelo sin dimensiones');
  const radius=Math.max(size.length()*.5,20),distance=radius/Math.sin(THREE.MathUtils.degToRad(17.5))*1.35;
  const direction=new THREE.Vector3(1.2,.82,1.3).normalize();
  camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);
  camera.near=Math.max(.1,distance-radius*2);camera.far=Math.max(1000,distance+radius*3);camera.updateProjectionMatrix();
  renderer.clear();renderer.render(scene,camera);
  const url=renderer.domElement.toDataURL('image/png');
  cache.set(type,url);if(cache.size>MAX_PREVIEW_CACHE)cache.delete(cache.keys().next().value);
  return url;
 }catch(err){console.warn('No se pudo crear miniatura',type,err);return null}
 finally{if(g){scene.remove(g);releasePart(g)}}
}
function process(){
 run=false;let steps=0;
 while(queue.length&&steps++<2){
  const {type,element,makePart,releasePart,standardPart}=queue.shift();
  if(!element.isConnected)continue;
  const url=renderPreview(type,makePart,releasePart,standardPart);
  if(url){const img=document.createElement('img');img.className='part-thumb-image';img.src=url;img.alt='Previsualizacion 3D de '+type;img.draggable=false;element.replaceChildren(img);element.classList.add('preview-loaded')}
 }
 if(queue.length){run=true;setTimeout(process,50)}
}
function schedule(type,element,makePart,releasePart,standardPart){
 if(cache.has(type)){const img=document.createElement('img');img.className='part-thumb-image';img.src=cache.get(type);img.alt='Miniatura 3D';img.draggable=false;element.replaceChildren(img);element.classList.add('preview-loaded');return}
 if(queue.some(q=>q.type===type&&q.element===element))return;
 queue.push({type,element,makePart,releasePart,standardPart});
 if(!run){run=true;setTimeout(process,55)}
}
export function bindCatalogPreviews(target,makePart,releasePart,standardPart){
 if(observer)observer.disconnect();queue.length=0;
 const cards=[...target.querySelectorAll('.part-card[data-part-type]')];
 if(typeof IntersectionObserver!=='function')return;
 observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;const el=e.target,icon=el.querySelector('.part-icon');if(!icon||icon.classList.contains('preview-loaded'))continue;schedule(el.dataset.partType,icon,makePart,releasePart,standardPart);observer.unobserve(el)}},{root:target,rootMargin:'50px 0px',threshold:.01});
 cards.forEach(card=>observer.observe(card));
}