import { createChapterProgress } from "@/lib/engine";

import { ALERT } from "../config";
import { sendToHost } from "../host-bridge";
import { VOTHISAU_ID } from "../../types";

/**
 * The suspicion of the soldiers, 0-100. It rises while a guard sees the player, falls otherwise,
 * and the React HUD hears about it (at most every `publishIntervalMs`).
 */
export class AlertMeter {
  private current = 0;
  private published = -1;
  private sinceFlush = 0;

  get value(): number {
    return this.current;
  }

  get isFull(): boolean {
    return this.current >= 100;
  }

  get isRed(): boolean {
    return this.current >= ALERT.redAt;
  }

  raise(ratePerSecond: number, dt: number): void {
    this.current = Math.min(100, this.current + ratePerSecond * dt);
  }

  decay(ratePerSecond: number, dt: number): void {
    this.current = Math.max(0, this.current - ratePerSecond * dt);
  }

  set(value: number): void {
    this.current = Math.min(100, Math.max(0, value));
  }

  reset(): void {
    this.set(0);
    this.sinceFlush = ALERT.publishIntervalMs;
    this.flush(0);
  }

  /** Tell the host the new value when it changed (throttled; `dt` in seconds). */
  flush(dt: number): void {
    this.sinceFlush += dt * 1000;
    const rounded = Math.round(this.current);
    if (rounded === this.published || this.sinceFlush < ALERT.publishIntervalMs) return;
    this.sinceFlush = 0;
    this.published = rounded;
    sendToHost({ type: "chapter:alert", value: rounded });
  }
}

/** Report how many of the story papers have been collected. */
export function reportProgress(collected: number, total: number): void {
  sendToHost({
    type: "chapter:progress",
    progress: createChapterProgress(VOTHISAU_ID, collected, total),
  });
}
