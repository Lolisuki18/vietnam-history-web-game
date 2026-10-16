import { createDebugRegistry } from "@/lib/game/debug";

export const debug = createDebugRegistry();
export const debugHandlers = debug.handlers;
export const plugDebugHandlers = debug.plug;
