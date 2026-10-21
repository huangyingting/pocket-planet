import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1366, height: 860 }, locale: 'zh-CN' });
const found = new Map();
async function scan(view) {
  const r = await p.evaluate(() => {
    const out = [];
    const vis = e => { for (let x = e; x && x !== document.body; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      const s = n.textContent.trim(); const el = n.parentElement;
      if (!s || !/[A-Za-z]{3,}/.test(s) || !el || ['SCRIPT', 'STYLE', 'KBD', 'svg'].includes(el.tagName) || el.closest('svg')) continue;
      if (!vis(el)) continue;
      out.push((el.className?.toString?.() || el.tagName).slice(0, 30) + ' | ' + s.slice(0, 80));
    }
    for (const el of document.querySelectorAll('[title],[aria-label],[placeholder]')) {
      for (const a of ['title', 'aria-label', 'placeholder']) { const v = el.getAttribute(a); if (v && /[A-Za-z]{3,}/.test(v) && !/[\u3400-\u9fff]/.test(v) && vis(el)) out.push('@' + a + ' ' + (el.id || el.className?.toString?.().slice(0, 20)) + ' | ' + v); }
    }
    return out;
  });
  for (const x of r) if (!found.has(x)) found.set(x, view);
}
const go = async (url, ms = 4000) => { await p.goto('http://localhost:5199/' + url); await p.waitForTimeout(ms); };
const tryClick = async (sel, ms = 1200) => { try { await p.click(sel, { timeout: 4000 }); await p.waitForTimeout(ms); return true; } catch { console.log('miss', sel); return false; } };
await go('?notut'); await scan('home');
for (const [la, lo, hh] of [[48, 10, 0.5], [30, 100, 0.3], [40, -95, 0.4], [-15, -60, 0.5], [0, 20, 0.5]]) { await p.evaluate(([a, o, h]) => window.__pp.globe.flyTo(a, o, h, 10), [la, lo, hh]); await p.waitForTimeout(2500); await scan('globe ' + la + ',' + lo); }
await tryClick('#btn-menu'); await scan('menu'); await tryClick('#btn-menu');
await tryClick('#btn-help'); await scan('hints'); await tryClick('#btn-help');
await tryClick('#btn-time'); await scan('time'); await p.getByTestId('time-range').fill('0'); await p.waitForTimeout(800); await scan('time0'); await tryClick('[data-testid=time-close]');
await tryClick('#btn-radio', 3000); await scan('radio'); await tryClick('#btn-radio');
await tryClick('#btn-collection'); await scan('collection'); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
await tryClick('#btn-game'); await scan('games');
const cards = await p.locator('.game-card').count();
for (let i = 0; i < cards; i++) { await p.locator('.game-card').nth(i).click().catch(() => {}); await p.waitForTimeout(1500); await scan('game' + i); await p.keyboard.press('Escape'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.waitForTimeout(300); await tryClick('#btn-game', 800); }
await p.keyboard.press('Escape');
await tryClick('#btn-search'); await p.keyboard.type('ma'); await p.waitForTimeout(1200); await scan('search'); await p.keyboard.press('Escape');
for (const k of ['eiffel', 'an_lion', 'dn_trex', 'vy_zhenghe', 'mg_monarch', 'pl_sakura', 'vh_concorde', 'cn_guilin']) { await p.evaluate(k => { location.hash = k; }, k); await p.waitForTimeout(2000); await scan('info ' + k); await p.keyboard.press('Escape'); }
await go('?notut#solar', 9000); await scan('solar');
for (const r of ['galaxy', 'group', 'laniakea', 'universe']) { await tryClick(`[data-testid=rail-${r}]`, 6000); await scan(r); const dc = await p.locator('[data-testid^=dc-]').count(); for (let i = 0; i < Math.min(dc, 4); i++) { await p.locator('[data-testid^=dc-]').nth(i).click().catch(() => {}); await p.waitForTimeout(1500); await scan(r + ' dc' + i); } }
await go('?notut#mars', 9000); await scan('mars');
await go('?notut', 3000); await tryClick('#btn-sky', 6000); await scan('sky');
for (const v of ['model', 'ground', 'space']) { await tryClick(`[data-testid=sky-view-${v}]`, 2500); await scan('sky ' + v); }
await tryClick('[data-testid=sky-cal]', 1500); await scan('sky cal');
for (const pg of ['about/', 'encyclopedia/', 'privacy/', 'credits/']) { await go(pg + '?lang=zh', 1500); await scan('page ' + pg); }
await b.close();
const byView = {};
for (const [t, v] of found) (byView[v] ??= []).push(t);
for (const [v, ts] of Object.entries(byView)) { console.log('== ' + v); for (const t of ts.slice(0, 40)) console.log('  ' + t); if (ts.length > 40) console.log('  …+' + (ts.length - 40)); }
