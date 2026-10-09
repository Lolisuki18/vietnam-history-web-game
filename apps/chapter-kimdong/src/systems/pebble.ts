import type { Point } from "@vhg/engine";
import type Phaser from "phaser";

import { GUARD, PEBBLE } from "../config";

const RIPPLE_COUNT = 4;
const RIPPLE_RINGS_PER_THROW = 2;
const RIPPLE_DURATION_MS = 800;
const RIPPLE_RING_DELAY_MS = 180;
const ARC_HEIGHT = 70;

/**
 * Throwing a pebble: it flies in an arc to a spot within range, then a sound ripple spreads
 * out (its radius is the distance guards can hear). Visual objects are pooled.
 */
export class PebbleThrower {
  private readonly pebble: Phaser.GameObjects.Arc;
  private readonly ripples: Phaser.GameObjects.Arc[] = [];
  private nextRipple = 0;
  private readyAt = 0;
  private flying = false;
  private tween?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onLand: (x: number, y: number) => void,
  ) {
    this.pebble = scene.add.circle(0, 0, 5, 0xd6d3d1).setStrokeStyle(1, 0x57534e).setDepth(25);
    this.pebble.setVisible(false);
    for (let i = 0; i < RIPPLE_COUNT; i++) {
      const ripple = scene.add.circle(0, 0, GUARD.hearingRadius).setDepth(4).setVisible(false);
      ripple.setStrokeStyle(3, 0xffffff, 0.8);
      this.ripples.push(ripple);
    }
  }

  /**
   * Throw from `from` toward `to`; the landing spot is clamped to `PEBBLE.range`.
   * Returns false while on cooldown or when a pebble is already in the air.
   */
  throw(from: Point, to: Point): boolean {
    const now = this.scene.time.now;
    if (this.flying || now < this.readyAt) return false;
    this.readyAt = now + PEBBLE.cooldownMs;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const scale = distance > PEBBLE.range ? PEBBLE.range / distance : 1;
    const landX = from.x + dx * scale;
    const landY = from.y + dy * scale;

    this.flying = true;
    this.pebble.setPosition(from.x, from.y).setVisible(true);
    const progress = { t: 0 };
    this.tween = this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: PEBBLE.flightMs,
      ease: "Sine.easeOut",
      onUpdate: () => {
        const t = progress.t;
        this.pebble.setPosition(
          from.x + (landX - from.x) * t,
          from.y + (landY - from.y) * t - Math.sin(t * Math.PI) * ARC_HEIGHT,
        );
      },
      onComplete: () => {
        this.flying = false;
        this.pebble.setVisible(false);
        this.spawnRipples(landX, landY);
        this.onLand(landX, landY);
      },
    });
    return true;
  }

  private spawnRipples(x: number, y: number): void {
    for (let ring = 0; ring < RIPPLE_RINGS_PER_THROW; ring++) {
      const ripple = this.ripples[this.nextRipple]!;
      this.nextRipple = (this.nextRipple + 1) % this.ripples.length;
      this.scene.tweens.killTweensOf(ripple);
      ripple.setPosition(x, y).setScale(0.05).setAlpha(0.9).setVisible(true);
      this.scene.tweens.add({
        targets: ripple,
        scale: 1,
        alpha: 0,
        delay: ring * RIPPLE_RING_DELAY_MS,
        duration: RIPPLE_DURATION_MS,
        ease: "Quad.easeOut",
        onComplete: () => ripple.setVisible(false),
      });
    }
  }

  destroy(): void {
    this.tween?.stop();
    for (const ripple of this.ripples) this.scene.tweens.killTweensOf(ripple);
    this.pebble.destroy();
    for (const ripple of this.ripples) ripple.destroy();
    this.ripples.length = 0;
  }
}
