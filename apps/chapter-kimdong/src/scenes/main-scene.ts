import { createChapterProgress } from "@vhg/engine";
import Phaser from "phaser";

import { gameEvents } from "../events";

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

const LETTER_COUNT = 5;
const PLAYER_SPEED = 220;
const PLAYER_START = { x: 80, y: GAME_HEIGHT - 80 };
const HIT_COOLDOWN_MS = 1200;

type MovementKeys = Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;

/**
 * Kim Đồng carries secret letters (mật thư) through the Cao Bằng forest
 * while avoiding the patrolling guards.
 */
export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: MovementKeys;
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private collected = 0;
  private invulnerable = false;
  private finished = false;

  constructor() {
    super("main");
  }

  create(): void {
    this.collected = 0;
    this.invulnerable = false;
    this.finished = false;

    this.drawForest();

    this.player = this.add.rectangle(PLAYER_START.x, PLAYER_START.y, 28, 28, 0x2f6fdb);
    this.player.setStrokeStyle(2, 0xffffff);
    this.physics.add.existing(this.player);
    this.playerBody.setCollideWorldBounds(true);

    for (let i = 0; i < LETTER_COUNT; i++) this.spawnLetter();
    this.spawnGuard(520, 140, 130, 90);
    this.spawnGuard(300, 380, -110, 120);

    this.hud = this.add
      .text(16, 12, "", { fontFamily: "sans-serif", fontSize: "22px", color: "#fef3c7" })
      .setDepth(10);
    this.banner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        fontFamily: "sans-serif",
        fontSize: "34px",
        color: "#ffffff",
        align: "center",
        backgroundColor: "#00000099",
        padding: { x: 20, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);
    this.updateHud();

    if (import.meta.env.DEV) {
      // Dev-only cheat: call `debugWinGame()` from the iframe's DevTools context to skip playing.
      window.debugWinGame = () => this.debugWin();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        delete window.debugWinGame;
      });
    }

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = keyboard.addKeys("W,A,S,D") as MovementKeys;
      keyboard.once("keydown-SPACE", () => {
        if (this.finished) this.scene.restart();
      });
    }
  }

  override update(): void {
    if (this.finished) return;

    const left = this.cursors?.left.isDown || this.wasd?.A.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.D.isDown;
    const up = this.cursors?.up.isDown || this.wasd?.W.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.S.isDown;

    const body = this.playerBody;
    body.setVelocity((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
    // Normalise so diagonal movement is not faster.
    body.velocity.normalize().scale(PLAYER_SPEED);
  }

  private get playerBody(): Phaser.Physics.Arcade.Body {
    return this.player.body as Phaser.Physics.Arcade.Body;
  }

  private drawForest(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1d3a27);
    for (let i = 0; i < 28; i++) {
      const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const y = Phaser.Math.Between(60, GAME_HEIGHT - 20);
      const radius = Phaser.Math.Between(14, 26);
      this.add.circle(x, y, radius, Phaser.Math.RND.pick([0x24492f, 0x2b5637, 0x1a3322]));
    }
  }

  private spawnLetter(): void {
    const x = Phaser.Math.Between(60, GAME_WIDTH - 60);
    const y = Phaser.Math.Between(90, GAME_HEIGHT - 120);
    const letter = this.add.rectangle(x, y, 22, 16, 0xfacc15).setStrokeStyle(2, 0x92400e);
    this.physics.add.existing(letter, true);

    const overlap = this.physics.add.overlap(this.player, letter, () => {
      overlap.destroy();
      letter.destroy();
      this.collect();
    });
  }

  private spawnGuard(x: number, y: number, vx: number, vy: number): void {
    const guard = this.add.rectangle(x, y, 30, 30, 0xb91c1c).setStrokeStyle(2, 0x450a0a);
    this.physics.add.existing(guard);
    const body = guard.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(1, 1);
    body.setVelocity(vx, vy);

    this.physics.add.overlap(this.player, guard, () => this.getCaught());
  }

  private collect(): void {
    if (this.finished) return;
    this.collected += 1;
    this.reportProgress();

    if (this.collected >= LETTER_COUNT) this.completeLevel();
  }

  private completeLevel(): void {
    this.finished = true;
    this.playerBody.setVelocity(0, 0);
    this.showBanner("Hoàn thành nhiệm vụ!\nNhấn SPACE để chơi lại");
  }

  /** Dev-only: behave as if every letter had been collected. */
  private debugWin(): void {
    if (this.finished) return;
    this.collected = LETTER_COUNT;
    this.reportProgress();
    this.completeLevel();
  }

  private reportProgress(): void {
    this.updateHud();
    gameEvents.emit("progress", createChapterProgress("kim-dong", this.collected, LETTER_COUNT));
  }

  private getCaught(): void {
    if (this.invulnerable || this.finished) return;
    this.invulnerable = true;
    this.player.setPosition(PLAYER_START.x, PLAYER_START.y);
    this.playerBody.reset(PLAYER_START.x, PLAYER_START.y);
    this.showBanner("Bị lính tuần phát hiện! Quay lại điểm xuất phát");

    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 150, yoyo: true, repeat: 3 });
    this.time.delayedCall(HIT_COOLDOWN_MS, () => {
      this.invulnerable = false;
      if (!this.finished) this.banner.setVisible(false);
    });
  }

  private showBanner(message: string): void {
    this.banner.setText(message).setVisible(true);
  }

  private updateHud(): void {
    this.hud.setText(`Mật thư: ${this.collected}/${LETTER_COUNT}`);
  }
}
