#!/usr/bin/env node
/**
 * visual-check-case.mjs — compare every section of a case page with its Figma render.
 *
 *   npm run dev                                         (other terminal)
 *   npm run visual:case -- ultra-bridge                 → all sections of /work/ultra-bridge
 *   npm run visual:case -- ultra-bridge 06-chapter-02-energy
 *   CASE_ROUTE=/projects/ultra-bridge npm run visual:case -- ultra-bridge   (if the route differs)
 *
 * Needs the references from `npm run figma:import-cases` (design/reference/cases/<slug>/*.png) and, on the page,
 * one element per Figma section: <section data-figma-section="<section key>">. `?visual=1` must switch off
 * every scroll animation (sections fully visible, film shows its poster, no sticky overlap).
 * Writes design/visual/cases/<slug>/<key>-actual.png and -diff.png (red = different) and prints a table.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [slug, only] = process.argv.slice(2);
if (!slug) { console.error('usage: npm run visual:case -- <slug> [section-key]'); process.exit(1); }
const base = process.env.VISUAL_URL || 'http://localhost:3000';
const route = process.env.CASE_ROUTE || `/work/${slug}`;
const refDir = path.join('design/reference/cases', slug);
if (!fs.existsSync(refDir)) { console.error(`✗ ${refDir} missing — run npm run figma:import-cases first.`); process.exit(1); }
const keys = fs.readdirSync(refDir).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')).filter((k) => !only || k === only).sort();
const outDir = path.join('design/visual/cases', slug);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto(base + route + (route.includes('?') ? '&' : '?') + 'visual=1', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// Figma renders sections without a fill as transparent PNGs: composite them onto the page's wall colour first.
const wall = (await page.evaluate(() => getComputedStyle(document.querySelector('[data-theme]') ?? document.body).backgroundColor)).match(/\d+/g).slice(0, 3).map(Number);
const flatten = (img) => {
  for (let i = 0; i < img.data.length; i += 4) {
    const a = img.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) img.data[i + c] = Math.round(img.data[i + c] * a + wall[c] * (1 - a));
    img.data[i + 3] = 255;
  }
  return img;
};
const rows = [];
for (const key of keys) {
  const ref = flatten(PNG.sync.read(fs.readFileSync(path.join(refDir, key + '.png'))));
  const el = page.locator(`[data-figma-section="${key}"]`).first();
  if (!(await el.count())) { rows.push([key, 'missing', '— no [data-figma-section] element']); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(250);
  let actual = PNG.sync.read(await el.screenshot());
  const w = Math.min(actual.width, ref.width), h = Math.min(actual.height, ref.height);
  const crop = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
  const a = crop(actual), r = crop(ref);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(r.data, a.data, diff.data, w, h, { threshold: 0.15, includeAA: false });
  fs.writeFileSync(path.join(outDir, key + '-actual.png'), PNG.sync.write(actual));
  fs.writeFileSync(path.join(outDir, key + '-diff.png'), PNG.sync.write(diff));
  const pct = (n / (w * h)) * 100;
  const size = actual.height !== ref.height ? ` (height ${actual.height} vs Figma ${ref.height})` : '';
  rows.push([key, `${pct < 3 ? '✓' : pct < 8 ? '~' : '✗'} ${pct.toFixed(2)}%`, size]);
}
await browser.close();
console.log(`\n${slug} — ${route}`);
for (const [k, v, note] of rows) console.log(`  ${v.padEnd(10)} ${k}${note ? ' ' + note : ''}`);
console.log(`\nDiff images: ${outDir}/*-diff.png  (✓ < 3 %, ~ < 8 %; fonts and anti-aliasing never match 100 %)`);
