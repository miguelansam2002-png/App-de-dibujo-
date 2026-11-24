import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {normalizeDocumentMeta,normalizeInspectionRecord,addInspection,removeInspection,compileInspectionRows,inspectionsCSV,evidenceSummary,escapeHTML} from '../src3d/v10-records.js';
import {createEngineeringDrawingSVG,createDrawingDXF} from '../src3d/v10-drawings.js';
import {createEngineeringReportHTML} from '../src3d/v10-report.js';
import {createEngineeringReportPDF} from '../src3d/v10-pdf.js';
const sample=()=>{
 const part={id:'pieza-1',name:'Bloque prueba',type:'solid_block',pos:[0,0,0],rot:[0,0,0],dims:{length:100,width:40,height:60},assemblyName:'Bancada',metadata:{equipmentTag:'TEST-001',v9:{partNumber:'',drawingRef:'',validation:'CONCEPTUAL'}}};
 const group=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(100,60,40),new THREE.MeshStandardMaterial());group.add(mesh);group.updateWorldMatrix(true,true);
 return {parts:[part],models:new Map([[part.id,group]]),part};
};
test('identificación documental controla campos, revisión y estado',()=>{
 const doc=normalizeDocumentMeta({projectCode:'PR-003',documentCode:'PL-A3',status:'CONVALIDADO',drawingSize:'A4',sectionAxis:'z',sectionAt:'-12.5',preparedBy:'Inspector',title:'Carcasa <importante>',issueDate:'2026-02-30'});
 assert.equal(doc.status,'BORRADOR');assert.equal(doc.drawingSize,'A4');assert.equal(doc.sectionAt,-12.5);assert.equal(doc.issueDate.length,10);
 assert.equal(doc.title,'Carcasa <importante>');assert.equal(escapeHTML(doc.title),'Carcasa &lt;importante&gt;');
});
test('inspección conserva valor cero sin deducir conformidad ni aceptar JS en foto',()=>{
 const {parts,part}=sample();
 const r=addInspection(part,{id:'obs01',type:'DIMENSIONAL',measurement:'0',nominal:'0',lowerLimit:'-0.2',upperLimit:'0.2',unit:'mm',finding:'Medida verificada',outcome:'PENDIENTE',photoDataUrl:'javascript:alert(1)'});
 assert.equal(r.measurement,0);assert.equal(r.nominal,0);assert.equal(r.outcome,'PENDIENTE');assert.equal(r.photoDataUrl,'');assert.equal(compileInspectionRows(parts).length,1);
 assert.equal(evidenceSummary(parts).inspections,1);
 assert.match(inspectionsCSV(parts),/TEST-001/);assert.ok(removeInspection(part,'obs01'));assert.equal(compileInspectionRows(parts).length,0);
});
test('CSV protege celdas con valores tipo fórmula',()=>{
 const {parts,part}=sample();addInspection(part,{finding:'=HYPERLINK("evil")',outcome:'PENDIENTE'});
 assert.match(inspectionsCSV(parts),/"'=HYPERLINK/);
});
test('lámina A3 genera cuatro proyecciones con cotas, corte y cajetín seguro',()=>{
 const {parts,models}=sample();const svg=createEngineeringDrawingSVG(parts,models,{documentCode:'A-001',title:'Tubo <no ejecutar>',sectionAxis:'x',sectionAt:0,preparedBy:'Ingeniero',revision:'B'});
 assert.match(svg,/<svg/);assert.match(svg,/420mm/);assert.match(svg,/PLANTA/);assert.match(svg,/ALZADO/);assert.match(svg,/LATERAL/);assert.match(svg,/ISOMÉTRICA/);
 assert.match(svg,/CORTE X/);assert.match(svg,/100 mm/);assert.match(svg,/60 mm/);assert.match(svg,/40 mm/);assert.match(svg,/Tubo &lt;no ejecutar&gt;/);
 assert.doesNotMatch(svg,/<no ejecutar>/);assert.match(svg,/NO APTO PARA FABRICACIÓN/);
});
test('lámina A4 y DXF llevan milímetros y entidades LINE',()=>{
 const {parts,models}=sample();const svg=createEngineeringDrawingSVG(parts,models,{drawingSize:'A4',includeSection:false});
 assert.match(svg,/297mm/);assert.match(svg,/210mm/);
 const dxf=createDrawingDXF(parts,models,{documentCode:'DWG-41'});
 assert.match(dxf,/\$INSUNITS\n70\n4/);assert.match(dxf,/\nLINE\n/);assert.match(dxf,/PRELIMINAR - NO APTO/);assert.ok(dxf.endsWith('EOF\n'));
});
test('informe HTML incluye trazabilidad, observaciones y evita inyección',()=>{
 const {parts,part}=sample();addInspection(part,{finding:'<script>alert(1)</script>',outcome:'NO_CONFORME',reference:'PL-04'});
 const html=createEngineeringReportHTML(parts,{title:'Informe <HTML>',documentCode:'R-1',preparedBy:'Técnico'},t=>({label:t}));
 assert.match(html,/Informe &lt;HTML&gt;/);assert.match(html,/NO_CONFORME/);assert.match(html,/PL-04/);
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>alert/);
});
test('informe PDF generado con cabecera PDF y tablas reales',async()=>{
 const {parts}=sample();const blob=createEngineeringReportPDF(parts,{title:'Ensayo de compresor',documentCode:'I-1'},t=>({label:t}));
 assert.equal(blob.type,'application/pdf');const prefix=new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()).slice(0,8));assert.ok(prefix.startsWith('%PDF-'),prefix);
});