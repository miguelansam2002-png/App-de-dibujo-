// Smoke real de OpenCascade STEP: genera B-Rep en el navegador y lo exporta.
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import {strict as assert} from 'node:assert';
import {mkdir,readFile} from 'node:fs/promises';
const base='http://127.0.0.1:4174';
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4174','--strictPort'],{stdio:'ignore'});
let browser;
try{
 let alive=false;for(let i=0;i<100;i++){try{if((await fetch(base)).ok){alive=true;break}}catch{}await new Promise(r=>setTimeout(r,400))}assert.ok(alive,'Vite preview inaccesible');
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({acceptDownloads:true,viewport:{width:1400,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base);
 await page.locator('#viewport canvas').waitFor({timeout:30000});
 await page.getByRole('button',{name:'Ingeniería'}).click();
 await page.getByRole('button',{name:'CAD exacto',exact:true}).click();
 const status=page.locator('.studio-cad-status');
 await page.getByRole('button',{name:'Crear sólido B-Rep'}).click();
 await page.waitForFunction(()=>{const t=document.querySelector('.studio-cad-status')?.textContent||'';return t.includes('Operación completada')||t.startsWith('Error:')},null,{timeout:160000});
 const msg=await status.innerText();assert.ok(msg.includes('Operación completada'),msg);
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('trazo-tecnico-3d-project-v3'))?.items?.find(x=>x.cad?.stepSource));
 assert.ok(p?.cad?.stepSource?.length>600,'B-Rep STEP no quedó conservado');
 assert.equal(p.cad.kind,'brep');
 assert.equal(p.cad.spec.kind,'box');
 const step=Buffer.from(p.cad.stepSource,'base64').toString('utf8');
 assert.match(step,/ISO-10303-21|FILE_SCHEMA|HEADER/i,'No es un STEP legible');
 const exported=page.waitForEvent('download',{timeout:160000});
 await page.getByRole('button',{name:/Exportar pieza B-Rep seleccionada/}).click();
 const file=await exported;
 assert.match(file.suggestedFilename(),/\.step$/i);
 const download=await readFile(await file.path());assert.ok(download.length>500,'STEP exportado vacío');
 await mkdir('qa-screenshots',{recursive:true});
 await page.screenshot({path:'qa-screenshots/cad-exacto-v7.png'});
 assert.deepEqual(errors,[],`Errores JavaScript: ${errors.join(', ')}`);
 console.log('CAD B-Rep STEP V7 OK · pieza creada, guardada y exportada '+download.length+' bytes');
}finally{await browser?.close();server.kill('SIGTERM')}