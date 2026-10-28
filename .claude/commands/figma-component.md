---
description: Build or update one component so it matches its Figma component 1:1 in every variant
argument-hint: <component name, e.g. "Project Card", or a Figma link with node-id>
---
Target: **$ARGUMENTS**

1. Resolve the target: component name → node-id via the table in `CLAUDE.md`; a Figma link → its `node-id`.
2. Read its entry in `src/data/figma/specs.json` (every variant: auto-layout, padding, gap, radius, strokes, fills,
   text styles, texts) and the SVG keys it needs in `src/data/figma/assets.json`.
3. Only if the spec leaves something unclear, call the Figma MCP: `get_design_context` on the node (once) and
   `get_screenshot` (once). Max 3 MCP calls for this command. Adapt the returned code to this repo; don't paste it.
4. Implement `src/components/board/<Name>.tsx`: props mirror the Figma component properties, variants become a
   `state`/`type` union, colours/sizes via tokens, art via `figmaSvg[...]`, themes via `data-theme` / `data-surface`.
5. Add every variant to `/dev/components`, labelled with the Figma variant name.
6. Compare each variant at 1:1 against the Figma screenshot (or `design/reference/*.png` crops): size, padding,
   type style, colour, stroke, radius, shadow, icon size/position. Fix every difference ≥ 1 px or any colour mismatch.
7. Report in 简体中文 what you built, what still differs and why.
