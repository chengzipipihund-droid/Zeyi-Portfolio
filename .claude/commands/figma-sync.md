---
description: Re-import a fresh Figma export and adapt the code to whatever changed in the design
argument-hint: <path to figma-export.json> (empty = ~/Downloads/figma-export.json)
---
Path given: "$ARGUMENTS" (if empty, use `~/Downloads/figma-export.json`).

1. Run `npm run figma:import -- <path>` and read its warnings.
2. `git diff --stat` and `git diff` on `src/styles/tokens.css`, `src/data/figma/**` and `src/assets/figma/index.ts`.
   Summarise for Zeyi which tokens, positions, texts, motion keyframes, components and SVG keys changed (added / removed / renamed).
3. Fix code that references removed or renamed keys, props or tokens. Never hand-edit generated files.
4. `npm run build`, then `/visual-check rest` and `/visual-check t0` (plus states touched by the change). If motion changed,
   re-check the intro at the storyboard times. Fix regressions.
5. Report in 简体中文: what changed in Figma → what you changed in code → visual % before/after.
