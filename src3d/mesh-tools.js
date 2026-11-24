import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ADDITION,SUBTRACTION,INTERSECTION,Brush,Evaluator} from 'three-bvh-csg';

const LIMIT=600000;
export function geometryAsAsset(raw,units='mm'){
 if(!raw?.getAttribute('position'))throw Error('El modelo no contiene vértices');
 const position=raw.getAttribute('position'),index=raw.getIndex();const count=index?index.count:position.count;
 if(count>LIMIT*3)throw Error('El modelo tiene demasiados triángulos para el editor');
 const scale=units==='m'?1000:units==='cm'?10:units==='in'?25.4:1;
 const arr=new Float32Array(count*3);
 for(let i=0;i<count;i++){const j=index?index.getX(i):i;arr[3*i]=position.getX(j)*scale;arr[3*i+1]=position.getY(j)*scale;arr[3*i+2]=position.getZ(j)*scale;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(arr,3));geo.computeVertexNormals();geo.computeBoundingBox();
 const center=geo.boundingBox.getCenter(new THREE.Vector3());geo.translate(-center.x,-center.y,-center.z);geo.computeBoundingBox();
 const size=geo.boundingBox.getSize(new THREE.Vector3());
 const asset={geometry:geo.toJSON(),sourceFormat:'mesh',triangles:count/3};geo.dispose();
 return {asset,center:center.toArray(),dims:{length:Math.max(.5,size.x),height:Math.max(.5,size.y),width:Math.max(.5,size.z)}};
}
export async function importMeshFile(file,units='mm'){
 const lower=file.name.toLowerCase(),bytes=await file.arrayBuffer();if(bytes.byteLength>32*1024*1024)throw Error('Archivo superior a 32 MB; utiliza un modelo simplificado');
 if(lower.endsWith('.stl')){
  const geo=new STLLoader().parse(bytes);const out=geometryAsAsset(geo,units);geo.dispose();return {...out,sourceFormat:'STL'};
 }
 if(lower.endsWith('.glb')||lower.endsWith('.gltf')){
  const result=await new Promise((resolve,reject)=>new GLTFLoader().parse(bytes,'',resolve,reject));const positions=[];
  result.scene.updateMatrixWorld(true);
  result.scene.traverse(obj=>{if(!obj.isMesh||!obj.geometry)return;const geo=obj.geometry,attr=geo.getAttribute('position'),indices=geo.getIndex(),n=indices?indices.count:attr.count;
   if(n+positions.length/3>LIMIT*3)throw Error('Modelo demasiado complejo');
   const local=new THREE.Vector3();for(let i=0;i<n;i++){const j=indices?indices.getX(i):i;local.fromBufferAttribute(attr,j).applyMatrix4(obj.matrixWorld);positions.push(local.x,local.y,local.z)}
  });
  if(!positions.length)throw Error('GLB sin geometría de malla');
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const out=geometryAsAsset(geo,units);geo.dispose();return {...out,sourceFormat:'GLB'};
 }
 throw Error('Formatos de malla admitidos: STL y GLB. STEP/IGES requiere un núcleo CAD B-Rep');
}
export function makeAssetModel(group,asset,color='#849aaa'){
 if(!asset?.geometry)throw Error('Geometría importada sin datos');
 const geo=new THREE.BufferGeometryLoader().parse(asset.geometry);
 const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,metalness:.62,roughness:.36,side:THREE.DoubleSide}));mesh.castShadow=true;group.add(mesh);
}
const PRIMITIVES=new Set(['solid_block','solid_cylinder','solid_sphere','custom_mesh']);
export function canBoolean(p){return PRIMITIVES.has(p?.type)}
export function booleanPieces(left,right,leftGroup,rightGroup,operation){
 if(!canBoolean(left)||!canBoolean(right))throw Error('Selecciona dos sólidos de la categoría CAD (bloque, cilindro, esfera o malla previa)');
 if(!['union','subtract','intersect'].includes(operation))throw Error('Operación no reconocida');
 const first=leftGroup.getObjectByProperty('isMesh',true),second=rightGroup.getObjectByProperty('isMesh',true);
 if(!first||!second)throw Error('No se encontró geometría de malla');
 first.updateWorldMatrix(true,false);second.updateWorldMatrix(true,false);
 const prepare=(m)=>{const geo=m.geometry.clone();geo.applyMatrix4(m.matrixWorld);geo.deleteAttribute('uv');geo.deleteAttribute('color');geo.clearGroups();if(!geo.getAttribute('normal'))geo.computeVertexNormals();const mat=new THREE.MeshStandardMaterial({color:'#8da6b8',metalness:.5,roughness:.4});const b=new Brush(geo,mat);b.updateMatrixWorld();return b};
 const a=prepare(first),b=prepare(second);
 try{
  const op=operation==='union'?ADDITION:operation==='subtract'?SUBTRACTION:INTERSECTION;
  const result=new Evaluator().evaluate(a,b,op);if(!result?.geometry?.getAttribute('position')?.count)throw Error('La operación produjo un sólido vacío');
  const geo=result.geometry.clone();const range=geo.drawRange; if(range.count!==Infinity&&range.count>0&&range.count<geo.getAttribute('position').count){/* drawRange retained; the operation is flagged experimental */}
  const asset=geometryAsAsset(geo);geo.dispose();result.geometry.dispose();
  return {...asset,sourceFormat:'CSG',experimental:true};
 }finally{a.geometry.dispose();b.geometry.dispose();a.material.dispose();b.material.dispose()}
}