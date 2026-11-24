import {bindCatalogPreviews,pauseCatalogPreviews} from './catalog-previews.js';
import {listProjects} from './project-store.js';
import {TRAIN_PRESETS} from './train-presets.js';
import './v12-shell.css';
import './v13-theme.css';

const h=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el};
const button=(cls,text,action)=>{const b=h('button',cls,text);b.type='button';b.addEventListener('click',action);return b};
const RECENT_KEY='trazo-v12-recents';
const favoritesKey='trazo-v12-favorites';
function readArray(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,20):[]}catch{return []}}
function writeArray(key,data){try{localStorage.setItem(key,JSON.stringify(data.slice(0,20)))}catch{}}
const intro=[['01','Selecciona una pieza','Busca en la biblioteca, elige el componente y pulsa Añadir.'],['02','Ajusta lo necesario','Selecciona el componente para editar medidas, material y posición.'],['03','Ensambla fácilmente','Usa Unir y toca la pieza destino para alinear conectores compatibles.'],['04','Guarda tu trabajo','Exporta el proyecto JSON y usa los puntos de recuperación.']];
export function createV12Shell({catalog,makePart,releasePart,standardPart,addPart,studio,notify,fitScene,renderScene,ensureViewport,setEditorActive}){
 let page='home',mode='all',search='',category='Todos',favorites=readArray(favoritesKey),recent=readArray(RECENT_KEY),firstDesign=true;
 const home=document.createElement('div');home.id='v12-shell';home.className='v12-shell';document.body.append(home);
 const quick=h('div','v12-quick');quick.id='v12-quick';document.body.append(quick);
 const advancedRail=document.querySelector('.studio-rail');if(advancedRail)document.body.append(advancedRail);
 const nav=h('nav','v12-nav');nav.setAttribute('aria-label','Navegación principal');
 const navItems=[['home','Inicio'],['library','Biblioteca 3D'],['projects','Proyectos'],['design','Estudio de diseño']];
 for(const [key,name] of navItems){const b=button('v12-nav-button',name,()=>go(key));b.dataset.page=key;nav.append(b)}
 document.querySelector('.topbar')?.prepend(nav);
 const getPart=type=>catalog.find(p=>p.type===type);
 function markRecent(type){recent=[type,...recent.filter(x=>x!==type)].slice(0,12);writeArray(RECENT_KEY,recent)}
 function pick(type){if(!getPart(type))return;markRecent(type);go('design');requestAnimationFrame(()=>requestAnimationFrame(()=>{addPart(type);ensureViewport?.();notify('Pieza añadida y visible en el diseño.')}))}
 function go(next){if(next==='design')pauseCatalogPreviews();else if(typeof palette!=='undefined')palette.hidden=true;page=next;setEditorActive?.(next==='design');document.body.classList.toggle('v12-design',next==='design');home.classList.toggle('v12-off',next==='design');
   nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.page===next);b.setAttribute('aria-current',b.dataset.page===next?'page':'false')});
   if(next==='design'){home.replaceChildren();if(firstDesign){firstDesign=false;setTimeout(()=>notify('Diseño listo: pulsa + Añadir pieza para comenzar'),350)}try{window.dispatchEvent(new Event('resize'))}catch{};requestAnimationFrame(()=>requestAnimationFrame(()=>{ensureViewport?.();renderScene?.()}));return}
   document.body.classList.remove('v12-parts','v12-inspector');studio?.close();render();
 }
 const heroBtn=(icon,title,desc,onClick,primary=false)=>{const b=button('v12-path'+(primary?' primary':''),'',onClick);b.append(h('div','v12-path-icon',icon),h('strong','',title),h('p','',desc),h('span','v12-path-cta','Abrir →'));return b};
 function head(parent,kicker,title,description){const intro=h('section','v12-head');intro.append(h('span','v12-kicker',kicker),h('h1','',title),h('p','',description));parent.append(intro)}
 function renderHome(){
 const content=h('main','v12-page');home.append(content);
 head(content,'TRAZO TÉCNICO 3D · STUDIO V13','¿Qué deseas hacer?','Dos espacios independientes. Explora modelos con tranquilidad o diseña con herramientas que aparecen cuando las necesitas.');
 const paths=h('section','v12-paths');
 paths.append(heroBtn('◈','Explorar biblioteca','Conoce piezas, equipos y trenes precargados sin alterar tu proyecto.',()=>go('library'),true),heroBtn('✦','Entrar al estudio','Crea, agrega, ensambla y modifica piezas en un espacio limpio.',()=>go('design')));
 paths.append(heroBtn('▦','Mis proyectos','Reabre tus trabajos y utiliza plantillas de equipos ya preparadas.',()=>go('projects')));
 content.append(paths);
 const bottom=h('div','v12-home-bottom');
 bottom.append(button('v12-secondary','▦ Mis proyectos',()=>go('projects')),button('v12-secondary','⚙ Trenes de compresión',()=>{go('design');studio.openTrains()}),button('v12-secondary','? Guía rápida',()=>{go('design');showGuide()}));
 content.append(bottom);
 const note=h('p','v12-footnote','Tus diseños siguen siendo editables. Los modelos precargados son conceptuales y no sustituyen documentación técnica certificada.');content.append(note);
 }
 function setFavorite(type){favorites=favorites.includes(type)?favorites.filter(x=>x!==type):[type,...favorites];writeArray(favoritesKey,favorites);render()}
 function renderCards(target,items,addLabel='Usar en diseño'){
 for(const part of items){const card=h('article','part-card v12-model-card');const preview=h('div','part-icon v12-model-preview',part.icon||'◇');const title=h('strong','',part.label);const hint=h('p','',part.hint||'Modelo conceptual editable');
 const label=h('span','v12-model-category',part.category);const actions=h('div','v12-model-actions');
 const fav=button('v12-fav'+(favorites.includes(part.type)?' chosen':''),favorites.includes(part.type)?'★':'☆',()=>setFavorite(part.type));fav.setAttribute('aria-label','Alternar favorito '+part.label);
 const open=button('v12-model-add','+ '+addLabel,()=>pick(part.type));actions.append(fav,open);
 card.append(preview,label,title,hint,actions);card.dataset.partType=part.type;target.append(card)}
 if(items.length)bindCatalogPreviews(target,makePart,releasePart,standardPart);
 else target.append(h('p','v12-no-results','No se encontraron modelos. Prueba otro nombre o categoría.'));
 }
 function renderLibrary(){
 const content=h('main','v12-page v12-library-page');home.append(content);
 head(content,'CATÁLOGO INDUSTRIAL · PIEZAS 3D','Explora antes de diseñar','Aquí puedes consultar los modelos disponibles. Sólo se añaden a tu diseño cuando pulsas “Usar en diseño”.');
 const toolbar=h('div','v12-filterbar');
 const input=h('input','v12-search');input.type='search';input.placeholder='Buscar compresor, rotor, tubería, bomba…';input.setAttribute('aria-label','Buscar modelos');input.value=search;input.oninput=()=>{search=input.value;updateList()};
 const types=h('div','v12-filter-pills');const filters=[['all','Todas'],['favorites','Favoritos'],['recent','Recientes']];
 for(const [key,label] of filters){const b=button('v12-pill'+(mode===key?' selected':''),label,()=>{mode=key;render()});types.append(b)}
 toolbar.append(input,types);content.append(toolbar);
 const categories=h('div','v12-categories');for(const name of ['Todos',...new Set(catalog.filter(p=>p.type!=='custom_mesh').map(p=>p.category))]){const b=button('v12-category'+(category===name?' active':''),name,()=>{category=name;render()});categories.append(b)}content.append(categories);
 const summary=h('div','v12-list-summary'),grid=h('div','v12-model-grid');content.append(summary,grid);
 function updateList(){const q=search.trim().toLocaleLowerCase('es');const list=catalog.filter(p=>p.type!=='custom_mesh'&&(category==='Todos'||p.category===category)&&(mode==='all'||(mode==='favorites'?favorites:recent).includes(p.type))&&(p.label+' '+p.hint+' '+p.type+' '+p.category).toLocaleLowerCase('es').includes(q));summary.textContent=list.length+' modelos · Miniaturas 3D · Catálogo original';grid.replaceChildren();renderCards(grid,list)}
 updateList();
 const trains=h('section','v12-trains');trains.append(h('h2','','Trenes de compresión listos para estudiar'));
 const presets=h('div','v12-train-cards');
 for(const t of TRAIN_PRESETS){const card=h('article','v12-train');card.append(h('span','','⚙'),h('strong','',t.title),h('p','',t.subtitle),button('v12-secondary','Abrir conjuntos',()=>{go('design');studio.openTrains()}));presets.append(card)}trains.append(presets);content.append(trains);
 }
 async function renderProjects(){
 const content=h('main','v12-page v13-projects-page');home.append(content);
 head(content,'CENTRO DE TRABAJO · V13','Tus proyectos y modelos preparados','Elige un proyecto guardado o parte de una plantilla industrial sin buscar entre los menús del editor.');
 const commands=h('div','v12-home-bottom');
 commands.append(button('v12-secondary','+ Nuevo diseño',()=>{go('design');document.getElementById('btnNew')?.click()}));
 commands.append(button('v12-secondary','Abrir archivo JSON',()=>{go('design');document.getElementById('btnOpen')?.click()}));
 commands.append(button('v12-secondary','Gestión avanzada',()=>{go('design');studio.openProjects()}));
 content.append(commands);
 const saved=h('section','v13-project-section');saved.append(h('h2','','Proyectos guardados'));
 const grid=h('div','v13-project-grid');grid.append(h('p','v12-no-results','Consultando proyectos locales…'));saved.append(grid);content.append(saved);
 try{const records=await listProjects();if(page!=='projects')return;grid.replaceChildren();
  for(const project of records){const card=h('article','v13-project-card');card.append(h('span','v12-kicker','DISEÑO EDITABLE'),h('strong','',project.name||'Proyecto sin nombre'),h('p','',String(project.pieces||0)+' piezas · '+(project.category||'General')),h('small','',new Date(project.updatedAt).toLocaleDateString('es-ES')));const open=button('v12-model-add','Abrir proyecto',async()=>{open.disabled=true;try{await studio.openProjectFromHome(project.id);go('design')}catch(error){notify('No se pudo abrir: '+error.message)}finally{open.disabled=false}});card.append(open);grid.append(card)}
  if(!records.length)grid.append(h('p','v12-no-results','No hay proyectos guardados todavía. Puedes crear uno o importar un archivo JSON.'));
 }catch(error){grid.replaceChildren(h('p','v12-no-results','No se pudo consultar el almacenamiento: '+error.message))}
 const templates=h('section','v13-project-section');templates.append(h('h2','','Proyectos prediseñados · trenes de compresión'),h('p','v13-muted','Plantillas conceptuales originales. Añádelas a tu diseño y personaliza cada componente.'));
 const options=h('div','v13-project-grid');for(const preset of TRAIN_PRESETS){const card=h('article','v13-project-card');card.append(h('span','v12-kicker','PLANTILLA 3D'),h('strong','',preset.title),h('p','',preset.subtitle));card.append(button('v12-model-add','Crear desde plantilla',()=>{try{studio.insertTrainPresetFromHome(preset.id);go('design')}catch(error){notify(error.message)}}));options.append(card)}templates.append(options);content.append(templates);
}
 function render(){home.replaceChildren();const header=h('nav','v13-shell-nav');header.setAttribute('aria-label','Cambiar espacio de trabajo');for(const [key,label] of [['home','Inicio'],['library','Biblioteca 3D'],['projects','Proyectos'],['design','Diseñar']]){const action=button('v13-shell-link'+(key===page?' active':''),label,()=>go(key));if(key===page)action.setAttribute('aria-current','page');header.append(action)}home.append(header);if(page==='home')renderHome();else if(page==='library')renderLibrary();else if(page==='projects')void renderProjects()}
 function showGuide(){const existing=document.getElementById('v12-guide');if(existing)existing.remove();const cover=h('div','v12-guide-cover');cover.id='v12-guide';const modal=h('section','v12-guide-modal');modal.setAttribute('role','dialog');modal.setAttribute('aria-label','Guía rápida');modal.append(h('span','v12-kicker','EMPIEZA AQUÍ'),h('h2','','Diseña en cuatro pasos'));for(const [n,title,desc] of intro){const line=h('div','v12-guide-line');line.append(h('b','',n),h('div','',title+' · '+desc));modal.append(line)}modal.append(button('v12-model-add','Entendido, comenzar',()=>cover.remove()));cover.append(modal);cover.addEventListener('click',e=>{if(e.target===cover)cover.remove()});document.body.append(cover)}
 function showAdd(){document.body.classList.add('v12-parts');document.body.classList.remove('v12-inspector');document.getElementById('libraryPanel')?.classList.add('open');document.getElementById('inspectorPanel')?.classList.remove('open');document.getElementById('librarySearch')?.focus()}
 function showInspector(){document.body.classList.add('v12-inspector');document.body.classList.remove('v12-parts');document.getElementById('inspectorPanel')?.classList.add('open');document.getElementById('libraryPanel')?.classList.remove('open')}
 const actions=[['＋ Añadir pieza',showAdd,'primary'],['⌁ Unir',()=>document.getElementById('joinBtn')?.click()],['✥ Mover',()=>document.getElementById('moveBtn')?.click()],['◌ Vista',()=>document.getElementById('orbitBtn')?.click()],['⚙ Propiedades',showInspector],['▦ Guardar',()=>document.getElementById('btnSave')?.click()]];
 for(const [label,action,style] of actions)quick.append(button('v12-quick-btn '+(style||''),label,action));
 const palette=h('section','v13-tool-palette');palette.setAttribute('aria-label','Más herramientas de diseño');palette.hidden=true;document.body.append(palette);
 const paletteGroups=[['Crear piezas',[['Bloque sólido',()=>pick('solid_block')],['Cilindro',()=>pick('solid_cylinder')],['Motor CAD exacto',()=>studio.openTools('brep')]]],['Ensamblar y revisar',[['Restricciones',()=>studio.openTools('assembly')],['Medir distancias',()=>studio.openTools('measure')],['Interferencias',()=>studio.openTools('collision')]]],['Documentar y gestionar',[['Planos e informes',()=>studio.openDocs()],['Trenes prediseñados',()=>studio.openTrains()],['Herramientas avanzadas',()=>{document.body.classList.add('v12-advanced')}]]]];
 for(const [title,tools] of paletteGroups){const group=h('div','v13-tool-group');group.append(h('h3','',title));for(const [label,handler] of tools){group.append(button('v13-tool',label,()=>{palette.hidden=true;handler()}))}palette.append(group)}
 const more=button('v12-quick-btn v12-more','··· Más',()=>{palette.hidden=!palette.hidden});quick.append(more);
 const guide=button('v12-tip','? Guía',showGuide);quick.append(guide);
 const tools=button('v12-tip','▧ Planos',()=>studio.openDocs());quick.append(tools);
 const homeBtn=button('v12-home-button','⌂ Inicio',()=>go('home'));document.querySelector('.top-actions')?.prepend(homeBtn);
 const libraryBtn=button('v12-home-button','◈ Modelos',()=>go('library'));document.querySelector('.top-actions')?.prepend(libraryBtn);
 const projectsBtn=button('v12-home-button','▦ Proyectos',()=>go('projects'));document.querySelector('.top-actions')?.prepend(projectsBtn);
 const closePanels=()=>{document.body.classList.remove('v12-parts','v12-inspector');document.getElementById('libraryPanel')?.classList.remove('open');document.getElementById('inspectorPanel')?.classList.remove('open')};
 document.getElementById('libraryClose')?.addEventListener('click',closePanels);
 document.getElementById('inspectorClose')?.addEventListener('click',closePanels);
 document.getElementById('partCatalog')?.addEventListener('click',e=>{if(e.target.closest('.part-card'))closePanels()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&page==='design')closePanels();if(page==='design'&&!e.ctrlKey&&!e.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')&&e.key.toLowerCase()==='a'){e.preventDefault();showAdd()}});
 go('home');
 return {go,showGuide,showAdd,showInspector};
}
