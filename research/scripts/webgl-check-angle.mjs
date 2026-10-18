import { chromium } from 'playwright';
const combos = [
 {channel:'chromium', args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']},
 {args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']},
 {args:['--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']},
 {channel:'chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']},
];
for (const c of combos) {
  try { const b = await chromium.launch(c); const p = await b.newPage();
  const r = await p.evaluate(()=>{const c=document.createElement('canvas'); const g=c.getContext('webgl2')||c.getContext('webgl'); if(!g) return 'none'; const d=g.getExtension('WEBGL_debug_renderer_info'); return (d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):'ok') });
  console.log(JSON.stringify(c), '=>', r); await b.close(); } catch(e){ console.log(JSON.stringify(c),'ERR',e.message.slice(0,200)); }
}
