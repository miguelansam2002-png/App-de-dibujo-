import {jsPDF} from 'jspdf';

// Convierte nuestras láminas SVG generadas internamente en instrucciones
// vectoriales PDF. Solo se admiten los elementos que produce V10: rect,
// line, path (M/L/H/V/Z), circle y text. No interpreta SVG arbitrario.
const parseColor=value=>{
 const s=String(value||'').trim().toLowerCase();
 if(!s||s==='none'||s==='transparent')return null;
 if(s==='white')return [255,255,255];if(s==='black')return [0,0,0];
 if(/^#[0-9a-f]{6}$/.test(s))return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 if(/^#[0-9a-f]{3}$/.test(s))return [1,2,3].map(i=>parseInt(s[i]+s[i],16));
 const rgb=s.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/);if(rgb)return rgb.slice(1,4).map(x=>Math.min(255,+x));
 return [33,74,98];
};
const inherited=(node,key,fallback)=>{
 for(let n=node;n&&n.nodeType===1;n=n.parentElement){const a=n.getAttribute(key);if(a!==null)return a}
 return fallback;
};
const numeric=(e,k,d=0)=>{const n=Number(e.getAttribute(k));return Number.isFinite(n)?n:d};
function tokenize(d){return String(d).match(/[MmLlHhVvZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[Ee][-+]?\d+)?/g)||[]}
function parseSegments(d,draw){
 const t=tokenize(d),isCommand=x=>/^[MmLlHhVvZz]$/.test(x||'');let i=0,cmd='',x=0,y=0,startX=0,startY=0,safety=0;
 const num=()=>{if(i>=t.length||isCommand(t[i]))return null;const n=Number(t[i++]);return Number.isFinite(n)&&Math.abs(n)<1e9?n:null};
 while(i<t.length&&safety++<45000){
  if(isCommand(t[i])){cmd=t[i++];if(cmd==='Z'||cmd==='z'){draw(x,y,startX,startY);x=startX;y=startY;continue}}
  if(!cmd)break;
  if(cmd==='M'||cmd==='m'||cmd==='L'||cmd==='l'){
   const a=num(),b=num();if(a===null||b===null)break;
   const nx=(cmd===cmd.toLowerCase()?x:0)+a,ny=(cmd===cmd.toLowerCase()?y:0)+b;
   if(cmd==='M'||cmd==='m'){startX=nx;startY=ny;cmd=cmd==='m'?'l':'L'}else draw(x,y,nx,ny);
   x=nx;y=ny;
  }else if(cmd==='H'||cmd==='h'){
   const a=num();if(a===null)break;const nx=cmd==='h'?x+a:a;draw(x,y,nx,y);x=nx;
  }else if(cmd==='V'||cmd==='v'){
   const a=num();if(a===null)break;const ny=cmd==='v'?y+a:a;draw(x,y,x,ny);y=ny;
  }else break;
 }
}
export async function createDrawingVectorPDF(source,size='A3'){
 if(typeof DOMParser==='undefined')throw Error('La exportación del plano PDF requiere un navegador');
 const dom=new DOMParser().parseFromString(source,'image/svg+xml'),root=dom.documentElement;
 if(root.localName!=='svg'||dom.querySelector('parsererror'))throw Error('La lámina no es un SVG válido');
 const box=(root.getAttribute('viewBox')||'0 0 1587 1122').trim().split(/[,\s]+/).map(Number);
 if(box.length!==4||box.some(v=>!Number.isFinite(v))||box[2]<=0||box[3]<=0)throw Error('Dimensiones SVG inválidas');
 const paper=size==='A4'?[297,210]:[420,297],pdf=new jsPDF({orientation:'landscape',unit:'mm',format:size==='A4'?'a4':'a3',compress:true});
 const sx=paper[0]/box[2],sy=paper[1]/box[3],tx=x=>(x-box[0])*sx,ty=y=>(y-box[1])*sy;
 const shapes=[...root.querySelectorAll('rect,path,line,circle,text')];
 if(shapes.length>90000)throw Error('Demasiadas entidades para una única lámina PDF');
 for(let i=0;i<shapes.length;i++){
  const e=shapes[i],tag=e.localName,fill=parseColor(inherited(e,'fill',tag==='text'?'#193d53':'none'));
  const stroke=parseColor(inherited(e,'stroke',tag==='path'||tag==='line'?'#355c75':'none'));
  const w=Number(inherited(e,'stroke-width','0.7'))||.7;
  if(stroke){pdf.setDrawColor(...stroke);pdf.setLineWidth(Math.max(.05,w*sx))}
  if(fill)pdf.setFillColor(...fill);
  if(tag==='rect'){
   const x=tx(numeric(e,'x')),y=ty(numeric(e,'y')),width=numeric(e,'width')*sx,height=numeric(e,'height')*sy;
   if(width>0&&height>0)pdf.rect(x,y,width,height,fill?(stroke?'FD':'F'):(stroke?'S':'F'));
  }else if(tag==='path'){
   if(stroke){parseSegments(e.getAttribute('d')||'',(x1,y1,x2,y2)=>pdf.line(tx(x1),ty(y1),tx(x2),ty(y2)))}
  }else if(tag==='line'){
   if(stroke)pdf.line(tx(numeric(e,'x1')),ty(numeric(e,'y1')),tx(numeric(e,'x2')),ty(numeric(e,'y2')));
  }else if(tag==='circle'){
   const r=numeric(e,'r');if(r>0)pdf.ellipse(tx(numeric(e,'cx')),ty(numeric(e,'cy')),r*sx,r*sy,fill?(stroke?'FD':'F'):(stroke?'S':'F'));
  }else if(tag==='text'){
   const text=e.textContent?.replace(/\s+/g,' ').trim();if(!text)continue;
   const color=fill||[29,69,89],px=Number(inherited(e,'font-size','12'))||12;
   pdf.setTextColor(...color);pdf.setFont('helvetica',/^(?:bold|[6-9]00)$/.test(inherited(e,'font-weight','normal'))?'bold':'normal');
   pdf.setFontSize(Math.max(5,Math.min(55,px*sx*72/25.4)));
   const anchor=inherited(e,'text-anchor','start'),align=anchor==='middle'?'center':anchor==='end'?'right':'left';
   const transform=e.getAttribute('transform')||'',rotation=transform.match(/rotate\(\s*(-?\d+(?:\.\d+)?)/);
   pdf.text(text.slice(0,240),tx(numeric(e,'x')),ty(numeric(e,'y')),{align,...(rotation?{angle:-Number(rotation[1])}:{} )});
  }
  // Entrega el control al navegador periódicamente durante planos grandes.
  if(i>0&&i%2500===0)await new Promise(resolve=>requestAnimationFrame(resolve));
 }
 return pdf.output('blob');
}