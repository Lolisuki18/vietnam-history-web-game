import type { GameStats } from "../types";

/** Total of story papers in acts 1 and 2 (`LORE` in data/story.ts). */
export const PAPER_TOTAL = 5;

/** What has happened so far in this run; it lives across the two Phaser levels. */
export interface RunState extends GameStats {
  /** Indices of the papers already picked up (a respawn never gives them twice). */
  papers: Set<number>;
  /** The player holds the grenade (given by comrade Bảy at the end of act 1). */
  hasGrenade: boolean;
}

export const run: RunState = {
  lettersCollected: 0,
  timesCaught: 0,
  grenadeHit: 0,
  checkpointPassed: 0,
  playedBuyer: 0,
  papers: new Set(),
  hasGrenade: false,
};

export function resetRun(): void {
  run.lettersCollected = 0;
  run.timesCaught = 0;
  run.grenadeHit = 0;
  run.checkpointPassed = 0;
  run.playedBuyer = 0;
  run.papers.clear();
  run.hasGrenade = false;
}

export function runStats(): GameStats {
  return {
    lettersCollected: run.lettersCollected,
    timesCaught: run.timesCaught,
    grenadeHit: run.grenadeHit,
    checkpointPassed: run.checkpointPassed,
    playedBuyer: run.playedBuyer,
  };
}
