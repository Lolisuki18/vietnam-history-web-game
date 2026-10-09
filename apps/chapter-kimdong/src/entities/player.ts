import type Phaser from "phaser";

const SIZE = 24;
const HAT_OFFSET_Y = -15;

/** Kim Đồng (Dền): a blue block with a white outline and a white hat. */
export class Player {
  readonly sprite: Phaser.GameObjects.Rectangle;
  private readonly hat: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add
      .rectangle(x, y, SIZE, SIZE, 0x2f6fdb)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(20);
    scene.physics.add.existing(this.sprite);
    this.body.setCollideWorldBounds(true);

    this.hat = scene.add
      .ellipse(x, y + HAT_OFFSET_Y, 32, 13, 0xffffff)
      .setStrokeStyle(2, 0xcbd5e1)
      .setDepth(21);
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  /** Keep the hat attached; call once per frame after physics has moved the sprite. */
  syncVisuals(): void {
    this.hat.setPosition(this.sprite.x, this.sprite.y + HAT_OFFSET_Y);
  }

  setAlpha(alpha: number): void {
    this.sprite.setAlpha(alpha);
    this.hat.setAlpha(alpha);
  }

  teleport(x: number, y: number): void {
    this.body.reset(x, y);
    this.syncVisuals();
  }

  destroy(): void {
    this.sprite.destroy();
    this.hat.destroy();
  }
}
