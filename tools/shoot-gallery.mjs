// Usage: node tools/shoot-gallery.mjs "<query>" out.png   (expects `npx vite --port 5199` running)
import { chromium } from 'playwright';
const [query = '', out = '/tmp/gallery.png'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('console', m => (m.type() === 'error' || m.type() === 'info') && console.error(m.text()));
page.on('pageerror', e => console.error(e));
await page.goto(`http://localhost:5199/tools/model-gallery.html?${query}`);
await page.waitForSelector('body[data-ready]', { timeout: 240000 });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('saved', out);
