import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir } from 'node:fs/promises';
import next from 'next';
import { chromium } from 'playwright';

const output = 'design/visual/prototypes';
console.log('Preparing portfolio verification server');
const app = next({ dev: false, dir: process.cwd(), conf: { distDir: process.env.NEXT_DIST_DIR || '.next-verify' } });
await app.prepare();
console.log('Production build ready');
const handler = app.getRequestHandler();
const server = http.createServer((request, response) => handler(request, response)).listen(0);
const base = `http://localhost:${server.address().port}`;
let browser;

try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch();
  for (const viewport of [{ width: 1600, height: 1100 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    const visit = async (route) => {
      const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route);
      await page.evaluate(() => document.fonts.ready);
    };
    const screenshot = async (name) => {
      await page.screenshot({ path: `${output}/${viewport.width}-${name}.png`, fullPage: true });
    };
    const checkImages = async () => {
      const broken = await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || !image.naturalWidth).map((image) => image.src));
      assert.deepEqual(broken, [], 'Images must load');
    };
    const checkWidth = async () => {
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Page must not overflow horizontally');
    };
    const homeStyle = () => page.locator('body').evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.color, style.fontFamily, style.margin];
    });

    await visit('/');
    await page.locator('[data-phase="t0"]').first().waitFor({ state: 'attached' });
    const originalHomeStyle = await homeStyle();
    await screenshot('home');
    await visit('/home');
    await page.locator('[data-phase="t1"]').first().waitFor({ state: 'attached' });
    for (const slug of ['ultra-bridge', 'seatrial-explorer', 'coreds']) {
      await visit(`/work/${slug}`);
      assert(await page.locator('[data-figma-section]').count() > 0, 'Case sections must render');
    }

    await visit('/portfolio');
    assert.equal(await page.locator('.pf-card').count(), 2);
    await checkImages();
    await checkWidth();
    await screenshot('index');
    await page.locator('.pf-card[href="/portfolio/seatrial-explorer"]').click();
    await page.locator('.st-root').waitFor();
    await page.locator('[data-tour="st-harbour-menu"] button').nth(1).click();
    assert.equal(await page.locator('.pf-steps > li').first().getAttribute('data-done'), 'true');
    await page.locator('.pf-step').nth(1).click();
    await page.locator('[data-tour="st-play"]').click();
    await page.getByRole('button', { name: 'Pause', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('.pf-step').nth(2).click();
    await page.getByRole('button', { name: 'Overlay', exact: true }).click();
    await page.locator('.st-maps-overlay').waitFor();
    await page.locator('.pf-step').nth(4).click();
    await page.locator('[data-tour="st-swap"]').click();
    assert.equal(await page.locator('.pf-steps > li').nth(4).getAttribute('data-done'), 'true');
    await checkWidth();
    await screenshot('seatrial');
    await page.locator('.pf-step').nth(5).click();
    await page.locator('[data-tour="st-assume"]').waitFor();
    await page.locator('.pf-mode button').nth(1).click();
    assert.equal(await page.locator('.pf-demo').getAttribute('data-mode'), 'free');
    await page.locator('.pf-mode button').first().click();

    await page.locator('.pf-rail footer a[href^="/portfolio/floatopia"]').click();
    await page.locator('.fl-root[data-screen="home"]').waitFor();
    assert.equal(await page.locator('.pf-step[aria-current="step"]').count(), 1);
    await checkImages();
    await page.locator('.pf-step').nth(1).click();
    await page.locator('[data-tour="fl-peek-sports"]').click();
    await page.locator('.fl-root[data-screen="island"]').waitFor();
    await page.locator('.pf-step').nth(2).click();
    await page.locator('[data-tour="fl-expand"]').click();
    await page.locator('.fl-root[data-screen="exploded"]').waitFor();
    await page.locator('.pf-step').nth(3).click();
    await page.locator('[data-tour="fl-book"]').click();
    await page.locator('.fl-root[data-screen="booked"]').waitFor();
    await checkImages();
    await checkWidth();
    await screenshot('floatopia-booked');
    await page.locator('.pf-lang button').nth(1).click();
    assert.equal(await page.locator('.pf-lang button').nth(1).getAttribute('aria-pressed'), 'true');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.pf-lang button').nth(1).getAttribute('aria-pressed'), 'true');
    await page.locator('.pf-logo').click();
    await page.locator('[data-phase="t0"]').first().waitFor({ state: 'attached' });
    assert.deepEqual(await homeStyle(), originalHomeStyle, 'Prototype styles must not change the home page');
    assert.deepEqual(errors, [], 'Browser must have no errors or failed resources');
    console.log(`PASS ${viewport.width}px: existing routes, index, prototype navigation, tour interactions, language, images, layout, home styles`);
    await context.close();
  }
  const missing = await fetch(`${base}/portfolio/not-a-prototype`);
  assert.equal(missing.status, 404);
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  for (const route of ['/portfolio', '/portfolio/seatrial-explorer', '/portfolio/floatopia']) {
    assert(sitemap.includes(`https://zeyi-cheng.org${route}</loc>`), `Sitemap missing ${route}`);
  }
  console.log('PASS unknown prototype returns 404; sitemap includes all prototype routes');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.closeAllConnections();
  server.close();
  await app.close?.();
  process.exit(process.exitCode || 0);
}