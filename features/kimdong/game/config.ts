/**
 * Render sprites with nearest-neighbour filtering instead of smoothing. Turn this on when the
 * real artwork in `public/assets` is pixel art.
 */
export const PIXEL_ART = false;

/** Gameplay tuning constants (distances in world px, times in ms unless noted). */

export const PLAYER = {
  /**
   * Matched to the walk animation so the feet do not slide: one walk cycle (4 frames, 2 steps of
   * ~21 world px) at `WALK_FPS` covers about this many px per second (see animations.ts).
   */
  speed: 140,
  /** Speed multiplier while swimming. */
  waterSpeedFactor: 0.7,
  /** Speed multiplier while crawling through a bush (the crawl cycle covers less ground). */
  bushSpeedFactor: 0.7,
  /** Alpha while hiding in a bush / diving in the stream. */
  bushAlpha: 0.5,
  waterAlpha: 0.35,
} as const;

export const GUARD = {
  speed: 75,
  investigateSpeed: 105,
  /** Radians per second. */
  turnRate: 4.5,
  coneRange: 230,
  coneHalfAngle: 0.5,
  /** Guards within this distance of a noise go and check it out. */
  hearingRadius: 320,
  /** How long a guard stays at the noise spot looking around. */
  investigateMs: 3500,
  /** How long a guard keeps staring after losing sight of the player. */
  watchMs: 1200,
} as const;

export const ALERT = {
  /** Percent per second while a guard sees the player. */
  seeRate: 38,
  /** Percent per second recovered while unseen. */
  decayRate: 6,
  /** Percent added when the player runs out of air. */
  drownPenalty: 20,
  /** Percent added per missed rhythm note. */
  rhythmMissPenalty: 20,
  /** Minimum ms between `chapter:alert` messages to the host. */
  publishIntervalMs: 100,
} as const;

export const OXYGEN = {
  /** Seconds of air while diving. */
  seconds: 5,
  /** Fraction of the bar recovered per second out of the water. */
  recoverPerSecond: 0.5,
} as const;

/**
 * The cuckoo mini-game: a cursor sweeps across a bar, back and forth, and the player presses
 * SPACE while it is over the lit zone in the middle ("three long calls" = three rounds).
 */
export const RHYTHM = {
  rounds: 3,
  /** Time the cursor takes to cross the bar in each round (it gets faster). */
  sweepMs: [1900, 1650, 1400] as readonly number[],
  /** Pause before the first sweep, and between a judged round and the next sweep. */
  startDelayMs: 1500,
  gapMs: 900,
  /** A press counts when the cursor is within this share of half the bar from the centre. */
  zoneHalf: 0.2,
  /** Pause after the last round before the mini-game closes. */
  finishDelayMs: 1200,
} as const;
export const CLIMAX = {
  /** Time the player has to react to the ambush. */
  decisionMs: 5000,
  squadSize: 6,
  /** Time from pressing SPACE to the shot (the "fire" frame of Kim Đồng's shooting pose). */
  shotMs: 220,
  /** Time from the shot until the squad answers with its volley. */
  squadReactMs: 200,
  /** How long the squad fires at the player after Kim Đồng's shot. */
  fireMs: 1400,
  /** Pause before the ambush prompt is shown again after the player was too late. */
  retryDelayMs: 1800,
} as const;

export const RUNNER = {
  /** The run ends after this long (or when the player is out of hearts). */
  durationMs: 14000,
  lanes: 3,
  hearts: 3,
  /** Obstacle speed in px/s at the start; grows by `speedGain` over the run. */
  scrollSpeed: 420,
  speedGain: 0.3,
  jumpMs: 650,
  jumpHeight: 82,
  /** While the jump is above this height the player clears rocks and roots. */
  clearHeight: 30,
  bulletSpeed: 1150,
  bulletWarnMs: 650,
  invulnerableMs: 1000,
  /** [min, max] ms between spawns. */
  obstacleEveryMs: [900, 1500] as readonly [number, number],
  bulletEveryMs: [1400, 2200] as readonly [number, number],
  /** No bullets in the first moments, so the player can get used to the controls. */
  bulletGraceMs: 2200,
} as const;

/** Pebbles to throw are a supply: picked up along the way, one is used per throw. */
export const PEBBLE_SUPPLY = {
  /** How many Kim Đồng carries at the start. */
  start: 3,
  /** The most he can carry. */
  max: 6,
  /** How close he has to get to pick one up (px). */
  pickupRadius: 30,
} as const;

export const PEBBLE = {
  range: 280,
  cooldownMs: 800,
  flightMs: 380,
} as const;
