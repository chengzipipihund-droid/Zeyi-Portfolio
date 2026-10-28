---
description: Implement one milestone of the home-page brief (M0–M9) end to end, then verify it
argument-hint: M0 | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9
---
Implement milestone **$ARGUMENTS** from `docs/home-page-brief.md` §11 (Milestones).

1. Read `CLAUDE.md` and every brief section this milestone touches. Make a short task list and start.
   Only stop to ask Zeyi when something is ambiguous, missing from Figma, or destructive. The deletions listed in
   `CLAUDE.md → Fresh start` are already approved for M0; any other deletion or route rename → ask first.
2. Follow the fidelity rules in `CLAUDE.md` strictly: tokens only, positions from `src/data/figma/layouts/*.json`,
   motion from `src/data/figma/motion/*.json`, art only from `src/assets/figma`, copy only from the export / `projects.ts`,
   `TODO(zeyi)` for anything missing.
3. Verify exactly as `CLAUDE.md → Workflow` says: `npm run build`, then `npm run dev` + the visual checks that apply
   to this milestone, and `/dev/components` for new components. Look at the diff images yourself and fix the biggest
   real differences before reporting.
4. Report to Zeyi in 简体中文:
   - 做了什么（文件列表）
   - 验证结果（build、visual 百分比、需要 Zeyi 用眼睛看的地方）
   - 需要 Zeyi 在 Figma 里补或确认的东西（列出 TODO(zeyi)）
   Do not commit unless Zeyi says so.
