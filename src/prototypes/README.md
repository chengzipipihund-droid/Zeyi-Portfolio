# Prototypes

Coded prototypes shown on `/portfolio`. Each folder is self-contained: React + one CSS file + one data file, no imports
from the rest of the site, no backend, no extra npm packages.

| Folder | Built from (Figma, file `gFWtnlIFWIpwDxI1ZwHm9v`) | Covers |
|---|---|---|
| `seatrial/` | page "SeaTrial Explorer": `P06 · Compare` 872:18979, tokens and drawing rules of the code layer 920:22003 | Compare (split / overlay, shared timeline, ghost hulls, events, deltas, Swap A/B), harbour picker, Value |
| `floatopia/` | page "Floatopia": section `07 · Prototype v2 — drawing-led` 1379:21907 (8 frames) | Map home → zoom → island → exploded → venue sheet → booked, Ask, Swap offer |

## Contract with the tour
`<Prototype ref={api} onEvent={fn} />`
- `api.goto(scene)` puts the prototype in a named state (the scene of a tour step).
- `onEvent(name)` reports what the visitor did (`scrub`, `swap`, `book` …); a step is ticked when one of its `done` events arrives.
- `data-tour="…"` marks the elements a step can outline.
Steps and copy live in `src/data/prototypes.ts`; the shell is `src/components/portfolio/Demo.tsx`.

## Data
All numbers are illustrative. SeaTrial tracks are synthesised from keyframes in `seatrial/data.ts` (harbour 1 = the
Figma case, 11:53 vs 10:02; harbours 2 and 3 were added for the demo). Floatopia content is copied from the frames;
availability for days other than Sat 26 rotates the same pattern.

## Assets
`public/prototypes/floatopia/*` are renders of the image fills in the Figma frames (ring map at 2×, others at 3–4×).
To refresh one, re-render the node in Figma and replace the file; sizes are set in the code, not read from the file.

## Fonts
Loaded in `src/app/portfolio/layout.tsx`: Barlow (SeaTrial), DM Mono and Archivo (Floatopia). Figma sets Floatopia in
SF Pro, which cannot be served on the web: Inter stands in for SF Pro and Archivo at 125 % width for SF Pro Expanded.

## Using one outside this site
Copy the folder and its assets into any React 18 project, import the component, give it a sized parent
(SeaTrial: at least 1280 × 770; Floatopia: 402 × 874) and provide the font variables above.
