import { expect, type Page } from '@playwright/test';

export const SHOTS = 'docs/assets/screenshots';

export async function openApp(page: Page, path = '/?lowfx=1&notut'): Promise<void> {
  await page.goto(path);
  await expect.poll(() => page.evaluate(() => !!(window as unknown as { __pp?: { ready: boolean } }).__pp?.ready), { timeout: 90_000 }).toBe(true);
  await page.waitForTimeout(800);
}

export async function flyTo(page: Page, lat: number, lon: number, h: number): Promise<void> {
  await page.evaluate(([a, b, c]) => (window as any).__pp.globe.flyTo(a, b, c, 10), [lat, lon, h]);
  await page.waitForTimeout(700);
}

export async function clickItem(page: Page, key: string): Promise<void> {
  const pt = await page.evaluate(k => (window as any).__pp.itemScreen(k), key);
  expect(pt, `item ${key} on screen`).not.toBeNull();
  await page.mouse.click(pt.x, pt.y);
}

export async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 150_000, animations: 'disabled' });
}
