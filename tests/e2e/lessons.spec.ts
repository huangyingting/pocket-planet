import { test, expect, type Page } from '@playwright/test';
import { fromHub, openApp } from './helpers.ts';

type W = { __lesson?: { painted: boolean; lineCount: number; sunLat: number; now: number; playing: boolean } | null; __pp: { globe: { captureTaps: boolean; forceNight: boolean; simTime: number | null; ev: { onGlobeTap?: (a: number, b: number) => void } } } };
const lesson = (page: Page) => page.evaluate(() => { const l = (window as unknown as W).__lesson; return l ? { painted: l.painted, lines: l.lineCount, sunLat: l.sunLat, now: l.now, playing: l.playing } : null; });
const globe = (page: Page) => page.evaluate(() => { const g = (window as unknown as W).__pp.globe; return { capture: g.captureTaps, night: g.forceNight, sim: g.simTime }; });

test('geography class: pick a lesson, watch the steps, answer the quiz, leave cleanly', async ({ page }, info) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await openApp(page);

  // the picker, from the menu: all topics by theme, or one curriculum (the Chinese one by textbook volume)
  await fromHub(page, 'learn', 'menu-lessons');
  await expect(page.getByTestId('lesson-list')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.lesson-grade')).toHaveCount(6);
  await page.getByTestId('lesson-track').click();
  await page.getByRole('option', { name: /China/ }).click();
  await expect(page.locator('.lesson-grade')).toHaveCount(4);
  await expect(page.getByTestId('lesson-usa')).toBeVisible();
  await page.getByTestId('lesson-track').click();
  await page.getByRole('option', { name: /England/ }).click();
  await expect(page.getByTestId('lesson-usa')).toHaveCount(0);
  await expect(page.getByTestId('lesson-rivers')).toBeVisible();
  await page.getByTestId('lesson-track').click();
  await page.getByRole('option', { name: /All topics/ }).click();
  await page.getByTestId('lesson-zones').click();

  const card = page.getByTestId('lesson');
  await expect(card).toBeVisible();
  // step 1: a painted band, two tropics, a label that follows the globe
  await expect.poll(async () => (await lesson(page))?.painted, { timeout: 30_000 }).toBe(true);
  expect((await lesson(page))!.lines).toBe(2);
  await expect(page.getByTestId('lesson-mark').first()).toBeVisible({ timeout: 30_000 });
  for (let i = 1; i < 4; i++) await card.getByTestId('lesson-next').click();

  // the last step runs a year clock: the overhead Sun moves, and the user can pause and scrub it
  await expect(card.getByTestId('lesson-range')).toBeVisible();
  await expect(page.getByTestId('lesson-sun')).toBeVisible({ timeout: 30_000 });
  const t0 = (await lesson(page))!.now;
  await expect.poll(async () => (await lesson(page))!.now, { timeout: 30_000 }).toBeGreaterThan(t0);
  expect((await globe(page)).sim).not.toBeNull();
  await card.getByTestId('lesson-play').click();
  expect((await lesson(page))!.playing).toBe(false);
  await card.getByTestId('lesson-range').fill('250'); // about three months after the March equinox
  await expect.poll(async () => (await lesson(page))!.sunLat).toBeGreaterThan(20);
  await page.screenshot({ path: info.outputPath('zones-clock.png') });

  // quiz: choices give feedback and unlock "next"
  await card.getByTestId('lesson-next').click();
  for (let k = 0; k < 3; k++) {
    await expect(card.getByTestId('lesson-next')).toBeDisabled();
    await card.locator('[data-testid="lesson-opt"][data-right="true"]').click();
    await expect(card.getByTestId('lesson-why')).toHaveClass(/ok/);
    await card.getByTestId('lesson-next').click();
  }
  await expect(card.getByTestId('lesson-score')).toContainText('3');
  // the score card sums up the lesson and offers the next one in the course
  await expect(card.getByTestId('lesson-keys').locator('li')).toHaveCount(3);
  await expect(card.getByTestId('lesson-nextlesson')).toBeVisible();
  await card.getByTestId('lesson-exit').click();
  await expect(card).toHaveCount(0);
  // everything the lesson switched on is put back
  expect(await lesson(page)).toBeNull();
  expect(await globe(page)).toEqual({ capture: false, night: false, sim: null });
  await expect(page.getByTestId('lesson-mark')).toHaveCount(0);

  // a teacher's deep link opens a lesson; a "find it" question takes a tap on the globe
  await page.evaluate(() => { location.hash = 'lesson/graticule'; });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card).toContainText(/Parallels/);
  for (let i = 0; i < 4; i++) await card.getByTestId('lesson-next').click();
  for (let k = 0; k < 2; k++) { await card.locator('[data-testid="lesson-opt"][data-right="false"]').first().click(); await expect(card.getByTestId('lesson-why')).toHaveClass(/no/); await card.getByTestId('lesson-next').click(); }
  await expect.poll(async () => (await globe(page)).capture).toBe(true);
  await page.evaluate(() => (window as unknown as W).__pp.globe.ev.onGlobeTap!(2, 3));
  await expect(card.getByTestId('lesson-why')).toHaveClass(/ok/);
  await expect(card.getByTestId('lesson-why')).toContainText(/km/);
  expect((await globe(page)).capture).toBe(false);
  await page.screenshot({ path: info.outputPath('graticule-locate.png') });
  await card.getByTestId('lesson-next').click();
  await expect(card.getByTestId('lesson-score')).toContainText('1');
  // leaving the globe for the Solar System ends the lesson
  await page.evaluate(() => { location.hash = 'solar'; });
  await expect(card).toHaveCount(0, { timeout: 30_000 });
  expect(await lesson(page)).toBeNull();
  // lessons carry charts and diagrams: a climate graph draws in the card
  await page.evaluate(() => { location.hash = 'lesson/climates'; });
  await expect(card).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 4 && !(await card.getByTestId('lesson-fig').count()); i++) await card.getByTestId('lesson-next').click();
  await expect(card.getByTestId('lesson-fig').locator('svg, .fig-key').first()).toBeVisible();
  await page.screenshot({ path: info.outputPath('climates-fig.png') });
  await card.getByTestId('lesson-exit').click();
  expect(errors).toEqual([]);
});
