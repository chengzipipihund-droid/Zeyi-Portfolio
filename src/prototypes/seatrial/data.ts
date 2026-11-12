// SeaTrial Explorer · demo data. Everything here is ILLUSTRATIVE: tracks are smooth curves through hand-set
// keyframes (same method as the prototype's scripts/generate_data.py), metrics are set by hand. Nothing comes from a
// simulator run. Harbour 1 reproduces the case shown in Figma (P06 · Compare); harbours 2 and 3 are added for the demo.
// Coordinates: harbour-local metres, x east, y north; heading nautical (0 = north, clockwise).

export type Point = [number, number];
/** t, x, y, headingDeg, sogKn, rotDegMin, bowThrusterPct, powerMW */
export type Sample = [number, number, number, number, number, number, number, number];
export type Identity = 'baseline' | 'gate-rudder';

export interface Configuration {
  id: string;
  name: string;
  short: string;
  role: string;
  identity: Identity;
}

export interface RunEvent {
  t: number;
  label: string;
  kind: 'mode' | 'actuator' | 'finish';
}

export interface Run {
  config: Configuration;
  samples: Sample[];
  events: RunEvent[];
  duration: number;
  metrics: Record<MetricKey, number>;
}

export type MetricKey = 'time' | 'energy' | 'thruster' | 'quay';

export const METRICS: { key: MetricKey; label: string; unit: string; better: 'lower' | 'higher' }[] = [
  { key: 'time', label: 'Manoeuvre time', unit: '', better: 'lower' },
  { key: 'energy', label: 'Energy for manoeuvre', unit: 'MWh', better: 'lower' },
  { key: 'thruster', label: 'Peak bow thruster load', unit: '%', better: 'lower' },
  { key: 'quay', label: 'Min. distance to quay', unit: 'm', better: 'higher' },
];

export interface Harbour {
  /** Width of the map view in metres and its centre at t = 0. The camera only moves when the ships would leave the view. */
  view: { widthM: number; cx: number; cy: number };
  land: Point[][];
  berth: { label: string; x0: number; x1: number; y: number; landSide: 'north' | 'south' };
  finish: { x: number; y: number; r: number };
  basin?: { x: number; y: number; r: number };
  contours: { depthM: number; points: Point[] }[];
}

export interface Environment {
  wind: { kn: number; fromDeg: number };
  waves: { hsM: number; fromDeg: number; tpS: number };
  current: { kn: number; towardDeg: number };
  depthM: number;
}

export interface Scenario {
  id: string;
  port: string;
  manoeuvre: string;
  note: string;
  env: Environment;
  harbour: Harbour;
  runs: Record<'flap' | 'gate', Run>;
}

export const VESSEL = { name: 'Ro-Pax ferry · RP-212', loaM: 212, beamM: 30, draughtM: 6.8 };

export const CONFIGS: Record<'flap' | 'gate', Configuration> = {
  flap: { id: 'flap', name: 'Flap rudder + 2 × FPP', short: 'Flap rudder', role: 'Baseline', identity: 'baseline' },
  gate: { id: 'gate', name: 'Gate Rudder + 2 × FPP', short: 'Gate Rudder', role: 'Proposal', identity: 'gate-rudder' },
};

// ---------------------------------------------------------------- track synthesis
const DT = 2;
type Key = [t: number, x: number, y: number, hdg: number];

/** Cubic Hermite through keyframes with Catmull-Rom tangents, starting at rest. */
function hermite(keys: Key[]): [number, number, number, number][] {
  const n = keys.length;
  const T = keys.map((k) => k[0]);
  const P = keys.map((k) => [k[1], k[2], k[3]]);
  const M = P.map((_, i) => {
    if (i === 0) return [0, 0, 0];
    if (i === n - 1) return P[i].map((v, d) => (v - P[i - 1][d]) / (T[i] - T[i - 1]));
    return P[i].map((_, d) => (P[i + 1][d] - P[i - 1][d]) / (T[i + 1] - T[i - 1]));
  });
  const end = T[n - 1];
  const times: number[] = [];
  for (let t = 0; t <= end + 1e-9; t += DT) times.push(t);
  if (end - times[times.length - 1] > 1e-6) times.push(end);
  return times.map((t) => {
    let i = 0;
    while (i < n - 2 && t > T[i + 1]) i++;
    const h = T[i + 1] - T[i];
    const u = (t - T[i]) / h;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10 = u ** 3 - 2 * u ** 2 + u;
    const h01 = -2 * u ** 3 + 3 * u ** 2;
    const h11 = u ** 3 - u ** 2;
    const v = [0, 1, 2].map((d) => h00 * P[i][d] + h10 * h * M[i][d] + h01 * P[i + 1][d] + h11 * h * M[i + 1][d]);
    return [t, v[0], v[1], v[2]] as [number, number, number, number];
  });
}

const smoothstep = (a: number, b: number, t: number) => {
  if (t <= a) return 0;
  if (t >= b) return 1;
  const u = (t - a) / (b - a);
  return u * u * (3 - 2 * u);
};
const bump = (riseEnd: number, holdEnd: number, fallEnd: number, peak: number) => (t: number) =>
  peak * smoothstep(0, riseEnd, t) * (1 - smoothstep(holdEnd, fallEnd, t));

function buildTrack(keys: Key[], thruster: (t: number) => number, energyMWh: number): Sample[] {
  const pts = hermite(keys);
  const rows = pts.map(([t, x, y, hdg], i) => {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    const span = Math.max(b[0] - a[0], 1e-6);
    const sog = Math.hypot((b[1] - a[1]) / span, (b[2] - a[2]) / span) * 1.943844;
    const rot = ((b[3] - a[3]) / span) * 60;
    return [t, x, y, ((hdg % 360) + 360) % 360, sog, rot, thruster(t)];
  });
  // Power: hotel-ish base + thruster + propulsion, scaled to hit the energy target.
  const raw = rows.map((s) => 0.55 + (1.1 * s[6]) / 100 + 0.08 * s[4] ** 1.6 + 0.004 * Math.abs(s[5]));
  const k = energyMWh / (raw.reduce((e, p) => e + p * DT, 0) / 3600);
  return rows.map((s, i) => [...s, raw[i] * k] as Sample);
}

function run(
  cfg: 'flap' | 'gate',
  keys: Key[],
  thruster: [number, number, number, number],
  metrics: Omit<Record<MetricKey, number>, 'time'>,
  events: RunEvent[],
): Run {
  const duration = keys[keys.length - 1][0];
  return {
    config: CONFIGS[cfg],
    samples: buildTrack(keys, bump(...thruster), metrics.energy),
    events: [...events, { t: duration, label: 'Finish zone reached', kind: 'finish' }],
    duration,
    metrics: { time: duration, ...metrics },
  };
}

// ---------------------------------------------------------------- scenarios
export const SCENARIOS: Scenario[] = [
  {
    // The Figma case: 11:53 against 10:02.
    id: 'open-quay',
    port: 'Nordkaj · Berth 3',
    manoeuvre: 'Un-berthing, 10 kn onto berth',
    note: 'Open quay. Wind pushes the ship onto the berth; crab off, then swing to the fairway in the south-east.',
    env: { wind: { kn: 10, fromDeg: 180 }, waves: { hsM: 0.5, fromDeg: 200, tpS: 4.5 }, current: { kn: 0.3, towardDeg: 90 }, depthM: 12 },
    harbour: {
      view: { widthM: 1160, cx: 250, cy: -190 },
      land: [
        [[-3000, 0], [3000, 0], [3000, 600], [-3000, 600]],
        [[640, 0], [690, 0], [690, -320], [640, -320]],
      ],
      berth: { label: 'Berth 3', x0: -120, x1: 120, y: 0, landSide: 'north' },
      finish: { x: 500, y: -700, r: 80 },
      contours: [
        { depthM: 8, points: [[-3000, -90], [-200, -120], [300, -100], [640, -60]] },
        { depthM: 12, points: [[-3000, -420], [0, -470], [500, -430], [3000, -380]] },
      ],
    },
    runs: {
      flap: run(
        'flap',
        [[0, 0, -15, 90], [90, -5, -40, 88], [180, -10, -90, 92], [260, 0, -160, 102], [360, 60, -260, 118], [460, 170, -380, 132], [560, 290, -500, 142], [640, 400, -610, 147], [713, 500, -700, 150]],
        [80, 260, 440, 92],
        { energy: 4.1, thruster: 92, quay: 18 },
        [
          { t: 20, label: 'Bow thruster on', kind: 'actuator' },
          { t: 40, label: 'Stern thruster on', kind: 'actuator' },
          { t: 300, label: 'Rudder hard over', kind: 'actuator' },
        ],
      ),
      gate: run(
        'gate',
        [[0, 0, -15, 90], [60, 0, -45, 92], [120, 5, -100, 98], [200, 40, -180, 112], [300, 130, -300, 130], [400, 250, -440, 142], [500, 380, -580, 148], [602, 500, -700, 150]],
        [50, 90, 220, 61],
        { energy: 2.9, thruster: 61, quay: 24 },
        [
          { t: 0, label: 'Crabbing mode', kind: 'mode' },
          { t: 130, label: 'Steering mode', kind: 'mode' },
          { t: 520, label: 'Sailing mode', kind: 'mode' },
        ],
      ),
    },
  },
  {
    id: 'inner-basin',
    port: 'Sundby · Inner basin',
    manoeuvre: 'Crab off, swing 180° in the basin',
    note: 'Enclosed basin. Crab off the north quay, turn inside a 380 m circle, leave through the eastern gap.',
    env: { wind: { kn: 15, fromDeg: 190 }, waves: { hsM: 0.3, fromDeg: 190, tpS: 3.5 }, current: { kn: 0, towardDeg: 0 }, depthM: 10 },
    harbour: {
      view: { widthM: 1180, cx: 230, cy: -170 },
      land: [
        [[-3000, 0], [3000, 0], [3000, 600], [-3000, 600]],
        [[-3000, -400], [770, -400], [770, -900], [-3000, -900]],
        [[720, 0], [770, 0], [770, -95], [720, -95]],
        [[720, -235], [770, -235], [770, -400], [720, -400]],
      ],
      berth: { label: 'Berth 5', x0: -120, x1: 120, y: 0, landSide: 'north' },
      finish: { x: 660, y: -165, r: 55 },
      basin: { x: 160, y: -190, r: 190 },
      contours: [{ depthM: 8, points: [[-3000, -70], [-150, -95], [420, -80], [720, -110]] }],
    },
    runs: {
      flap: run(
        'flap',
        [[0, 0, -18, 270], [100, -5, -60, 271], [200, 10, -130, 262], [300, 60, -195, 225], [400, 120, -215, 170], [500, 200, -205, 120], [600, 320, -180, 98], [700, 480, -168, 91], [790, 660, -165, 90]],
        [70, 430, 560, 100],
        { energy: 4.6, thruster: 100, quay: 22 },
        [
          { t: 15, label: 'Bow thruster on', kind: 'actuator' },
          { t: 210, label: 'Bow thruster at 100 %', kind: 'actuator' },
          { t: 520, label: 'Rudder amidships', kind: 'actuator' },
        ],
      ),
      gate: run(
        'gate',
        [[0, 0, -18, 270], [70, 5, -70, 268], [150, 40, -150, 240], [240, 110, -200, 180], [330, 180, -190, 120], [420, 300, -172, 95], [520, 480, -165, 90], [600, 660, -165, 90]],
        [45, 250, 340, 66],
        // Faster swing, but it passes closer to the quay: the proposal is not better on every number.
        { energy: 3.1, thruster: 66, quay: 14 },
        [
          { t: 0, label: 'Crabbing mode', kind: 'mode' },
          { t: 90, label: 'Turning mode', kind: 'mode' },
          { t: 400, label: 'Sailing mode', kind: 'mode' },
        ],
      ),
    },
  },
  {
    id: 'river-berth',
    port: 'Hallvik · River berth',
    manoeuvre: 'Crabbing against 0.8 kn current',
    note: 'River quay, 320 m fairway. The current sets the ship downstream while it leaves the berth.',
    env: { wind: { kn: 6, fromDeg: 20 }, waves: { hsM: 0.1, fromDeg: 20, tpS: 2 }, current: { kn: 0.8, towardDeg: 270 }, depthM: 9 },
    harbour: {
      view: { widthM: 1200, cx: 300, cy: 150 },
      land: [
        [[-3000, 0], [3000, 0], [3000, -600], [-3000, -600]],
        [[-3000, 330], [-200, 318], [500, 326], [3000, 310], [3000, 900], [-3000, 900]],
      ],
      berth: { label: 'Berth 1', x0: -120, x1: 120, y: 0, landSide: 'south' },
      finish: { x: 720, y: 160, r: 60 },
      contours: [
        { depthM: 6, points: [[-3000, 62], [-100, 70], [400, 58], [3000, 66]] },
        { depthM: 6, points: [[-3000, 268], [0, 262], [600, 272], [3000, 258]] },
      ],
    },
    runs: {
      flap: run(
        'flap',
        [[0, 0, 18, 90], [90, -25, 45, 92], [180, -50, 85, 90], [270, -30, 125, 84], [360, 60, 150, 82], [460, 240, 160, 86], [560, 480, 162, 90], [650, 720, 160, 90]],
        [60, 250, 380, 96],
        { energy: 3.8, thruster: 96, quay: 12 },
        [
          { t: 15, label: 'Bow thruster on', kind: 'actuator' },
          { t: 120, label: 'Set 50 m downstream', kind: 'actuator' },
          { t: 280, label: 'Rudder hard over', kind: 'actuator' },
        ],
      ),
      gate: run(
        'gate',
        [[0, 0, 18, 90], [60, 0, 55, 88], [130, 20, 105, 84], [220, 120, 140, 82], [320, 310, 155, 86], [420, 540, 160, 90], [500, 720, 160, 90]],
        [40, 110, 200, 58],
        { energy: 2.6, thruster: 58, quay: 20 },
        [
          { t: 0, label: 'Crabbing mode', kind: 'mode' },
          { t: 100, label: 'Steering mode', kind: 'mode' },
          { t: 330, label: 'Sailing mode', kind: 'mode' },
        ],
      ),
    },
  },
];

// ---------------------------------------------------------------- helpers
export interface ShipState {
  t: number;
  x: number;
  y: number;
  headingDeg: number;
  sogKn: number;
  ended: boolean;
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpAngle = (a: number, b: number, u: number) => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + d * u + 360) % 360;
};

export function stateAt(samples: Sample[], t: number): ShipState {
  const last = samples[samples.length - 1];
  if (t >= last[0]) return { t: last[0], x: last[1], y: last[2], headingDeg: last[3], sogKn: last[4], ended: true };
  if (t <= 0) return { t: 0, x: samples[0][1], y: samples[0][2], headingDeg: samples[0][3], sogKn: samples[0][4], ended: false };
  const i = Math.min(samples.length - 2, Math.floor(t / DT));
  const a = samples[i];
  const b = samples[i + 1];
  const u = (t - a[0]) / (b[0] - a[0]);
  return { t, x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), headingDeg: lerpAngle(a[3], b[3], u), sogKn: lerp(a[4], b[4], u), ended: false };
}

export function ghostTimes(endT: number, tNow: number, every: number): number[] {
  const out: number[] = [];
  for (let t = 0; t < Math.min(tNow, endT) - 1e-6; t += every) out.push(t);
  return out;
}

/** Ship outline in units of length (x, bow towards +x) and beam (y). Same polygon as the Figma panel. */
export const HULL: Point[] = [[0.5, 0], [0.34, 0.5], [-0.47, 0.5], [-0.5, 0.4], [-0.5, -0.4], [-0.47, -0.5], [0.34, -0.5]];

export const mmss = (s: number) => `${String(Math.floor(Math.round(s) / 60)).padStart(2, '0')}:${String(Math.round(s) % 60).padStart(2, '0')}`;
/** 111 → "1:51" (deltas and axis ticks). */
export const mss = (s: number) => `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

export function formatMetric(key: MetricKey, v: number): string {
  if (key === 'time') return mmss(v);
  if (key === 'energy') return `${v.toFixed(1)} MWh`;
  if (key === 'thruster') return `${Math.round(v)} %`;
  return `${Math.round(v)} m`;
}

/** Delta of `b` against `a`, as text and as a verdict that does not care which configuration it is. */
export function delta(key: MetricKey, a: number, b: number): { text: string; verdict: 'good' | 'bad' | 'same' } {
  const d = b - a;
  const def = METRICS.find((m) => m.key === key)!;
  const verdict = Math.abs(d) < 1e-9 ? 'same' : (def.better === 'lower' ? d < 0 : d > 0) ? 'good' : 'bad';
  const sign = d > 0 ? '+' : '−';
  const abs = Math.abs(d);
  let text: string;
  if (key === 'time') text = `${sign}${mss(abs)}`;
  else if (key === 'energy') text = `${sign}${Math.round((abs / a) * 100)} %`;
  else if (key === 'thruster') text = `${sign}${Math.round(abs)} pp`;
  else text = `${sign}${Math.round(abs)} m`;
  return { text, verdict };
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compass = (dx: number, dy: number) => COMPASS[Math.round((((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360) / 45) % 8];

/** Translate: seconds per manoeuvre → slower crossing → energy → fuel cost per year (illustrative assumptions). */
export const VALUE_DEFAULTS = { manoeuvresPerCrossing: 2, crossingHours: 3.5, annualFuelEUR: 6_000_000, energyExponent: 2 };
export function translate(savedS: number, crossingHours: number) {
  const perCrossingS = savedS * VALUE_DEFAULTS.manoeuvresPerCrossing;
  const speedPct = (perCrossingS / (crossingHours * 3600)) * 100;
  const energyPct = (1 - (1 - speedPct / 100) ** VALUE_DEFAULTS.energyExponent) * 100;
  const eurPerYear = (VALUE_DEFAULTS.annualFuelEUR * energyPct) / 100;
  return { perCrossingS, speedPct, energyPct, eurPerYear };
}
