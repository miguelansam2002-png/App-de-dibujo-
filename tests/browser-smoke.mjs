// Prueba de extremo a extremo del editor. Se ejecuta en GitHub Actions con Playwright + Chromium.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:4173';
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'ignore'});
let browser;
try{
  let online=false;
  for(let i=0;i<60;i++){
    try{const r=await fetch(base);if(r.ok){online=true;break}}catch{}
    await new Promise(r=>setTimeout(r,500));
  }
  assert.ok(online,'Servidor Vite de previsualización no arrancó');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  await mkdir('qa-screenshots',{recursive:true});
  const page=await browser.newPage({viewport:{width:1440,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base);await page.locator('#viewport canvas').waitFor({timeout:20000});
  await page.waitForTimeout(1700);
  assert.equal(await page.locator('.part-card').count(),99,'El catálogo debe mostrar 99 componentes');
  assert.equal((await page.locator('#status').innerText()).includes('Editor 3D V5 listo'),true);
  await page.waitForTimeout(600);
  assert.ok(await page.locator('.part-card[data-part-type]').count()===99,'Cada tarjeta debe ofrecer identificador');
  await page.screenshot({path:'qa-screenshots/desktop.png'});
  await page.locator('#librarySearch').fill('omega');
  assert.equal(await page.locator('.part-card').count(),1);
  await page.locator('.part-card').first().click();
  assert.equal(await page.locator('#elementCount').innerText(),'2');
  assert.ok((await page.locator('#selectedType').innerText()).includes('GRAPA OMEGA'));
  const added=await page.evaluate(()=>JSON.parse(localStorage.getItem('trazo-tecnico-3d-project-v3')));
  assert.equal(added.items[1].joint?.targetId,added.items[0].id,'La grapa debe montarse en la tubería sin posicionarla a mano');
  await page.locator('#posX').fill('275');await page.locator('#posX').dispatchEvent('change');
  assert.equal(Number(await page.locator('#posX').inputValue()),275);
  assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('trazo-tecnico-3d-project-v3')))).items[1].joint,undefined,'Mover manualmente separa la unión');
  await page.locator('[data-jog="X:1"]').click();
  assert.equal(Number(await page.locator('#posX').inputValue()),285);
  await page.screenshot({path:'qa-screenshots/omega.png'});
  // Al insertar una pieza debe centrarse automáticamente para que se vea claramente.
  await page.locator('#btnFocus').click();
  assert.ok(await page.locator('#viewport canvas').isVisible());
  await page.locator('#librarySearch').fill('tubería recta');await page.locator('.part-card').first().click();
  await page.locator('#npsSelect').selectOption('4');await page.locator('#applyNps').click();
  const inputs=await page.locator('#dimensionFields input').evaluateAll(a=>a.map(x=>Number(x.value)));
  assert.ok(inputs.includes(114.3),'NPS 4 debe establecer diámetro exterior 114.3 mm');
  await page.locator('#btnJoinTap').click();
  await page.locator('#objectList button').first().click();
  const linked=await page.evaluate(()=>JSON.parse(localStorage.getItem('trazo-tecnico-3d-project-v3')));
  assert.equal(linked.items[2].joint?.targetId,linked.items[0].id,'Unir tocando debe vincular la tubería');
  await page.locator('#btnDetach').click();
  const unlinked=await page.evaluate(()=>JSON.parse(localStorage.getItem('trazo-tecnico-3d-project-v3')));
  assert.equal(unlinked.items[2].joint,undefined,'Separar conserva pieza independiente');
  const tablet=await browser.newPage({viewport:{width:820,height:1180},hasTouch:true,isMobile:true,deviceScaleFactor:1}),mobileErrors=[];
  tablet.on('pageerror',e=>mobileErrors.push(String(e)));await tablet.goto(base);await tablet.locator('#viewport canvas').waitFor({timeout:20000});
  const dockOne=await tablet.locator('#dockJoin').boundingBox(),dockLast=await tablet.locator('#dockInspect').boundingBox();
  assert.ok(dockOne&&dockLast&&Math.abs(dockOne.y-dockLast.y)<3,'Los cinco botones de la barra táctil deben estar en una sola fila');
  await tablet.screenshot({path:'qa-screenshots/tablet.png'});
  await tablet.locator('#dockLibrary').click();
  assert.ok(await tablet.locator('#libraryPanel').evaluate(el=>el.classList.contains('open')));
  await tablet.waitForTimeout(340);await tablet.screenshot({path:'qa-screenshots/tablet-library.png'});
  assert.deepEqual(errors,[],'Errores JavaScript en escritorio');assert.deepEqual(mobileErrors,[],'Errores JavaScript en tableta');
  console.log('Pruebas UI V4: montaje automático, unión por toque, separación, catálogo, NPS y tableta');
}finally{if(browser)await browser.close();server.kill('SIGTERM')}