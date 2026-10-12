import { clamp } from "@/lib/engine";

import { ALERT } from "../config";
import { sendToHost } from "../host-bridge";

/** The 0-100% alert meter. Reports to the host at most every `publishIntervalMs`. */
export class AlertMeter {
  private current = 0;
  private lastPublished = -1;
  private lastPublishTime = -Infinity;

  get value(): number {
    return this.current;
  }

  get isFull(): boolean {
    return this.current >= 100;
  }

  add(percent: number): void {
    this.current = clamp(this.current + percent, 0, 100);
  }

  /** Grow by `ratePerSecond` for `dt` seconds. */
  raise(ratePerSecond: number, dt: number): void {
    this.add(ratePerSecond * dt);
  }

  decay(ratePerSecond: number, dt: number): void {
    this.add(-ratePerSecond * dt);
  }

  reset(): void {
    this.current = 0;
    this.lastPublished = -1;
    this.lastPublishTime = -Infinity;
    this.publish(0);
  }

  /** Call every frame with the scene clock (ms); sends only when the rounded value changed. */
  flush(now: number): void {
    const rounded = Math.round(this.current);
    if (rounded === this.lastPublished) return;
    if (now - this.lastPublishTime < ALERT.publishIntervalMs && rounded !== 0 && rounded !== 100) {
      return;
    }
    this.lastPublishTime = now;
    this.publish(rounded);
  }

  private publish(rounded: number): void {
    this.lastPublished = rounded;
    sendToHost({ type: "chapter:alert", value: rounded });
  }
}
