import { sampleCatmullRom, type Point } from "@/lib/engine";

export interface Circle extends Point {
  r: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GuardRoute {
  id: string;
  /** Waypoints; the guard spawns on the first one. */
  path: readonly Point[];
  /** `true`: loop back to the start. `false`: walk back and forth. */
  loop: boolean;
  /** Start walking the route in reverse (so guards sharing a path are not in sync). */
  reverse?: boolean;
}

/** World size in world units (pixels at zoom 1). */
export const WORLD = { width: 2400, height: 1400 } as const;

/** Design viewport: the camera zoom keeps at least this much of the world visible. */
export const VIEW = { width: 1280, height: 720 } as const;

export const PLAYER_START: Point = { x: 170, y: 1230 };

/**
 * Where the 5 letters (mật thư) lie. All of them are outside the guard post: the signal tree only
 * works once all 5 are in hand, and the post's gate only opens after the signal.
 */
export const LETTER_SPOTS: readonly Point[] = [
  { x: 560, y: 1040 },
  { x: 520, y: 380 },
  { x: 1800, y: 1160 },
  { x: 1960, y: 260 },
  { x: 2110, y: 700 },
];

/** Hiding spots: standing inside makes the player invisible to guards. */
export const BUSHES: readonly Circle[] = [
  { x: 380, y: 1180, r: 46 },
  { x: 700, y: 1010, r: 42 },
  { x: 260, y: 900, r: 50 },
  { x: 640, y: 760, r: 44 },
  { x: 420, y: 560, r: 48 },
  { x: 760, y: 330, r: 42 },
  { x: 280, y: 250, r: 46 },
  { x: 1330, y: 900, r: 44 },
  { x: 1380, y: 440, r: 42 },
  { x: 1700, y: 1000, r: 50 },
  { x: 2050, y: 1180, r: 44 },
  { x: 1840, y: 380, r: 46 },
  { x: 2150, y: 480, r: 42 },
  { x: 1560, y: 260, r: 44 },
];

/** Stream: a Catmull-Rom spline through these points; swimming here hides the player. */
export const RIVER_CONTROL: readonly Point[] = [
  { x: 1180, y: -40 },
  { x: 1230, y: 250 },
  { x: 1120, y: 520 },
  { x: 1060, y: 800 },
  { x: 1130, y: 1080 },
  { x: 1010, y: 1440 },
];
export const RIVER_WIDTH = 120;
export const RIVER_POLYLINE: readonly Point[] = sampleCatmullRom(RIVER_CONTROL, 14);

/** x of the stream's centre line at height `y` (the polyline point closest to that height). */
function riverXAt(y: number): number {
  let best = RIVER_POLYLINE[0]!;
  for (const point of RIVER_POLYLINE) {
    if (Math.abs(point.y - y) < Math.abs(best.y - y)) best = point;
  }
  return best.x;
}

/**
 * Places where the stream can be crossed dry: a bamboo bridge and a row of stepping stones.
 * They are drawn over the water and are not "water" for hiding / swimming (see zones.ts).
 */
export const BRIDGES: readonly (Rect & { kind: "bridge" | "stones" })[] = [
  { kind: "bridge", x: riverXAt(930) - 95, y: 930 - 36, w: 190, h: 72 },
  { kind: "stones", x: riverXAt(380) - 85, y: 380 - 42, w: 170, h: 84 },
];

/**
 * Pebbles lying on the ground (pick-up spots): along the trails and near bushes and rocks, thicker
 * where it is hard (near the guard post, in the fog stretch). None of them is in the stream.
 */
export const PEBBLE_SPOTS: readonly Point[] = [
  { x: 250, y: 1190 },
  { x: 450, y: 1100 },
  { x: 595, y: 935 },
  { x: 575, y: 690 },
  { x: 540, y: 470 },
  { x: 640, y: 310 },
  { x: 850, y: 755 },
  { x: 940, y: 725 },
  { x: 1290, y: 705 },
  { x: 1395, y: 985 },
  { x: 1650, y: 1105 },
  { x: 1450, y: 450 },
  { x: 1780, y: 235 },
  { x: 2050, y: 700 },
  { x: 2130, y: 560 },
];

/** Rocks to hide behind (like a bush: stand in the circle and the guards cannot see you). */
export const ROCK_COVERS: readonly Circle[] = [
  { x: 480, y: 860, r: 46 },
  { x: 950, y: 1190, r: 46 },
  { x: 1500, y: 310, r: 46 },
  { x: 2030, y: 860, r: 46 },
  { x: 760, y: 1300, r: 46 },
];

/** Soldiers asleep against a tree near the start: harmless, solid obstacles of the first stage. */
export const SLEEPING_GUARDS: readonly (Point & { row: 0 | 1 })[] = [
  { x: 120, y: 1090, row: 0 },
  { x: 290, y: 1330, row: 1 },
];

/** Guard post in the middle-east of the map, closed by a gate on its west side. */
export const OUTPOST = {
  x: 1500,
  y: 520,
  w: 460,
  h: 360,
  wall: 24,
  gateY: 650,
  gateH: 100,
} as const;

function buildOutpostWalls(): readonly Rect[] {
  const { x, y, w, h, wall, gateY, gateH } = OUTPOST;
  const gapBottom = gateY + gateH;
  const eastX = x + w - wall;
  return [
    { x, y, w, h: wall },
    { x, y: y + h - wall, w, h: wall },
    { x, y, w: wall, h: gateY - y },
    { x, y: gapBottom, w: wall, h: y + h - gapBottom },
    { x: eastX, y, w: wall, h: gateY - y },
    { x: eastX, y: gapBottom, w: wall, h: y + h - gapBottom },
  ];
}

export const OUTPOST_WALLS: readonly Rect[] = buildOutpostWalls();
export const OUTPOST_GATE: Rect = {
  x: OUTPOST.x,
  y: OUTPOST.gateY,
  w: OUTPOST.wall,
  h: OUTPOST.gateH,
};

/** The old tree that Kim Đồng hoots from (Phase 2 rhythm mini-game). */
export const TREE = { x: 1370, y: 700, r: 78, triggerRadius: 170 } as const;

/** Dirt trails (purely visual). */
export const TRAILS: readonly (readonly Point[])[] = [
  [
    { x: 170, y: 1230 },
    { x: 330, y: 1150 },
    { x: 560, y: 1040 },
    { x: 600, y: 800 },
    { x: 520, y: 560 },
    { x: 520, y: 380 },
    { x: 700, y: 260 },
  ],
  [
    { x: 600, y: 800 },
    { x: 850, y: 760 },
    { x: 1000, y: 720 },
  ],
  [
    { x: 1240, y: 700 },
    { x: 1370, y: 700 },
    { x: 1500, y: 700 },
  ],
  [
    { x: 1960, y: 700 },
    { x: 2100, y: 700 },
    { x: 2150, y: 480 },
    { x: 1960, y: 260 },
  ],
  [
    { x: 1370, y: 700 },
    { x: 1380, y: 900 },
    { x: 1700, y: 1100 },
    { x: 1800, y: 1160 },
  ],
];

export const GUARD_ROUTES: readonly GuardRoute[] = [
  {
    id: "west-south",
    loop: true,
    path: [
      { x: 300, y: 1100 },
      { x: 620, y: 1100 },
      { x: 620, y: 950 },
      { x: 300, y: 950 },
    ],
  },
  {
    id: "west-north",
    loop: true,
    path: [
      { x: 350, y: 420 },
      { x: 700, y: 420 },
      { x: 700, y: 620 },
      { x: 350, y: 620 },
    ],
  },
  {
    id: "east-north",
    loop: false,
    path: [
      { x: 1700, y: 200 },
      { x: 2100, y: 200 },
    ],
  },
  {
    id: "east-south",
    loop: true,
    path: [
      { x: 1600, y: 1100 },
      { x: 2000, y: 1100 },
      { x: 2000, y: 1250 },
      { x: 1600, y: 1250 },
    ],
  },
  {
    id: "outpost-a",
    loop: true,
    path: [
      { x: 1560, y: 580 },
      { x: 1900, y: 580 },
      { x: 1900, y: 820 },
      { x: 1560, y: 820 },
    ],
  },
  {
    id: "outpost-b",
    loop: true,
    reverse: true,
    path: [
      { x: 1620, y: 640 },
      { x: 1840, y: 640 },
      { x: 1840, y: 760 },
      { x: 1620, y: 760 },
    ],
  },
];
