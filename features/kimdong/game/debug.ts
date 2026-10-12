import { createDebugRegistry } from "@/lib/game/debug";

/** This game's own cheat registry (see `lib/game/debug.ts`); scenes plug their handlers into it. */
export const debug = createDebugRegistry();
export const debugHandlers = debug.handlers;
export const plugDebugHandlers = debug.plug;
