/** Trazo Tecnico V8 - two-stage collision scanner: AABB broad phase and mesh BVH narrow phase.
 *  Does not claim exact B-Rep volume intersection or manufacturing clearance certification.
 */
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';

const treeCache=new WeakMap();
const boundsCache=new WeakMap();
const sleep=()=>new Promise(r=>setTimeout(r,0));
const pretty=n=>Math.round(n*100)/100;
const meshesOf=group=>{const result=[];group.traverse(o=>{if(o.isMesh&&o.visible!==false&&o.geometry?.attributes?.position?.count>=3)result.push(o)});return result};
const getTree=geometry=>{let tree=treeCache.get(geometry);if(!tree){tree=new MeshBVH(geometry,{maxLeafTris:16,strategy:0});treeCache.set(geometry,tree)}return tree};
function overlapBox(a,b,tolerance){const dx=Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x),dy=Math.min(a.max.y,b.max.y)-Math.max(a.min.y,b.min.y),dz=Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z);
 if(Math.min(dx,dy,dz)<=tolerance)return null;
 return {depth:pretty(Math.min(dx,dy,dz)),axes:[dx,dy,dz].map(pretty),volume:pretty(dx*dy*dz),boxA:a,boxB:b};
}
function meshOverlap(A,B,limit){
 const aMeshes=meshesOf(A),bMeshes=meshesOf(B),bBoxes=bMeshes.map(m=>new THREE.Box3().setFromObject(m));let tested=0;
 for(const a of aMeshes){const aBox=new THREE.Box3().setFromObject(a);for(let i=0;i<bMeshes.length;i++){
  if(!aBox.intersectsBox(bBoxes[i]))continue;
  if(++tested>limit)return {hit:false,incomplete:true,tests:tested};
  const b=bMeshes[i],gA=a.geometry,gB=b.geometry;
  if(!gA?.index&&!gA?.attributes?.position||!gB?.attributes?.position)continue;
  const countA=gA.index?.count||gA.attributes.position.count,countB=gB.index?.count||gB.attributes.position.count;
  if(countA>450000||countB>450000)return {hit:false,incomplete:true,tests:tested};
  try{const relative=new THREE.Matrix4().copy(a.matrixWorld).invert().multiply(b.matrixWorld);
   if(getTree(gA).intersectsGeometry(gB,relative))return {hit:true,incomplete:false,tests:tested};
  }catch{return {hit:false,incomplete:true,tests:tested}}
 }}
 return {hit:false,incomplete:false,tests:tested};
}
export function boundsOverlap(a,b,tolerance=.5){return overlapBox(a,b,tolerance)}
export function connected(parts,a,b){
 const lookup=new Map(parts.map(p=>[p.id,p]));
 const follows=(src,target)=>{let cur=lookup.get(src),seen=new Set();while(cur&&!seen.has(cur.id)){if(cur.id===target)return true;seen.add(cur.id);cur=lookup.get(cur.constraint?.targetId||cur.joint?.targetId)}return false};
 return follows(a,b)||follows(b,a);
}
export async function scanInterferences(parts,models,{tolerance=1,excludeConnected=true,excludeSameAssembly=false,maxPairs=25000,maxNarrowTests=600,onProgress=()=>{},signal=null}={}){
 const visible=parts.filter(p=>!p.hidden&&!p.hiddenByDefault&&models.has(p.id)&&models.get(p.id)?.visible!==false);
 const array=visible.map(p=>{const obj=models.get(p.id);obj.updateWorldMatrix(true,true);return {p,obj,box:new THREE.Box3().setFromObject(obj)}}).filter(x=>!x.box.isEmpty());
 const collisions=[],uncertain=[];let broad=0,narrow=0,seen=0,skipped=0;
 const max=Math.min(maxPairs,array.length*(array.length-1)/2);
 for(let i=0;i<array.length;i++)for(let j=i+1;j<array.length;j++){
  if(signal?.aborted)throw new Error('Exploracion cancelada');
  if(seen++>=max)return {collisions,uncertain,broad,narrow,skipped,processed:seen,truncated:true};
  const a=array[i],b=array[j];
  if(excludeSameAssembly&&a.p.assemblyId&&a.p.assemblyId===b.p.assemblyId){skipped++;continue}
  if(excludeConnected&&connected(parts,a.p.id,b.p.id)){skipped++;continue}
  if(a.box.distanceToPoint(b.box.getCenter(new THREE.Vector3()))>Math.max(b.box.getSize(new THREE.Vector3()).length(),a.box.getSize(new THREE.Vector3()).length())*2){continue}
  const intersect=overlapBox(a.box,b.box,tolerance);if(!intersect)continue;
  broad++;
  const available=Math.max(0,maxNarrowTests-narrow);
  const narrowResult=available?meshOverlap(a.obj,b.obj,available):{hit:false,incomplete:true,tests:0};narrow+=narrowResult.tests;
  const pair={a:a.p.id,b:b.p.id,nameA:a.p.name,nameB:b.p.name,depth:intersect.depth,overlapAxes:intersect.axes,overlapVolume:intersect.volume};
  if(narrowResult.hit){collisions.push({...pair,level:'surface-crossing'})}
  else if(narrowResult.incomplete||a.box.containsBox(b.box)||b.box.containsBox(a.box)){uncertain.push({...pair,level:narrowResult.incomplete?'review-required':'possible-containment'})}
  if((seen&31)===0){onProgress({seen,total:max,collisions:collisions.length,uncertain:uncertain.length});await sleep()}
 }
 collisions.sort((a,b)=>b.depth-a.depth);uncertain.sort((a,b)=>b.depth-a.depth);
 onProgress({seen,total:max,collisions:collisions.length,uncertain:uncertain.length});
 return {collisions,uncertain,broad,narrow,skipped,processed:seen,truncated:false};
}
export function clearanceFromBounds(groupA,groupB){
 const a=new THREE.Box3().setFromObject(groupA),b=new THREE.Box3().setFromObject(groupB);
 if(a.isEmpty()||b.isEmpty())return null;
 const axis=['x','y','z'].map(k=>Math.max(0,b.min[k]-a.max[k],a.min[k]-b.max[k]));
 return {axis:axis.map(pretty),gap:pretty(Math.hypot(...axis)),overlap:!!overlapBox(a,b,0)};
}