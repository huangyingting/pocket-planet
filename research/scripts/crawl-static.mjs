import { chromium } from 'playwright';
import fs from 'fs';
const pages = ['about','privacy','landmarks/','animals/','discover/','landmarks/eiffel-tower/','animals/lion/','discover/titanic-wreck/','ko/about','ko/landmarks/','ko/landmarks/eiffel-tower/','ja/about','zh/about','nonexistent-page-xyz','landmarks/not-a-landmark/'];
const b = await chromium.launch();
const out = {};
for (const [vpName, vp] of [['desktop',{width:1366,height:900}],['mobile',{width:390,height:844}]]) {
  const ctx = await b.newContext({viewport:vp, deviceScaleFactor:1, isMobile: vpName==='mobile', hasTouch: vpName==='mobile'});
  const p = await ctx.newPage();
  for (const path of pages) {
    const resp = await p.goto('https://myearthtoy.com/'+path, {waitUntil:'networkidle', timeout:60000}).catch(e=>null);
    const name = path.replace(/\//g,'_')||'root';
    await p.screenshot({path:`screenshots/static/${vpName}_${name}.png`, fullPage: vpName==='desktop' && !path.match(/^(landmarks|animals|ko\/landmarks)\/$/)});
    if (vpName==='desktop') {
      out[path] = await p.evaluate(() => ({
        title: document.title, status: 0,
        h: [...document.querySelectorAll('h1,h2,h3')].slice(0,40).map(e=>e.tagName+': '+e.textContent.trim().slice(0,100)),
        links: [...new Set([...document.querySelectorAll('a')].map(a=>a.getAttribute('href')))].slice(0,60),
        text: document.body.innerText.slice(0,2500),
        imgs: document.images.length,
        forms: [...document.querySelectorAll('input,select,button,form')].map(e=>e.tagName+'#'+e.id+'.'+e.className).slice(0,30)
      }));
      out[path].status = resp ? resp.status() : 'ERR';
    }
  }
  await ctx.close();
}
fs.writeFileSync('data/static_pages.json', JSON.stringify(out,null,1));
await b.close();
