// Motion values that are NOT in Figma — tune the feel here (Figma keyframes stay in src/data/figma/motion/*.json).

export const HOME_MOTION = {
  /** Reduced motion: T0 ⇄ T1 cross-fade, seconds (brief §7.3). */
  reducedFade: 0.3,
  /** WORK → back to the desk, Project bin → collect the cards: Animation A backwards at this speed (Zeyi to confirm). */
  backToDeskSpeed: 2,
  /** Project bin hover on the board (not in Figma; Zeyi to confirm): lift in px, raised above the cards, lift shadow. */
  binHover: { lift: 6, duration: 0.15 },
} as const;

// T1 interactions (docs/home-page-brief.md §7.4–7.5). Start values from the brief; tune the feel here.
export const BOARD_MOTION = {
  /** Hover intent before a card grows to L, seconds. */
  hoverIntent: 0.08,
  /** Card M → L, tools pushed aside: spring. */
  grow: { type: 'spring', stiffness: 380, damping: 30 },
  /** Black → project colour (rest ⇄ hover / match / dim cross-fade), seconds. */
  colour: 0.18,
  /** Pull off the hook: lift px, scale, seconds; then fade into the "taken" silhouette. */
  pull: { lift: 10, scale: 1.02, duration: 0.12, fade: 0.2 },
  /** Put back: the card drops onto its hook and swings once, degrees → 0. */
  putBack: { swing: 6, duration: 0.5 },
  /** Side board flip, each half (0 → 90°, swap, 90 → 0°), seconds. */
  flipHalf: 0.18,
  /** Skill strings draw (pathLength 0 → 1), seconds, and stagger per string. */
  strings: { duration: 0.4, stagger: 0.06 },
} as const;
