import { chromium } from 'playwright';
const combos = [
 {args:['--use-angle=vulkan','--use-vulkan=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']},
 {args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--in-process-gpu']},
 {args:['--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']},
];
for (const c of combos) {
  try { const b = await chromium.launch(c); const p = await b.newPage();
  const r = await p.evaluate(()=>{const c=document.createElement('canvas'); const g=c.getContext('webgl'); if(!g) return 'none'; const d=g.getExtension('WEBGL_debug_renderer_info'); return (d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):'ok') });
  console.log(JSON.stringify(c.args), '=>', r);
  if (r==='none') { await p.goto('chrome://gpu'); await p.waitForTimeout(2000); const t = await p.evaluate(()=>document.body.innerText); console.log(t.split('\n').filter(l=>/WebGL|GL_RENDERER|Problem|disabled|Error|ANGLE/i.test(l)).slice(0,20).join('\n')); }
  await b.close(); } catch(e){ console.log(JSON.stringify(c),'ERR',e.message.slice(0,200)); }
}
