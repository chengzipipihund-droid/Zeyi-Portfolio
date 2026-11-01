---
description: Build or update one case page from the Figma case export, or re-sync all of them after a new export
argument-hint: ultra-bridge | seatrial-explorer | coreds | sync
---
Argument: "$ARGUMENTS"

If it is `sync`:
1. `npm run figma:import-cases` (all `~/Downloads/figma-case-*.zip`), read the notes it prints.
2. `git diff --stat src/data/figma/cases public/projects` — summarise for Zeyi which sections, texts and images changed.
3. Fix code that depends on renamed/removed sections or node names. Never hand-edit generated files.
4. `npm run build`, then `npm run visual:case -- <slug>` for every changed case. Report in 简体中文.

Otherwise build/update the case page `$ARGUMENTS`:
1. Read `CLAUDE.md` and `docs/case-pages-brief.md` (all of it), `src/data/figma/cases/index.json` and `src/data/figma/cases/$ARGUMENTS.json`.
   Look at `design/reference/cases/$ARGUMENTS/*.png` before writing code.
2. Implement / fix following the brief: page anatomy §3, rules §4, motion §5, responsive §6. Reuse the home-page components
   (header, footer, Nav/Tab, Peg, Project Card, props). Every section element gets `data-figma-section="<key>"`.
3. Verify: `npm run build` clean → `npm run dev` → `npm run visual:case -- $ARGUMENTS`; open the worst diff images yourself and fix
   real differences (layout, colour, missing media) before reporting. Then scroll the page with motion on and with `?visual=1`.
4. Report to Zeyi in 简体中文: files changed · per-section visual % · what to look at in the browser · open TODO(zeyi).
   Do not commit unless Zeyi says so.
