import * as THREE from 'three';
import {normalizeDocumentMeta,escapeHTML} from './v10-records.js';
import {billOfMaterials} from './studio-core.js';

// Geometria proyectada de las mallas CAD del proyecto. No hay eliminacion exacta
// de lineas ocultas ni tolerancias de fabricacion.
const W=1587,H=1122;
const E=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const round=n=>Number.isFinite(n)?n.toFixed(1):'0.0';
const dim=n=>Number.isFinite(n)?Number(n.toFixed(2)).toLocaleString('es-ES'):'—';
const project=(v,view)=>{
 const [x,y,z]=Array.isArray(v)?v:[v.x,v.y,v.z];
 switch(view){case 'top':return [x,-z];case 'front':return [x,-y];case 'side':return [z,-y];case 'iso':return [(x-z)*.7071068,-(x+z)*.408248+y*.816496];
 case 'cut-x':return [z,-y];case 'cut-y':return [x,-z];case 'cut-z':return [x,-y];default:return [x,-y]}
};
const bboxCorners=box=>{const a=box.min,b=box.max;return [[a.x,a.y,a.z],[b.x,a.y,a.z],[b.x,b.y,a.z],[a.x,b.y,a.z],[a.x,a.y,b.z],[b.x,a.y,b.z],[b.x,b.y,b.z],[a.x,b.y,b.z]]};
const boxSegments=box=>{const corners=bboxCorners(box);return E.map(([a,b])=>[corners[a],corners[b]])};
const boundsFor=(items,models,showHidden=false)=>{
 const entries=[];const bounds=new THREE.Box3();
 for(const part of items){const model=models.get(part.id);if(!model)continue;if(!showHidden&&(part.hidden||part.hiddenByDefault||model.visible===false))continue;
  model.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(model);if(box.isEmpty())continue;
  bounds.union(box);entries.push({part,model,box});
 }
 if(bounds.isEmpty())bounds.set(new THREE.Vector3(-100,-100,-100),new THREE.Vector3(100,100,100));
 return {entries,bounds};
};
const line=(a,b)=>`<path d="M ${round(a[0])} ${round(a[1])} L ${round(b[0])} ${round(b[1])}"/>`;
function visibleEdges(entries,view,maxSegments=12500){
 const segments=[];let count=0;
 for(const {model} of entries){
  model.traverse(o=>{
   if(!o.isMesh||!o.geometry?.getAttribute('position')||count>=maxSegments)return;
   let edges;
   try{edges=new THREE.EdgesGeometry(o.geometry,28)}catch{return}
   const pos=edges.getAttribute('position');if(!pos){edges.dispose();return}
   const step=Math.max(2,Math.ceil((pos.count/2)/Math.min(300,maxSegments-count))*2);
   for(let i=0;i+1<pos.count&&count<maxSegments;i+=step){
    const a=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
    const b=new THREE.Vector3().fromBufferAttribute(pos,i+1).applyMatrix4(o.matrixWorld);
    if(a.distanceToSquared(b)<1e-8)continue;
    segments.push([project(a,view),project(b,view)]);count++;
   }
   edges.dispose();
  });
 }
 return segments;
}
const bounds2=points=>{
 if(!points.length)return {min:[-10,-10],max:[10,10]};
 return {min:[Math.min(...points.map(x=>x[0])),Math.min(...points.map(x=>x[1]))],max:[Math.max(...points.map(x=>x[0])),Math.max(...points.map(x=>x[1]))]};
};
const transform=(bounds,rect,pad=48)=>{
 const {min,max}=bounds;
 const spanX=Math.max(1,max[0]-min[0]),spanY=Math.max(1,max[1]-min[1]);
 const scale=Math.min((rect.w-pad*2)/spanX,(rect.h-pad*2-18)/spanY);
 return {scale,sx:p=>rect.x+pad+(p[0]-min[0])*scale+((rect.w-pad*2)-spanX*scale)/2,
  sy:p=>rect.y+28+pad*.45+(p[1]-min[1])*scale+((rect.h-pad*1.75-28)-spanY*scale)/2};
};
const dimLine=(p1,p2,value,orientation='horizontal')=>{
 if(orientation==='horizontal'){
  const y=Math.max(p1[1],p2[1])+19;return `<g class="dimension" stroke="#0885a1" stroke-width="1"><path d="M${round(p1[0])} ${round(y-17)}v24 M${round(p2[0])} ${round(y-17)}v24 M${round(p1[0])} ${round(y)}H${round(p2[0])}"/><path d="M${round(p1[0])} ${round(y)}l7 -4v8z M${round(p2[0])} ${round(y)}l-7 -4v8z" fill="#0885a1"/></g><text x="${round((p1[0]+p2[0])/2)}" y="${round(y-4)}" font-size="12" text-anchor="middle" fill="#07506d" stroke="white" stroke-width="3" paint-order="stroke">${dim(value)} mm</text>`;
 }
 const x=Math.min(p1[0],p2[0])-21;return `<g class="dimension" stroke="#0885a1" stroke-width="1"><path d="M${round(x+15)} ${round(p1[1])}h-23 M${round(x+15)} ${round(p2[1])}h-23 M${round(x)} ${round(p1[1])}V${round(p2[1])}"/></g><text x="${round(x-6)}" y="${round((p1[1]+p2[1])/2)}" font-size="12" text-anchor="middle" fill="#07506d" stroke="white" stroke-width="3" paint-order="stroke" transform="rotate(-90 ${round(x-6)} ${round((p1[1]+p2[1])/2)})">${dim(value)} mm</text>`;
};
function panel(rect,title,body,label='PROYECCIÓN DE MALLAS'){
 return `<g font-family="Arial,sans-serif"><rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="white" stroke="#b0c3cd" stroke-width="1.3"/><rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="29" fill="#e7f0f5"/><text x="${rect.x+13}" y="${rect.y+20}" font-size="14" font-weight="bold" fill="#173b52">${title}</text><text x="${rect.x+rect.w-12}" y="${rect.y+19}" text-anchor="end" font-size="9" fill="#617d8f">${label}</text>${body}</g>`;
}
const layout={top:{x:40,y:102,w:932,h:351},front:{x:40,y:466,w:932,h:352},side:{x:985,y:102,w:558,h:238},iso:{x:985,y:352,w:558,h:237},cut:{x:985,y:601,w:558,h:217}};
function viewPanel(entries,box,kind,doc){
 const rect=layout[kind],corners=bboxCorners(box).map(x=>project(x,kind));
 const bound2=bounds2(corners),map=transform(bound2,rect,kind==='iso'?32:49);
 const strokes=[];
 for(const {box:b} of entries){for(const [a,c] of boxSegments(b)){
  const p1=project(a,kind),p2=project(c,kind);
  strokes.push(line([map.sx(p1),map.sy(p1)],[map.sx(p2),map.sy(p2)]));
 }}
 const mesh=doc.showMeshEdges?visibleEdges(entries,kind,kind==='iso'?4200:3600):[];
 const fine=mesh.map(([a,b])=>line([map.sx(a),map.sy(a)],[map.sx(b),map.sy(b)]));
 const span=box.getSize(new THREE.Vector3());const horizontal=kind==='side'?span.z:kind==='iso'?null:span.x;
 const vertical=kind==='front'||kind==='side'?span.y:kind==='top'?span.z:null;
 let dims='';
 if(doc.includeDimensions&&horizontal!==null){
  const start=[map.sx([bound2.min[0],bound2.max[1]]),map.sy([bound2.min[0],bound2.max[1]])];
  const end=[map.sx([bound2.max[0],bound2.max[1]]),map.sy([bound2.max[0],bound2.max[1]])];
  dims+=dimLine(start,end,horizontal);
 }
 if(doc.includeDimensions&&vertical!==null){
  const start=[map.sx([bound2.min[0],bound2.min[1]]),map.sy([bound2.min[0],bound2.min[1]])];
  const end=[map.sx([bound2.min[0],bound2.max[1]]),map.sy([bound2.min[0],bound2.max[1]])];
  dims+=dimLine(start,end,vertical,'vertical');
 }
 let balloons='';
 if(doc.showBalloons&&kind==='iso'){
  const max=12;
  for(const [i,{part,box:b}] of entries.slice(0,max).entries()){
   const ctr=b.getCenter(new THREE.Vector3()),p=project(ctr,kind),x=map.sx(p),y=map.sy(p);
   const bx=Math.min(rect.x+rect.w-26,Math.max(rect.x+25,x+(i%2?28:-25))),by=Math.min(rect.y+rect.h-22,Math.max(rect.y+42,y+(i%3?17:-18)));
   balloons+=`<path d="M${round(x)} ${round(y)}L${round(bx)} ${round(by)}" fill="none" stroke="#347e9c" stroke-width="1"/><circle cx="${round(bx)}" cy="${round(by)}" r="11" fill="white" stroke="#147d95"/><text x="${round(bx)}" y="${round(by+4)}" font-size="11" text-anchor="middle" fill="#135771" font-weight="bold">${i+1}</text>`;
  }
 }
 const title={top:'PLANTA · X–Z',front:'ALZADO · X–Y',side:'LATERAL · Z–Y',iso:'ISOMÉTRICA'}[kind];
 return panel(rect,title,`<g fill="none" stroke="#96a9b7" opacity=".6" stroke-width=".6">${strokes.join('')}</g><g fill="none" stroke="#204b64" stroke-width=".72" opacity=".77">${fine.join('')}</g>${dims}${balloons}`,'AJUSTE AUTOMÁTICO');
}

function crossEdge(a,b,axis,plane,eps=.00001){
 const p=a[axis]-plane,q=b[axis]-plane;
 if(Math.abs(p)<=eps&&Math.abs(q)<=eps)return null;
 if((p>eps&&q>eps)||(p<-eps&&q<-eps))return null;
 const t=(plane-a[axis])/(b[axis]-a[axis]);if(!Number.isFinite(t)||t<-eps||t>1+eps)return null;
 return a.clone().lerp(b,Math.min(1,Math.max(0,t)));
}
function cutMeshSegments(entries,axis,at,maxTriangles=30000){
 const segments=[];let n=0;
 for(const {model} of entries){
  model.traverse(mesh=>{
   if(!mesh.isMesh||n>=maxTriangles)return;
   const geo=mesh.geometry,pos=geo?.getAttribute('position'),ix=geo?.getIndex();if(!pos)return;
   const total=Math.floor((ix?.count||pos.count)/3);const stride=Math.max(1,Math.ceil(total/15000));
   for(let i=0;i<total&&n<maxTriangles;i+=stride){n++;
    const vs=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(pos,ix?ix.getX(i*3+j):i*3+j).applyMatrix4(mesh.matrixWorld));
    const edges=[[0,1],[1,2],[2,0]];const hits=[];
    for(const [a,b] of edges){const pt=crossEdge(vs[a],vs[b],axis,at);if(pt&&!hits.some(x=>x.distanceToSquared(pt)<1e-5))hits.push(pt)}
    if(hits.length>=2){segments.push([project(hits[0],'cut-'+axis),project(hits[1],'cut-'+axis)]);if(segments.length>9000)return}
   }
  });
 }
 return segments;
}
function sectionPanel(entries,box,doc){
 const rect=layout.cut,view='cut-'+doc.sectionAxis;
 const projections=bboxCorners(box).map(x=>project(x,view)),domain=bounds2(projections),map=transform(domain,rect,25);
 const cuts=doc.includeSection?cutMeshSegments(entries,doc.sectionAxis,doc.sectionAt):[];
 const paths=cuts.map(([a,b])=>line([map.sx(a),map.sy(a)],[map.sx(b),map.sy(b)])).join('');
 const empty=`<text x="${rect.x+rect.w/2}" y="${rect.y+rect.h/2}" text-anchor="middle" font-size="12" fill="#698093">${doc.includeSection?'Sin intersecciones en el plano seleccionado':'Sección no solicitada'}</text>`;
 return panel(rect,`CORTE ${doc.sectionAxis.toUpperCase()} = ${dim(doc.sectionAt)} mm`,`<g fill="none" stroke="#0c8598" stroke-width="1.4">${paths}</g>${cuts.length?'':empty}`,'CORTE DE MALLAS · NO B-REP');
}
export function createEngineeringDrawingSVG(items,models,rawDoc={},options={}){
 const doc=normalizeDocumentMeta(rawDoc),{entries,bounds}=boundsFor(items,models,doc.includeHidden),sz=bounds.getSize(new THREE.Vector3());
 const bom=billOfMaterials(items,()=>null);
 const rows=bom.slice(0,9).map((r,i)=>`<text x="55" y="${861+i*19}" font-size="12" fill="#28495a">${i+1}. ${escapeHTML(r.description).slice(0,49)} <tspan fill="#0c7890">×${r.quantity}</tspan></text>`).join('');
 const notes=escapeHTML(doc.notes||'Croquis de referencia — verificar datos del fabricante');
 const views=[viewPanel(entries,bounds,'top',doc),viewPanel(entries,bounds,'front',doc),viewPanel(entries,bounds,'side',doc),viewPanel(entries,bounds,'iso',doc),sectionPanel(entries,bounds,doc)].join('');
 const orig=doc.drawingSize==='A4'?[297,210]:[420,297];
 return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${orig[0]}mm" height="${orig[1]}mm" viewBox="0 0 ${W} ${H}">
 <rect width="${W}" height="${H}" fill="white"/><rect x="19" y="19" width="1549" height="1084" fill="none" stroke="#254e65" stroke-width="2"/>
 <rect x="30" y="30" width="1528" height="59" fill="#153f58"/><text x="51" y="67" font-family="Arial,sans-serif" font-size="25" font-weight="bold" fill="white">TRAZO TÉCNICO 3D · LÁMINA DE INGENIERÍA</text><text x="1539" y="65" text-anchor="end" font-family="Arial" font-size="12" fill="#cfe8ed">${escapeHTML(doc.documentCode||'SIN CÓDIGO')}</text>
 ${views}<g font-family="Arial,sans-serif"><text x="54" y="846" font-size="15" fill="#13445c" font-weight="bold">LISTA DE PIEZAS · MUESTRA (TOTAL ${items.length})</text>${rows}<text x="54" y="1050" font-size="11" fill="#6a7f8b">${notes.slice(0,115)}</text>
 <rect x="985" y="831" width="558" height="227" fill="#f0f5f7" stroke="#6d91a5" stroke-width="1.2"/>
 <rect x="985" y="831" width="558" height="38" fill="#cfdee8"/><text x="1001" y="854" font-size="18" font-weight="bold" fill="#173c52">${escapeHTML(doc.title).slice(0,50)}</text>
 <text x="1001" y="888" font-size="12" fill="#284d63">Proyecto: ${escapeHTML(doc.projectCode||'—')} · Doc: ${escapeHTML(doc.documentCode||'—')}</text>
 <text x="1001" y="909" font-size="12" fill="#284d63">Dimensiones X ${dim(sz.x)} · Y ${dim(sz.y)} · Z ${dim(sz.z)} mm</text>
 <text x="1001" y="930" font-size="11" fill="#284d63">Elaboró: ${escapeHTML(doc.preparedBy||'—').slice(0,40)} · Revisó: ${escapeHTML(doc.reviewedBy||'—').slice(0,39)}</text>
 <text x="1001" y="951" font-size="11" fill="#284d63">${doc.drawingSize} horizontal · ESCALA AJUSTADA · mm · Fecha: ${doc.issueDate}</text>
 <text x="1001" y="972" font-size="11" fill="#284d63">Revisión ${escapeHTML(doc.revision)} · Estado ${escapeHTML(doc.status)} · Hoja 1/1</text>
 <rect x="998" y="987" width="530" height="58" rx="3" fill="#fff1dc" stroke="#e9c993"/><text x="1008" y="1008" font-size="13" font-weight="bold" fill="#955713">PRELIMINAR · NO APTO PARA FABRICACIÓN</text>
 <text x="1008" y="1027" font-size="10.5" fill="#75512d">Proyección de mallas; revisar tolerancias y planos OEM.</text>
 </g></svg>`;
}
const dxfText=x=>String(x??'').replace(/[^\x20-\x7E]/g,' ').slice(0,120);
const dxfLine=(a,b,layer)=>`0\nLINE\n8\n${layer}\n10\n${round(a[0])}\n20\n${round(a[1])}\n30\n0\n11\n${round(b[0])}\n21\n${round(b[1])}\n31\n0\n`;
const dxfTextEnt=(t,x,y,size=15)=>`0\nTEXT\n8\nANNOTATIONS\n10\n${round(x)}\n20\n${round(y)}\n30\n0\n40\n${round(size)}\n1\n${dxfText(t)}\n`;
export function createDrawingDXF(items,models,rawDoc={}){
 const doc=normalizeDocumentMeta(rawDoc),{entries,bounds}=boundsFor(items,models,doc.includeHidden),span=bounds.getSize(new THREE.Vector3());
 const group=['top','front','side'];const offsets={top:[0,0],front:[0,-Math.max(300,span.z*1.5)],side:[Math.max(300,span.x*1.5),0]};
 const result=[];for(const kind of group){const layer=kind.toUpperCase(),off=offsets[kind];
  result.push(dxfTextEnt(layer,off[0],off[1]+90,28));
  for(const {box:b} of entries)for(const [a,c] of boxSegments(b)){
   const p1=project(a,kind),p2=project(c,kind);result.push(dxfLine([p1[0]+off[0],-p1[1]+off[1]],[p2[0]+off[0],-p2[1]+off[1]],layer));
  }
 }
 // DXF contains projected envelope contours only; not machinable CAD B-Rep outlines.
 result.push(dxfTextEnt('X '+dim(span.x)+' mm / Y '+dim(span.y)+' mm / Z '+dim(span.z)+' mm',0,-Math.max(600,span.z*1.7),19));
 result.push(dxfTextEnt(doc.documentCode||'TRAZO V10',0,-Math.max(650,span.z*1.9),19));
 result.push(dxfTextEnt('PRELIMINAR - NO APTO PARA FABRICACION',0,-Math.max(700,span.z*2.1),16));
 return `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${result.join('')}0\nENDSEC\n0\nEOF\n`;
}