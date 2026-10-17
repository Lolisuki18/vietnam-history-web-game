import type { Point } from "@/lib/engine";

import {
  CAI_TONG_KEY,
  SOLDIER_KEYS,
  type VILLAGER_KEYS,
  type PropKey,
  type SoldierTexture,
} from "./assets/manifest";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface GuardRoute {
  /** Waypoints; the guard walks them in order (ping-pong, or round and round with `loop`). */
  path: Point[];
  loop?: boolean;
  reverse?: boolean;
  /** Stand on `path[0]` and look one way, then the other (angles in radians; dwell times in ms). */
  scan?: { angles: [number, number]; dwellMs: [number, number] };
  texture: SoldierTexture;
  /** Guards of the checkpoint: they stop caring once the player has been waved through. */
  gate?: boolean;
}

export interface PropSpawn {
  key: PropKey;
  /** Feet of the prop (the picture stands on this point). */
  x: number;
  y: number;
  /** Blocks movement and sight: a box of this size standing on the feet. */
  solid?: { w: number; h: number };
  flip?: boolean;
  /** Lets a scene find the picture again (see `GATE_BARRIER_ID`). */
  id?: string;
}

export interface CrowdSpawn {
  x: number;
  y: number;
  /** Radius of the safe zone around the group. */
  radius: number;
  members: { dx: number; dy: number; texture: (typeof VILLAGER_KEYS)[number] }[];
}

export interface PaperSpawn {
  /** Index into `LORE` (story.ts). */
  index: number;
  x: number;
  y: number;
  /** The paper that ends the act: picking it up starts the next scene. */
  final?: boolean;
}

export interface Checkpoint extends Point {
  /** Forest only: reached once the player is at or above this y. */
  atY?: number;
}

export interface LevelDef {
  id: "forest" | "market";
  act: 1 | 2;
  world: { w: number; h: number };
  /** How much of the world one screen should show (the camera zoom follows). */
  view: { w: number; h: number };
  start: Point;
  ground: "forest" | "market";
  /** Colour and strength of the darkness laid over the world (night in the forest). */
  shade: { color: number; alpha: number };
  solids: Rect[];
  props: PropSpawn[];
  bushes: Circle[];
  guards: GuardRoute[];
  papers: PaperSpawn[];
  pebbles: Point[];
  checkpoints: Checkpoint[];
}

/** Small deterministic random numbers, so a level always looks the same. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TREE_SOLID = { w: 34, h: 26 } as const;

/** The rectangle a solid prop occupies. */
export function solidRect(prop: PropSpawn): Rect | null {
  if (!prop.solid) return null;
  return {
    x: prop.x - prop.solid.w / 2,
    y: prop.y - prop.solid.h,
    w: prop.solid.w,
    h: prop.solid.h,
  };
}

/** Every blocking rectangle of a level: the invisible walls plus the solid props. */
export function levelBlockers(level: LevelDef): Rect[] {
  const rects = [...level.solids];
  for (const prop of level.props) {
    const rect = solidRect(prop);
    if (rect) rects.push(rect);
  }
  return rects;
}

/* ------------------------------------------------------------------------------------------ */
/* Act 1: the rubber forest (a corridor, walked from the bottom to the top)                    */
/* ------------------------------------------------------------------------------------------ */

const FOREST_WORLD = { w: 1200, h: 2800 } as const;
/** The corridor the player walks in, between two dense walls of trees. */
export const FOREST_CORRIDOR = { left: 330, right: 870 } as const;

function forestProps(): PropSpawn[] {
  const random = rng(1948);
  const props: PropSpawn[] = [];
  const treeKey = (): PropKey => (random() < 0.5 ? "prop_rubber_tree_a" : "prop_rubber_tree_b");

  // Walls of trees on both sides: the nearest row is solid, the rest is scenery.
  for (let y = 140; y <= 2760; y += 120) {
    props.push({ key: treeKey(), x: 296 + random() * 26, y, solid: TREE_SOLID });
    props.push({ key: treeKey(), x: 904 - random() * 26, y: y + 40, solid: TREE_SOLID });
    props.push({ key: treeKey(), x: 170 + random() * 60, y: y + 20 });
    props.push({ key: treeKey(), x: 1000 - random() * 60, y: y + 60 });
    props.push({ key: treeKey(), x: 60 + random() * 60, y: y + 10 });
    props.push({ key: treeKey(), x: 1140 - random() * 60, y: y + 50 });
  }

  const tree = (x: number, y: number): PropSpawn => ({
    key: treeKey(),
    x,
    y,
    solid: TREE_SOLID,
  });
  // Zone 1: open ground to learn to walk on, with a few trees and rustling leaves.
  // (The real trees are 260 px tall and their crowns hide what is just north of them: keep them
  // off the tutorial bush and the gap.)
  props.push(tree(450, 2500), tree(760, 2420), tree(740, 2250));
  for (const [x, y] of [
    [560, 2610],
    [660, 2540],
    [520, 2420],
    [700, 2300],
    [610, 2180],
  ] as const) {
    props.push({ key: "prop_leaf_pile", x, y });
  }
  props.push({ key: "prop_fern", x: 420, y: 2330 }, { key: "prop_fern", x: 800, y: 2570 });

  // Zone 2: a narrow gap with a guard who looks away, and a bush to wait in.
  for (let x = 340; x <= 500; x += 60) props.push(tree(x, 2000));
  for (let x = 700; x <= 860; x += 60) props.push(tree(x, 2000));

  // Zone 3: patrols going left and right, with trees and bushes to hide behind.
  props.push(tree(500, 1450), tree(700, 1170), tree(560, 1010), tree(660, 720), tree(790, 1790));
  props.push({ key: "prop_log", x: 600, y: 1360 }, { key: "prop_log", x: 720, y: 880 });

  // The end: comrade Bảy's hidden post.
  props.push({ key: "prop_post_bay", x: 600, y: 190, solid: { w: 120, h: 40 } });
  return props;
}

const FOREST_BUSHES: Circle[] = [
  { x: 540, y: 2090, r: 52 },
  { x: 410, y: 1690, r: 46 },
  { x: 810, y: 1560, r: 46 },
  { x: 400, y: 1380, r: 46 },
  { x: 800, y: 1230, r: 46 },
  { x: 420, y: 1090, r: 46 },
  { x: 810, y: 900, r: 46 },
  { x: 410, y: 760, r: 46 },
  { x: 800, y: 640, r: 46 },
  { x: 560, y: 470, r: 50 },
];

export const FOREST: LevelDef = {
  id: "forest",
  act: 1,
  world: FOREST_WORLD,
  view: { w: 700, h: 440 },
  start: { x: 600, y: 2680 },
  ground: "forest",
  shade: { color: 0x050a1f, alpha: 0.36 },
  solids: [
    { x: 0, y: 0, w: FOREST_CORRIDOR.left, h: FOREST_WORLD.h },
    {
      x: FOREST_CORRIDOR.right,
      y: 0,
      w: FOREST_WORLD.w - FOREST_CORRIDOR.right,
      h: FOREST_WORLD.h,
    },
    { x: 0, y: 0, w: FOREST_WORLD.w, h: 60 },
  ],
  props: forestProps(),
  bushes: FOREST_BUSHES,
  guards: [
    // The first guard stands still and turns now and then (a long look away, a short look back).
    {
      path: [{ x: 600, y: 1925 }],
      scan: { angles: [-Math.PI / 2, Math.PI / 2], dwellMs: [3600, 2200] },
      texture: SOLDIER_KEYS[0],
    },
    {
      path: [
        { x: 400, y: 1600 },
        { x: 800, y: 1600 },
      ],
      texture: SOLDIER_KEYS[1],
    },
    {
      path: [
        { x: 800, y: 1300 },
        { x: 400, y: 1300 },
      ],
      texture: SOLDIER_KEYS[0],
    },
    {
      path: [
        { x: 420, y: 1000 },
        { x: 780, y: 1000 },
        { x: 780, y: 820 },
        { x: 420, y: 820 },
      ],
      loop: true,
      texture: SOLDIER_KEYS[1],
    },
    {
      path: [
        { x: 800, y: 560 },
        { x: 400, y: 560 },
      ],
      texture: SOLDIER_KEYS[0],
    },
  ],
  papers: [
    { index: 0, x: 690, y: 2360 },
    { index: 1, x: 800, y: 1450 },
    { index: 4, x: 600, y: 270, final: true },
  ],
  pebbles: [
    { x: 500, y: 2560 },
    { x: 650, y: 2270 },
    { x: 620, y: 2130 },
    { x: 780, y: 1250 },
    { x: 600, y: 700 },
  ],
  checkpoints: [
    { x: 600, y: 2680 },
    { x: 600, y: 1850, atY: 1880 },
    { x: 600, y: 950, atY: 980 },
  ],
};

/** Floating text trigger: a line Chị Sáu thinks when she first gets to this place. */
export const FOREST_THOUGHT_SPOTS = {
  /** Walking the first metres. */
  start: { x: 600, y: 2650 },
  /** The first guard (the tutorial gap). */
  gap: { x: 600, y: 2160 },
  /** Past the gap, the patrols start. */
  patrols: { x: 600, y: 1760 },
} as const;

/* ------------------------------------------------------------------------------------------ */
/* Act 2: Đất Đỏ market (a small sandbox with one gate)                                        */
/* ------------------------------------------------------------------------------------------ */

const MARKET_WORLD = { w: 1600, h: 1500 } as const;

/** The brick wall that splits the map, and the single gap the gate guards. */
export const MARKET_WALL = { x: 520, w: 60, gapTop: 1100, gapBottom: 1230 } as const;
/** Entering this box asks the checkpoint question. */
export const GATE_TRIGGER: Rect = { x: 400, y: 1090, w: 120, h: 150 };
/** Where the player stands once waved through. */
export const GATE_PASSED_X = 600;
/** The barrier in the gate; the market scene lifts it when the player is waved through. */
export const GATE_BARRIER_ID = "gate-barrier";

const STALL_SOLID = { w: 170, h: 52 } as const;
const stall = (key: PropKey, x: number, y: number, flip = false): PropSpawn => ({
  key,
  x,
  y,
  solid: STALL_SOLID,
  flip,
});

export const WELL: Point = { x: 1100, y: 640 };
/** The rope that holds the hanging goods; cutting it drops the crates onto `CRATE_DROP`. */
export const ROPE: Point = { x: 790, y: 540 };
export const CRATE_DROP: Point = { x: 960, y: 470 };
export const THROW_ZONE: Circle = { x: 1100, y: 900, r: 60 };
export const EXIT: Circle = { x: 1470, y: 150, r: 48 };
/** Cai Tòng walks round the well in the middle of the market. */
export const CAI_TONG_ROUTE: GuardRoute = {
  path: [
    { x: 990, y: 540 },
    { x: 1210, y: 540 },
    { x: 1210, y: 720 },
    { x: 990, y: 720 },
  ],
  loop: true,
  texture: CAI_TONG_KEY,
};

function marketProps(): PropSpawn[] {
  const props: PropSpawn[] = [];
  // The wall, in blocks, with the gap left open and a barrier in it. The blocks are 120 px tall and
  // stand on their feet: the north ones end exactly where the gap starts, the south ones start
  // exactly where it ends, so the picture matches the collision boxes in `MARKET.solids`.
  const wallX = MARKET_WALL.x + MARKET_WALL.w / 2;
  for (let feet = MARKET_WALL.gapTop; feet > 90; feet -= 120) {
    props.push({ key: "prop_wall_brick", x: wallX, y: feet });
  }
  for (let feet = MARKET_WALL.gapBottom + 120; feet < 1450 + 120; feet += 120) {
    props.push({ key: "prop_wall_brick", x: wallX, y: feet });
  }
  // The boom barrier stands in the middle of the opening (the picture is 110 px tall, on its feet).
  props.push({
    key: "prop_gate_barrier",
    id: GATE_BARRIER_ID,
    x: wallX,
    y: (MARKET_WALL.gapTop + MARKET_WALL.gapBottom) / 2 + 55,
  });

  // West side: where the player comes in.
  props.push(
    stall("prop_stall_a", 250, 700),
    stall("prop_stall_b", 250, 400),
    { key: "prop_crate", x: 180, y: 1260, solid: { w: 60, h: 40 } },
    { key: "prop_crate", x: 245, y: 1280, solid: { w: 60, h: 40 } },
    { key: "prop_cart", x: 420, y: 1010, solid: { w: 130, h: 40 } },
  );
  // East side: the market proper.
  props.push(
    stall("prop_stall_fruit", 720, 330),
    { key: "prop_rope_stall", x: 790, y: 520, solid: { w: 170, h: 50 } },
    stall("prop_stall_a", 1380, 330, true),
    stall("prop_stall_b", 720, 780),
    stall("prop_stall_fruit", 1470, 720, true),
    stall("prop_stall_a", 780, 1040),
    stall("prop_stall_b", 1130, 1090),
    stall("prop_stall_fruit", 1400, 1020, true),
    stall("prop_stall_a", 1000, 1340),
    stall("prop_stall_b", 1310, 1340, true),
    stall("prop_stall_fruit", 700, 1350),
    { key: "prop_well", x: WELL.x, y: WELL.y, solid: { w: 90, h: 44 } },
    { key: "prop_cart", x: 900, y: 910, solid: { w: 130, h: 40 } },
    { key: "prop_cart", x: 1290, y: 880, solid: { w: 130, h: 40 } },
    { key: "prop_cart", x: 1450, y: 1230, solid: { w: 130, h: 40 } },
    { key: "prop_crate", x: 940, y: 220, solid: { w: 60, h: 40 } },
    { key: "prop_crate", x: 1000, y: 230, solid: { w: 60, h: 40 } },
    { key: "prop_crate", x: 640, y: 560, solid: { w: 60, h: 40 } },
  );
  return props;
}

export const MARKET_CROWDS: CrowdSpawn[] = [
  {
    x: 300,
    y: 1010,
    radius: 90,
    members: [
      { dx: -30, dy: 0, texture: "villager_a" },
      { dx: 10, dy: 10, texture: "villager_b" },
      { dx: 40, dy: -20, texture: "villager_d" },
      { dx: -10, dy: 40, texture: "villager_e" },
    ],
  },
  {
    x: 870,
    y: 620,
    radius: 85,
    members: [
      { dx: -25, dy: 0, texture: "villager_b" },
      { dx: 20, dy: 15, texture: "villager_d" },
      { dx: 35, dy: -25, texture: "villager_a" },
    ],
  },
  {
    x: 1130,
    y: 930,
    radius: 95,
    members: [
      { dx: -35, dy: 0, texture: "villager_c" },
      { dx: 0, dy: 20, texture: "villager_e" },
      { dx: 38, dy: -10, texture: "villager_b" },
      { dx: -5, dy: -32, texture: "villager_d" },
    ],
  },
  {
    x: 1340,
    y: 520,
    radius: 85,
    members: [
      { dx: -20, dy: 0, texture: "villager_d" },
      { dx: 28, dy: 15, texture: "villager_b" },
      { dx: 5, dy: -30, texture: "villager_e" },
    ],
  },
  {
    x: 930,
    y: 1200,
    radius: 85,
    members: [
      { dx: -28, dy: 0, texture: "villager_b" },
      { dx: 30, dy: 10, texture: "villager_e" },
      { dx: 0, dy: -28, texture: "villager_a" },
    ],
  },
  {
    x: 1250,
    y: 1200,
    radius: 85,
    members: [
      { dx: -25, dy: 5, texture: "villager_c" },
      { dx: 25, dy: -5, texture: "villager_d" },
      { dx: 0, dy: 30, texture: "villager_a" },
    ],
  },
];

export const MARKET: LevelDef = {
  id: "market",
  act: 2,
  world: MARKET_WORLD,
  view: { w: 900, h: 560 },
  start: { x: 130, y: 1380 },
  ground: "market",
  shade: { color: 0xfff1c0, alpha: 0.05 },
  solids: [
    { x: 0, y: 0, w: MARKET_WORLD.w, h: 90 },
    { x: 0, y: 1450, w: MARKET_WORLD.w, h: 50 },
    { x: 0, y: 0, w: 50, h: MARKET_WORLD.h },
    { x: 1550, y: 0, w: 50, h: MARKET_WORLD.h },
    // The wall with its gap.
    { x: MARKET_WALL.x, y: 90, w: MARKET_WALL.w, h: MARKET_WALL.gapTop - 90 },
    {
      x: MARKET_WALL.x,
      y: MARKET_WALL.gapBottom,
      w: MARKET_WALL.w,
      h: 1450 - MARKET_WALL.gapBottom,
    },
  ],
  props: marketProps(),
  bushes: [],
  guards: [
    // The two at the gate look toward the people who come up to it.
    {
      path: [{ x: 620, y: 1060 }],
      scan: { angles: [Math.PI * 0.85, Math.PI * 0.7], dwellMs: [2800, 1800] },
      texture: SOLDIER_KEYS[0],
      gate: true,
    },
    {
      path: [{ x: 620, y: 1270 }],
      scan: { angles: [Math.PI * 1.15, Math.PI * 1.3], dwellMs: [2800, 1800] },
      texture: SOLDIER_KEYS[1],
      gate: true,
    },
    {
      path: [
        { x: 150, y: 820 },
        { x: 440, y: 820 },
      ],
      texture: SOLDIER_KEYS[1],
    },
    {
      path: [
        { x: 650, y: 190 },
        { x: 1450, y: 190 },
      ],
      texture: SOLDIER_KEYS[0],
    },
    {
      path: [
        { x: 640, y: 640 },
        { x: 640, y: 440 },
        { x: 960, y: 440 },
        { x: 960, y: 640 },
      ],
      loop: true,
      texture: SOLDIER_KEYS[1],
    },
    {
      path: [
        { x: 1300, y: 440 },
        { x: 1470, y: 440 },
        { x: 1470, y: 600 },
        { x: 1300, y: 600 },
      ],
      loop: true,
      texture: SOLDIER_KEYS[0],
    },
    {
      path: [
        { x: 1010, y: 800 },
        { x: 1010, y: 1180 },
      ],
      texture: SOLDIER_KEYS[1],
    },
    {
      path: [
        { x: 1200, y: 1150 },
        { x: 1500, y: 1150 },
        { x: 1500, y: 1400 },
        { x: 1200, y: 1400 },
      ],
      loop: true,
      texture: SOLDIER_KEYS[0],
    },
  ],
  papers: [
    { index: 2, x: 130, y: 1010 },
    { index: 3, x: 1480, y: 880 },
  ],
  pebbles: [],
  checkpoints: [
    { x: 130, y: 1380 },
    { x: 700, y: 1170 },
  ],
};

/** All the places a villager group stands, as rectangles of stand-in spawn data (for tests). */
export const ALL_LEVELS: readonly LevelDef[] = [FOREST, MARKET];
