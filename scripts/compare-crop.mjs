#!/usr/bin/env node
/**
 * compare-crop.mjs — diff a component screenshot against the same region of a Figma reference PNG.
 *   node scripts/compare-crop.mjs <actual.png> <reference-key> <x> <y> [out-dir]
 * Crops design/reference/<key>.png at (x, y) with the size of <actual.png>, writes <name>-diff.png, prints mismatch %.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [actualPath, key, x, y, outDir = 'design/visual'] = process.argv.slice(2);
const actual = PNG.sync.read(fs.readFileSync(actualPath));
const ref = PNG.sync.read(fs.readFileSync(path.join('design/reference', `${key}.png`)));
const { width: w, height: h } = actual;
const crop = new PNG({ width: w, height: h });
PNG.bitblt(ref, crop, +x, +y, Math.min(w, ref.width - x), Math.min(h, ref.height - y), 0, 0);
const diff = new PNG({ width: w, height: h });
const n = pixelmatch(crop.data, actual.data, diff.data, w, h, { threshold: 0.15, includeAA: false });
const name = path.basename(actualPath, '.png');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${name}-ref.png`), PNG.sync.write(crop));
fs.writeFileSync(path.join(outDir, `${name}-diff.png`), PNG.sync.write(diff));
console.log(`${name}: ${((n / (w * h)) * 100).toFixed(2)}% of ${w}×${h} differ vs ${key} @ (${x}, ${y})`);
