import { TypedEmitter } from "@/lib/engine";

import type { ChoiceId, ChoiceOption, DialogueId } from "../types";

/** Commands arriving from the React UI (see `useVoThiSauBridge`). */
export const hostEvents = new TypedEmitter<{
  start: undefined;
  restart: undefined;
  "dialogue-closed": DialogueId;
  "choice-made": { id: ChoiceId; option: ChoiceOption };
  "qte-done": { passed: boolean };
  /** Whether Phaser may read (and swallow) the keyboard; off while React dialogs have focus. */
  keyboard: boolean;
  /** The pause menu / a timed choice is open (true) / closed (false): freeze or continue the game. */
  pause: boolean;
}>();

/** Events between Phaser scenes (the level ⇄ UiScene). */
export const gameEvents = new TypedEmitter<{
  /** Short message in the middle of the screen. */
  banner: { text: string; ms: number };
  /** A level (re)started: UiScene drops any overlay that is still showing. */
  reset: undefined;
  /** The on-screen action button was pressed (replaces Space). */
  "touch:action": undefined;
  /** Gameplay scenes tell UiScene whether the virtual controls should be shown right now. */
  "controls:active": boolean;
  /** Pebbles carried (UiScene shows the counter); `max` 0 hides it. */
  pebbles: { count: number; max: number };
}>();
