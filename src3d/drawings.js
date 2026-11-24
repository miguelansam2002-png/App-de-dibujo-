import * as THREE from 'three';
import {billOfMaterials,bomToCsv} from './studio-core.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(n)?Number(n.toFixed(1)).toLocaleString('es-ES'):'—';
const corners=b=>{const a=b.min,z=b.max;return [[a.x,a.y,a.z],[z.x,a.y,a.z],[z.x,z.y,a.z],[a.x,z.y,a.z],[a.x,a.y,z.z],[z.x,a.y,z.z],[z.x,z.y,z.z],[a.x,z.y,z.z]]};
const EDGES=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
function viewOf(point,mode){const [x,y,z]=point;if(mode==='front')return [x,-y];if(mode==='top')return [x,-z];if(mode==='side')return [z,-y];return [(.707*x-.707*z),(-.43*x-.43*z+.86*y)];}
function makeSheetView(models,mode,x,y,w,h,items){
 const bbox=new THREE.Box3();for(const group of models.values()){if(group.visible!==false)bbox.expandByObject(group)}if(bbox.isEmpty())bbox.set(new THREE.Vector3(-100,-100,-100),new THREE.Vector3(100,100,100));
 const pcs=corners(bbox).map(c=>viewOf(c,mode)),min=[Math.min(...pcs.map(x=>x[0])),Math.min(...pcs.map(x=>x[1]))],max=[Math.max(...pcs.map(x=>x[0])),Math.max(...pcs.map(x=>x[1]))];
 const scale=Math.min((w-52)/Math.max(100,max[0]-min[0]),(h-58)/Math.max(100,max[1]-min[1]));const sx=v=>x+26+(v-min[0])*scale,sy=v=>y+32+(v-min[1])*scale;
 const segments=[];let n=0;
 for(const p of items){const g=models.get(p.id);if(!g||g.visible===false)continue;const box=new THREE.Box3().setFromObject(g);if(box.isEmpty())continue;
  const cs=corners(box);for(const [a,b] of EDGES){const A=viewOf(cs[a],mode),B=viewOf(cs[b],mode);segments.push(`<path d="M${sx(A[0]).toFixed(1)} ${sy(A[1]).toFixed(1)} L${sx(B[0]).toFixed(1)} ${sy(B[1]).toFixed(1)}"/>`)}
  // Superficies: muestreo acotado de aristas de malla (vista conceptual, no proyección oculta CAD).
  g.updateMatrixWorld(true);g.traverse(child=>{if(!child.isMesh||n>2100)return;const geom=child.geometry;if(!geom?.getAttribute('position'))return;
   const pos=geom.getAttribute('position'),ix=geom.getIndex();const count=Math.min(ix?.count||pos.count,2500);const step=Math.max(3,Math.ceil(count/240)*3);let last;
   for(let k=0;k<count-3;k+=step){const ia=ix?ix.getX(k):k,ib=ix?ix.getX(k+1):k+1;const a=new THREE.Vector3().fromBufferAttribute(pos,ia).applyMatrix4(child.matrixWorld),b=new THREE.Vector3().fromBufferAttribute(pos,ib).applyMatrix4(child.matrixWorld);const A=viewOf(a.toArray(),mode),B=viewOf(b.toArray(),mode);segments.push(`<path d="M${sx(A[0]).toFixed(1)} ${sy(A[1]).toFixed(1)} L${sx(B[0]).toFixed(1)} ${sy(B[1]).toFixed(1)}" opacity=".35"/>`);n++}
  });
 }
 const label={front:'ALZADO',top:'PLANTA',side:'LATERAL',iso:'ISOMÉTRICA'}[mode];
 return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#9cb3c5" stroke-width="1"/><rect x="${x}" y="${y}" width="${w}" height="23" fill="#eaf3f8"/><text x="${x+12}" y="${y+16}" font-size="12" fill="#143b53" font-weight="bold">${label}</text><g stroke="#365d74" stroke-width=".65" fill="none" stroke-linecap="round">${segments.join('')}</g></g>`;
}
export function createDrawingSVG(items,models,title='Proyecto 3D',meta={}){
 const bounds=new THREE.Box3();for(const m of models.values())if(m.visible!==false)bounds.expandByObject(m);
 const dim=bounds.isEmpty()?new THREE.Vector3():bounds.getSize(new THREE.Vector3());const rows=billOfMaterials(items,p=>({label:p}));
 const W=1587,H=1122;
 const views=[makeSheetView(models,'top',38,98,960,385,items),makeSheetView(models,'front',38,493,960,385,items),makeSheetView(models,'side',1008,98,541,385,items),makeSheetView(models,'iso',1008,493,541,385,items)];
 const bom=rows.slice(0,9).map((r,i)=>`<text x="${56+i*0}" y="${929+i*15}" font-size="11" fill="#204456">${i+1}. ${esc(r.description).slice(0,34)}   ×${r.quantity}</text>`).join('');
 return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect x="22" y="22" width="1543" height="1078" fill="none" stroke="#27465d" stroke-width="2"/><rect x="32" y="30" width="1524" height="52" fill="#153c55"/><text x="49" y="59" font-family="Arial" font-size="22" fill="white" font-weight="bold">TRAZO TÉCNICO 3D — PLANO DE REFERENCIA</text>${views.join('')}<g font-family="Arial"><text x="54" y="904" font-size="14" fill="#254961" font-weight="bold">LISTA DE PIEZAS (PARCIAL)</text>${bom}<rect x="1007" y="897" width="543" height="170" fill="#f0f6fa" stroke="#56778a"/><text x="1022" y="922" font-size="17" font-weight="bold" fill="#143b53">${esc(title).slice(0,46)}</text><text x="1022" y="948" font-size="12" fill="#385d74">Conjunto de referencia · ${items.length} elementos</text><text x="1022" y="969" font-size="12" fill="#385d74">Envolvente X ${fmt(dim.x)} × Y ${fmt(dim.y)} × Z ${fmt(dim.z)} mm</text><text x="1022" y="994" font-size="12" fill="#385d74">Emitido: ${new Date().toISOString().slice(0,10)} · Unidades: mm</text><text x="1022" y="1017" font-size="12" fill="#385d74">Revisión: ${esc(meta.revision||'0')} · A3 horizontal</text><rect x="1020" y="1033" width="510" height="22" fill="#fff2e0"/><text x="1028" y="1049" font-size="11" fill="#8a5316" font-weight="bold">CONCEPTUAL · NO APTO PARA FABRICACIÓN</text></g></svg>`;
}
export function createReportHTML(items,title,notes,partDefinition){const rows=billOfMaterials(items,partDefinition),totals=rows.reduce((sum,r)=>sum+r.quantity,0);
 const body=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.description)}</td><td>${esc(r.assembly)}</td><td>${r.quantity}</td><td>${esc(Object.entries(r.dimensions).map(([k,v])=>k+'='+v).join(', '))}</td></tr>`).join('');
 return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)} · Informe</title><style>body{font-family:Arial,sans-serif;color:#193747;padding:35px;line-height:1.5}h1{color:#104e66}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #9fb9c8;padding:8px;text-align:left}th{background:#e3eff5}@media print{body{padding:10px}thead{display:table-header-group}}footer{margin-top:35px;color:#9a5708;font-weight:bold}.meta{background:#eef6fa;padding:18px;border-left:4px solid #168a9d}</style></head><body><h1>TRAZO TÉCNICO 3D</h1><h2>${esc(title)}</h2><div class="meta">Informe técnico preliminar · ${new Date().toLocaleDateString('es-ES')} · ${totals} piezas<br>Observaciones: ${esc(notes||'Sin observaciones')}</div><h3>Lista de materiales</h3><table><thead><tr><th>N°</th><th>Descripción</th><th>Conjunto</th><th>Cant.</th><th>Parámetros (mm)</th></tr></thead><tbody>${body}</tbody></table><footer>MODELOS CONCEPTUALES — NO HOMOLOGADOS. Verificar dimensiones, cargas, tolerancias y planos de fabricante antes de construir.</footer></body></html>`;
}
export {bomToCsv};