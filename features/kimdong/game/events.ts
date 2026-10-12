import { TypedEmitter } from "@/lib/engine";

import type { DialogueId } from "../types";

/** Commands arriving from the React UI (see `useKimDongBridge`). */
export const hostEvents = new TypedEmitter<{
  start: undefined;
  restart: undefined;
  "dialogue-closed": DialogueId;
  /** Whether Phaser may read (and swallow) the keyboard; off while React dialogs have focus. */
  keyboard: boolean;
  /** The pause menu is open (true) / closed (false): freeze or continue the whole game. */
  pause: boolean;
}>();

/** Events between Phaser scenes (gameplay scenes ⇄ UiScene). */
export const gameEvents = new TypedEmitter<{
  /** Short message in the middle of the screen. */
  banner: { text: string; ms: number };
  /** A gameplay scene (re)started: UiScene drops any overlay that is still showing. */
  reset: undefined;
  "rhythm:start": undefined;
  /** One rhythm note was judged. */
  "rhythm:note": { hit: boolean };
  "rhythm:done": { hits: number; misses: number };
  /** Show the ambush prompt with its countdown. */
  "climax:start": undefined;
  /** The player answered the ambush prompt (`acted: false` = the time ran out). */
  "climax:result": { acted: boolean };
  /** The on-screen action button was pressed (replaces Space / left click). */
  "touch:action": undefined;
  /** The game continued after a pause; payload = how long it was frozen (ms). */
  resumed: number;
  /** Gameplay scenes tell UiScene whether the virtual controls should be shown right now. */
  "controls:active": boolean;
}>();
