/**
 * Render sprites with nearest-neighbour filtering instead of smoothing. Turn this on when the
 * real artwork in `public/assets` is pixel art.
 */
export const PIXEL_ART = false;

/** Gameplay tuning constants (distances in world px, times in ms unless noted). */

export const PLAYER = {
  speed: 230,
  /** Speed multiplier while swimming. */
  waterSpeedFactor: 0.7,
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

export type RhythmKey = "SPACE" | "LEFT" | "UP" | "RIGHT";

export const RHYTHM = {
  /** Keys of the falling notes, in order. */
  keys: ["SPACE", "LEFT", "UP", "RIGHT", "SPACE"] as readonly RhythmKey[],
  /** Time from the start until the first note reaches the hit line. */
  firstNoteMs: 2200,
  /** Time between two notes reaching the hit line. */
  intervalMs: 900,
  /** Time a note takes to fall from the top of the lane to the hit line. */
  fallMs: 1500,
  /** A press within this distance of a note's time counts. */
  hitWindowMs: 170,
  /** Pause after the last note before the mini-game closes. */
  finishDelayMs: 1200,
} as const;

export const CLIMAX = {
  /** Time the player has to react to the ambush. */
  decisionMs: 5000,
  squadSize: 6,
  /** How long the squad fires at the player after the stone lands. */
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

export const PEBBLE = {
  range: 280,
  cooldownMs: 800,
  flightMs: 380,
} as const;
