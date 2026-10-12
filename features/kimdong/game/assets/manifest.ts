/**
 * The contract between the game code and the artwork in `public/assets`.
 * Change a frame size or a sheet layout here (and in `public/assets/README.md`) and everything
 * else — animations, hitboxes, the fallback art — follows.
 */

const BASE = "/assets/kimdong/";

/** Texture / tilemap keys. */
export const ASSET_KEYS = {
  kimdong: "kimdong",
  soldier: "french_soldier",
  tiles: "forest_tiles",
  map: "level1",
  letter: "letter",
  bush: "bush",
} as const;

export const ASSET_URLS = {
  kimdong: `${BASE}sprites/kimdong.png`,
  soldier: `${BASE}sprites/french_soldier.png`,
  tiles: `${BASE}images/forest_tiles.png`,
  map: `${BASE}maps/level1.json`,
  letter: `${BASE}images/letter.png`,
  bush: `${BASE}images/bush.png`,
} as const;

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
} as const;

/** Size of one frame of the character spritesheets. */
export const SPRITE_FRAME = { width: 32, height: 48 } as const;

/**
 * Sprite origin. With (0.5, 0.75) the sprite's x/y is the centre of its feet, which is also the
 * centre of the physics hitbox, so every position used by the game logic stays unchanged.
 */
export const SPRITE_ORIGIN = { x: 0.5, y: 0.75 } as const;

/** Side of the square hitbox at the character's feet. */
export const HITBOX_SIZE = 24;

/** Top-left of the hitbox inside a frame, so that it is centred on the sprite origin. */
export const HITBOX_OFFSET = {
  x: SPRITE_FRAME.width * SPRITE_ORIGIN.x - HITBOX_SIZE / 2,
  y: SPRITE_FRAME.height * SPRITE_ORIGIN.y - HITBOX_SIZE / 2,
} as const;

/** `kimdong.png`: 4 columns; one row per animation. */
export const KIMDONG_SHEET = {
  columns: 4,
  rows: { down: 0, left: 1, right: 2, up: 3, swim: 4 },
} as const;

/** `french_soldier.png`: 4 columns; one row per walking direction. */
export const SOLDIER_SHEET = {
  columns: 4,
  rows: { left: 0, right: 1 },
} as const;

/** Display width of the letter pickup in world px (the image is scaled to it). */
export const LETTER_DISPLAY_WIDTH = 30;

/** A bush image is scaled so that it covers this multiple of the bush's hiding radius. */
export const BUSH_DISPLAY_FACTOR = 2.3;
