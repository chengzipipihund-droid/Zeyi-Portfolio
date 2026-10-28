#!/usr/bin/env node
/**
 * snap.mjs — screenshot pages of a production build without leaving a server running.
 *
 *   NEXT_DIST_DIR=.next-verify npx next build
 *   NEXT_DIST_DIR=.next-verify node scripts/snap.mjs <out-dir> "<route>|<selector>|<name>" …
 *
 * Starts Next in this process (production), screenshots each route (optionally one element), prints console
 * errors, then exits — nothing keeps running. Use it beside `npm run dev`: it never touches `.next`.
 */
import http from 'node:http';
import path from 'node:path';
import next from 'next';
import { chromium } from 'playwright';

const [outDir, ...shots] = process.argv.slice(2);
const app = next({ dev: false, dir: process.cwd(), conf: { distDir: process.env.NEXT_DIST_DIR || '.next-verify' } });
await app.prepare();
const handle = app.getRequestHandler();
const server = http.createServer((req, res) => handle(req, res)).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
try {
  for (const spec of shots) {
    const [route, selector, name] = spec.split('|');
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
    await page.goto(base + route, { waitUntil: 'networkidle' });
    // load lazy images (next/image) before the shot
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager')));
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const target = selector ? page.locator(selector).first() : page;
    const file = path.join(outDir, `${name || 'page'}.png`);
    await target.screenshot({ path: file, fullPage: !selector });
    console.log(`${file}  errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
  await app.close?.();
  process.exit(0);
}
