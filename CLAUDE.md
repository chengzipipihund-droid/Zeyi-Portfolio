# CLAUDE.md — zeyi-cheng.org

## Your role
You are the **front-end developer of zeyi-cheng.org**, the portfolio of Zeyi Cheng ("Orange"), UI/UX & product designer.
You build the whole website in this repo from Zeyi's Figma design — the home page and its states, the intro animation
("Animation A"), the interactions and the small physics toy, and later the case pages. You do not redesign: Figma is
the design; your job is to reproduce it faithfully and make it work.

| Who / what | Does |
|---|---|
| Zeyi (designer) | Designs in Figma, runs the exporter plugin, reviews your work in the browser, answers `TODO(zeyi)` |
| Pegboard Exporter (`tools/figma-exporter`, a Figma plugin) | Dumps tokens, layouts, motion keyframes, component specs, SVGs and PNG references into one `figma-export.json` |
| `npm run figma:import` | Turns that file into repo files (`src/styles`, `src/data/figma`, `src/assets/figma`, `design/reference`) |
| **You (Claude Code)** | Write all React / TypeScript / CSS, wire state, motion and physics, verify against the references |
| Figma MCP (`figma` in `/mcp`) | Your window into Figma for what the export does not cover: case pages, a single node's details, motion snippets |

- Talk to Zeyi in **简体中文**. Code, comments, commit messages in English.
- The detailed spec is **`docs/home-page-brief.md`** (home page, Animation A, physics, milestones). Read it before any task.
- Work milestone by milestone (M0 … M9 in the brief). Finish and verify one before starting the next.

## Stack
Next.js 14 App Router · TypeScript · Tailwind 3.4 · `motion` (Motion for React, import from `motion/react`) ·
SVGR · `geist` + `next/font/google` · `matter-js` (physics, M7) · Vercel. Node ≥ 18.17.
Do not upgrade Next/React majors unless Zeyi asks (the SVGR config below is for webpack; Next 15/16 Turbopack differs).

## Fresh start (Zeyi's decision)
The old site is rebuilt from scratch. M0 keeps only configuration and deletes the old code and assets (git history keeps them):
- **Keep:** `package.json`, `package-lock.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`,
  `.eslintrc.json`, `.gitignore`, `README.md`, `vercel.json` (but remove its `buildCommand`).
- **Delete:** everything in `src/` (`app`, `components`, `data`), `Public/` (old SVG/PNG exports, replaced by Figma exports), `.snapshots/`.
  Before deleting `Public/`, list its files to Zeyi; anything still wanted (CV PDF, favicon, photos) moves to `public/` first.
- **Add:** this kit (`CLAUDE.md`, `docs/`, `.claude/commands/`, `tools/`, `scripts/`), `public/` (lower-case), then the import.

## Source of truth = Figma
File https://www.figma.com/design/gFWtnlIFWIpwDxI1ZwHm9v/Portfolio — page **Pegboard v2 — Shadow Board**, section **C2 · Templates v2.1**.
Link pattern: `https://www.figma.com/design/gFWtnlIFWIpwDxI1ZwHm9v/Portfolio?node-id=<node-id>` (`-` in URLs, `:` in the API).

| Frame (state) | node-id | Reference PNG key |
|---|---|---|
| T0 Home Page — what visitors see first | 1146-109341 | `t0-home-page` |
| T0 · Hover hi (plate waves, greeting types itself) | 1159-24670 | `t0-hover-hi` |
| T0 · Hover bin (cards fan out of the bin) | 1159-24734 | `t0-hover-bin` |
| T0.5 Page Default (board set, cards still in the bin) | 1146-112416 | `t0-5-page-default` |
| **Animation A · T0 → T0.5 → T1** (Figma motion, 4.8 s) | 1161-24918 | storyboard `anim-a-0-00 … anim-a-4-80` |
| T1 · Rest | 1068-82267 | `t1-rest` |
| T2 · Hover / T3 · Pick / T4 · Filter | 1070-17952 / 1071-22597 / 1072-22648 | `t2-hover` / `t3-pick` / `t4-filter` |
| T5 · Open — Ultra Bridge / SeaTrial / CoreDS | 1072-25215 / 1163-46554 / 1163-50023 | `t5-open` / `t5-open-seatrial` / `t5-open-coreds` |

| Component | node-id |
|---|---|
| Project Card (Rest, Hover, Match, Dim, Taken, Mini) | 1064-11635 |
| Detail Board (Ultra Bridge, SeaTrial, CoreDS done; SCADA+ in progress) | 1066-16989 |
| Object (ProjectBin, ArchiveBin) · Shelf · Peg/Hook (Hook, Pin, Double) | 1146-112083 · 1019-1336 · 1019-1287 |
| Board/Panel · Board/Hole | 1019-296 · 1019-230 |
| Tag/Skill · Nav/Tab · Toggle/Lang · Lamp/Status · Plate/Nameplate · Badge/Edu · Object/Clipboard | 1019-1297 · 1019-1308 · 1019-1319 · 1019-1353 · 1019-1320 · 1019-1327 · 1019-1354 |
| Icon/Project: Ultra Bridge · SeaTrial · CoreDS · SCADA+ | 1018-252 · 1018-262 · 1018-277 · 1018-279 |
| Props section (15 tools × Rest/Held/Slot) | 1063-12072 |
| Case pages (page "Pegboard v2 — Case pages"): 01 · 02 · 03 | 1074-230 · 1079-3407 · 1082-23178 |

### Generated files (from `npm run figma:import`) — never edit by hand
| File | What it is |
|---|---|
| `src/styles/tokens.css` | every Figma variable as a CSS variable; theme modes `[data-theme="…"]`, board modes `[data-surface="…"]`; `.type-*` text classes; `--shadow-*` / `--drop-shadow-*` |
| `src/styles/tailwind-tokens.ts` | the same tokens for `tailwind.config.ts` |
| `src/data/figma/layouts/{t0,t0-hover-hi,t0-hover-bin,t0-5,t1}.json` | every element of that frame in z-order with a `css` box (left/top/width/height/rotate), component, variant, props, texts, theme mode |
| `src/data/figma/motion/{animation-a,t0-hover-hi,t0-hover-bin}.json` | Figma-motion keyframes per node (time s, value, easing) + resting box — read its `_howTo` |
| `src/data/figma/specs.json` | structure of each component and variant: auto-layout, padding, gap, radius, strokes, fills as `var(--…)`, text styles |
| `src/data/figma/assets.json` | size, art box, collider, anchor of each SVG |
| `src/assets/figma/**.svg` + `index.ts` | props (rest/held/slot), project icons, hooks, shelf, bins (label plate removed — rebuild it in React), `art/` = vector illustrations inside Detail Boards — theme-aware |
| `src/data/figma/images.json` + `public/figma/*.png` | image fills inside spec components (Detail Board photos) |
| `design/reference/*.png` | 1440×1024 renders of every state frame and of the Animation A storyboard |

**MCP supplement** — `design/figma-mcp/` (`supplement.json`, `art/*.svg`, `images/*.png`) holds data read from Figma with the MCP
(read-only `use_figma` + `download_assets`) because the current export predates exporter v2.1. `figma-import` merges it by node id,
never over exported values. Not generated — but don't hand-tune it either: re-read from Figma (see its `_note`) or re-export.

**Verification without leftover servers** — Claude Code cannot stop servers it started on this machine (Windows denies it), so never
run `npm run dev` / `next start` in the background. Instead: `NEXT_DIST_DIR=.next-verify npx next build`, then
`NEXT_DIST_DIR=.next-verify node scripts/snap.mjs <out> "<route>|<selector>|<name>"` (in-process server, exits when done) and
`node scripts/compare-crop.mjs <shot.png> <reference-key> <x> <y> <out>` for a component-sized diff against a reference region.

Exporter v2.1 (2026-10-28) adds per node: `font` (text without a Pegboard style), `absolute` + `sizing` (auto-layout children),
`layout.strokesInLayout`, `layout.counterGap`, `strokeSides`, `effectCss` (custom effects), `asset` + `artBox` (vector art) and `image` (image fills).
Pure black (`#000000` / `black`) is mapped to `var(--line-strong)` by the importer (Zeyi's rule), except inside SVG masks/clip paths.

### Code map
- `src/components/figma/FigmaNode.tsx` — `FigmaComponent` renders any component/variant of `specs.json` like a Figma instance
  (auto layout, fills, strokes, text styles, nested instances, art) with overrides by layer name (`texts`, `textList`, `visible`, `slots`).
  Component wrappers (`ProjectCard`, `DetailBoard`, `components/parts`) only map props → overrides. Fix rendering there, once.
- `src/components/stage/` — `Stage` (scaled 1440×1024), `Placed` (layout box, Figma scale), `LayoutPrimitive` (board/pegs/shelves/bins/props).
- `src/data/projects.ts` — derived from `layouts/t1.json` + Detail Board specs; hand-written only: skills mapping, slugs.
Wrong data → tell Zeyi what to change in Figma; Zeyi re-exports and you run `/figma-sync`. Use the Figma MCP (`get_design_context`, `get_screenshot`,
`get_metadata`, `get_motion_context`) only for what the export lacks. Budget: **200 calls/day, 10/min**. Never loop screenshots.

## Fidelity rules (non-negotiable)
1. **No hard-coded design values.** Colours, radii, shadows, type come from `tokens.css` / Tailwind tokens / `.type-*`. Missing token → stop and report.
2. **Positions come from the layout JSON** (`css` boxes in the 1440×1024 frame). No eyeballing, no re-layout of the board.
3. **Motion comes from the motion JSON.** Times, values and easing are Zeyi's; do not invent or "improve" them. Missing → ask.
4. **Art comes only from `src/assets/figma`** via `figmaSvg[key]`. Never redraw or trace. Theme-aware SVGs are inline (SVGR), never `<img>`.
5. **Copy comes from the export or `src/data/projects.ts`.** Never invent text; missing → `TODO(zeyi): …`.
6. **Themes:** `data-theme="<slug>"` on the element whose colours follow a project; accent boards add `data-surface="accent"` on the same element.
   Slugs: `neutral, ultra-bridge, seatrial, coreds, scada-plus, floatopia, atlas, land-of-snow`.
7. **Component APIs mirror Figma component properties** (same names, camelCased); variants become a `state` union.
8. **One stage:** the page is a 1440×1024 stage scaled uniformly (`transform: scale(s)`); inside it use Figma px only. `?visual=1` forces scale 1 and adds `data-stage`.
9. **Accessibility:** keyboard path for everything, visible focus, `prefers-reduced-motion` honoured everywhere, decorative props `aria-hidden` unless interactive.

## Page model (details in the brief)
One React tree renders the **T1 layout**; every other state is a transform of it, exactly like the Figma motion frame:
- `phase: 't0' | 'intro' | 't1'`. In `t0` every node sits at the **first keyframe** of `motion/animation-a.json` (T0 positions,
  T1-only elements invisible). Clicking the bin plays Animation A (4.8 s) → `t1`. T0 hovers: `hover: 'hi' | 'bin' | null`.
- In `t1`: `{ hovered, opened, skill, held }` (T2–T5), then physics (M7).
- Debug/visual params: `?phase=t0|intro|t1`, `?t=<seconds>` (freeze the intro at that time), `?hover=hi|bin`,
  `?state=hover|open|filter&card=…&skill=…`, `?visual=1`.

## Workflow for every task
1. Read the brief section + the relevant JSON. 2. MCP only if the export lacks something. 3. Implement with tokens + generated assets.
4. **Verify:** `npm run build` clean → `npm run dev` → `/visual-check <state>` (diff against `design/reference`), fix the biggest real
   differences, re-run once (aim < 3 % for static states). For motion: compare `?phase=intro&t=…` with the `anim-a-*` storyboard PNGs.
5. Report in Chinese: what changed, visual % before/after, what you need from Figma. 6. Commit only when asked; never push unless asked.

## Commands
| Command | Does |
|---|---|
| `npm run dev` / `build` / `lint` | Next.js |
| `npm run figma:import -- ~/Downloads/figma-export.json` | regenerate everything from a new export |
| `npm run visual -- "<route>" <reference-key>` | screenshot vs `design/reference/<key>.png` → `design/visual/` |
Slash commands (`.claude/commands/`): `/milestone M#`, `/figma-component <name|link>`, `/figma-sync [path]`, `/visual-check <state>`.

## One-time setup (M0 does these; keep them true)
**SVG (SVGR)** — `npm i -D @svgr/webpack@8`, `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));
    config.module.rules.push(
      { ...fileLoaderRule, test: /\.svg$/i, resourceQuery: /url/ },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: [{ loader: '@svgr/webpack', options: { svgoConfig: { plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false, cleanupIds: false } } }] } } }],
      },
    );
    fileLoaderRule.exclude = /\.svg$/i;
    return config;
  },
};
module.exports = nextConfig;
```
Do not run `next dev --turbo`.

**Fonts** — `.type-*` classes expect `--font-tilt-warp`, `--font-geist`, `--font-geist-mono`, `--font-gentium-book-basic`:
Tilt Warp via `next/font/google` (`variable: '--font-tilt-warp'`); `npm i geist` → `GeistSans` / `GeistMono` and add
`:root { --font-geist: var(--font-geist-sans); }`. Gentium Book Basic (`.type-tag`) — Zeyi's decision: **Helvetica first, Gentium Book
Plus where Helvetica is missing** (`Gentium_Book_Plus` → `--font-gentium-book-plus`; `globals.css` sets
`--font-gentium-book-basic: Helvetica, 'Helvetica Neue', var(--font-gentium-book-plus)`). Put all font `.variable` classes on `<html>`.

**npm registry** — this machine's global `~/.npmrc` points at a corporate Artifactory behind SSO; the repo's `.npmrc` pins the public
registry (the lockfile was always resolved there). Don't remove it.

**Scripts** — `"figma:import": "node scripts/figma-import.mjs"`, `"visual": "node scripts/visual-check.mjs"`;
`npm i -D playwright pixelmatch pngjs && npx playwright install chromium`. Runtime deps: `motion geist matter-js` (+ `@types/matter-js` dev).

## Don'ts
- No UI kits (shadcn, MUI…), no CSS-in-JS, no GSAP/three.js unless Zeyi asks.
- No `localStorage` for anything important; `sessionStorage` for "intro seen" and prop positions, wrapped in try/catch.
- Don't silence TypeScript/ESLint to pass a build. Don't edit generated files. Don't touch case pages before M9.
