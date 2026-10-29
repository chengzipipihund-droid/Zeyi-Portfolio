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

// M7 physics toy (brief §8). Start values from the brief; tune the feel here.
export const PHYSICS = {
  /** Drag a pinned tool farther than this (px) and it comes off the wall; before that it follows at `rubberBand`. */
  detach: 60,
  rubberBand: 0.5,
  /** Put down this close (px) to a free hole → hangs there (its new home)… */
  snap: 24,
  /** …only when the pointer was nearly still on release (px per step); faster = a throw. */
  snapMaxSpeed: 3,
  /** Fling: last-3-frame pointer velocity × throw, capped (px per step). */
  throw: 0.6,
  maxThrow: 25,
  restitution: { metal: 0.2, tapeRoll: 0.4 },
  friction: 0.6,
  frictionStatic: 0.8,
  frictionAir: 0.02,
  density: { metal: 0.002, light: 0.001 },
  /** Card pendulums: air friction, density, and the largest swing (degrees) — a hit makes a card swing, never flip it. */
  cardFrictionAir: 0.06,
  cardDensity: 0.003,
  cardMaxSwing: 30,
  /** Turning Rearrange off: tools fly home on this spring. */
  home: { type: 'spring', stiffness: 160, damping: 20 },
} as const;

/** Metal tools (heavier, less bouncy); the rest are plastic / wood (brief §8). */
export const METAL_TOOLS = new Set(['hammer', 'pliers', 'wrench', 'screwdriver', 'utility-knife', 'scissors', 'tape-measure']);
