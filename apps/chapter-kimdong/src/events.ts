import { TypedEmitter, type ChapterProgress } from "@vhg/engine";

/** Events the Phaser scenes raise for the host page glue in main.ts. */
export const gameEvents = new TypedEmitter<{ progress: ChapterProgress }>();
