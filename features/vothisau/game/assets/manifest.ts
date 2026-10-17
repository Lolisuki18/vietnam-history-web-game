/**
 * The contract between the game code and the artwork in `public/assets/vothisau`.
 * Change a frame size or sheet layout here (and in `public/assets/vothisau/README.md`) and the
 * loader, animations and hitboxes follow. Every key has a stand-in drawn by code
 * (`placeholder-art.ts`), so a file that is not made yet never breaks the game.
 */

const BASE = "/assets/vothisau/";

/**
 * Added to every image URL so a browser that cached an older sheet fetches the rebuilt one. Bump it
 * whenever a file in `public/assets/vothisau` is rebuilt.
 */
export const ASSET_VERSION = "20261017a";

const sprites = (name: string): string => `${BASE}sprites/${name}.png?v=${ASSET_VERSION}`;
const images = (name: string): string => `${BASE}images/${name}.png?v=${ASSET_VERSION}`;

/** Size of one frame of the character spritesheets, in file px (shown at `SPRITE_SCALE`). */
export const SPRITE_FRAME = { width: 80, height: 96 } as const;
export const SPRITE_SCALE = 0.65;
export const LOGICAL_FRAME = {
  width: Math.round(SPRITE_FRAME.width * SPRITE_SCALE),
  height: Math.round(SPRITE_FRAME.height * SPRITE_SCALE),
} as const;
/** (0.5, 0.75): the sprite's x / y is the centre of its feet and of the hitbox. */
export const SPRITE_ORIGIN = { x: 0.5, y: 0.75 } as const;
export const HITBOX_SIZE = 22;

/** `sau.png`: 6 columns; one row per animation, each using the first `frames[...]` columns. */
export const SAU_SHEET = {
  columns: 6,
  rows: { down: 0, left: 1, right: 2, up: 3, sneak: 4, throw: 5, interact: 6, hide: 7 },
  frames: { walk: 4, sneak: 4, throw: 3, interact: 3, hide: 2 },
} as const;

/** Soldiers and Cai Tòng: 5 columns; row 0 walks left, row 1 walks right. */
export const SOLDIER_SHEET = { columns: 5, rows: { left: 0, right: 1 } } as const;

/** Villagers and comrade Bảy: 4 columns; row 0 chats / stands (4 frames), row 1 cowers (2). */
export const NPC_SHEET = {
  columns: 4,
  rows: { idle: 0, scared: 1 },
  frames: { idle: 4, scared: 2 },
} as const;

/** The enemy sheets (guards use the first two in turn so a patrol is a mixed one). */
export const SOLDIER_KEYS = ["french_soldier", "viet_gian"] as const;
export const CAI_TONG_KEY = "cai_tong";
export type SoldierTexture = (typeof SOLDIER_KEYS)[number] | typeof CAI_TONG_KEY;
export const VILLAGER_KEYS = ["villager_a", "villager_b", "villager_c"] as const;
export const SAU_KEY = "sau";
export const BAY_KEY = "dong_chi_bay";

/** Every character sheet, key -> file URL. */
export const SPRITE_URLS: Readonly<Record<string, string>> = {
  [SAU_KEY]: sprites("sau"),
  french_soldier: sprites("french_soldier"),
  viet_gian: sprites("viet_gian"),
  [CAI_TONG_KEY]: sprites("cai_tong"),
  [BAY_KEY]: sprites("dong_chi_bay"),
  villager_a: sprites("villager_a"),
  villager_b: sprites("villager_b"),
  villager_c: sprites("villager_c"),
};

/** `emotes.png`: 64 x 64 frames. */
export const EMOTE_SHEET = {
  key: "emotes",
  frameSize: 64,
  frames: { question: 0, alert: 1, dots: 2, eye: 3, zzz: 4 },
} as const;

/** `item_paper.png`: a shimmering letter / newspaper, 4 frames of 48 x 48. */
export const PAPER_SHEET = { key: "item_paper", frame: 48, frames: 4, displayWidth: 38 } as const;

/** `fx_explosion.png`: 6 frames of 128 x 128. */
export const EXPLOSION_SHEET = { key: "fx_explosion", frame: 128, frames: 6 } as const;

/** Single pictures loaded as images. */
export const IMAGE_KEYS = {
  pebble: "item_pebble",
  grenade: "item_grenade",
  groundForest: "ground_forest",
  groundMarket: "ground_market",
} as const;

export interface PropDef {
  /** Size in world px (the real picture is scaled to it); the origin is the middle of the bottom edge. */
  w: number;
  h: number;
}

/** Props: the key is the file name in `images/`. */
export const PROPS = {
  prop_rubber_tree_a: { w: 150, h: 260 },
  prop_rubber_tree_b: { w: 150, h: 260 },
  prop_bush_a: { w: 130, h: 100 },
  prop_bush_b: { w: 130, h: 100 },
  prop_fern: { w: 70, h: 56 },
  prop_leaf_pile: { w: 60, h: 30 },
  prop_log: { w: 120, h: 40 },
  prop_post_bay: { w: 170, h: 150 },
  prop_stall_a: { w: 200, h: 150 },
  prop_stall_b: { w: 200, h: 150 },
  prop_stall_fruit: { w: 200, h: 150 },
  prop_cart: { w: 150, h: 90 },
  prop_well: { w: 110, h: 110 },
  prop_crate: { w: 64, h: 56 },
  prop_wall_brick: { w: 128, h: 120 },
  prop_gate_barrier: { w: 120, h: 110 },
  prop_tunnel_hatch: { w: 110, h: 70 },
  prop_rope_stall: { w: 200, h: 170 },
} as const satisfies Record<string, PropDef>;
export type PropKey = keyof typeof PROPS;
export const PROP_KEYS = Object.keys(PROPS) as PropKey[];

export const IMAGE_URLS: Readonly<Record<string, string>> = {
  [EMOTE_SHEET.key]: images("emotes"),
  [PAPER_SHEET.key]: images("item_paper"),
  [EXPLOSION_SHEET.key]: images("fx_explosion"),
  [IMAGE_KEYS.pebble]: images("item_pebble"),
  [IMAGE_KEYS.grenade]: images("item_grenade"),
  [IMAGE_KEYS.groundForest]: images("ground_forest"),
  [IMAGE_KEYS.groundMarket]: images("ground_market"),
  ...Object.fromEntries(PROP_KEYS.map((key) => [key, images(key)])),
};

/** Audio keys (every file is optional: `audio.ts` synthesizes a stand-in for the effects). */
export const AUDIO_KEYS = {
  bgmForest: "bgm_forest_night",
  bgmPatrol: "bgm_patrol",
  bgmMarket: "bgm_market",
  bgmChase: "bgm_chase",
  footstep: "sfx_footstep_leaf",
  pebble: "sfx_pebble",
  whistle: "sfx_whistle_signal",
  alert: "sfx_alert",
  question: "sfx_question",
  pickup: "sfx_pickup_paper",
  grenadeThrow: "sfx_grenade_throw",
  explosion: "sfx_explosion",
  policeWhistle: "sfx_police_whistle",
  ropeCut: "sfx_rope_cut",
  crateFall: "sfx_crate_fall",
  crowd: "sfx_crowd_murmur",
  heartbeat: "sfx_heartbeat",
} as const;
export type AudioName = keyof typeof AUDIO_KEYS;

/** Audio is not versioned (rename the file instead). */
export const AUDIO_URLS = Object.fromEntries(
  (Object.entries(AUDIO_KEYS) as [AudioName, string][]).map(([name, key]) => [
    name,
    `${BASE}audio/${key}.wav`,
  ]),
) as Record<AudioName, string>;
