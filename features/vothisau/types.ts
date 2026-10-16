import type { ChapterId, ChapterProgress } from "@/lib/engine";

/** The id of this game in the chapter list (`CHAPTER_IDS`); the only place the literal appears. */
export const VOTHISAU_ID = "vo-thi-sau" as const satisfies ChapterId;

/** The three acts (hồi): 1 forest, 2 market (both Phaser), 3 interrogation room (React only). */
export type Act = 1 | 2 | 3;

/** Story beats the game reports to the UI (drives the HUD objective and the control hints). */
export const CHAPTER_PHASES = [
  "forest",
  "meet-bay",
  "market",
  "checkpoint",
  "target",
  "escape",
  "interrogation",
  "ending",
] as const;
export type ChapterPhase = (typeof CHAPTER_PHASES)[number];

/** Dialogues the game can ask the UI to display (modal on aged paper). */
export const DIALOGUE_IDS = ["bay"] as const;
export type DialogueId = (typeof DIALOGUE_IDS)[number];

/** Timed choices: the game freezes and the UI asks the player to pick within a few seconds. */
export const CHOICE_IDS = ["checkpoint", "caitong"] as const;
export type ChoiceId = (typeof CHOICE_IDS)[number];

/** What the player picked. `timeout` = no answer in time. */
export type ChoiceOption = "a" | "b" | "c" | "timeout";

/** Numbers the game collects during acts 1 and 2 (act 3 adds `interrogationPath`). */
export interface GameStats {
  lettersCollected: number;
  /** Times the alert meter filled up and the player was sent back to a checkpoint. */
  timesCaught: number;
  /** 1 when the grenade hit Cai Tòng. */
  grenadeHit: number;
  /** 1 when the checkpoint question was answered correctly. */
  checkpointPassed: number;
  /** 1 when the player played the buyer (option A) and 0 when they threw at once (B). */
  playedBuyer: number;
}

/** Numbers saved with the completed chapter (all numeric: see `ChapterOutcome`). */
export interface VoThiSauOutcome extends GameStats {
  /** 1 = contempt, 2 = defiance. */
  interrogationPath: number;
}

/** Messages the game sends up to the React UI. */
export type ChapterMessage =
  | { type: "chapter:ready" }
  | { type: "chapter:progress"; progress: ChapterProgress }
  | { type: "chapter:act"; act: Act }
  | { type: "chapter:phase"; phase: ChapterPhase }
  /** A lore item was picked up; `index` is the item's number (0-based). */
  | { type: "chapter:lore"; index: number }
  | { type: "chapter:dialogue"; id: DialogueId }
  | { type: "chapter:choice"; id: ChoiceId }
  /** Start the "play the buyer" timing mini-game. */
  | { type: "chapter:qte" }
  /** Alert meter, 0-100. */
  | { type: "chapter:alert"; value: number }
  /** Whether the player carries the grenade. */
  | { type: "chapter:grenade"; has: boolean }
  /** Acts 1 and 2 are done: on to the interrogation room. */
  | { type: "chapter:escaped"; stats: GameStats };

/** Commands the React UI sends down to the game. */
export type HostMessage =
  | { type: "host:start" }
  | { type: "host:restart" }
  | { type: "host:dialogue-closed"; id: DialogueId }
  | { type: "host:choice-made"; id: ChoiceId; option: ChoiceOption }
  | { type: "host:qte-done"; passed: boolean };
