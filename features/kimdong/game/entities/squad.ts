import type Phaser from "phaser";

import { SHOOT_ANIM_LEFT, soldierAnim } from "../assets/animations";
import { ASSET_KEYS, SOLDIER_SHEET, SOLDIER_TEXTURES, SPRITE_ORIGIN } from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";
import { CLIMAX } from "../config";

const FLASH_INTERVAL_MS = 85;
const TRACER_JITTER = 18;
/** Where the rifle's muzzle is, from the soldier's feet (the shooting sheet faces left). */
const MUZZLE_OFFSET = { x: -26, y: -26 } as const;
/** On-screen size of one muzzle flash, in world px. */
const FLASH_SIZE = 52;

/**
 * The French squad of the ambush. Soldiers march into the camera view from its top-right
 * corner and later fire tracer lines at a target.
 */
export class Squad {
  private readonly soldiers: Phaser.GameObjects.Sprite[] = [];
  private readonly tracers: Phaser.GameObjects.Graphics;
  private readonly flashes: Phaser.GameObjects.Sprite[] = [];
  private fireEvent?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    for (let i = 0; i < CLIMAX.squadSize; i++) {
      // They come from the right and face left, toward the player.
      // French soldiers and "lính khố xanh" fall in together.
      this.soldiers.push(
        fitToWorld(
          scene.add
            .sprite(
              0,
              -10_000,
              SOLDIER_TEXTURES[i % SOLDIER_TEXTURES.length]!,
              SOLDIER_SHEET.rows.left * SOLDIER_SHEET.columns,
            )
            .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y)
            .setDepth(40),
        ),
      );
    }
    this.tracers = scene.add.graphics().setDepth(41);
    // One muzzle flash per soldier (the artist's picture, row 0 of the sheet fires to the left).
    if (scene.textures.exists(ASSET_KEYS.muzzleFlash)) {
      for (let i = 0; i < CLIMAX.squadSize; i++) {
        this.flashes.push(
          scene.add
            .sprite(0, -10_000, ASSET_KEYS.muzzleFlash, 1)
            .setDisplaySize(FLASH_SIZE, FLASH_SIZE)
            .setDepth(42)
            .setVisible(false),
        );
      }
    }
  }

  /** Where the squad stands (valid after `enter`). */
  get center(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    for (const soldier of this.soldiers) {
      x += soldier.x;
      y += soldier.y;
    }
    return { x: x / this.soldiers.length, y: y / this.soldiers.length };
  }

  /** March the soldiers in from the top-right corner of `view` to their firing line. */
  enter(view: Phaser.Geom.Rectangle): void {
    this.soldiers.forEach((soldier, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const targetX = view.right - view.width * 0.12 - column * 70;
      const targetY = view.y + view.height * 0.2 + row * 75 + column * 18;
      soldier.setPosition(view.right + 140 + index * 40, view.y - 80);
      soldier.anims.play(
        soldierAnim(SOLDIER_TEXTURES[index % SOLDIER_TEXTURES.length]!, "left"),
        true,
      );
      this.scene.tweens.add({
        targets: soldier,
        x: targetX,
        y: targetY,
        duration: 900,
        delay: index * 110,
        ease: "Sine.easeOut",
        // Marching stops once they are in position.
        onComplete: () => {
          soldier.anims.stop();
          soldier.setFrame(SOLDIER_SHEET.rows.left * SOLDIER_SHEET.columns);
        },
      });
    });
  }

  /** Fire flickering tracer lines at `target` for `CLIMAX.fireMs`. */
  fireAt(target: { x: number; y: number }): void {
    this.fireEvent?.remove();
    // They stop marching and shoot: aim, fire, recoil (the soldiers face left, toward the player).
    if (this.scene.anims.exists(SHOOT_ANIM_LEFT)) {
      for (const soldier of this.soldiers) soldier.anims.play(SHOOT_ANIM_LEFT, true);
    }
    this.fireEvent = this.scene.time.addEvent({
      delay: FLASH_INTERVAL_MS,
      repeat: Math.floor(CLIMAX.fireMs / FLASH_INTERVAL_MS),
      callback: () => this.drawTracers(target),
    });
    this.scene.time.delayedCall(CLIMAX.fireMs + FLASH_INTERVAL_MS, () => {
      this.tracers.clear();
      for (const flash of this.flashes) flash.setVisible(false);
    });
  }

  private drawTracers(target: { x: number; y: number }): void {
    const g = this.tracers;
    g.clear();
    g.lineStyle(3, 0xff6b5c, 0.9);
    this.soldiers.forEach((soldier, index) => {
      const flash = this.flashes[index];
      if (Math.random() < 0.4) {
        flash?.setVisible(false);
        return;
      }
      const muzzle = { x: soldier.x + MUZZLE_OFFSET.x, y: soldier.y + MUZZLE_OFFSET.y };
      g.beginPath();
      g.moveTo(muzzle.x, muzzle.y);
      g.lineTo(
        target.x + (Math.random() - 0.5) * TRACER_JITTER * 2,
        target.y + (Math.random() - 0.5) * TRACER_JITTER * 2,
      );
      g.strokePath();
      if (flash) {
        // Frames 1 and 2 of the top row: the flame, then the burst.
        flash
          .setPosition(muzzle.x - FLASH_SIZE * 0.3, muzzle.y)
          .setFrame(Math.random() < 0.5 ? 1 : 2);
        flash.setVisible(true);
      } else {
        g.fillStyle(0xffe08a, 0.9);
        g.fillCircle(muzzle.x, muzzle.y, 6);
      }
    });
  }

  destroy(): void {
    this.fireEvent?.remove();
    for (const soldier of this.soldiers) {
      this.scene.tweens.killTweensOf(soldier);
      soldier.destroy();
    }
    this.soldiers.length = 0;
    this.tracers.destroy();
    for (const flash of this.flashes) flash.destroy();
    this.flashes.length = 0;
  }
}
