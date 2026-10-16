import type Phaser from "phaser";

import type { Point } from "@/lib/engine";

import { EXPLOSION_ANIM } from "../assets/animations";
import { EXPLOSION_SHEET, IMAGE_KEYS } from "../assets/manifest";
import { GRENADE, PEBBLES } from "../config";
import { arcPoint } from "./motion";

const FX_DEPTH = 5400;

/** A ring that grows and fades where a noise was made (the "sound wave" of the design). */
export function noiseRipple(scene: Phaser.Scene, x: number, y: number, radius = 90): void {
  const ring = scene.add.circle(x, y, 8).setStrokeStyle(3, 0xffffff, 0.8).setDepth(FX_DEPTH);
  scene.tweens.add({
    targets: ring,
    scale: radius / 8,
    alpha: 0,
    duration: 600,
    ease: "Sine.easeOut",
    onComplete: () => ring.destroy(),
  });
}

/** Throws pebbles: one flies at a time along a small arc and makes a noise where it lands. */
export class PebbleThrower {
  private flying = false;
  private cooldown = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onLanded: (x: number, y: number) => void,
  ) {}

  get isReady(): boolean {
    return !this.flying && this.cooldown <= 0;
  }

  /** Call every frame (`dt` in seconds). */
  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt * 1000);
  }

  /** Throw from `from` at `to` (the target is pulled in to the throwing range). */
  throw(from: Point, to: Point): void {
    if (!this.isReady) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const reach = Math.min(distance, PEBBLES.range);
    const target = { x: from.x + (dx / distance) * reach, y: from.y + (dy / distance) * reach };

    this.flying = true;
    const image = this.scene.add
      .image(from.x, from.y - 20, IMAGE_KEYS.pebble)
      .setDisplaySize(16, 16)
      .setDepth(FX_DEPTH);
    const progress = { t: 0 };
    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: PEBBLES.flightMs,
      ease: "Linear",
      onUpdate: () => {
        const p = arcPoint({ x: from.x, y: from.y - 20 }, target, progress.t, 38);
        image.setPosition(p.x, p.y);
      },
      onComplete: () => {
        image.destroy();
        this.flying = false;
        this.cooldown = PEBBLES.cooldownMs;
        this.onLanded(target.x, target.y);
      },
    });
  }
}

/** The grenade in the air, from `from` to `to`, then `onLanded`. */
export function throwGrenade(
  scene: Phaser.Scene,
  from: Point,
  to: Point,
  flightMs: number,
  onLanded: () => void,
): void {
  const start = { x: from.x, y: from.y - 24 };
  const image = scene.add
    .image(start.x, start.y, IMAGE_KEYS.grenade)
    .setDisplaySize(22, 22)
    .setDepth(FX_DEPTH);
  const progress = { t: 0 };
  scene.tweens.add({
    targets: progress,
    t: 1,
    duration: flightMs,
    ease: "Linear",
    onUpdate: () => {
      const p = arcPoint(start, to, progress.t, GRENADE.arcHeight);
      image.setPosition(p.x, p.y).setAngle(progress.t * 540);
    },
    onComplete: () => {
      image.destroy();
      onLanded();
    },
  });
}

/** A flash, smoke and fire at (x, y); a real animation when `fx_explosion.png` is there. */
export function spawnExplosion(scene: Phaser.Scene, x: number, y: number): void {
  const flash = scene.add.circle(x, y, 20, 0xfff2b0, 1).setDepth(FX_DEPTH);
  scene.tweens.add({
    targets: flash,
    scale: 7,
    alpha: 0,
    duration: 380,
    ease: "Cubic.easeOut",
    onComplete: () => flash.destroy(),
  });

  if (scene.anims.exists(EXPLOSION_ANIM)) {
    const sprite = scene.add.sprite(x, y - 20, EXPLOSION_SHEET.key, 0).setDepth(FX_DEPTH + 1);
    sprite.setScale(1.6);
    sprite.anims.play(EXPLOSION_ANIM);
    sprite.once("animationcomplete", () => sprite.destroy());
    return;
  }
  // Stand-in: fire and a few puffs of smoke.
  const fire = scene.add.circle(x, y - 10, 24, 0xff8a1f, 0.95).setDepth(FX_DEPTH + 1);
  scene.tweens.add({
    targets: fire,
    scale: 3.6,
    alpha: 0,
    duration: 520,
    ease: "Quad.easeOut",
    onComplete: () => fire.destroy(),
  });
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
    const puff = scene.add
      .circle(x, y - 10, 14 + Math.random() * 10, 0x3a3a3a, 0.8)
      .setDepth(FX_DEPTH + 1);
    scene.tweens.add({
      targets: puff,
      x: x + Math.cos(angle) * (60 + Math.random() * 50),
      y: y - 10 + Math.sin(angle) * (40 + Math.random() * 40) - 30,
      scale: 2.2,
      alpha: 0,
      duration: 900 + Math.random() * 400,
      ease: "Sine.easeOut",
      onComplete: () => puff.destroy(),
    });
  }
}

/** The aiming aid of the grenade: a dotted arc to a reticle that sweeps in and out. */
export class AimOverlay {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(5500).setVisible(false);
  }

  show(from: Point, to: Point): void {
    const g = this.graphics.setVisible(true);
    g.clear();
    const start = { x: from.x, y: from.y - 24 };
    // Dotted parabola.
    g.fillStyle(0xfff2a8, 0.9);
    for (let i = 1; i <= 16; i++) {
      const p = arcPoint(start, to, i / 17, GRENADE.arcHeight);
      g.fillCircle(p.x, p.y, 2.5);
    }
    // Reticle on the ground.
    g.lineStyle(3, 0xff4b3a, 0.95);
    g.strokeCircle(to.x, to.y, GRENADE.killRadius * 0.45);
    g.lineBetween(to.x - 14, to.y, to.x + 14, to.y);
    g.lineBetween(to.x, to.y - 14, to.x, to.y + 14);
  }

  hide(): void {
    this.graphics.clear().setVisible(false);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
