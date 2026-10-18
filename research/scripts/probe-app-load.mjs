import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'], _x:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx = await b.newContext({viewport:{width:1280,height:800}, locale:'en-US'});
const p = await ctx.newPage();
const net = [];
p.on('request', r => net.push({m:r.method(), u:r.url(), t:r.resourceType()}));
p.on('console', m => { if (m.type()==='error') net.push({console:m.text().slice(0,300)}); });
p.on('pageerror', e => net.push({pageerror:e.message.slice(0,300)}));
await p.goto('https://myearthtoy.com/', {waitUntil:'domcontentloaded', timeout:90000});
for (let i=0;i<12;i++){ await p.waitForTimeout(5000); await p.screenshot({path:`screenshots/app/load_${i}.png`, timeout:120000}); const ld = await p.evaluate(()=>{const l=document.getElementById('loading'); return l? (l.hidden||getComputedStyle(l).display==='none'||getComputedStyle(l).opacity==='0' ? 'gone':'visible') : 'removed'}); console.log(i, ld); if (ld!=='visible') break; }
await p.waitForTimeout(4000);
await p.screenshot({path:'screenshots/app/home_desktop.png', timeout:120000});
const state = await p.evaluate(() => {
  const vis = e => e && !e.hidden && e.offsetParent !== null;
  return { tools: [...document.querySelectorAll('.tools .btn')].map(e=>({id:e.id, text:e.textContent.trim(), vis:vis(e)})),
    title: document.getElementById('t-title')?.textContent, count: document.getElementById('t-count')?.textContent,
    hint: document.getElementById('hint')?.innerText, bodyText: document.body.innerText.slice(0,1500),
    dialogs: [...document.querySelectorAll('[role=dialog],.gmodal,#info,#game,#qz,#photo,#ride')].map(e=>e.id+':'+(e.hidden?'hidden':'shown')),
    ls: Object.fromEntries(Object.keys(localStorage).map(k=>[k, localStorage.getItem(k).slice(0,200)])),
    cookies: document.cookie };
});
console.log(JSON.stringify(state,null,1));
fs.writeFileSync('data/net_home.json', JSON.stringify(net,null,1));
await ctx.storageState({path:'data/state.json'});
await b.close();
