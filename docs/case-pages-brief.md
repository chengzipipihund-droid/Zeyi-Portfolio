# Case pages brief — zeyi-cheng.org (M9)

Read with `CLAUDE.md`. Figma page **Pegboard v2 — Case pages** (file `gFWtnlIFWIpwDxI1ZwHm9v`).
Three case pages ship now: **01 Ultra Bridge**, **02 SeaTrial Explorer**, **03 CoreDS**. SCADA+ (04) is not exported yet.

## 0. Add this block to CLAUDE.md (once, under "Generated files")

```md
| `src/data/figma/cases/<slug>.json` + `index.json` | case pages (`npm run figma:import-cases`): every section as a tree — `kind` = mount / media-frame / image / image-bg / art / component / text / shape / frame, with layout, styles as var(--…), texts, links and media.src |
| `public/projects/<slug>/NNN-*.{jpg,png,svg}` | every visual of the case pages; intro.mp4 and other hand-added files are never touched by the importer |
| `design/reference/cases/<slug>/<section>.png` | 1× render of each case-page section, for `npm run visual:case` |
Case pages: read `docs/case-pages-brief.md` before touching them. Never redraw a visual that exists in public/projects/<slug>;
never invent copy; keep TODO(zeyi) where Figma says "to fill in" / "TO CONFIRM".
```

## 1. Figma → files

| Case | Figma frame | Theme (`data-theme`) | Sections (key = `data-figma-section`) |
|---|---|---|---|
| 01 Ultra Bridge | 1074-230 | `ultra-bridge` | site-header · **intro-film** · breadcrumb · hero · chapter-tabs · chapters 01–07 (07 = Gala & materials, new) · next-tool · site-footer |
| 02 SeaTrial Explorer | 1079-3407 | `seatrial` | site-header · breadcrumb · hero · chapter-tabs · chapters 01–07 (03 = From simulator to sketch, new) · next-tool · site-footer |
| 03 CoreDS | 1082-23178 | `coreds` | site-header · breadcrumb · hero · chapter-tabs · chapters 01–04 · next-tool · site-footer |

The exact keys are in `src/data/figma/cases/index.json` (`NN-<name>`, e.g. `06-chapter-02-energy`). Each section has a 1440-wide
reference PNG in `design/reference/cases/<slug>/<key>.png`.

## 2. The data (`src/data/figma/cases/<slug>.json`)

`{ slug, number, title, modes: { theme }, sections: [{ key, kind, name, number?, title?, anchor?, video?, reference, tree }], media }`

`kind` of a section: `header | film | breadcrumb | hero | tabs | chapter | next | footer`.
Every `tree` node has `id name type x y w h` (+ `sizing: [H, V]` = FIXED/HUG/FILL inside auto-layout, `absolute`, `rotation`, `opacity`)
and a `kind`:

| node kind | what it is | render as |
|---|---|---|
| `frame` | auto-layout or plain frame: `layout {mode, gap, padding, primaryAlign, counterAlign, wrap}`, `style {fills, strokes, radius, padding}` | flex box (`mode` HORIZONTAL → row, VERTICAL → column; NONE → relative box with absolutely placed children) |
| `text` | `text`, `textStyle` (e.g. `Pegboard/Case H2` → class `.type-case-h2`), `fills` (`var(--…)`), `link?` | the right element (`h1` title, `h2` chapter title, `p`…) with the type class and colour; `link` → `<a>` |
| `mount` | a figure: children (one or more media) + `caption {text, textStyle, fills}` | `<figure>` + `<figcaption>` |
| `media-frame` | `frame: "board"` (white card, 2 px ink border, radius 16, padding, optional `pins`) or `frame: "image"` (no border, radius 16, clip) + `media {src, w, h, x, y, alt}` | `<Mount>` frame + `next/image` |
| `image` | a frame/rectangle whose fill is a photo: `media.src`, `style.radius`, optional `style.strokes` | `next/image` with radius (and border if `strokes`) |
| `image-bg` | a frame with a photo fill **and** children (the intro film) | background image + children on top |
| `art` | vector art or a component that is not part of the site kit, exported as SVG/PNG | `<img src>` (decorative unless `alt`) — never redraw |
| `component` | an instance of a site-kit component (`Site/Header`, `Site/Footer`, `Nav/Tab`, `Peg/Hook`, `Project Card`, `Prop/*`, `Icon/Project/*`…) with `props`/`texts` | the existing React component from the home page |
| `shape` | rectangle/ellipse (rules, dots) | a div with the style |

Colours are `var(--token)` strings; a value with `/* collection: name */` is a colour outside Pegboard — use it as is and list it to Zeyi.
`media.src` is already the public URL (`/projects/<slug>/NNN-name.jpg`). Width/height = display size in px at 1440.

## 3. Page anatomy (build these, then fill the bodies with a generic tree renderer)

- **`<CasePage slug>`** at the route the home Detail Board already links to (`caseHref` in `src/data/projects.ts`; default `/work/<slug>`).
  Root: `data-theme={case.modes.theme}`, background `var(--surface-wall)`. Static generation for the three slugs.
- **Site header / footer**: the home components.
- **`<Film>`** (UB only, section kind `film`): see §5.2. Poster = the frame's background image; video `public/projects/ultra-bridge/intro.mp4`
  (`TODO(zeyi)` until the file exists — the poster must look finished without it). Overlay: kicker, title "From manual to guided.",
  play/pause button (the circle), scroll cue. Hide the "VIDEO · … TODO(zeyi)" note text in production (it is a design note).
- **`<CaseHero>`**: a white card, 2 px `var(--line-strong)` border, radius 24 — **no pegboard holes on case pages**. Kicker in
  `--text-secondary`; **title and subtitle in `--theme-accent`**; lead, "FROM … TO …" shift and award pill in ink; meta strip
  (keys `--text-secondary`, values `--text-primary`); visual on the right as a `media-frame`.
- **`<ChapterTabs>`**: the tab rail (`Nav/Tab` instances). Sticky under the header, the current chapter is `State=Current`
  (scroll-spy), click scrolls to the chapter anchor (`#01-context-research` …). Keyboard: tabs are links.
- **`<Chapter>`**: "Chapter head" (number in accent, title, lead) + rule + body rendered from the tree.
- **`<Mount>`**: `frame: "board"` = white card + border + padding + pins (`Peg/Hook` Pin, absolutely placed); `frame: "image"` =
  the image itself with radius 16 and no border (Zeyi's rule: dark, coloured or non-white images frame themselves).
- **Official site card** (UB chapter 07, node "Official site"): the button text links to
  `https://pdp-wartsila.vercel.app/portfolio` (`target="_blank" rel="noopener"`), label "Explore our voyage.".
- **`<NextTool>`**: white card (no holes), Project Card on a hook + props; "Take it off →" goes to the next case, "Back to the board"
  goes to `/` and opens that project's Detail Board (`/?p=<slug>`).

## 4. Fidelity rules for case pages

1. Desktop (≥ 1280 px) matches the reference PNGs: content width 1280, side padding 80 at 1440, sizes and gaps from the tree.
2. Tokens and `.type-*` classes only; no hex values unless the JSON gives one.
3. Images: `next/image` with `width/height` from the JSON, `sizes` for the column width, `priority` only for the hero/film poster.
4. Visuals that are images in `public/projects` stay images (screens, diagrams, print pieces). Use `media.alt` as alt text, or `alt=""` for `art`.
5. Copy only from the JSON. Open items stay visible to Zeyi as `TODO(zeyi)` comments — never invent field observations or roles.

## 5. Motion

### 5.1 Section scenes (all case pages)
Every section with kind `hero | chapter | next` is a scene:
- **Enter**: as its top moves from the bottom of the viewport to 65 % of the viewport height → opacity 0 → 1, `y` 48 px → 0.
- **Leave**: as its bottom moves from 35 % of the viewport height to the top → opacity 1 → 0, `y` 0 → −32 px.
- Scroll-linked (Motion `useScroll({ target, offset })` + `useTransform`), not time-based; two ranges per section so tall chapters
  (2–3 k px) stay fully visible while you read them. Smooth with `useSpring({ stiffness: 200, damping: 40 })` on the progress.
- Inside a chapter each `mount` reveals once when 20 % visible: opacity 0 → 1, `y` 16 → 0, 500 ms ease-out, 60 ms stagger per row.
- Header, breadcrumb, chapter tabs and footer never fade.

### 5.2 Intro film → case (Ultra Bridge)
- The film section is a 160 vh scroll runway with a `position: sticky; top: 0; height: 100vh` stage (video `object-fit: cover`,
  `autoplay muted loop playsInline`, poster). The header stays above it.
- Over the runway, film opacity 1 → 0 and scale 1 → 1.04 (progress 0.4 → 1). The breadcrumb + hero are pulled up by −60 vh so they
  rise over the fading film and fade in with their own enter range: the two cross-fade, no blank frame in between.
- Pause the video when the film is out of view; the circle button toggles play/pause (`aria-label`), the scroll cue fades out
  after 120 px of scroll.
- Missing `intro.mp4` → poster only, same layout.

### 5.3 Reduced motion and visual checks
`prefers-reduced-motion` **or** `?visual=1` → no scroll animation at all: every section fully visible at rest, film = poster as a
normal 810 px section (no sticky, no runway, no negative margin), no autoplay. This is what `npm run visual:case` compares.

## 6. Responsive (Figma has desktop only)
≥ 1280: as Figma. 768–1279: same structure, content width `calc(100vw − 2 × 48px)`, columns keep proportions.
< 768: rows wrap into one column, side padding 20, chapter head stacks (number, title, lead), type scales with `clamp()`
down to 0.8×; tickets/guide strips scroll horizontally. Mark this as provisional — Zeyi will design mobile later.

## 7. Performance, a11y, SEO
`npm i -D sharp` before importing (the importer recompresses the bitmaps). Lazy-load everything below the hero; video `preload="metadata"`.
Each case page: `<title>` "<Title> — <Subtitle> · Zeyi Cheng", description = hero lead, OG image = hero visual.
Landmarks: `<header> <main> <footer>`; one `h1` (case title); chapters are `<section aria-labelledby>`.
Lighthouse ≥ 90 performance on each case page.

## 8. Open content (show to Zeyi, keep as TODO)
- UB chapter 01 note "2 FERRY VISITS + PRODUCT TEST → Key field observations — to fill in."
- SeaTrial hero meta "ROLE & PERIOD · TO CONFIRM".
- UB `intro.mp4` (the film itself).
- Anything the importer lists under "notes".

## 9. Verify
`npm run build` · `npm run visual:case -- ultra-bridge` (and the other two) — ✓ < 3 % per section is the goal, explain anything above 8 % ·
scroll each page by hand: scenes fade in/out, film cross-fades into the hero and back, tabs follow the scroll, reduced motion shows
everything · keyboard: Tab through tabs, links, film button · Lighthouse.
