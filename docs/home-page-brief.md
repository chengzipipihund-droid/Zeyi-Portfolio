# Home page brief — "Shadow Board" (zeyi-cheng.org)

Read with `CLAUDE.md`. Figma page **Pegboard v2 — Shadow Board**, section **C2 · Templates v2.1**.
The home page is **one page with states**: T0 (quiet desk) → Animation A → T1 (full pegboard) → T2–T5 (hover, pick, filter, open).

---

## 1. Definition of done (home v2.0)
- First visit: `/` shows **T0**. Hovering the "hi" plate and the bin play their hover motions. Clicking the bin plays **Animation A**
  (4.8 s) and lands on **T1** pixel-close to `t1-rest.png`. Returning visitors in the same session land directly on T1.
- T1: hover a card → M→L in its colour (T2); click → side board becomes its Detail Board (T5, projects 01–03 complete);
  skill tag → strings + Match/Dim (T4); Esc reverses.
- Keyboard-only and `prefers-reduced-motion` work everywhere; touch works; scaled stage at any width ≥ 360 px.
- `npm run build` clean; Lighthouse performance ≥ 90 on the Vercel preview.
- Physics (pick up, throw, collide, pile) is **M7**; case pages are **M9**.

## 2. Stage
- Frame 1440 × 1024, background `var(--surface-wall)`. `<Stage>`: `s = min(containerWidth / 1440, 1)`, a 1440×1024 layer with
  `transform: scale(s); transform-origin: top left`, wrapper height `1024 * s`, centred when wider than 1440.
- `?visual=1` → `s = 1`, `data-stage` on the 1440×1024 layer, no cursor-dependent decorations.
- Below 768 px: keep the scaled stage for v2.0 (mobile layout will come from Figma later).

## 3. States → frames → code
| State | Figma frame | Layout JSON | Motion JSON | Code state |
|---|---|---|---|---|
| T0 home | T0 Home Page | `t0` | first keyframes of `animation-a` | `phase='t0'` |
| T0 hover "hi" | T0 · Hover hi | `t0-hover-hi` | `t0-hover-hi` | `phase='t0', hover='hi'` |
| T0 hover bin | T0 · Hover bin | `t0-hover-bin` | `t0-hover-bin` | `phase='t0', hover='bin'` |
| Animation A | Animation A · T0 → T0.5 → T1 | (resting = `t1`) | `animation-a` | `phase='intro'` |
| T0.5 (mid-intro) | T0.5 Page Default | `t0-5` | = `animation-a` at t ≈ 1.65 s | — |
| T1 rest | T1 · Rest | `t1` | — | `phase='t1'` |
| T2 / T3 / T4 / T5 | T2 … T5 frames | — (built from components) | — | `hovered / held / skill / opened` |

**The trick that makes everything consistent:** render the **T1 layout once**. T0 is the same DOM with each node offset by the
**first keyframe** of `motion/animation-a.json` (T1-only nodes at opacity 0, T0-only nodes visible). Animation A animates those
offsets to the resting state. This is exactly how the Figma motion frame is built, so positions match by construction.
T0-only nodes in the motion frame: `Bin · T0 label`, `Badge · hi (T0)`, `Nav · WORK (T0)`, `Fly · Mini · …` (cards in the bin), `Cursor · click` (demo only — do not render).

## 4. Layers
**Nav (Zeyi, 2026-10-28):** the **LAB** tab is removed from the site (still in Figma — expect it in visual diffs); WORK, EXP, INFO keep their Figma positions.
**T0 (`layouts/t0.json`):** Top rail · Logo · Nav ×4 (WORK *default*) · Rearrange (β) · Lang toggle · Shelf · desk (bin sits on it) ·
4 Mini cards in the bin (01–04, rotated) · Project bin (label "HI, there / Hihihihihihi" — approved by Zeyi as is) ·
Badge "hi ←" on Shelf · education · Footer. No board, no logo sub.
**T1 (`layouts/t1.json`):** as before plus the **empty Project bin** at (395, 816) (it replaced the spirit level) — header, two boards,
11 tools, pin on the pliers only, 2 shelves, archive bin + 3 archive minis, 4 project cards on hooks, timeline ruler, nameplate,
status lamp, skill tags (7), two education badges, clipboard on its hook, footer. Hooks render above their cards.

## 5. Components
Build from `specs.json` + MCP `get_design_context` when unsure; every state in `/dev/components`.
- **Board** (1019-296): radius `--radius-board`, inside stroke 2 `--board-stroke`, fill `--board-fill`, clips. Holes: inline SVG
  `<pattern>` 40×40, origin (8,12), slot `x=12 y=8 w=8 h=24 rx=4` fill `--board-hole` (first hole top-left at 20,20). `surface: light|accent`.
- **ProjectCard** (1064-11635): `state: rest|hover|match|dim|taken|mini`, props `number meta title subtitle focus icon showStatus theme`.
  rest/match/dim/taken 240×300 · hover 320×540 · mini 200×120. Rest content renders inside `data-theme="neutral"`.
- **Bin** (Object 1146-112083, `variant: project|archive`): SVG body (`object-projectbin`, `object-archivebin`) + React **label plate**
  (frame "Label plate" in `specs.json`, two text lines from the instance texts). The bin is drawn **in front of** the cards inside it.
- **DetailBoard** (1066-16989): one data-driven component; Ultra Bridge, SeaTrial, CoreDS are final in Figma (white board, accent outline
  and text — follow the variant, not older notes); SCADA+ uses the same layout with `TODO(zeyi)` gaps.
- **Prop** (`kind`, `state: rest|held|slot`), **Peg**, **Shelf**: SVGs. **SkillTag, NavTab, LangToggle, StatusLamp, Nameplate, EduBadge,
  Clipboard, TimelineRuler**: React from `specs.json`.

## 6. Data — `src/data/projects.ts`
`slug, theme, number, meta, title, subtitle, focus, icon, showStatus, skills[], detail{kicker, pager, lead, from, to, facts[], chapters?, caseHref, pdfHref?}`
from the card props (`layouts/t1.json`) and Detail Board texts (`specs.json`). Archive minis A1–A3 in a separate list.
Skills → projects (Zeyi, 2026-10-28; 01 Ultra Bridge · 02 SeaTrial · 03 CoreDS · 04 SCADA+):
| Skill tag | Projects |
|---|---|
| HMI / SCADA | 01, 03, 04 |
| AI decision support | 01, 02 |
| Design systems | 03 |
| System architecture | 01, 02, 04 |
| Front-end · React | 01, 02, 03, 04 |
| B2B web tools | 02 |
| Sustainable design | 01 |

## 7. Motion (all values from `src/data/figma/motion/*.json`)
Use `motion/react`. For each animated node: `keyframes = track.map(k => cssValue(k.v))`, `times = track.map(k => k.t / duration)`,
`ease` per segment from `k.ease` (map: EASE_OUT → `easeOut`, EASE_IN → `easeIn`, EASE_IN_AND_OUT → `easeInOut`, LINEAR → `linear`,
CUSTOM_CUBIC_BEZIER → `[x1,y1,x2,y2]`, EASE_OUT_BACK → `backOut`, HOLD → step (`ease: () => 0`), GENTLE/QUICK/BOUNCY/CUSTOM_SPRING
→ a spring or `[0.22, 1, 0.36, 1]` if a spring cannot run inside keyframes). Converters: TRANSLATION_X/Y → `x`/`y` px,
**ROTATION → `rotate: -v`** (Figma is counter-clockwise), SCALE_XY → `scale`, OPACITY → `opacity`. Pivot = element centre.
Wrapper frames (`Hang · …` pivot at the hook, `Fly · …` / `Motion · …` pivot at the card centre) become positioned divs with the same box.
Cross-check with MCP `get_motion_context` on the frame node (it returns motion.dev snippets) — one call per frame.

**7.1 T0 · Hover hi** — plate: `ROTATION` wave over 0.78 s and a 6 px lift; greeting "the website owner is now greeting you warmly."
(`.type-label`, `--text-secondary`) appears 32 px above the plate as a **typewriter**: one span per character, opacity 0→1 in steps across
1.1 s, linear (Figma `TextStagger`, grouping CHARACTER). `aria-live="polite"` with the whole sentence. Leave → fade out 150 ms.

**7.2 T0 · Hover bin** — the four minis spring from their in-bin pose to the fan (`motion/t0-hover-bin.json`, 40 ms stagger, spring
bounce 0.3). Pill "CLICK TO HANG THEM UP" under the shelf. Leave → spring back into the bin. Pure hover effect.

**7.2b Not in Figma (M4 choices, Zeyi to confirm):** leaving the hi plate eases it back to T0 in 150 ms; leaving the bin springs
the minis back with the same spring (no stagger); the "CLICK TO HANG THEM UP" pill fades in/out in 150 ms, like the greeting.
The T0 minis keep their instance's `Show status` (off), so the SCADA+ WIP lamp only shows on the T1 card.

**7.3 Animation A (T0 → T0.5 → T1, 4.8 s)** — trigger: click / Enter on the bin (also on the cards in it).
| Time (s) | What happens |
|---|---|
| 0 – 0.24 | Press: bin squashes to 0.96 and back |
| 0.15 – 0.95 | Bin (with its cards) travels from the desk shelf to its slot on the board (cubic 0.65,0,0.25,1); label cross-fades "HI, there" → "Project" |
| 0.25 – 1.05 | Same-element moves: desk shelf → pen-cup shelf; hi plate + its shelf → education shelf, plate cross-fades "hi" → "(A!)"; WORK tab → current |
| 0.35 – 0.95 | Both boards fade in (0.985 → 1) |
| 0.6 – 1.65 | Nameplate drops in; tools drop in left → right (GENTLE); hooks pop (back-out); archive bin rises; pen cup + mug drop onto the shelf (bouncy); timeline fades |
| 1.65 | = T0.5 (cards still in the bin) |
| 1.75 / 2.07 / 2.39 / 2.71 | Card 01 / 02 / 03 / 04 (each settles 1.82 s after it starts; 04 at 4.53): lifts 120 px out of the bin, flies to its hook (0.45,0,0.2,1) while turning upright and growing to 1.2, cross-fades into the real card which unfolds from the hook (0.84 → 1) and swings 9° → −6° → 3.5° → −1.8° → 0 (EASE_IN_AND_OUT, 0.3 s each); the hook dips 2.5 px |
| 3.25 – 3.5 | Status lamp blinks on (HOLD steps) |
| 3.3 – 4.0 | "Pull a skill…" label and skill tags rise in (50 ms stagger) |
| 3.4 – 4.55 | Clipboard drops onto its hook and swings |
| 4.8 | = T1 |
Rules: one master timeline — a clock (`HomeState`) that every layer samples with `poseAt(node, t)`; `?t=` freezes it.
Click/Esc during the intro → jump to the end. `prefers-reduced-motion` → 300 ms cross-fade T0 → T1 (hovers jump to their pose).
**Routes (Zeyi, 2026-10-29, replaces "play once per visit"):** T0 = `/`, T1 = `/home`, one persistent scene. Bin → `/home` plays
Animation A; WORK on `/home` → `/` plays it backwards at 2× (`styles/motion.ts`, Zeyi to confirm); back/forward animate too;
loading `/home` shows T1 directly; the Logo on T1 replays Animation A. Deep links (`?p=`, `?skill=`) go to `/home`.

**7.4 T1 states** — T2 hover: 80 ms intent, card M→L under its hook (Motion `layout`, spring 380/30), colour 180 ms, tools overlapping the
L card get nudged (≤ 24 px, ≤ 6°) until M7 replaces this with physics. T4 filter: strings draw (`pathLength` 0→1, 400 ms, 60 ms stagger),
Match/Dim, pill "N TOOLS USE <SKILL> · ESC TO RELEASE". T5 open: see 7.5.

**7.4b M6 as built (Figma T2/T4/T5 diffs in `src/data/figma/states.json`):** a tool under the L card uses Figma's T2 pose when
there is one (Ultra Bridge: hammer / pliers / screwdriver picked up = Held, drawn above the card, Slot left under it); tools under
the other three L cards (no Figma frame) get the brief's nudge in place (≤ 24 px, ≤ 6°, under the card). "CLICK TO TAKE IT OFF"
follows the pointer at Figma's offset. Filter: tools 0.45, archive 0.3, Dim cards + their hooks 0.3, "Pull a skill…" hidden, pill
"N TOOLS USE <SKILL> · ESC TO RELEASE", strings + dots from the pulled tag's hole to the hooks. Opening a card clears a filter.
URL: `/home?p=<slug>` / `/home?skill=<slug>` (replaceState). Keyboard focus on a card = L; Enter opens and focus moves to
"PUT BACK"; touch: 1st tap = L, 2nd tap opens. Side flip perspective 1600 px (not in Figma). "Open the case" / PDF: M9 — TODO(zeyi).
**Open question (Zeyi):** the SCADA+ L card grows to y = 1100, past the board (984) and the stage (1024) — Figma has no SCADA+ hover.

**7.5 Card click** — the card is pulled off its hook (y −10 px, scale 1.02, 120 ms, ease-out), then fades into the dashed "taken"
silhouette (200 ms) while the side board flips (rotateY 0→90° 180 ms, swap to the Detail Board, 90→0° 180 ms). URL `/?p=<slug>`.
Put back (Esc / button): reverse; the card drops back onto the hook and swings once (6° → 0, 0.5 s).

## 8. Physics toy (M7, Matter.js)
**No modes (Zeyi, 2026-10-29).** Every tool can always be picked up, dragged and thrown; they collide and pile up. The top-right
button is **Reset** (Figma still says "REARRANGE · β" — rename it there): every tool flies home (spring), cards and bins stop swinging —
the board looks as it did on arrival.
**Hang back only at home:** a lifted tool hangs again only when released (slowly) within 30 px of its own place; anywhere else it
drops. No re-hanging on other holes.
**Archive swap:** clicking the Archive bin collects the project cards into the Project bin (Animation A backwards to T0.5 on the
cards' own clock), then A1–A3 fly out of the Archive bin onto hooks 01–03 (synthesised from the minis' boxes, `lib/motion/archive.ts`);
clicking either bin again swaps back. Both bins get the same hover (lift above the cards, shadow) when the pointer is inside their box.
**World** (stage px, gravity y = 1, `enableSleeping`, fixed 1000/60 ms steps, ≤ 3 per frame, paused when the tab is hidden):
- Static: floor = bottom edge of the main board (inner), side walls, every shelf top, the two bins as U-shapes (things can fall in).
- Tools: compound bodies from `assets.json` (`collider` if Figma has a `Collider` layer, else the shape of the art itself — Zeyi:
  the drawing's own outline, never the frame; the `art` box is too loose for diagonal tools (wrench), so derive a convex hull
  from the SVG geometry; thin tools ≥ 8 px thick).
  Hung tools: pinned by a zero-length constraint at their anchor (`anchor` or top-centre of the art box).
- Cards: pendulum bodies pinned at their hook point (category CARD); collide with free tools only → a thrown hammer makes a card swing.
  They can never be lifted; swing ≤ 30°. Only the hanging set (projects or archive) collides.
- Bins: U-shaped pendulums hung from their top centre — a hit swings them a little (≤ 8°); tools can still fall in.
- Pointer brush: kinematic circle r = 14 following the pointer; collides with hung tools and cards only while pointer speed > 600 px/s.
| Parameter | Start value | Meaning |
|---|---|---|
| detach distance | 30 px | drag a pinned tool farther than this and it comes off the wall |
| rubber band | 0.5 | before detaching it follows the pointer at half distance |
| hang radius | 30 px | released within this of its own place (pointer slower than 3 px/step) → hangs there again; else drops |
| throw | last-3-frame pointer velocity × 0.6, max 25 px/step | fling on release |
| restitution | metal 0.2 · tape roll 0.4 | bounce |
| friction / static / air | 0.6 / 0.8 / 0.02 | piles stay put |
| density | metal 0.002 · plastic/wood 0.001 | hammer heavier than pencil |
**Render:** DOM elements positioned by `transform` in rAF from body positions (no React state per frame); `drop-shadow-lift` while held.
**Persist:** positions in `sessionStorage` (try/catch). **Reduced motion:** physics off; pick up = click a tool, click a hole.
Keyboard: Tab to a tool, Enter knocks it off the wall / hangs it back, Esc hangs it back.

## 9. Case pages (M9)
Figma page **Pegboard v2 — Case pages**, frames 01 (1074-230), 02 (1079-3407), 03 (1082-23178). Build a shared case layout
(Hero, Shift, MetaStrip, ChapterTabs, Chapter, Mount, NextTool) with MCP `get_design_context` per section, export images through
the MCP asset URLs into `public/projects/<slug>/`, content in MDX. SeaTrial role (Zeyi): designer and front-end developer.
Open content gaps (Ultra Bridge observations, SeaTrial placeholder tolerances) stay `TODO(zeyi)`.

## 10. Accessibility, performance, SEO
Tab order header → bin / cards → skill tags → side board → footer; focus ring `2px solid var(--theme-accent)`. Cards and the bin are buttons
with names ("Ultra Bridge — Edge AI Advisory System. Open details", "Open the project board"). SVGs inline via SVGR; fonts self-hosted;
Matter.js lazy-loaded when the board opens; static home page. Metadata: title "Zeyi Cheng — UI/UX & Product Designer", OG image `TODO`.

## 11. Milestones
| # | Scope | Done when |
|---|---|---|
| M0 | Fresh start (CLAUDE.md → "Fresh start"); branch `home-v2`; deps; SVGR; fonts; scripts; import; `tokens.css` in `globals.css`; Tailwind tokens | `npm run build` passes; `/dev/components` shows every SVG with its key |
| M1 | Stage, Board, Peg, Shelf, Bin (+ label plate), Prop | each in `/dev/components`, matches Figma nodes |
| M2 | ProjectCard (6 states), DetailBoard (01–03), SkillTag, NavTab, LangToggle, StatusLamp, Nameplate, EduBadge, Clipboard, TimelineRuler + `projects.ts` | every state 1:1 in `/dev/components` |
| M3 | Home renders **T1** from `layouts/t1.json` | `/visual-check rest` < 3 % |
| M4 | **T0** + its two hovers (7.1, 7.2) | `/visual-check t0`, `hover-hi`, `hover-bin` |
| M5 | **Animation A** (7.3) + `?t=` freeze | storyboard checks `intro-0.55 … intro-3.45` look right; Zeyi approves the feel |
| M6 | T1 interactions: hover L, card click (7.5), filter, Esc, keyboard, touch, reduced motion | `/visual-check hover`, `open`, `open-seatrial`, `open-coreds`, `filter` |
| M7 | Physics toy (§8) | Zeyi can pick up, throw and pile tools; 60 fps on a mid laptop; Reset flies everything home |
| M8 | Polish, metadata, Vercel preview, domain | Lighthouse ≥ 90; live on zeyi-cheng.org |
| M9 | Case pages 01–03 | each page reviewed against its Figma frame |
