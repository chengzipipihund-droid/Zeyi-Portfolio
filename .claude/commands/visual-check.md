---
description: Compare a home-page state (or an Animation A moment) with its Figma reference PNG and fix the biggest differences
argument-hint: t0 | hover-hi | hover-bin | rest | hover | filter | open | open-seatrial | open-coreds | intro-<seconds>
---
State: "$ARGUMENTS" (empty = rest).

| state | route (no leading "/" — Git Bash rewrites it) | reference (`design/reference/<key>.png`) |
|---|---|---|
| t0 | `?visual=1` | `t0-home-page` |
| hover-hi | `?hover=hi&visual=1` | `t0-hover-hi` |
| hover-bin | `?hover=bin&visual=1` | `t0-hover-bin` |
| rest | `home?visual=1` | `t1-rest` |
| hover | `home?state=hover&card=ultra-bridge&visual=1` | `t2-hover` |
| filter | `home?state=filter&skill=hmi-scada&visual=1` | `t4-filter` |
| open / open-seatrial / open-coreds | `home?state=open&card=ultra-bridge&visual=1` (… `seatrial`, `coreds`) | `t5-open` / `t5-open-seatrial` / `t5-open-coreds` |
| intro-0.55 … intro-4.80 | `?t=0.55&visual=1` | `anim-a-0-55` (storyboard: 0.00, 0.55, 1.10, 1.65, 2.15, 2.80, 3.45, 4.80) |
(`t3-pick` belongs to M7. Storyboard PNGs are a static bake with approximate easing: compare positions and visibility, not exact pixels.)

1. Never start `npm run dev` / `next start` in the background (Claude Code cannot stop them on this machine). Build instead:
   `NEXT_DIST_DIR=.next-verify npx next build`.
2. `NEXT_DIST_DIR=.next-verify node scripts/snap.mjs design/visual "<route>|[data-stage]|<reference>"` then
   `node scripts/compare-crop.mjs design/visual/<reference>.png <reference> 0 0 design/visual`.
3. Open `design/reference/<reference>.png`, `design/visual/<reference>.png` and `-diff.png` (you can read images); list the
   differences, biggest first. Ignore pure font anti-aliasing (Chrome on Windows renders sub-pixel colour fringes).
4. Fix up to 5 real differences (position, size, colour, missing element, z-order, timing for intro states), re-run once.
5. Report in 简体中文: before → after %, what you fixed, what remains and why.
