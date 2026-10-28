---
description: Compare a home-page state (or an Animation A moment) with its Figma reference PNG and fix the biggest differences
argument-hint: t0 | hover-hi | hover-bin | rest | hover | filter | open | open-seatrial | open-coreds | intro-<seconds>
---
State: "$ARGUMENTS" (empty = rest).

| state | route | reference (`design/reference/<key>.png`) |
|---|---|---|
| t0 | `/?phase=t0` | `t0-home-page` |
| hover-hi | `/?phase=t0&hover=hi` | `t0-hover-hi` |
| hover-bin | `/?phase=t0&hover=bin` | `t0-hover-bin` |
| rest | `/?phase=t1` | `t1-rest` |
| hover | `/?phase=t1&state=hover&card=ultra-bridge` | `t2-hover` |
| filter | `/?phase=t1&state=filter&skill=hmi-scada` | `t4-filter` |
| open / open-seatrial / open-coreds | `/?phase=t1&state=open&card=ultra-bridge` (… `seatrial`, `coreds`) | `t5-open` / `t5-open-seatrial` / `t5-open-coreds` |
| intro-0.55 … intro-4.80 | `/?phase=intro&t=0.55` | `anim-a-0-55` (storyboard: 0.00, 0.55, 1.10, 1.65, 2.15, 2.80, 3.45, 4.80) |
(`t3-pick` belongs to M7. Storyboard PNGs are a static bake with approximate easing: compare positions and visibility, not exact pixels.)

1. Make sure `npm run dev` is running (start it in the background if not).
2. `npm run visual -- "<route>" <reference>`.
3. Open `design/reference/<reference>.png`, `design/visual/<reference>-actual.png` and `-diff.png` (you can read images); list the
   differences, biggest first. Ignore pure font anti-aliasing.
4. Fix up to 5 real differences (position, size, colour, missing element, z-order, timing for intro states), re-run once.
5. Report in 简体中文: before → after %, what you fixed, what remains and why.
