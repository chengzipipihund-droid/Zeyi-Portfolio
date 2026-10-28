#!/usr/bin/env node
/**
 * visual-check.mjs — screenshot the running site and diff it against a Figma reference PNG.
 *
 *   npm run dev                                   (in another terminal)
 *   npm run visual                                       → /home vs design/reference/t1-rest.png
 *   npm run visual -- "/" t0-home-page                  → T0 vs design/reference/t0-home-page.png
 *   npm run visual -- "/?t=2.15" anim-a-2-15            → Animation A frozen at 2.15 s vs the storyboard
 *
 * Needs: npm i -D playwright pixelmatch pngjs && npx playwright install chromium
 * Writes design/visual/<name>-actual.png, -diff.png (red = different) and prints the mismatch %.
 * The page must render the board inside an element with [data-stage] at scale 1 when ?visual=1 is set.
 * Use the number as a guide: fonts and anti-aliasing never match 100 %. Look at the diff image.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const route = process.argv[2] || '/home';
const name = process.argv[3] || 't1-rest';
const base = process.env.VISUAL_URL || 'http://localhost:3000';
const refPath = path.join('design/reference', `${name}.png`);
if (!fs.existsSync(refPath)) {
  console.error(`✗ No reference ${refPath}. Re-export from Figma with "Include reference PNGs" and run figma:import.`);
  process.exit(1);
}
const ref = PNG.sync.read(fs.readFileSync(refPath));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: ref.width, height: ref.height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const url = base + route + (route.includes('?') ? '&' : '?') + 'visual=1';
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const stage = page.locator('[data-stage]').first();
const buf = (await stage.count()) ? await stage.screenshot() : await page.screenshot();
await browser.close();

let actual = PNG.sync.read(buf);
if (actual.width !== ref.width || actual.height !== ref.height) {
  console.warn(`⚠ size differs: actual ${actual.width}×${actual.height} vs Figma ${ref.width}×${ref.height} — comparing the overlapping area.`);
  const w = Math.min(actual.width, ref.width), h = Math.min(actual.height, ref.height);
  const crop = (img) => { const out = new PNG({ width: w, height: h }); PNG.bitblt(img, out, 0, 0, w, h, 0, 0); return out; };
  actual = crop(actual);
  ref.data = crop(ref).data; ref.width = w; ref.height = h;
}
const diff = new PNG({ width: ref.width, height: ref.height });
const n = pixelmatch(ref.data, actual.data, diff.data, ref.width, ref.height, { threshold: 0.15, includeAA: false });
fs.mkdirSync('design/visual', { recursive: true });
fs.writeFileSync(`design/visual/${name}-actual.png`, PNG.sync.write(actual));
fs.writeFileSync(`design/visual/${name}-diff.png`, PNG.sync.write(diff));
const pct = (n / (ref.width * ref.height)) * 100;
console.log(`${pct < 2 ? '✓' : pct < 6 ? '~' : '✗'} ${name}: ${pct.toFixed(2)}% pixels differ (${n}) — see design/visual/${name}-diff.png`);
