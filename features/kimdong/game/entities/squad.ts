import type Phaser from "phaser";

import { soldierAnim } from "../assets/animations";
import { SOLDIER_SHEET, SOLDIER_TEXTURES, SPRITE_ORIGIN } from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";
import { CLIMAX } from "../config";

const FLASH_INTERVAL_MS = 85;
const TRACER_JITTER = 18;
/** Height of the rifle above the soldier's feet. */
const MUZZLE_HEIGHT = 18;

/**
 * The French squad of the ambush. Soldiers march into the camera view from its top-right
 * corner and later fire tracer lines at a target.
 */
export class Squad {
  private readonly soldiers: Phaser.GameObjects.Sprite[] = [];
  private readonly tracers: Phaser.GameObjects.Graphics;
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
    this.fireEvent = this.scene.time.addEvent({
      delay: FLASH_INTERVAL_MS,
      repeat: Math.floor(CLIMAX.fireMs / FLASH_INTERVAL_MS),
      callback: () => this.drawTracers(target),
    });
  }

  private drawTracers(target: { x: number; y: number }): void {
    const g = this.tracers;
    g.clear();
    g.lineStyle(3, 0xff6b5c, 0.9);
    for (const soldier of this.soldiers) {
      if (Math.random() < 0.4) continue;
      g.beginPath();
      g.moveTo(soldier.x - 10, soldier.y - MUZZLE_HEIGHT);
      g.lineTo(
        target.x + (Math.random() - 0.5) * TRACER_JITTER * 2,
        target.y + (Math.random() - 0.5) * TRACER_JITTER * 2,
      );
      g.strokePath();
      g.fillStyle(0xffe08a, 0.9);
      g.fillCircle(soldier.x - 14, soldier.y - MUZZLE_HEIGHT, 6);
    }
  }

  destroy(): void {
    this.fireEvent?.remove();
    for (const soldier of this.soldiers) {
      this.scene.tweens.killTweensOf(soldier);
      soldier.destroy();
    }
    this.soldiers.length = 0;
    this.tracers.destroy();
  }
}
