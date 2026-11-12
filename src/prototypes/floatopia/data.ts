// Floatopia · demo content, copied from the Figma frames "07 · Prototype v2 — drawing-led" (1379:21907).
// Coordinates are Figma px inside the 402 × 874 phone frame. No backend: availability is a fixed, illustrative set.

export const IMG = '/prototypes/floatopia';

/** The ring drawing is one 1478 × 420 strip; pins are anchored on it (x, y of the anchor dot). */
export const STRIP = { w: 1478, h: 420 };

export interface Island {
  id: string;
  num: string;
  pin: string;
  anchor: [number, number];
  index: string;
  title: string;
  meta: string;
  event?: string;
  built?: boolean;
}

export const ISLANDS: Island[] = [
  { id: 'sports', num: '01', pin: 'Sports', anchor: [361, 148], index: '01 · ON HIGH LINE', title: 'Sports Island', meta: '2 min walk · 14 slots free', event: 'Sat · Vertical Challenge', built: true },
  { id: 'plaza', num: '03', pin: 'Plaza', anchor: [786, 216], index: '03 · GROUND · SQUARE', title: 'Plaza Island', meta: '6 min walk · 3 courts free', event: 'Fri–Sun · Night Market' },
  { id: 'transit', num: '04', pin: 'Transit', anchor: [893, 148], index: '04 · GROUND · HUB', title: 'Transit Island', meta: '7 min walk · cable car 6 min' },
  { id: 'wellness', num: '05', pin: 'Wellness', anchor: [984, 216], index: '05 · GROUND · GARDEN', title: 'Wellness Island', meta: '8 min walk · 8 sessions', event: 'Daily 07:00 · Tai chi' },
  { id: 'kids', num: '06', pin: 'Kids', anchor: [1159, 205], index: '06 · GROUND · PLAY', title: 'Children’s Island', meta: '10 min · pitch free 16:00' },
  { id: 'link', num: '02', pin: 'Link', anchor: [1375, 69], index: '02 · HIGH LINE +500 M', title: 'Community Link', meta: '12 min · 22 bikes ready' },
];

export type Availability = 'free' | 'few' | 'waitlist' | 'open';

export interface Venue {
  id: string;
  n: number;
  name: string;
  meta: string;
  badge: string;
  status: Availability;
  filter: string;
  /** Marker centre on the exploded drawing (screen px) and its tooltip. */
  marker: [number, number];
  tip: string;
  cardMeta: string;
  next?: string;
  insight?: string;
}

export const FILTERS = ['All', 'Climbing', 'Fitness', 'Ball games', 'Running'];

export const VENUES: Venue[] = [
  { id: 'climbing', n: 1, name: 'Rock Climbing Hall', meta: 'L1 · Bouldering Lv 1–7 · B2–B4', badge: '6 free', status: 'free', filter: 'Climbing', marker: [110, 443], tip: 'Rock Climbing · 6 free', cardMeta: 'L1 · Bouldering Lv 1–7 · modules B2–B4', next: 'Next 18:30', insight: 'Next week +1 module here.\nWaitlist reached 31 h.' },
  { id: 'gym', n: 2, name: 'Micro Gym', meta: 'L2 · Strength · module M2', badge: '2 left', status: 'few', filter: 'Fitness', marker: [303, 326], tip: 'Micro Gym · 2 left', cardMeta: 'L2 · Strength · module M2' },
  { id: 'funnel', n: 3, name: 'Box Funnel', meta: 'L2 · Wind tunnel · coach included', badge: 'Waitlist', status: 'waitlist', filter: 'Fitness', marker: [146, 363], tip: 'Box Funnel · waitlist', cardMeta: 'L2 · Wind tunnel · coach included' },
  { id: 'court', n: 4, name: 'Flex Court', meta: 'L3 · Badminton · ping pong', badge: '4 free', status: 'free', filter: 'Ball games', marker: [163, 252], tip: 'Flex Court · 4 free', cardMeta: 'L3 · Badminton · ping pong' },
  { id: 'runway', n: 5, name: 'Elevated Runway', meta: 'L1 · 06:00–23:00 · no booking', badge: 'Open', status: 'open', filter: 'Running', marker: [342, 374], tip: 'Elevated Runway · open', cardMeta: 'L1 · 06:00–23:00 · no booking' },
];

export const LEVELS: { y: number; code: string; name: string }[] = [
  { y: 206, code: 'L3', name: 'Ring' },
  { y: 264, code: 'L2', name: 'Deck' },
  { y: 435, code: 'L1', name: 'Hall' },
  { y: 533, code: 'G', name: 'Centre' },
];
export const NOTES: { x: number; y: number; label: string }[] = [
  { x: 75, y: 169, label: 'Coffee bar' },
  { x: 23, y: 395, label: 'View point' },
  { x: 177, y: 516, label: 'Hockey rink' },
];

// ---------------------------------------------------------------- booking sheet (Rock Climbing Hall)
export const DAYS: { dow: string; day: string; long: string; dot: 'free' | 'few' | 'busy' }[] = [
  { dow: 'SAT', day: '26', long: 'Sat 26 Oct', dot: 'free' },
  { dow: 'SUN', day: '27', long: 'Sun 27 Oct', dot: 'few' },
  { dow: 'MON', day: '28', long: 'Mon 28 Oct', dot: 'free' },
  { dow: 'TUE', day: '29', long: 'Tue 29 Oct', dot: 'free' },
  { dow: 'WED', day: '30', long: 'Wed 30 Oct', dot: 'busy' },
  { dow: 'THU', day: '31', long: 'Thu 31 Oct', dot: 'few' },
  { dow: 'FRI', day: '01', long: 'Fri 01 Nov', dot: 'free' },
];

export interface Slot {
  start: string;
  status: 'free' | 'few' | 'waitlist';
  left: number;
}
const STARTS = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00'];
const SAT: Slot['status'][] = ['free', 'free', 'few', 'waitlist', 'free', 'few', 'waitlist', 'free', 'free'];
const SAT_LEFT = [8, 7, 2, 0, 6, 3, 0, 4, 9];
/** Day 0 is the Figma frame; the other days rotate the same pattern so the grid stays believable. */
export function slotsFor(day: number): Slot[] {
  return STARTS.map((start, i) => {
    if (day === 0) return { start, status: SAT[i], left: SAT_LEFT[i] };
    const status = SAT[(i + day * 2) % SAT.length];
    return { start, status, left: status === 'waitlist' ? 0 : status === 'few' ? 2 + ((i + day) % 2) : 5 + ((i * 3 + day) % 5) };
  });
}
export const PRICE = { session: 40, coach: 80, minutes: 90 };

export const addMinutes = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const t = (h * 60 + m + min + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

export interface Booking {
  island: string;
  venue: string;
  date: string;
  time: string;
  module: string;
  people: string;
  gate: string;
  opens: string;
  heldUntil: string;
  /** People counted towards the climbing module threshold; undefined = no layout card. */
  climbers?: number;
}

// ---------------------------------------------------------------- ask
export const ASK = {
  query: 'badminton tonight after 7, two of us',
  chips: ['Badminton', 'Today', '19:00–22:00', '2 people'],
  options: [
    { id: 'flex', title: 'Flex Court A', where: 'Sports Island · L3 · 4 min walk', time: '20:00–21:30 · MOP 60', why: 'Closest free court. 19:00 is full, 20:00 is quiet.', action: 'Hold', best: true },
    { id: 'plaza', title: 'Plaza Court 1', where: 'Plaza Island · outdoor · 6 min walk', time: '19:30–21:00 · Free', why: 'Starts earlier; lit until 22:00.', action: 'Hold' },
    { id: 'wait', title: 'Flex Court A · waitlist', where: 'Sports Island · L3', time: '19:00–20:30 · MOP 60', why: 'Two people ahead. Books itself if it frees up.', action: 'Join' },
  ],
};
