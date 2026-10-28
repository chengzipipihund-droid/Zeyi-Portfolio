// Motion values that are NOT in Figma — tune the feel here (Figma keyframes stay in src/data/figma/motion/*.json).

export const HOME_MOTION = {
  /** Reduced motion: T0 ⇄ T1 cross-fade, seconds (brief §7.3). */
  reducedFade: 0.3,
  /** WORK → back to the desk, Project bin → collect the cards: Animation A backwards at this speed (Zeyi to confirm). */
  backToDeskSpeed: 2,
  /** Project bin hover on the board (not in Figma; Zeyi to confirm): lift in px, raised above the cards, lift shadow. */
  binHover: { lift: 6, duration: 0.15 },
} as const;
