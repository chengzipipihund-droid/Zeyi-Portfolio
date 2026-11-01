#!/usr/bin/env node
/**
 * figma-import-cases.mjs — unpack the case-page exports of the Pegboard Exporter (button "Export case pages").
 *
 *   npm run figma:import-cases                                   → every ~/Downloads/figma-case-*.zip
 *   npm run figma:import-cases -- ~/Downloads/figma-case-ultra-bridge.zip [more.zip …]
 *
 * Writes (generated — never edit by hand, re-export instead):
 *   src/data/figma/cases/<slug>.json        structure of every section (tree with layout, texts, styles, media refs)
 *   src/data/figma/cases/index.json         list of case pages and their sections / chapter anchors
 *   public/projects/<slug>/NNN-*.{jpg,png,svg}   every visual (old NNN-* files of that case are removed first;
 *                                           anything else in the folder, e.g. intro.mp4, is kept)
 *   design/reference/cases/<slug>/*.png     1× render of each section, for `npm run visual`
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const warnings = [];
let inputs = process.argv.slice(2).map((p) => p.replace(/^~(?=$|\/)/, os.homedir()));
if (!inputs.length) {
  const dl = path.join(os.homedir(), 'Downloads');
  inputs = fs.existsSync(dl) ? fs.readdirSync(dl).filter((f) => /^figma-case-.*\.zip$/.test(f)).map((f) => path.join(dl, f)) : [];
}
if (!inputs.length) {
  console.error('✗ No zip given and no ~/Downloads/figma-case-*.zip found. Run "Export case pages" in the Figma plugin first.');
  process.exit(1);
}

function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error(`${file}: not a zip file`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`${file}: broken central directory`);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(local + 26), lExtraLen = buf.readUInt16LE(local + 28);
    const start = local + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + csize);
    entries.set(name, method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : (() => { throw new Error(`${name}: unsupported compression ${method}`); })());
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

const write = (rel, data) => { const abs = path.join(root, rel); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, data); };
// Figma's JPG/PNG exports are large. If `sharp` is installed (npm i -D sharp) every bitmap is recompressed in place
// (same file name, so the JSON paths stay valid): JPG → mozjpeg q80, PNG → max compression. next/image still resizes at runtime.
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* optional */ }
async function optimise(name, data) {
  if (!sharp) return data;
  try {
    if (/\.jpe?g$/i.test(name)) return await sharp(data).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    if (/\.png$/i.test(name)) { const out = await sharp(data).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(); return out.length < data.length ? out : data; }
  } catch (e) { warnings.push(`${name}: could not recompress (${e.message})`); }
  return data;
}
const casesDir = 'src/data/figma/cases';
const indexPath = path.join(root, casesDir, 'index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : { cases: [] };

for (const zipFile of inputs) {
  const entries = readZip(zipFile);
  const json = JSON.parse(entries.get('cases.json').toString('utf8'));
  if (!json.meta || json.meta.kind !== 'cases') throw new Error(`${zipFile}: cases.json is not a case-page export`);
  for (const c of json.cases) {
    // clean the previous export of this case (generated files only)
    const pub = path.join(root, 'public/projects', c.slug);
    if (fs.existsSync(pub)) for (const f of fs.readdirSync(pub)) if (/^\d{3}-/.test(f)) fs.rmSync(path.join(pub, f));
    fs.rmSync(path.join(root, 'design/reference/cases', c.slug), { recursive: true, force: true });
    let media = 0, refs = 0, bytes = 0;
    for (const [name, data] of entries) {
      if (name.startsWith(`media/${c.slug}/`)) {
        const out = await optimise(name, data);
        write(path.join('public/projects', c.slug, name.slice(`media/${c.slug}/`.length)), out); media++; bytes += out.length;
        if (out.length > 1.5 * 1024 * 1024) warnings.push(`${c.slug}: ${name} is ${(out.length / 1048576).toFixed(1)} MB${sharp ? '' : ' — run `npm i -D sharp` and import again to recompress'}`);
      }
      if (name.startsWith(`reference/${c.slug}/`)) { write(path.join('design/reference/cases', c.slug, name.slice(`reference/${c.slug}/`.length)), data); refs++; }
    }
    write(path.join(casesDir, `${c.slug}.json`), JSON.stringify({ meta: json.meta, ...c }, null, 1));
    const summary = {
      slug: c.slug, number: c.number, title: c.title, theme: c.modes && c.modes.theme, nodeId: c.nodeId,
      sections: c.sections.map((s) => ({ key: s.key, kind: s.kind, number: s.number, title: s.title, anchor: s.anchor, reference: s.reference, video: s.video })),
    };
    index.cases = index.cases.filter((x) => x.slug !== c.slug).concat(summary).sort((a, b) => String(a.number).localeCompare(String(b.number)));
    // warnings: colours outside the Pegboard collections, open TODOs, missing film
    const walk = (n, where) => {
      if (!n) return;
      for (const k of ['fills', 'strokes']) for (const v of [].concat((n.style && n.style[k]) || n[k] || [])) if (typeof v === 'string' && v.includes('/*')) warnings.push(`${c.slug} · ${where} · "${n.name}": ${v}`);
      if (n.kind === 'text' && /TODO|to fill in|TO CONFIRM|TO FILL/i.test(n.text)) warnings.push(`${c.slug} · ${where}: open text "${n.text.slice(0, 80)}"`);
      (n.children || []).forEach((x) => walk(x, where));
    };
    for (const s of c.sections) {
      walk(s.tree, s.key);
      if (s.video && !fs.existsSync(path.join(root, 'public', s.video.src))) warnings.push(`${c.slug}: film section expects public${s.video.src} — TODO(zeyi) add the video (the poster image is used until then)`);
    }
    console.log(`✓ ${c.title}: ${c.sections.length} sections · ${media} media (${(bytes / 1048576).toFixed(1)} MB) · ${refs} reference PNGs`);
  }
}
write(path.join(casesDir, 'index.json'), JSON.stringify({ updatedAt: new Date().toISOString(), cases: index.cases }, null, 1));
const uniq = [...new Set(warnings)];
if (uniq.length) {
  console.log(`\n⚠ ${uniq.length} notes:`);
  for (const w of uniq.slice(0, 60)) console.log('  · ' + w);
  if (uniq.length > 60) console.log(`  … and ${uniq.length - 60} more`);
}
console.log('\nNext: open design/reference/cases/<slug>/ to see what each section should look like.');
