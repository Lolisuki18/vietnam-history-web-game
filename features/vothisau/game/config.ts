/**
 * Render sprites with smoothing (the art is HD, painted at 2x, then scaled down). Turn this on
 * only if the real artwork is true pixel art.
 */
export const PIXEL_ART = false;

/** Gameplay tuning constants (distances in world px, times in ms unless noted). */

export const PLAYER = {
  /** Matched to the walk animation (see animations.ts) so the feet do not slide. */
  speed: 150,
  /** Speed multiplier while crawling through a bush / sneaking in the crowd. */
  bushSpeedFactor: 0.7,
  crowdSpeedFactor: 0.75,
  /** Alpha while hidden (a bush, the dark) or blended into the crowd. */
  hiddenAlpha: 0.5,
} as const;

export const GUARD = {
  speed: 70,
  investigateSpeed: 100,
  /** The guards run at twice their patrol speed once the grenade has gone off. */
  chaseSpeedFactor: 2,
  /** Radians per second. */
  turnRate: 4.5,
  coneRange: 215,
  coneHalfAngle: 0.5,
  /** Guards within this distance of a noise go and check it out. */
  hearingRadius: 340,
  /** A guard who spots the player calls the guards within this distance (reinforcements). */
  backupRadius: 380,
  investigateMs: 3200,
  watchMs: 1200,
  /** A blended-in player is only noticed this close. */
  closeInspectRadius: 55,
  /** A guard this close to the player in the chase catches them. */
  catchRadius: 24,
  /** Body radius used for sliding along walls while chasing. */
  bodyRadius: 12,
} as const;

export const ALERT = {
  /** Percent per second while a guard sees the player (forest, market). */
  seeRate: 38,
  marketSeeRate: 52,
  decayRate: 8,
  /** A wrong answer at the checkpoint jumps the meter here. */
  checkpointFail: 70,
  /** The "buyer" timing game failed. */
  buyerFail: 80,
  /** Guards see this much farther after a wrong answer ("the net tightens"). */
  tightenFactor: 1.25,
  yellowAt: 45,
  redAt: 85,
  publishIntervalMs: 100,
} as const;

export const PEBBLES = {
  start: 3,
  max: 6,
  range: 300,
  cooldownMs: 700,
  flightMs: 360,
  pickupRadius: 30,
} as const;

export const SPEECH = {
  /** Milliseconds per typed character. */
  typeMs: 28,
  /** How long a finished bubble stays. */
  holdMs: 2600,
  /** Minimum gap between two lines of the same kind (guard chatter must not spam the screen). */
  cooldownMs: 6000,
} as const;

export const GRENADE = {
  /** The aiming reticle sweeps between these distances from the player (world px). */
  minRange: 110,
  maxRange: 340,
  /** Time for the reticle to go there and back. */
  sweepMs: 1500,
  flightMs: 850,
  arcHeight: 120,
  /** The grenade kills Cai Tòng when it lands this close to him. */
  killRadius: 85,
  /** Guards this close to the blast are stunned for `stunMs`. */
  stunRadius: 150,
  stunMs: 2200,
  /** Frightened villagers run this far. */
  scatterRadius: 420,
} as const;

export const ESCAPE = {
  /** Pause before the guards start the chase after the blast (they are stunned or confused). */
  startDelayMs: 900,
  exitRadius: 48,
} as const;

/** The buyer timing game: a cursor sweeps a bar, SPACE while it is over the lit zone. */
export const BUYER_QTE = {
  rounds: 3,
  /** Misses allowed. */
  maxMisses: 1,
  sweepMs: [1700, 1450, 1250] as readonly number[],
  zoneHalf: 0.17,
  startDelayMs: 900,
  gapMs: 700,
} as const;
