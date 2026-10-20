// Usage: node tools/perf.mjs [label] [out.json] [--mobile]   — builds nothing; serves ./dist with `vite preview` and measures
// load time, JS bytes, long tasks, per-frame CPU time, frame intervals, draw calls and triangles over a scripted tour.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const MOBILE = argv.includes('--mobile');
const [label = 'run', out] = argv.filter(a => !a.startsWith('--'));
// --mobile: phone-sized viewport, DPR 3, touch, and 4× CPU throttling (roughly a mid-range phone)
const QUERY = argv.find(a => a.startsWith('--q='))?.slice(4) ?? '';
const PORT = 5300 + Math.floor(Math.random() * 300);
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const url = `http://localhost:${PORT}/`;
for (let i = 0; i < 100; i++) { try { if ((await fetch(url)).ok) break; } catch { /* starting */ } await new Promise(r => setTimeout(r, 200)); }

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36' }
  : { viewport: { width: 1280, height: 800 } });
const cdp = await page.context().newCDPSession(page);
if (MOBILE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Performance.enable');
await page.addInitScript(() => {
  window.__lt = [];
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
});
await page.goto(url + '?notut' + (QUERY ? '&' + QUERY : ''));
await page.waitForFunction(() => window.__pp?.ready, null, { timeout: 180000 });
const load = await page.evaluate(() => {
  const res = performance.getEntriesByType('resource');
  const js = res.filter(r => r.name.endsWith('.js'));
  return {
    readyMs: Math.round(performance.now()),
    jsFiles: js.length,
    jsKB: Math.round(js.reduce((s, r) => s + (r.encodedBodySize || r.transferSize || 0), 0) / 1024),
  };
});

// per-frame CPU time of the globe's frame() (camera, placement, items, layers, render submit, labels)
await page.evaluate(() => {
  const g = window.__pp.globe;
  const orig = g.frame.bind(g);
  window.__ft = [];
  g.frame = () => { const t = performance.now(); orig(); window.__ft.push(performance.now() - t); };
  window.__raf = [];
  let last = performance.now();
  const tick = () => { const n = performance.now(); window.__raf.push(n - last); last = n; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
await page.waitForTimeout(5000); // let the first view settle (placement of visible items)
const settleLong = await page.evaluate(() => window.__lt.slice());

const STOPS = [['Europe', 48.5, 6], ['China', 33, 112], ['N. America', 39, -98], ['Africa', 3, 22], ['Australia', -26, 136], ['India', 22, 80], ['S. America', -15, -60], ['Japan', 36, 138]];
const ZOOM = MOBILE ? 5 : 6.5;
const stops = [];
const tourStart = await page.evaluate(() => { window.__ft.length = 0; window.__raf.length = 0; return performance.now(); });
for (const [name, lat, lon] of STOPS) {
  await page.evaluate(([la, lo, z]) => window.__pp.globe.flyTo(la, lo, (4 * 2.2) / z, 1200), [lat, lon, ZOOM]);
  await page.waitForTimeout(3200);
  stops.push(await page.evaluate(n => {
    const g = window.__pp.globe, r = g.renderer;
    let meshes = 0; g.scene.traverse(o => { if (o.isMesh && o.visible) meshes++; });
    let shown = 0, far = 0;
    for (const p of g.placed.values()) if (p.obj.visible) { shown++; if (p.far) far++; }
    return { stop: n, calls: r.info.render.calls, tris: r.info.render.triangles, geos: r.info.memory.geometries, placed: g.placed.size, shown, far, meshes };
  }, name));
}
const tour = await page.evaluate(t0 => {
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
  const lt = window.__lt.filter(([s]) => s >= t0);
  return {
    frames: window.__raf.length,
    fps: Math.round(1000 / q(window.__raf, 0.5) * 10) / 10,
    rafP95: Math.round(q(window.__raf, 0.95)),
    frameCpuMed: Math.round(q(window.__ft, 0.5) * 100) / 100,
    frameCpuP95: Math.round(q(window.__ft, 0.95) * 100) / 100,
    frameCpuMax: Math.round(Math.max(0, ...window.__ft)),
    longTasks: lt.length, longTaskMs: Math.round(lt.reduce((s, [, d]) => s + d, 0)), longTaskMax: Math.round(Math.max(0, ...lt.map(([, d]) => d))),
  };
}, tourStart);
const gpu = await page.evaluate(() => {
  const g = window.__pp.globe, c = g.renderer.domElement;
  return { buffer: `${c.width}x${c.height}`, pixelRatio: g.renderer.getPixelRatio(), quality: g.quality?.tier ?? null };
}).catch(() => ({}));
const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
await browser.close();
srv.kill();

const avg = k => Math.round(stops.reduce((s, x) => s + x[k], 0) / stops.length);
const result = {
  label, mobile: MOBILE, ...load, ...gpu, heapMB: Math.round(metrics.JSHeapUsedSize / 1048576),
  loadLongTasks: settleLong.length, loadLongTaskMs: Math.round(settleLong.reduce((s, [, d]) => s + d, 0)),
  ...tour, avgCalls: avg('calls'), avgTris: avg('tris'), avgMeshes: avg('meshes'), stops,
};
console.log(JSON.stringify(result, null, 1));
if (out) writeFileSync(out, JSON.stringify(result, null, 1));
process.exit(0);
