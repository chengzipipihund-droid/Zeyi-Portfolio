# Pegboard Exporter v3.1 (Figma development plugin) — kit copy

This folder is the reference version from the kit. The repo's own plugin lives in `tools/figma-exporter/` and may have
extra code (e.g. `exportSpecArt`); `EXPORTER-FIX-PROMPT.md` merges v3.1 into it. Until then this copy can be imported as a
second development plugin ("Pegboard Exporter v3.1 (kit copy)", different id) — use it for **Export case pages**.

v3.1 fixes: `exportSvg` accepts any node (component → instance, everything else → off-canvas clone), one failing node is
skipped and listed instead of aborting the export, error messages are shown in full (Figma's engine leaves the message out of
`e.stack`), warnings appear in the plugin window and in `meta.warnings`.


Two buttons:

| Button | Output | Import in the repo |
|---|---|---|
| **Export home** | `figma-export.json` (~5 MB): variables (all modes) · Pegboard text & effect styles · layouts of T0, T0 · Hover hi, T0 · Hover bin, T0.5, T1 · Figma-motion keyframes of Animation A and the two T0 hovers · component specs · theme-aware SVGs · PNG renders of T0…T5 and the Animation A storyboard | `npm run figma:import -- ~/Downloads/figma-export.json` (or `/figma-sync`) |
| **Export case pages** | one `figma-case-<project>.zip` per case page (01 Ultra Bridge, 02 SeaTrial Explorer, 03 CoreDS): `cases.json` (every section as a tree: layout, texts, links, styles), every visual as JPG/PNG/SVG, a 1× PNG of every section | `npm run figma:import-cases` (takes every `~/Downloads/figma-case-*.zip`) or `/case-page sync` |

## Install once (Figma desktop app)
1. Open the Portfolio file in the **Figma desktop app**.
2. Menu → **Plugins → Development → Import plugin from manifest…** → `tools/figma-exporter/manifest.json` in the repo.
   Already installed? Nothing to do: a development plugin reads `code.js` / `ui.html` from disk every time it runs.

## Run
1. Plugins → Development → **Pegboard Exporter (zeyi-cheng.org)**.
2. Keep "Include reference PNGs" ticked and press a button. Home takes 20–60 s; case pages 1–2 min per page (Figma may look frozen).
3. Files land in Downloads. If one does not, press its button in the plugin window (or "Download again").

## What it relies on in Figma
- Home: page **Pegboard v2 — Shadow Board**, section starting with **`C2 ·`**, frames `T0 Home Page`, `T0 · Hover hi…`,
  `T0 · Hover bin…`, `T0.5…`, `T1 · Rest`, `T2 ·`…`T5 ·`, `Animation A · T0…`, `Animation A · storyboard · t = … s`.
- Case pages: page **Pegboard v2 — Case pages**, top-level frames `Case · 01 …`, `Case · 02 …`, `Case · 03 …` (numbers in `CONFIG.cases.numbers`).
  Inside a case frame, the direct children are the sections (`Site/Header`, `Intro film · …`, `Breadcrumb`, `Hero wrap`, `Chapter tabs`,
  `Chapter NN · Title`, `Next tool`, `Site/Footer`). A figure is a frame named `Mount · …` holding a `Board` (white card with border)
  or `Image frame` (image framed by itself) plus a `Caption` text.
- Variable collections `Pegboard / …`; text and effect styles `Pegboard/…`.
Renamed something? Update `CONFIG` at the top of `code.js`.

The plugin creates temporary nodes off-canvas (SVG instances, flat image rectangles) and deletes them right away; it changes nothing else.
Colours bound to `Pegboard / …` variables become CSS variables; other colours stay hex values (the importers list them).
