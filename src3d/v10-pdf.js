import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
// svg2pdf exige DOM de navegador; cargar solo al solicitar un plano PDF.
import {billOfMaterials} from './studio-core.js';
import {normalizeDocumentMeta,compileInspectionRows,evidenceSummary} from './v10-records.js';

export async function drawingSVGtoPDF(svgSource,size='A3'){
 if(typeof DOMParser==='undefined')throw Error('Conversión PDF disponible en navegador, no Node.js');
 const mm=size==='A4'?[297,210]:[420,297];
 const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:size==='A4'?'a4':'a3',compress:true});
 const root=new DOMParser().parseFromString(svgSource,'image/svg+xml').documentElement;
 if(root.querySelector('parsererror'))throw Error('El SVG contiene caracteres no válidos');
 await import('svg2pdf.js');
 if(typeof pdf.svg!=='function')throw Error('El módulo de conversión vectorial SVG a PDF no está disponible');
 await pdf.svg(root,{x:0,y:0,width:mm[0],height:mm[1]});
 return pdf.output('blob');
}
const fmt=x=>x===null||x===undefined?'—':String(x);
const font=(pdf,size=10,weight='normal',color=[28,57,77])=>{pdf.setFont('helvetica',weight);pdf.setFontSize(size);pdf.setTextColor(...color)};
function header(pdf,title,doc,pageHint='INFORME DE INSPECCIÓN'){
 const w=210;
 pdf.setFillColor(20,62,84);pdf.rect(0,0,w,30,'F');
 font(pdf,9,'bold',[210,239,248]);pdf.text('TRAZO TÉCNICO 3D · DOCUMENTACIÓN DE INGENIERÍA',14,10);
 font(pdf,17,'bold',[255,255,255]);pdf.text(title.slice(0,48),14,21);
 font(pdf,9,'normal',[52,81,99]);pdf.text(`${pageHint} · ${doc.documentCode||'SIN CÓDIGO'} · REV ${doc.revision}`,14,39);
 pdf.setDrawColor(143,178,194);pdf.line(14,44,196,44);
}
function heading(pdf,text,y){font(pdf,12,'bold',[25,78,100]);pdf.text(text,14,y);pdf.setDrawColor(175,204,215);pdf.line(14,y+3,196,y+3);return y+11}
const tableStyle={font:'helvetica',fontSize:8,cellPadding:2.7,lineWidth:.15,lineColor:[174,197,211],textColor:[31,58,75],overflow:'linebreak'};
export function createEngineeringReportPDF(items=[],rawDoc={},partDefinition=()=>null){
 const doc=normalizeDocumentMeta(rawDoc),pdf=new jsPDF({format:'a4',unit:'mm',compress:true});
 const title=doc.title||'Informe técnico de ingeniería';header(pdf,title,doc);
 let y=52;font(pdf,9);const details=[`Proyecto: ${doc.projectCode||'—'}     Documento: ${doc.documentCode||'—'}`,`Fecha: ${doc.issueDate}     Revisión: ${doc.revision}     Estado: ${doc.status}`,`Elaboró: ${doc.preparedBy||'Pendiente'}     Revisó: ${doc.reviewedBy||'Pendiente'}`];
 for(const t of details){pdf.text(t.slice(0,112),14,y);y+=7}
 y=heading(pdf,'1. Alcance y resumen',y+5);
 font(pdf,9);const intro='Consolidado de componentes y registros de inspección. Modelo conceptual: requiere cotejo con planos OEM, criterios de aceptación y medidas reales.';
 const introLines=pdf.splitTextToSize(intro,180);pdf.text(introLines,14,y);y+=introLines.length*5+4;
 const stats=evidenceSummary(items);pdf.text(`Piezas: ${stats.items}    Inspecciones: ${stats.inspections}    Contrastados: ${stats.contrasted}`,14,y);y+=10;
 const notes=pdf.splitTextToSize(doc.notes||'Sin comentarios generales registrados.',180).slice(0,8);pdf.text(notes,14,y);y+=notes.length*5+8;
 y=heading(pdf,'2. Lista de componentes',y);
 const bom=billOfMaterials(items,partDefinition).slice(0,300);
 autoTable(pdf,{startY:y,head:[['#','Descripción','Cantidad','Conjunto','Dimensiones modelo (mm)']],body:bom.map((p,i)=>[i+1,p.description,p.quantity,p.assembly,Object.entries(p.dimensions).map(([k,v])=>`${k} ${v}`).join(' / ').slice(0,90)]),styles:tableStyle,headStyles:{fillColor:[31,91,116],textColor:[255,255,255],fontSize:8},margin:{left:14,right:14,bottom:19},theme:'grid',showHead:'everyPage'});
 pdf.addPage();header(pdf,title,doc,'TRAZABILIDAD DE COMPONENTES');
 const traces=items.map((p,i)=>[i+1,p.metadata?.equipmentTag||'—',p.name||p.type,p.metadata?.v9?.partNumber||'—',p.metadata?.v9?.drawingRef||'—',p.metadata?.v9?.validation||'CONCEPTUAL']);
 autoTable(pdf,{startY:51,head:[['#','Etiqueta','Componente','P/N','Plano/Manual','Estado']],body:traces,styles:tableStyle,headStyles:{fillColor:[31,91,116]},margin:{left:14,right:14,bottom:19},theme:'grid',showHead:'everyPage'});
 pdf.addPage();header(pdf,title,doc,'REGISTROS DE INSPECCIÓN');
 const inspections=compileInspectionRows(items);
 autoTable(pdf,{startY:51,head:[['Fecha','Pieza','Tipo','Hallazgo','Valor','Estado','Referencia']],body:inspections.map(x=>[x.date,x.tag||x.piece,x.type,x.finding.slice(0,160),`${fmt(x.measurement)} ${x.unit}`,x.outcome,x.reference.slice(0,90)]),styles:tableStyle,headStyles:{fillColor:[31,91,116]},margin:{left:14,right:14,bottom:19},theme:'grid',showHead:'everyPage'});
 const last=pdf.internal.getNumberOfPages();pdf.setPage(last);let sy=Math.min(253,(pdf.lastAutoTable?.finalY||52)+15);
 if(sy>263){pdf.addPage();sy=48}font(pdf,9,'bold',[123,77,27]);pdf.text('PRELIMINAR · NO APTO PARA FABRICACIÓN',14,sy);
 for(let n=1;n<=pdf.internal.getNumberOfPages();n++){pdf.setPage(n);font(pdf,8,'normal',[106,124,134]);pdf.text(`Emisión ${doc.issueDate} · Rev ${doc.revision}`,14,288);pdf.text(`${n} / ${pdf.internal.getNumberOfPages()}`,193,288,{align:'right'})}
 return pdf.output('blob');
}