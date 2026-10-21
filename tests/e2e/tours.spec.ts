import { test, expect } from '@playwright/test';
import { openApp } from './helpers.ts';

/** Each tour walks real scenes; screenshots go to test-results for a visual check of what the card covers. */
test('guided tours: pick from the help panel, walk every step, leave or finish', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await openApp(page);
  await page.locator('#btn-help').click();
  await page.getByTestId('btn-tours').click();
  await expect(page.getByTestId('tour-cosmos')).toBeVisible();

  const walk = async (id: string, check: (i: number) => Promise<void>) => {
    if (!(await page.getByTestId('tour-' + id).isVisible())) { await page.getByTestId('menu-tours').click().catch(async () => { await page.locator('#btn-menu').click(); await page.getByTestId('menu-tours').click(); }); }
    await page.getByTestId('tour-' + id).click();
    const card = page.getByTestId('tour');
    await expect(card).toBeVisible();
    const n = Number((await card.locator('.tour-kicker').innerText()).match(/\/\s*(\d+)/)?.[1] ?? (await card.locator('.dots span').count()));
    for (let i = 0; i < n; i++) {
      await check(i);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: info.outputPath(`${id}-${i + 1}.png`) });
      if (i < n - 1) await card.getByTestId('tour-next').click();
    }
    await card.getByTestId('tour-next').click(); // finish
    await expect(card).toHaveCount(0);
  };

  await walk('cosmos', async i => {
    if (i === 1) await expect(page.locator('body.solar')).toHaveCount(1, { timeout: 60_000 });
    if (i === 3) await expect(page.getByTestId('rail-galaxy')).toHaveClass(/on/, { timeout: 30_000 });
    if (i === 5) await expect(page.getByTestId('rail-group')).toHaveClass(/on/, { timeout: 30_000 });
  });
  await page.locator('#btn-menu').click();
  await walk('eclipse', async i => {
    if (i === 1) { await expect(page.getByTestId('sky')).toBeVisible({ timeout: 60_000 }); await expect(page.getByTestId('sky-view-model')).toHaveAttribute('aria-selected', 'true'); }
    if (i === 2) await expect(page.getByTestId('sky-view-ground')).toHaveAttribute('aria-selected', 'true');
    if (i === 3) await expect(page.locator('#sky-title')).toContainText(/lunar/i);
  });
  // the sky stays open after the tour: close it and leave space
  await page.getByTestId('sky-close').click();
  await expect(page.getByTestId('sky')).toHaveCount(0);
  await page.evaluate(() => { location.hash = '#tour/tern'; });
  const card = page.getByTestId('tour');
  await expect(card).toBeVisible();
  await expect(page.locator('body.solar')).toHaveCount(0, { timeout: 20_000 });
  for (const k of [2, 3, 4, 5, 6]) {
    await card.getByTestId('tour-next').click();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: info.outputPath(`tern-${k}.png`) });
  }
  await expect(page.getByTestId('info-name')).toContainText(/tern/i);
  // leaving keeps you where you are
  await card.getByTestId('tour-exit').click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/touring/);
  expect(errors).toEqual([]);
});
