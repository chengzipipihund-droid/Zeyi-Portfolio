# Pegboard Exporter (Figma development plugin)

Exports everything the website needs from the Figma file into one `figma-export.json` (about 5 MB with PNGs):
variables (all modes) · Pegboard text & effect styles · layouts of T0, T0 · Hover hi, T0 · Hover bin, T0.5, T1 ·
Figma-motion keyframes of Animation A and the two T0 hovers · component specs · theme-aware SVGs of props, icons,
hooks, shelf, bins · PNG renders of every state frame (T0 … T5) and of the Animation A storyboard.

## Install once (Figma desktop app)
1. Open the Portfolio file in the **Figma desktop app**.
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Pick `tools/figma-exporter/manifest.json` from this repo.

## Run
1. Plugins → Development → **Pegboard Exporter (zeyi-cheng.org)**.
2. Keep "Include reference PNGs" ticked, press **Export** (20–60 s). The file downloads as `figma-export.json`.
   If nothing downloads, press **Download again** or **Copy JSON** and paste it into `design/figma-export.json`.
3. In the repo: `npm run figma:import -- ~/Downloads/figma-export.json` (or `/figma-sync` in Claude Code).

## What it relies on in Figma
- Page **Pegboard v2 — Shadow Board**, section whose name starts with **`C2 ·`**.
- Frames in that section: `T0 Home Page`, `T0 · Hover hi…`, `T0 · Hover bin…`, `T0.5…`, `T1 · Rest`, `T2 ·`…`T5 ·`,
  `Animation A · T0…` (the motion frame) and `Animation A · storyboard · t = … s`. Reference keys are the part of the
  frame name before " — " (e.g. `T5 · Open SeaTrial — …` → `t5-open-seatrial`).
- Variable collections `Pegboard / …`; text and effect styles `Pegboard/…`.
- Components: `Prop/<Tool>` sets (`State=Rest|Held|Slot`), `Peg/Hook`, `Object` (bins), `Icon/Project/<Name>`, `Shelf`,
  plus the names in `CONFIG.specNames`.
- Optional per tool: hidden layers `Collider` (physics shape) and `Anchor` (hang point).
Renamed something? Update `CONFIG` at the top of `code.js`.

The plugin creates a temporary instance per SVG (off-canvas) and deletes it right away; it changes nothing else.
Colours bound to `Pegboard / …` variables become CSS variables; colours from other collections become plain hex values
(the importer warns about them).
