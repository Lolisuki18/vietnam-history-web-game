/**
 * The contract between the game code and the artwork in `public/assets`.
 * The art is produced from the raw images (kept in git history, see tools/kimdong-art/README.md) by
 * `tools/kimdong-art/build.py`:
 * change a frame size or a sheet layout there and here (and in `public/assets/kimdong/README.md`)
 * and everything else — animations, hitboxes, the fallback art — follows.
 */

const BASE = "/assets/kimdong/";

/** Texture / tilemap keys. */
export const ASSET_KEYS = {
  kimdong: "kimdong",
  soldier: "french_soldier",
  khoXanh: "linh_kho_xanh",
  letter: "letter",
  emotes: "emotes",
  tree: "prop_tree",
  tower: "prop_tower",
  fence: "prop_fence",
  fencePost: "prop_fence_post",
  pebbles: "pebbles",
  ducThanh: "duc_thanh",
  sfx: "sfx",
  // New character spritesheets
  soldierSleeping: "soldier_sleeping",
  soldierShooting: "soldier_shooting",
  soldierRunning: "soldier_running",
  kimdongClimb: "kimdong_climb",
  kimdongShoot: "kimdong_shoot",
  kimdongFall: "kimdong_fall",
  kimdongHideRock: "kimdong_hide_rock",
  // Pictures that hold several frames in a row (loaded as spritesheets)
  outpostGate: "prop_outpost_gate",
  rootObstacle: "prop_root_obstacle",
  muzzleFlash: "muzzle_flash",
  tuHuBird: "tu_hu_bird",
  bulletTracer: "bullet_tracer",
  spacePrompt: "ui_space_prompt",
  pebbleItem: "item_pebble",
  barbedWire: "prop_barbed_wire",
  fogA: "fog_layer_a",
  fogB: "fog_layer_b",
} as const;

/**
 * `ui_cuckoo_rhythm.png` holds the mini-game's pieces side by side (px rectangles in the file):
 * the bar (with its lit zone, 51 px wide, in the middle), the diamond cursor and the two labels.
 */
export const RHYTHM_UI = {
  key: "ui_cuckoo_rhythm",
  spark: "ui_rhythm_hit_spark",
  parts: {
    track: { x: 10, y: 8, w: 301, h: 31 },
    cursor: { x: 20, y: 48, w: 25, h: 37 },
    hit: { x: 80, y: 50, w: 81, h: 35 },
    miss: { x: 180, y: 50, w: 81, h: 35 },
  },
} as const;

/** `ui_space_prompt.png`: 2 frames of 160 x 64 (dark / lit "[ SPACE ] BẮN SÚNG ĐÁNH ĐỘNG") that blink. */
export const SPACE_PROMPT_FRAME = { width: 160, height: 64 } as const;

/** `item_pebble.png`: 3 kinds of pebble to pick up, 32 x 32 each. */
export const PEBBLE_ITEM_FRAME = { size: 32, kinds: 3 } as const;

/** `prop_barbed_wire.png`: 6 pieces of 64 x 64: wire on a post, vertical, two corners, a coil (4), a post. */
export const BARBED_WIRE_FRAME = { size: 64, fence: 0, vertical: 1, coil: 4 } as const;

/** Frame sizes of the sheets above, in file px. */
export const GATE_FRAME = { width: 64, height: 96 } as const; // 4 frames: closed ... open
export const ROOT_FRAME = { width: 120, height: 80 } as const; // 2 kinds of root
export const FLASH_FRAME = { size: 64 } as const; // 4 x 2: row 0 faces right, row 1 faces left
export const BIRD_FRAME = { size: 48 } as const; // 4 wing-beat frames
/** `bullet_tracer.png`: 2 frames of 64 x 32: 0 the tracer (head to the right, about 52 px long), 1 a hit spark. */
export const TRACER_FRAME = { width: 64, height: 32, length: 52 } as const;

/** Seamless ground textures (cut from `forest_tiles.png`) the world is painted with. */
export const GROUND_KEYS = {
  grass: "ground_grass",
  dirt: "ground_dirt",
  water: "ground_water",
} as const;

/** Bush pictures: the world picks one for each hiding bush in turn. */
export const BUSH_KEYS = ["bush_a", "bush_b", "bush_c", "bush_d"] as const;
/** Decorative rocks and stumps scattered over the forest floor (no collision). */
export const ROCK_KEYS = [
  "prop_rock_a",
  "prop_rock_b",
  "prop_rock_c",
  "prop_rock_d",
  "prop_rock_e",
  "prop_rock_f",
  "prop_rock_g",
] as const;
export const STUMP_KEYS = ["prop_stump_a", "prop_stump_b", "prop_stump_c"] as const;
/** Ferns and grass tufts sprinkled over the ground (no collision). */
export const DECOR_KEYS = [
  "deco_fern_a",
  "deco_palm_a",
  "deco_fern_b",
  "deco_tuft_a",
  "deco_tuft_b",
] as const;

/** New environment, prop, VFX and UI image keys. */
export const NEW_PROP_KEYS = [
  "prop_rock_cover_a",
  "prop_rock_cover_b",
  "prop_stepping_stones",
  "prop_bamboo_bridge",
  "ui_cuckoo_rhythm",
  "ui_oxygen_hud",
  "ui_rhythm_hit_spark",
  "portrait_kimdong_worried",
  "portrait_kimdong_determined",
] as const;

/** Every image loaded in a loop by the preloader (all in `images/`). */
export const LOOSE_IMAGE_KEYS = [
  ...BUSH_KEYS,
  ...ROCK_KEYS,
  ...STUMP_KEYS,
  ...DECOR_KEYS,
  ...Object.values(GROUND_KEYS),
  ...NEW_PROP_KEYS,
  ASSET_KEYS.fence,
  ASSET_KEYS.fencePost,
  ASSET_KEYS.pebbles,
] as const;

/**
 * Added to every image URL so a browser that cached an older sheet fetches the rebuilt one. Bump it
 * whenever `tools/kimdong-art/build.py` changes a file in `public/assets/kimdong`.
 */
export const ASSET_VERSION = "20261016a";

const images = (name: string): string => `${BASE}images/${name}.png?v=${ASSET_VERSION}`;
const sprites = (name: string): string => `${BASE}sprites/${name}.png?v=${ASSET_VERSION}`;

export const ASSET_URLS = {
  kimdong: sprites("kimdong"),
  soldier: sprites("french_soldier"),
  khoXanh: sprites("linh_kho_xanh"),
  ducThanh: sprites("duc_thanh"),
  sfx: images("sfx"),
  letter: images("letter"),
  emotes: images("emotes"),
  tree: images("prop_tree"),
  tower: images("prop_tower"),
  // Sprites
  soldierSleeping: sprites("soldier_sleeping"),
  soldierShooting: sprites("soldier_shooting"),
  soldierRunning: sprites("soldier_running"),
  kimdongClimb: sprites("kimdong_climb"),
  kimdongShoot: sprites("kimdong_shoot"),
  kimdongFall: sprites("kimdong_fall"),
  kimdongHideRock: sprites("kimdong_hide_rock"),
  outpostGate: images("prop_outpost_gate"),
  rootObstacle: images("prop_root_obstacle"),
  muzzleFlash: images("muzzle_flash"),
  tuHuBird: images("tu_hu_bird"),
  bulletTracer: images("bullet_tracer"),
  spacePrompt: images("ui_space_prompt"),
  pebbleItem: images("item_pebble"),
  barbedWire: images("prop_barbed_wire"),
  fogA: images("fog_layer_a"),
  fogB: images("fog_layer_b"),
} as const;

/** Rock hiding spots (see `ROCK_COVERS` in world-data.ts) and how they are drawn. */
export const ROCK_COVER_KEYS = ["prop_rock_cover_a", "prop_rock_cover_b"] as const;

/** Audio asset keys. */
export const AUDIO_KEYS = {
  cuckoo: "sfx_cuckoo",
  gunshot: "sfx_gunshot",
  pebble: "sfx_pebble_throw",
  footsteps: "sfx_footsteps",
  splash: "sfx_water_splash",
  bgmExplore: "bgm_explore",
  bgmTension: "bgm_tension",
  bgmRunner: "bgm_runner",
  // New audio assets
  bgmStreamBirds: "bgm_stream_birds",
  fogFootsteps: "sfx_fog_footsteps",
  alert: "sfx_alert",
  question: "sfx_question",
  pickupLetter: "sfx_pickup_letter",
  gasp: "sfx_gasp",
  heartbeatCountdown: "sfx_heartbeat_countdown",
  cuckooSignal: "sfx_cuckoo_signal",
  cuckooWarning: "sfx_cuckoo_warning",
  /** Optional: a short click for picking a pebble up (a synthesized click plays without it). */
  pebblePickup: "sfx_pebble_pickup",
} as const;

export const AUDIO_URLS = {
  cuckoo: `${BASE}audio/sfx_cuckoo.wav`,
  gunshot: `${BASE}audio/sfx_gunshot.wav`,
  pebble: `${BASE}audio/sfx_pebble_throw.wav`,
  footsteps: `${BASE}audio/sfx_footsteps.wav`,
  splash: `${BASE}audio/sfx_water_splash.wav`,
  bgmExplore: `${BASE}audio/bgm_explore.wav`,
  bgmTension: `${BASE}audio/bgm_tension.wav`,
  bgmRunner: `${BASE}audio/bgm_runner.wav`,
  bgmStreamBirds: `${BASE}audio/bgm_stream_birds.wav`,
  fogFootsteps: `${BASE}audio/sfx_fog_footsteps.wav`,
  alert: `${BASE}audio/sfx_alert.wav`,
  question: `${BASE}audio/sfx_question.wav`,
  pickupLetter: `${BASE}audio/sfx_pickup_letter.wav`,
  gasp: `${BASE}audio/sfx_gasp.wav`,
  heartbeatCountdown: `${BASE}audio/sfx_heartbeat_countdown.wav`,
  cuckooSignal: `${BASE}audio/sfx_cuckoo_signal.wav`,
  cuckooWarning: `${BASE}audio/sfx_cuckoo_warning.wav`,
  pebblePickup: `${BASE}audio/sfx_pebble_pickup.wav`,
} as const;

/** `images(name)` for the props and bushes (they are loaded in a loop by the preloader). */
export const imageUrl = images;

/**
 * Size of one frame of the character spritesheets, in file pixels. The files are drawn larger than
 * they are shown (`SPRITE_SCALE`) so they stay sharp when the camera zooms in.
 */
export const SPRITE_FRAME = { width: 80, height: 96 } as const;
export const SPRITE_SCALE = 0.65;

/** Size of a character frame in the game world, in world pixels (the character fills ~70%). */
export const LOGICAL_FRAME = {
  width: Math.round(SPRITE_FRAME.width * SPRITE_SCALE),
  height: Math.round(SPRITE_FRAME.height * SPRITE_SCALE),
} as const;

/**
 * Sprite origin. With (0.5, 0.75) the sprite's x/y is the centre of its feet, which is also the
 * centre of the physics hitbox, so every position used by the game logic stays unchanged.
 */
export const SPRITE_ORIGIN = { x: 0.5, y: 0.75 } as const;

/** Side of the square hitbox at the character's feet, in world pixels. */
export const HITBOX_SIZE = 24;

/** `kimdong.png`: 6 columns; one row per animation, each using the first `frames[row]` columns. */
export const KIMDONG_SHEET = {
  columns: 6,
  rows: {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
    swim: 4,
    run: 5,
    jump: 6,
    throw: 7,
    swimIdle: 8,
    hide: 9,
    crawl: 10,
  },
  frames: { walk: 4, swim: 4, run: 6, jump: 3, throw: 3, swimIdle: 2, hide: 2, crawl: 4 },
} as const;

/** `duc_thanh.png`: 4 columns; rows down, left, right, up, then idle + talking. */
export const DUC_THANH_SHEET = {
  columns: 4,
  rows: { down: 0, left: 1, right: 2, up: 3, talk: 4 },
} as const;

/** `sfx.png`: 192 px frames; 0 pebble, 1 impact spark, 2-7 a sound ring that grows and fades. */
export const SFX_SHEET = { frameSize: 192, pebble: 0, impact: 1, ringFrom: 1, ringTo: 7 } as const;

/** `french_soldier.png` / `linh_kho_xanh.png`: 5 columns; one row per walking direction. */
export const SOLDIER_SHEET = {
  columns: 5,
  rows: { left: 0, right: 1 },
} as const;

/** The two enemy sprite sheets; guards use them in turn so a patrol is a mixed one. */
export const SOLDIER_TEXTURES = [ASSET_KEYS.soldier, ASSET_KEYS.khoXanh] as const;
export type SoldierTexture = (typeof SOLDIER_TEXTURES)[number];

/** `letter.png`: 5 columns x 3 rows, 14 frames of a shimmering letter (80 x 71 each). */
export const LETTER_SHEET = { frameWidth: 80, frameHeight: 71, frames: 14 } as const;

/** `emotes.png`: 64 x 64 frames. */
export const EMOTE_SHEET = {
  frameSize: 64,
  frames: { question: 0, alert: 1, dots: 2, eye: 3, zzz: 4 },
} as const;

/** Display width of the letter pickup in world px (the frame includes a margin for the glow). */
export const LETTER_DISPLAY_WIDTH = 58;

/** A bush image is scaled so that it covers this multiple of the bush's hiding radius. */
export const BUSH_DISPLAY_FACTOR = 2.4;
