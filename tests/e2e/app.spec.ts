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
  await page.locator('#lang-select').selectOption('zh');
  await expect(page.locator('h1')).toHaveText('口袋星球');
  await page.reload();
  await expect(page.locator('h1')).toHaveText('口袋星球', { timeout: 90_000 });
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

test('passport stamps, time machine and sounds', async ({ page }) => {
  await openApp(page, '/?lowfx=1&notut#eiffel');
  await expect(page.getByTestId('info-name')).toHaveText('Eiffel Tower');
  await page.getByTestId('say-hello').click();
  await expect(page.locator('#toast')).toContainText('Hello in French');
  await page.keyboard.press('Escape');
  await page.getByTestId('btn-collection').click();
  await expect(page.getByTestId('hub-passport')).toContainText('1 / ');
  await page.getByTestId('hub-passport').click();
  await page.getByTestId('book-europe').click();
  await expect(page.getByTestId('stamp-eiffel')).toHaveClass(/have/);
  await shot(page, 'desktop_06b_passport');
  await page.getByTestId('next-stop').click();
  await expect(page.getByTestId('info-name')).not.toHaveText('Eiffel Tower');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { location.hash = 'an_lion'; });
  await expect(page.getByTestId('hear-it')).toBeVisible();
  await page.getByTestId('hear-it').click();
  await page.keyboard.press('Escape');

  await page.getByTestId('btn-time').click();
  await expect(page.getByTestId('time-bar')).toBeVisible();
  await expect(page.getByTestId('time-year')).toHaveText('Today');
  await page.getByTestId('time-range').fill('0');
  await expect(page.getByTestId('time-year')).toHaveText('Age of dinosaurs');
  expect(await page.evaluate(() => (window as any).__pp.globe.itemFilter !== null)).toBe(true);
  await shot(page, 'desktop_06c_time_machine');
  await page.getByTestId('time-close').click();
  await expect(page.getByTestId('time-bar')).toBeHidden();
  expect(await page.evaluate(() => (window as any).__pp.globe.itemFilter)).toBeNull();
});

test('vehicle ride mode', async ({ page }) => {
  await openApp(page);
  const key = await page.evaluate(() => { const g = (window as any).__pp.globe; return [...g.placed.keys(), ...g.pending.keys()].find((k: string) => k.startsWith('vh_')); });
  expect(key).toBeTruthy();
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
  await expect(page.getByTestId('daily-rows')).toContainText('⌖');
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
  await expect(page.locator('h1 .en')).toHaveText('Landmarks');
  await page.locator('#q').fill('eiffel');
  await page.getByRole('link', { name: /Eiffel Tower/ }).first().click();
  await expect(page.locator('h1 .en')).toHaveText('Eiffel Tower');
  await page.locator('[data-set=zh]').click();
  await expect(page.locator('h1 .zh')).toBeVisible();
  await expect(page.locator('h1 .en')).toBeHidden();
  await page.locator('[data-set=en]').click();
  await shot(page, 'desktop_19_encyclopedia');
  await page.getByRole('link', { name: /See it on the 3D globe/ }).click();
  await expect(page).toHaveURL(/\/#eiffel$/);
  const res = await page.request.get('/does-not-exist');
  expect(res.status()).toBe(404);
});

test('read more expands a Wikipedia reader in the chosen language', async ({ page }) => {
  const seen: string[] = [];
  await page.route('**/*.wikipedia.org/**', async route => {
    const u = new URL(route.request().url());
    seen.push(u.hostname);
    const zh = u.hostname.startsWith('zh');
    const extract = zh
      ? '埃菲尔铁塔是一座铁塔。\n== 历史 ==\n它建于1889年。\n== 设计 ==\n高330米。\n== 参考文献 ==\n略'
      : 'The Eiffel Tower is a wrought-iron tower.\n== History ==\nBuilt for the 1889 fair.\n== Design ==\nIt is 330 m tall.\n== Tourism ==\nMillions visit.\n== Height ==\nTall.\n== Lighting ==\nSparkles.\n== References ==\nx';
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ query: { pages: [{ title: zh ? '艾菲爾鐵塔' : 'Eiffel Tower', varianttitles: { 'zh-cn': '埃菲尔铁塔' }, extract, description: zh ? '巴黎的铁塔' : 'Tower in Paris' }] } }) });
  });
  await openApp(page, '/?lowfx=1&notut#eiffel');
  await expect(page.getByTestId('info-name')).toHaveText('Eiffel Tower');
  const before = (await page.getByTestId('info').boundingBox())!.width;
  await page.getByTestId('read-more').click();
  await expect(page.getByTestId('reader-title')).toHaveText('Eiffel Tower');
  await expect.poll(async () => (await page.getByTestId('info').boundingBox())!.width).toBeGreaterThan(before * 1.8);
  await expect(page.getByTestId('info-name')).toBeVisible();
  await expect(page.getByTestId('reader-article')).toContainText('Built for the 1889 fair.');
  await expect(page.getByTestId('reader-article')).not.toContainText('References');
  await page.getByTestId('reader-continue').click();
  await expect(page.getByTestId('reader-article')).toContainText('Sparkles.');
  await expect(page.getByTestId('reader-near').first()).toBeVisible();
  await shot(page, 'desktop_20_reader');
  await page.getByTestId('reader-lang-zh').click();
  await expect(page.getByTestId('reader-title')).toHaveText('埃菲尔铁塔');
  await expect(page.getByTestId('reader-article')).toContainText('它建于1889年。');
  expect(seen).toContain('zh.wikipedia.org');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('reader')).toBeHidden();
  await expect(page.getByTestId('info-name')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('info')).toBeHidden();
});

test('graticule toggles from the layers menu', async ({ page }) => {
  await openApp(page);
  const on = () => page.evaluate(() => (window as any).__pp.globe.settings.graticule);
  expect(await on()).toBe(true);
  await expect(page.locator('.lb-grid').first()).toBeVisible();
  await page.getByTestId('btn-menu').click();
  await page.locator('label.switch-card', { has: page.getByTestId('set-graticule') }).click();
  await expect.poll(on).toBe(false);
  await expect(page.locator('.lb-grid:visible')).toHaveCount(0);
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

test('solar system: zoom out from Earth, visit Mars and a feature, land back on Earth @mobile', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*.wikipedia.org/**', route => route.fulfill({ contentType: 'application/json',
    body: JSON.stringify({ query: { pages: [{ title: 'Mars', extract: 'Mars is the fourth planet.\n== Geography ==\nRed dust.', description: 'Planet' }] } }) }));
  await openApp(page);
  const mobile = info.project.name === 'mobile';
  // Wheeling on past the widest globe view opens the Solar System.
  await page.mouse.move(400, 400);
  if (mobile) await page.getByTestId('btn-solar').click();
  else for (let i = 0; i < 60 && !(await page.evaluate(() => document.body.classList.contains('solar'))); i++) {
    await page.mouse.wheel(0, 120); await page.waitForTimeout(80);
  }
  await expect(page.getByTestId('sp-earth')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('body')).toHaveClass(/solar/);
  await expect.poll(() => page.evaluate(() => (window as any).__pp.globe.paused)).toBe(true);
  await page.waitForTimeout(2500);
  await shot(page, `${info.project.name}_30_solar_earth`);
  // Constellation overlay toggles on and off and remembers the choice.
  const cst = page.getByTestId('solar-cst');
  const on = await cst.getAttribute('aria-pressed');
  await cst.click();
  await expect(cst).toHaveAttribute('aria-pressed', on === 'true' ? 'false' : 'true');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('pp.cst'))).not.toBeNull();
  await cst.click();
  await expect(cst).toHaveAttribute('aria-pressed', String(on));

  await page.getByTestId('sp-mars').click();
  await expect(page.getByTestId('solar-name')).toHaveText('Mars');
  await expect(page).toHaveURL(/#solar\/mars$/);
  await page.waitForTimeout(2500);
  await shot(page, `${info.project.name}_31_solar_mars`);
  const feat = page.locator('[data-testid^="feat-sf_mars_"]').first();
  const featName = (await feat.textContent())!.replace(/^\S+\s*/u, '').trim();
  await feat.click();
  await expect(page.getByTestId('solar-name')).toContainText(featName.slice(0, 4));
  await expect(page.getByTestId('solar-crumbs')).toContainText('Mars');
  await page.waitForTimeout(2200);
  await shot(page, `${info.project.name}_32_solar_feature`);
  await page.getByTestId('solar-read-more').click();
  await expect(page.getByTestId('reader')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('reader')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('solar-info')).toBeHidden();

  await page.getByTestId('crumb-system').click();
  await page.waitForTimeout(2200);
  await shot(page, `${info.project.name}_33_solar_overview`);
  await page.getByTestId('sp-earth').click();
  await page.getByTestId('solar-enter-earth').click();
  await expect(page.getByTestId('sp-earth')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/solar/);
  await expect.poll(() => page.evaluate(() => (window as any).__pp.globe.paused)).toBe(false);
  await expect(page.locator('canvas.globe-canvas')).toBeVisible();

  // Deep link straight to a body.
  await page.goto('/?lowfx=1&notut#solar/saturn');
  await expect(page.getByTestId('solar-name')).toHaveText('Saturn', { timeout: 30_000 });
  expect(errors).toEqual([]);
});

test('scale ladder: rail climbs from Earth to the universe and back @mobile', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await openApp(page);
  await expect(page.getByTestId('rail-earth')).toHaveClass(/on/);

  await page.getByTestId('rail-galaxy').click();
  await expect(page).toHaveURL(/#milkyway$/, { timeout: 30_000 });
  if (info.project.name === 'mobile') await page.getByTestId('crumb-scale').click();
  await expect(page.getByTestId('solar-name')).toHaveText('Milky Way');
  await expect(page.getByTestId('rail-galaxy')).toHaveClass(/on/);
  await page.waitForTimeout(2000);
  await shot(page, `${info.project.name}_34_milkyway`);
  await page.getByTestId('solar-info-close').click();
  await page.getByTestId('dc-dp_orion_nebula').click();
  await expect(page.getByTestId('solar-name')).toHaveText('Orion Nebula');
  await expect(page).toHaveURL(/#milkyway\/dp_orion_nebula$/);

  await page.getByTestId('rail-universe').click();
  await expect(page).toHaveURL(/#universe$/);
  await page.waitForTimeout(2000);
  await shot(page, `${info.project.name}_35_universe`);
  await page.goto('/?lowfx=1&notut#localgroup/dp_m31');
  await expect(page.getByTestId('solar-name')).toHaveText('Andromeda Galaxy', { timeout: 30_000 });

  await page.getByTestId('rail-solar').click();
  await expect(page).toHaveURL(/#solar/);
  await expect(page.getByTestId('crumb-system')).toBeVisible();
  await page.getByTestId('rail-earth').click();
  await expect(page.locator('body')).not.toHaveClass(/solar/, { timeout: 20_000 });
  await expect(page.getByTestId('rail-earth')).toHaveClass(/on/);
  expect(errors).toEqual([]);
});

test('sky theatre: eclipse deep link, space view, calendar pick, close', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await openApp(page, '/?lowfx=1&notut#sky/solar-eclipse-2026-08-12');
  const sky = page.getByTestId('sky');
  await expect(sky).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#sky-title')).toContainText(/eclipse/i);
  await page.getByTestId('sky-view-space').click();
  await expect(page.getByTestId('sky-view-space')).toHaveAttribute('aria-selected', 'true');
  await page.waitForTimeout(1500);
  await shot(page, 'desktop_40_sky_eclipse_space');
  await page.getByTestId('sky-cal').click();
  await expect(sky).toHaveClass(/cal-open/);
  await page.locator('.skycal-list button[data-kind="lunar-eclipse"]').first().click();
  await expect(page.locator('#sky-title')).toContainText(/lunar/i);
  await page.getByTestId('sky-close').click();
  await expect(sky).toHaveCount(0);
  await page.getByTestId('btn-menu').click();
  await page.getByTestId('btn-sky').click();
  await expect(page.getByTestId('sky')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
