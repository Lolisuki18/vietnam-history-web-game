import Phaser from "phaser";

import { GameAudio } from "../audio";
import { RUNNER } from "../config";
import { plugDebugHandlers } from "../debug";
import { gameEvents } from "../events";
import { sendToHost } from "../host-bridge";
import { touchInput } from "../input-state";

type RunnerState = "running" | "ending" | "finished";

interface SceneData {
  lettersCollected?: number;
}

interface Obstacle {
  view: Phaser.GameObjects.Container;
  rock: Phaser.GameObjects.Arc;
  root: Phaser.GameObjects.Rectangle;
  active: boolean;
  lane: number;
  /** Collision width. */
  width: number;
}

interface Bullet {
  warning: Phaser.GameObjects.Rectangle;
  shot: Phaser.GameObjects.Rectangle;
  state: "idle" | "warning" | "flying";
  lane: number;
  /** ms left in the warning phase. */
  timer: number;
}

interface BackgroundTree {
  circle: Phaser.GameObjects.Arc;
  /** Above (top) or below (bottom) the trail. */
  zone: "top" | "bottom";
  /** 0-1 position inside the zone. */
  frac: number;
  /** Fraction of the scroll speed (parallax). */
  parallax: number;
}

const OBSTACLE_POOL = 8;
const BULLET_POOL = 4;
const TREE_COUNT = 16;
const PLAYER_SIZE = 26;
const PLAYER_X_FRACTION = 0.68;
const BULLET_LENGTH = 90;

const ENDING_CAPTIONS: readonly { atMs: number; text: string }[] = [
  { atMs: 1300, text: "Tiếng súng nổ vang giữa núi rừng Cao Bằng…" },
  { atMs: 3900, text: "Kim Đồng đã ngã xuống, để cán bộ kịp rút an toàn." },
  { atMs: 6500, text: "Tiếng chim tu hú vẫn vọng lại giữa đại ngàn…" },
];
const BLACKOUT_DELAY_MS = 500;
const BLACKOUT_MS = 2600;
const ENDING_TOTAL_MS = 9500;

/**
 * Phase 3b: Kim Đồng runs left, drawing the soldiers away. Rocks and roots come from the left
 * (dodge by changing lane or jumping), bullets from the right (change lane). The run lasts
 * `RUNNER.durationMs` or until the hearts are gone, then the ending plays.
 *
 * All objects are created once; obstacles and bullets are pooled and nothing is allocated per frame.
 */
export class RunnerScene extends Phaser.Scene {
  private state: RunnerState = "running";
  private audio!: GameAudio;
  private lettersCollected = 5;

  private elapsedMs = 0;
  private hearts: number = RUNNER.hearts;
  private hits = 0;
  private lane = 1;
  private laneY = 0;
  private jumpClock = -1;
  /** Current height of the jump in px (0 on the ground). */
  private jumpOffset = 0;
  private stickWasUp = false;
  private stickWasDown = false;
  private controlsActive = false;
  private invulnerableMs = 0;
  private obstacleTimer = 0;
  private bulletTimer = 0;

  private player!: Phaser.GameObjects.Container;
  private ground!: Phaser.GameObjects.Rectangle;
  private trail!: Phaser.GameObjects.Rectangle;
  private heartsText!: Phaser.GameObjects.Text;
  private progressBack!: Phaser.GameObjects.Rectangle;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private blackout!: Phaser.GameObjects.Rectangle;
  private caption!: Phaser.GameObjects.Text;
  private readonly trees: BackgroundTree[] = [];
  private readonly obstacles: Obstacle[] = [];
  private readonly bullets: Bullet[] = [];
  private readonly chasers: Phaser.GameObjects.Container[] = [];
  private stopAmbience?: () => void;
  private readonly cleanups: Array<() => void> = [];

  constructor() {
    super("runner");
  }

  init(data: SceneData): void {
    this.lettersCollected = data.lettersCollected ?? 5;
    this.state = "running";
    this.elapsedMs = 0;
    this.hearts = RUNNER.hearts;
    this.hits = 0;
    this.lane = 1;
    this.jumpClock = -1;
    this.jumpOffset = 0;
    this.stickWasUp = false;
    this.stickWasDown = false;
    this.controlsActive = false;
    this.invulnerableMs = 0;
    this.obstacleTimer = 700;
    this.bulletTimer = RUNNER.bulletGraceMs;
    this.trees.length = 0;
    this.obstacles.length = 0;
    this.bullets.length = 0;
    this.chasers.length = 0;
    this.cleanups.length = 0;
  }

  create(): void {
    this.audio = new GameAudio(this);
    this.createBackground();
    this.createChasers();
    this.createPools();
    this.createPlayer();
    this.createHud();

    this.layout();
    this.laneY = this.laneCenterY(this.lane);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.input.keyboard?.on("keydown", this.onKeyDown);
    this.cleanups.push(
      () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this),
      () => this.input.keyboard?.off("keydown", this.onKeyDown),
      gameEvents.on("touch:action", () => this.jump()),
      () => this.stopAmbience?.(),
      () => gameEvents.emit("controls:active", false),
    );
    if (import.meta.env.DEV) {
      this.cleanups.push(
        plugDebugHandlers({
          win: () => this.startEnding(),
          goto: (target) => {
            if (target === "ending") this.startEnding();
          },
          state: () => ({
            scene: `runner:${this.state}`,
            lane: this.lane,
            playerY: Math.round(this.player.y),
            laneTargetY: Math.round(this.laneCenterY(this.lane)),
            screen: `${this.scale.width}x${this.scale.height}`,
            jumpOffset: Math.round(this.jumpOffset),
            hearts: this.hearts,
            elapsedMs: Math.round(this.elapsedMs),
          }),
        }),
      );
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const cleanup of this.cleanups.splice(0)) cleanup();
    });

    this.cameras.main.fadeIn(450, 0, 0, 0);
    // Scenes draw in registration order and this one was added after the UI scene.
    this.scene.bringToTop("ui");
    gameEvents.emit("reset", undefined);
    sendToHost({ type: "chapter:phase", phase: "runner" });
  }

  override update(_time: number, delta: number): void {
    this.syncControlsVisibility();
    if (this.state === "finished") return;
    const dt = Math.min(delta, 50) / 1000;
    const dtMs = dt * 1000;

    const progress = Math.min(1, this.elapsedMs / RUNNER.durationMs);
    const speed = RUNNER.scrollSpeed * (1 + RUNNER.speedGain * progress);
    this.scrollBackground(dt, this.state === "running" ? speed : speed * 0.15);

    if (this.state !== "running") return;

    this.elapsedMs += dtMs;
    this.invulnerableMs = Math.max(0, this.invulnerableMs - dtMs);
    this.readTouchLanes();
    this.updatePlayer(dt, dtMs);
    this.spawn(dtMs);
    this.updateObstacles(dt, speed);
    this.updateBullets(dt, dtMs);
    this.progressFill.setSize(
      Math.max(1, this.progressBack.width * progress),
      this.progressBack.height,
    );

    if (this.elapsedMs >= RUNNER.durationMs || this.hearts <= 0) this.startEnding();
  }

  // ----- layout -------------------------------------------------------------------------

  private get laneGap(): number {
    return Phaser.Math.Clamp(this.scale.height * 0.17, 56, 120);
  }

  private laneCenterY(lane: number): number {
    return this.scale.height * 0.52 + (lane - (RUNNER.lanes - 1) / 2) * this.laneGap;
  }

  private layout(): void {
    const { width, height } = this.scale;
    const bandTop = this.laneCenterY(0) - this.laneGap * 0.75;
    const bandBottom = this.laneCenterY(RUNNER.lanes - 1) + this.laneGap * 0.75;

    this.ground.setPosition(width / 2, height / 2).setSize(width, height);
    this.trail
      .setPosition(width / 2, (bandTop + bandBottom) / 2)
      .setSize(width, bandBottom - bandTop);

    for (const tree of this.trees) {
      tree.circle.y =
        tree.zone === "top" ? tree.frac * bandTop : bandBottom + tree.frac * (height - bandBottom);
    }

    this.player.x = width * PLAYER_X_FRACTION;
    this.chasers.forEach((chaser, index) =>
      chaser.setPosition(width - 34, this.laneCenterY(index)),
    );

    // Below the React HUD (counter, objective, alert meter) that covers the top of the screen.
    this.progressBack.setPosition(width / 2, 84).setSize(Math.min(420, width * 0.5), 10);
    this.progressFill.setPosition(width / 2 - this.progressBack.width / 2, 84);
    this.heartsText.setPosition(16, 72);
    this.blackout.setPosition(width / 2, height / 2).setSize(width, height);
    this.caption.setPosition(width / 2, height / 2).setWordWrapWidth(Math.max(240, width * 0.8));
  }

  // ----- creation -----------------------------------------------------------------------

  private createBackground(): void {
    this.ground = this.add.rectangle(0, 0, 10, 10, 0x1d3a27).setDepth(0);
    this.trail = this.add.rectangle(0, 0, 10, 10, 0x6b4d31).setDepth(1);
    for (let i = 0; i < TREE_COUNT; i++) {
      const circle = this.add
        .circle(Phaser.Math.Between(0, this.scale.width), 0, Phaser.Math.Between(26, 54))
        .setFillStyle(Phaser.Math.RND.pick([0x24492f, 0x2b5637, 0x1a3322]))
        .setDepth(2);
      this.trees.push({
        circle,
        zone: i % 2 === 0 ? "top" : "bottom",
        frac: Phaser.Math.FloatBetween(0.15, 0.85),
        parallax: Phaser.Math.FloatBetween(0.5, 1),
      });
    }
  }

  private createChasers(): void {
    for (let i = 0; i < RUNNER.lanes; i++) {
      const body = this.add.rectangle(0, 0, 30, 30, 0xb91c1c).setStrokeStyle(2, 0x450a0a);
      const helmet = this.add.ellipse(0, -14, 32, 15, 0x3f4a2c).setStrokeStyle(2, 0x1c2312);
      this.chasers.push(this.add.container(0, 0, [body, helmet]).setDepth(6));
    }
  }

  private createPools(): void {
    for (let i = 0; i < OBSTACLE_POOL; i++) {
      const rock = this.add.circle(0, 0, 22, 0x78716c).setStrokeStyle(3, 0x292524);
      const root = this.add.rectangle(0, 0, 84, 18, 0x5b3a1e).setStrokeStyle(3, 0x2a1a0c);
      const view = this.add.container(0, 0, [rock, root]).setDepth(5).setVisible(false);
      this.obstacles.push({ view, rock, root, active: false, lane: 0, width: 44 });
    }
    for (let i = 0; i < BULLET_POOL; i++) {
      const warning = this.add.rectangle(0, 0, 10, 6, 0xff3b3b, 0.5).setDepth(4).setVisible(false);
      const shot = this.add
        .rectangle(0, 0, BULLET_LENGTH, 6, 0xff5252)
        .setDepth(7)
        .setVisible(false);
      this.bullets.push({ warning, shot, state: "idle", lane: 0, timer: 0 });
    }
  }

  private createPlayer(): void {
    const body = this.add
      .rectangle(0, 0, PLAYER_SIZE, PLAYER_SIZE, 0x2f6fdb)
      .setStrokeStyle(2, 0xffffff);
    const hat = this.add.ellipse(0, -15, 34, 14, 0xffffff).setStrokeStyle(2, 0xcbd5e1);
    this.player = this.add.container(0, 0, [body, hat]).setDepth(10);
  }

  private createHud(): void {
    this.heartsText = this.add
      .text(0, 0, "", { fontFamily: "sans-serif", fontSize: "30px", color: "#ff6b6b" })
      .setDepth(60);
    this.updateHearts();
    this.progressBack = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.5).setDepth(60);
    this.progressFill = this.add.rectangle(0, 0, 1, 10, 0xfacc15).setOrigin(0, 0.5).setDepth(61);
    this.blackout = this.add.rectangle(0, 0, 10, 10, 0x000000, 1).setDepth(90).setAlpha(0);
    this.caption = this.add
      .text(0, 0, "", {
        fontFamily: "sans-serif",
        fontSize: "30px",
        color: "#e5e7eb",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(95)
      .setAlpha(0);
  }

  // ----- input --------------------------------------------------------------------------

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.state !== "running" || event.repeat) return;
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.changeLane(-1);
        break;
      case "ArrowDown":
      case "KeyS":
        this.changeLane(1);
        break;
      case "Space":
        this.jump();
        break;
    }
  };

  private changeLane(direction: number): void {
    this.lane = Phaser.Math.Clamp(this.lane + direction, 0, RUNNER.lanes - 1);
  }

  private jump(): void {
    if (this.state === "running" && this.jumpClock < 0) this.jumpClock = 0;
  }

  /**
   * The joystick acts like the up/down keys: one lane change each time it is pushed from the
   * neutral position (edge detection, so holding it does not skip several lanes).
   */
  private readTouchLanes(): void {
    if (touchInput.up && !this.stickWasUp) this.changeLane(-1);
    if (touchInput.down && !this.stickWasDown) this.changeLane(1);
    this.stickWasUp = touchInput.up;
    this.stickWasDown = touchInput.down;
  }

  /** Tell the UI scene when the virtual controls should be on screen (only on change). */
  private syncControlsVisibility(): void {
    const active = this.state === "running";
    if (active === this.controlsActive) return;
    this.controlsActive = active;
    gameEvents.emit("controls:active", active);
  }

  // ----- simulation ---------------------------------------------------------------------

  private scrollBackground(dt: number, speed: number): void {
    const width = this.scale.width;
    for (const tree of this.trees) {
      const circle = tree.circle;
      circle.x += speed * tree.parallax * dt;
      if (circle.x > width + circle.radius) circle.x = -circle.radius;
    }
  }

  /** Eased lane change + jump arc; the visual position follows the logical lane. */
  private updatePlayer(dt: number, dtMs: number): void {
    const targetY = this.laneCenterY(this.lane);
    this.laneY += (targetY - this.laneY) * Math.min(1, dt * 18);

    let jumpOffset = 0;
    if (this.jumpClock >= 0) {
      this.jumpClock += dtMs;
      const t = this.jumpClock / RUNNER.jumpMs;
      if (t >= 1) this.jumpClock = -1;
      else jumpOffset = Math.sin(t * Math.PI) * RUNNER.jumpHeight;
    }
    this.jumpOffset = jumpOffset;

    this.player.setPosition(this.player.x, this.laneY - jumpOffset);
    // Blink while invulnerable.
    this.player.setAlpha(
      this.invulnerableMs > 0 && Math.floor(this.invulnerableMs / 90) % 2 === 0 ? 0.35 : 1,
    );
  }

  private spawn(dtMs: number): void {
    this.obstacleTimer -= dtMs;
    if (this.obstacleTimer <= 0) {
      this.obstacleTimer = Phaser.Math.Between(...RUNNER.obstacleEveryMs);
      this.spawnObstacle();
    }
    this.bulletTimer -= dtMs;
    if (this.bulletTimer <= 0) {
      this.bulletTimer = Phaser.Math.Between(...RUNNER.bulletEveryMs);
      this.spawnBullet();
    }
  }

  private spawnObstacle(): void {
    const obstacle = this.obstacles.find((candidate) => !candidate.active);
    if (!obstacle) return;
    const isRock = Math.random() < 0.55;
    obstacle.active = true;
    obstacle.lane = Phaser.Math.Between(0, RUNNER.lanes - 1);
    obstacle.width = isRock ? 44 : 84;
    obstacle.rock.setVisible(isRock);
    obstacle.root.setVisible(!isRock);
    obstacle.view.setPosition(-60, this.laneCenterY(obstacle.lane)).setVisible(true);
  }

  private spawnBullet(): void {
    const bullet = this.bullets.find((candidate) => candidate.state === "idle");
    if (!bullet) return;
    bullet.state = "warning";
    bullet.lane = Phaser.Math.Between(0, RUNNER.lanes - 1);
    bullet.timer = RUNNER.bulletWarnMs;
    bullet.warning.setVisible(true);
  }

  private updateObstacles(dt: number, speed: number): void {
    const width = this.scale.width;
    const playerX = this.player.x;
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      const view = obstacle.view;
      view.x += speed * dt;
      view.y = this.laneCenterY(obstacle.lane);
      if (view.x > width + 100) {
        obstacle.active = false;
        view.setVisible(false);
        continue;
      }
      const sameLane = Math.abs(this.laneY - view.y) < this.laneGap * 0.4;
      const overlapsX = Math.abs(view.x - playerX) < (obstacle.width + PLAYER_SIZE) / 2;
      const cleared = this.jumpOffset > RUNNER.clearHeight;
      if (sameLane && overlapsX && !cleared) this.hit(() => (obstacle.active = false), view);
    }
  }

  private updateBullets(dt: number, dtMs: number): void {
    const width = this.scale.width;
    const playerX = this.player.x;
    for (const bullet of this.bullets) {
      if (bullet.state === "idle") continue;
      const y = this.laneCenterY(bullet.lane);
      if (bullet.state === "warning") {
        bullet.timer -= dtMs;
        // A thin red line across the lane, pulsing, tells where the shot will fly.
        bullet.warning.setPosition(width / 2, y).setSize(width, 6);
        bullet.warning.setAlpha(0.25 + 0.35 * Math.abs(Math.sin(bullet.timer / 70)));
        if (bullet.timer <= 0) {
          bullet.state = "flying";
          bullet.warning.setVisible(false);
          bullet.shot.setPosition(width + BULLET_LENGTH, y).setVisible(true);
          this.audio.thud();
        }
        continue;
      }
      bullet.shot.x -= RUNNER.bulletSpeed * dt;
      bullet.shot.y = y;
      if (bullet.shot.x < -BULLET_LENGTH) {
        bullet.state = "idle";
        bullet.shot.setVisible(false);
        continue;
      }
      const sameLane = Math.abs(this.laneY - y) < this.laneGap * 0.4;
      const overlapsX = Math.abs(bullet.shot.x - playerX) < (BULLET_LENGTH + PLAYER_SIZE) / 2;
      if (sameLane && overlapsX) {
        this.hit(() => {
          bullet.state = "idle";
          bullet.shot.setVisible(false);
        });
      }
    }
  }

  /** Take a hit (ignored while invulnerable); `consume` removes the thing that hit. */
  private hit(consume: () => void, source?: Phaser.GameObjects.Container): void {
    if (this.invulnerableMs > 0) return;
    consume();
    source?.setVisible(false);
    this.hearts -= 1;
    this.hits += 1;
    this.invulnerableMs = RUNNER.invulnerableMs;
    this.cameras.main.shake(180, 0.012);
    this.updateHearts();
  }

  private updateHearts(): void {
    this.heartsText.setText("♥".repeat(Math.max(0, this.hearts)).split("").join(" "));
  }

  // ----- ending -------------------------------------------------------------------------

  /** Gunshot, white flash, fade to black with captions and the sounds of the forest. */
  private startEnding(): void {
    if (this.state !== "running") return;
    this.state = "ending";
    sendToHost({ type: "chapter:phase", phase: "ending" });

    for (const obstacle of this.obstacles) obstacle.view.setVisible(false);
    for (const bullet of this.bullets) {
      bullet.state = "idle";
      bullet.warning.setVisible(false);
      bullet.shot.setVisible(false);
    }
    this.progressBack.setVisible(false);
    this.progressFill.setVisible(false);

    this.audio.gunshot();
    this.cameras.main.flash(200, 255, 255, 255);
    this.cameras.main.shake(450, 0.03);
    this.tweens.add({
      targets: this.blackout,
      alpha: 1,
      delay: BLACKOUT_DELAY_MS,
      duration: BLACKOUT_MS,
    });

    this.stopAmbience = this.audio.startAmbience();
    // Cuckoo calls drifting in from far away, getting fainter.
    this.time.delayedCall(1500, () => this.audio.cuckoo(0.14));
    this.time.delayedCall(4200, () => this.audio.cuckoo(0.09));
    this.time.delayedCall(7000, () => this.audio.cuckoo(0.05));

    for (const { atMs, text } of ENDING_CAPTIONS) {
      this.time.delayedCall(atMs, () => this.showCaption(text));
    }
    this.time.delayedCall(ENDING_TOTAL_MS, () => this.finish());
  }

  private showCaption(text: string): void {
    this.caption.setText(text);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 600, yoyo: true, hold: 1600 });
  }

  private finish(): void {
    if (this.state !== "ending") return;
    this.state = "finished";
    sendToHost({
      type: "chapter:complete",
      outcome: {
        lettersCollected: this.lettersCollected,
        survivedSeconds: Math.round(Math.min(this.elapsedMs, RUNNER.durationMs) / 100) / 10,
        hits: this.hits,
      },
    });
  }
}
