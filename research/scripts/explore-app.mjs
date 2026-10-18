import { chromium } from 'playwright';
import fs from 'fs';
const VP = process.argv[2] || 'desktop';
const vp = VP==='mobile' ? {viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:1} : {viewport:{width:1280,height:800}};
const b = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx = await b.newContext({...vp, locale:'en-US'});
await ctx.addInitScript(() => { try { localStorage.setItem('tutorial','skip'); } catch(e){}
  const raf = window.requestAnimationFrame.bind(window); let last = 0;
  window.requestAnimationFrame = cb => raf(t => { if (t - last < 300) { return window.requestAnimationFrame(cb); } last = t; cb(t); }); });
const p = await ctx.newPage(); p.setDefaultTimeout(60000);
const log = []; const net=[];
p.on('request', r => { if (!/fonts|cdn-cgi|\.js$/.test(r.url())) net.push(r.method()+' '+r.url().slice(0,200)); });
p.on('pageerror', e => log.push({pageerror:e.message.slice(0,200)}));
let n = 0;
async function snap(name) {
  n++; const f = `screenshots/app/${VP}B_${String(n).padStart(2,'0')}_${name}.png`;
  try { await p.screenshot({path:f, timeout:150000}); } catch(e) { log.push({name, shotErr:e.message.slice(0,100)}); }
  const st = await p.evaluate(() => {
    const vis = e => e && !e.hidden && e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
    const out = {};
    for (const e of document.querySelectorAll('[role=dialog],.gmodal,#info,#game,#qz,#photo,#ride,#menu,#tut,#tip,#hint,#enc-panel,#g-card,#dexpop')) if (vis(e)) out[e.id||e.className] = e.innerText.slice(0,1500);
    return { zoom: document.getElementById('zoomlv')?.textContent, hash: location.hash, open: out };
  }).catch(e=>({err:e.message}));
  log.push({step:n, name, ...st}); console.log(n, name, Object.keys(st.open||{}).join(','));
}
const click = async (sel) => { try { await p.locator(sel).first().click({timeout:15000}); } catch(e) { log.push({clickErr:sel, m:e.message.slice(0,120)}); } await p.waitForTimeout(2500); };
const esc = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(1200); };
await p.goto('https://myearthtoy.com/', {waitUntil:'domcontentloaded', timeout:120000});
for (let i=0;i<40;i++){ await p.waitForTimeout(8000); const gone = await p.evaluate(()=>!document.getElementById('loading')).catch(()=>false); console.log('wait',i,gone, new Date().toISOString()); if (gone) break; }
await p.waitForTimeout(5000);
await snap('welcome');
await click('#hint'); await snap('help_hint'); await click('#hint');
await click('#menu-btn'); await snap('menu_open');
await click('#menu-btn');
await click('#dex-open'); await snap('collection'); await esc(); await snap('after_esc');
for (const s of ['#acct-close','#dex-close']) if (await p.locator(s).isVisible().catch(()=>false)) await click(s);
await click('#game-open'); await snap('game_chooser');
const cards = await p.locator('#gq-cards > *').count(); log.push({gameCards:cards});
for (let i=0;i<cards;i++) { await click(`#gq-cards > *:nth-child(${i+1})`); await snap('game_card_'+(i+1));
  for (const s of ['#acct-close','#qz-setup [data-close]','#g-pick [data-close]','#g-quit','#qz-quit']) if (await p.locator(s).first().isVisible().catch(()=>false)) await click(s);
  if (await p.locator('#gq-choose').isHidden().catch(()=>true)) { await click('#game-open'); }
}
await esc(); for (const s of ['#gq-choose [data-close]','#acct-close']) if (await p.locator(s).first().isVisible().catch(()=>false)) await click(s);
await click('#ph-open'); await snap('photo_mode'); await click('#ph-shot'); await snap('photo_shot'); await click('#ph-alb'); await snap('photo_album');
for (const s of ['#ph-album [data-close]','#ph-x','#acct-close']) if (await p.locator(s).first().isVisible().catch(()=>false)) await click(s);
for (const h of ['eiffel','an_lion','mi_titanic']) { await p.evaluate(h=>{location.hash=h}, h); await p.waitForTimeout(9000); await snap('hash_'+h);
  if (h==='eiffel' && await p.locator('#info-enc-b').isVisible().catch(()=>false)) { await click('#info-enc-b'); await p.waitForTimeout(3000); await snap('encyclopedia_panel'); await click('#enc-close'); }
  if (await p.locator('#info-close').isVisible().catch(()=>false)) await click('#info-close'); }
for (let i=0;i<4;i++) await click('#zin'); await snap('zoomed_in');
await p.mouse.click(VP==='mobile'?195:640, VP==='mobile'?420:400); await p.waitForTimeout(3000); await snap('canvas_tap');
if (await p.locator('#info-close').isVisible().catch(()=>false)) await click('#info-close');
await click('#reset'); 
await click('#menu-btn'); await p.selectOption('#lang','ko').catch(e=>log.push({langErr:e.message})); await p.waitForTimeout(4000); await snap('lang_ko');
await p.selectOption('#lang','en').catch(()=>{}); await p.waitForTimeout(3000);
if (!(await p.locator('#menu').isVisible().catch(()=>false))) await click('#menu-btn');
await click('#credits-open'); await snap('credits'); await click('#credits-close');
if (!(await p.locator('#menu').isVisible().catch(()=>false))) await click('#menu-btn');
if (await p.locator('#acct-open').isVisible().catch(()=>false)) { await click('#acct-open'); await snap('account_dialog'); await click('#acct-close'); }
if (await p.locator('#gb-open').isVisible().catch(()=>false)) { await click('#gb-open'); await snap('guestbook'); await click('#gb-close'); }
await p.evaluate(()=>{location.hash='daily'}); await p.waitForTimeout(8000); await snap('daily');
const ls = await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k).slice(0,300)])));
log.push({localStorage:ls});
fs.writeFileSync(`data/explore_${VP}.json`, JSON.stringify({log, net:[...new Set(net)]},null,1));
await b.close();
