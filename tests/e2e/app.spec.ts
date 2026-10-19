import { test, expect } from '@playwright/test';
import { openApp, flyTo, clickItem, shot } from './helpers.ts';

test.describe.configure({ mode: 'serial' });

test('home: globe, top bar, zoom readout, hints @mobile', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await openApp(page);
  await expect(page.locator('h1')).toHaveText('Pocket Planet');
  await expect(page.getByTestId('zoom')).toHaveText('×4.0');
  for (const id of ['btn-photo', 'btn-collection', 'btn-game', 'btn-menu']) await expect(page.getByTestId(id)).toBeVisible();
  await expect(page.locator('canvas.globe-canvas')).toBeVisible();
  await page.locator('#btn-help').click();
  await expect(page.locator('#hints')).toBeVisible();
  await shot(page, `${info.project.name}_01_home`);
  await page.locator('#btn-zoom-in').click();
  await expect.poll(async () => parseFloat((await page.getByTestId('zoom').textContent())!.slice(1))).toBeGreaterThan(5);
  expect(errors).toEqual([]);
});

test('tutorial shows on first visit and can be completed', async ({ page }) => {
  await openApp(page, '/?lowfx=1');
  const tut = page.getByTestId('tutorial');
  await expect(tut).toBeVisible();
  await shot(page, 'desktop_02_tutorial');
  for (let i = 0; i < 7; i++) await page.getByTestId('tut-next').click();
  await expect(tut).toHaveCount(0);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!(window as any).__pp?.ready), { timeout: 90_000 }).toBe(true);
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('tutorial')).toHaveCount(0);
});

test('menu: toggles layers & names, language persists', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('btn-menu').click();
  await expect(page.locator('#menu')).toBeVisible();
  await shot(page, 'desktop_03_menu');
  await page.locator('label.switch-card', { has: page.getByTestId('set-names') }).click();
  await expect(page.locator('.labels')).toBeHidden();
  await page.locator('label.switch-card', { has: page.getByTestId('set-names') }).click();
  await expect(page.locator('.labels')).toBeVisible();
  const landmarkVisible = () => page.evaluate(() => [...(window as any).__pp.globe.placed.entries()].some(([, p]: any) => p.item.type === 'landmark' && p.obj.visible));
  await expect.poll(landmarkVisible).toBe(true);
  await page.locator('label.switch-card', { has: page.getByTestId('set-landmarks') }).click();
  await expect.poll(landmarkVisible).toBe(false);
  await page.locator('label.switch-card', { has: page.getByTestId('set-landmarks') }).click();
  await expect.poll(landmarkVisible).toBe(true);
  await page.getByTestId('aura-aurora').click();
  await expect.poll(() => page.evaluate(() => (window as any).__pp.globe.settings.auraPreset)).toBe('aurora');
  await page.getByTestId('mode-minimal').click();
  await expect.poll(() => page.evaluate(() => (window as any).__pp.globe.settings.surfaceMode)).toBe('minimal');
  await page.getByTestId('mode-realistic').click();
  await page.locator('#lang-select').selectOption('ko');
  await expect(page.locator('h1')).toHaveText('포켓 플래닛');
  await page.reload();
  await expect(page.locator('h1')).toHaveText('포켓 플래닛', { timeout: 90_000 });
  await page.getByTestId('btn-menu').click();
  await page.locator('#lang-select').selectOption('en');
  await expect(page.locator('h1')).toHaveText('Pocket Planet');
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).toBeHidden();
});

test('tap a landmark opens info card; deep link; Esc closes', async ({ page }) => {
  await openApp(page);
  await flyTo(page, 48.858, 2.294, 1.6);
  await clickItem(page, 'eiffel');
  await expect(page.getByTestId('info-name')).toHaveText('Eiffel Tower');
  await expect(page.locator('#info-preview')).toBeVisible();
  await expect(page).toHaveURL(/#eiffel$/);
  await shot(page, 'desktop_04_info_landmark');
  await page.getByTestId('react-like').click();
  await expect(page.getByTestId('react-like')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('info')).toBeHidden();
  await expect(page).not.toHaveURL(/#eiffel/);
  await openApp(page, '/?lowfx=1&notut#an_lion');
  await expect(page.getByTestId('info-name')).toHaveText('Lion');
});

test('collect an animal into the dex and earn a sticker', async ({ page }) => {
  await openApp(page, '/?lowfx=1&notut#an_lion');
  await expect(page.getByTestId('info-name')).toHaveText('Lion');
  await expect(page.getByTestId('add-dex')).toHaveCount(0);
  await page.getByTestId('zoom-close').click();
  await page.getByTestId('add-dex').click();
  await expect(page.locator('#toast')).toContainText('Sticker unlocked: 🐾 First find');
  await expect(page.locator('#toast')).toContainText('Lion');
  await shot(page, 'desktop_05_dex_added');
  await page.keyboard.press('Escape');
  await page.getByTestId('btn-collection').click();
  await expect(page.getByTestId('hub-animals')).toContainText('1 / ');
  await shot(page, 'desktop_06_collection');
  await page.getByTestId('hub-animals').click();
  await expect(page.getByTestId('dex-an_lion')).toHaveClass(/have/);
  await page.keyboard.press('Escape');
  await page.getByTestId('hub-stickers').click();
  await expect(page.locator('.sticker.have').first()).toBeVisible();
});

test('vehicle ride mode', async ({ page }) => {
  await openApp(page);
  const key = await page.evaluate(() => { const g = (window as any).__pp.globe; return [...g.placed.keys()].find((k: string) => k.startsWith('vh_')); });
  await page.evaluate(k => { location.hash = k; }, key);
  await expect(page.getByTestId('ride')).toBeVisible();
  await page.getByTestId('ride').click();
  await expect(page.getByTestId('ride-bar')).toBeVisible();
  await page.waitForTimeout(1500);
  await shot(page, 'desktop_07_ride');
  await page.getByTestId('ride-exit').click();
  await expect(page.getByTestId('ride-bar')).toBeHidden();
});

test('photo mode saves to album', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('btn-photo').click();
  await page.getByTestId('shutter').click();
  await expect(page.locator('#toast')).toContainText(/album/i);
  await page.getByTestId('photo-album').click();
  await expect(page.getByTestId('album-grid').locator('img')).toHaveCount(1);
  await shot(page, 'desktop_08_album');
});

test('Place it! full game (practice)', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('btn-game').click();
  await shot(page, 'desktop_09_games');
  await page.getByTestId('game-placeit').click();
  await page.getByTestId('diff-practice').click();
  for (let r = 0; r < 10; r++) {
    await expect(page.getByTestId('placeit-target')).toBeVisible();
    if (r === 0) await page.getByTestId('placeit-hint').click();
    await page.mouse.click(640 + (r % 3) * 20, 430);
    await expect(page.getByTestId('placeit-confirm')).toBeEnabled();
    if (r === 0) await shot(page, 'desktop_10_placeit_guess');
    await page.getByTestId('placeit-confirm').click();
    await expect(page.getByTestId('placeit-result')).toBeVisible();
    if (r === 0) await shot(page, 'desktop_11_placeit_reveal');
    await page.getByTestId('placeit-next').click();
  }
  await expect(page.getByTestId('placeit-results')).toBeVisible();
  await shot(page, 'desktop_12_placeit_results');
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('pp.progress')!).placeit.practice.plays);
  expect(best).toBe(1);
});

test('Quiz: 2 players pass-and-play to podium', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('btn-game').click();
  await page.getByTestId('game-quiz').click();
  await page.getByTestId('players-2').click();
  await page.getByTestId('level-hard').click();
  await shot(page, 'desktop_13_quiz_setup');
  await page.getByTestId('quiz-start').click();
  for (let q = 0; q < 10; q++) {
    await expect(page.getByTestId('quiz-prompt')).toBeVisible();
    await expect(page.getByTestId('quiz-opt')).toHaveCount(5);
    const sel = q % 2 === 0 ? '[data-correct="true"]' : '[data-correct="false"]';
    await page.locator(`[data-testid="quiz-opt"]${sel}`).first().click();
    if (q === 0) await shot(page, 'desktop_14_quiz_answer');
    await page.getByTestId('quiz-next').click();
  }
  await expect(page.getByTestId('quiz-results')).toBeVisible();
  await expect(page.locator('.podium .s1')).toContainText('Player 1');
  await shot(page, 'desktop_15_quiz_results');
});

test('Daily Planet: guesses, hints, share, persisted state', async ({ page }) => {
  await openApp(page, '/?lowfx=1&notut#daily');
  await expect(page.getByTestId('daily-input')).toBeVisible();
  await page.getByTestId('daily-pick').click();
  await expect(page.getByTestId('daily-pick-hud')).toBeVisible();
  const vp = page.viewportSize()!;
  await page.mouse.click(vp.width / 2, vp.height / 2 + 40);
  await expect(page.getByTestId('daily-rows').locator('li:not(.empty)')).toHaveCount(1);
  await expect(page.getByTestId('daily-rows')).toContainText('📍');
  const guesses = ['Tokyo', 'Lima', 'Nairobi', 'Reykjavik', 'Sydney', 'Anchorage'];
  for (const g of guesses) {
    if (await page.getByTestId('daily-result').isVisible()) break;
    await page.getByTestId('daily-input').fill(g);
    await page.getByTestId('daily-submit').click();
  }
  await expect(page.getByTestId('daily-result')).toBeVisible();
  await expect(page.locator('.share-text')).toContainText('Pocket Planet Daily');
  await shot(page, 'desktop_16_daily_done');
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!(window as any).__pp?.ready), { timeout: 90_000 }).toBe(true);
  await expect(page.getByTestId('daily-result')).toBeVisible();
});

test('account: magic link sign-in, nickname, sync, guestbook', async ({ page }) => {
  await openApp(page, '/?lowfx=1&notut#an_lion');
  await page.getByTestId('zoom-close').click();
  await page.getByTestId('add-dex').click();
  await page.keyboard.press('Escape');
  await page.evaluate(() => { location.hash = 'account'; });
  await page.getByTestId('email').fill('kid.explorer@example.com');
  await page.getByTestId('send-link').click();
  const link = await page.getByTestId('dev-link').getAttribute('href');
  expect(link).toContain('/api/auth/verify?token=');
  await page.goto(link!.replace(/^https?:\/\/[^/]+/, ''));
  await expect(page).toHaveURL(/#signed-in/);
  await expect.poll(() => page.evaluate(() => fetch('/api/me').then(r => r.json()).then(j => j.user?.email))).toBe('kid.explorer@example.com');
  await expect(page.getByTestId('handle')).toBeVisible({ timeout: 90_000 });
  await page.getByTestId('handle').fill('Explorer_01');
  await page.getByTestId('handle').press('Enter');
  await page.getByTestId('sync-now').click();
  await expect(page.locator('#toast')).toContainText(/synced/i);
  const server = await page.evaluate(() => fetch('/api/progress').then(r => r.json()));
  expect(Object.keys(server.progress.dex)).toContain('an_lion');
  await shot(page, 'desktop_17_account');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { location.hash = 'guestbook'; });
  await page.getByTestId('gb-text').fill('Hello from the e2e test! https://spam.example');
  await page.getByTestId('gb-post').click();
  await expect(page.getByTestId('gb-list')).toContainText('Hello from the e2e test! 🔗');
  await expect(page.getByTestId('gb-list')).toContainText('Explorer_01');
  await shot(page, 'desktop_18_guestbook');
});

test('encyclopedia static pages link back to the globe', async ({ page }) => {
  await page.goto('/landmarks/');
  await expect(page.locator('h1')).toContainText('Landmarks');
  await page.getByRole('link', { name: /Eiffel Tower/ }).click();
  await expect(page.locator('h1')).toHaveText('Eiffel Tower');
  await shot(page, 'desktop_19_encyclopedia');
  await page.getByRole('link', { name: /See it on the globe/ }).click();
  await expect(page).toHaveURL(/\/#eiffel$/);
  const res = await page.request.get('/does-not-exist');
  expect(res.status()).toBe(404);
});

test('mobile layout: info card as bottom sheet @mobile', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await openApp(page, '/?lowfx=1&notut#pyramids');
  await expect(page.getByTestId('info-name')).toBeVisible();
  const box = await page.getByTestId('info').boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.y + box!.height).toBeGreaterThan(vp.height - 20);
  await shot(page, 'mobile_02_info');
  await page.keyboard.press('Escape');
  await page.getByTestId('btn-menu').click();
  await shot(page, 'mobile_03_menu');
});
