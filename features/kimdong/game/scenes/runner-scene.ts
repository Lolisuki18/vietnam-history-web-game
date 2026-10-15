import Phaser from "phaser";

import { BIRD_ANIM, FALL_ANIM, runAnim, soldierAnim } from "../assets/animations";
import {
  ASSET_KEYS,
  ROCK_KEYS,
  SOLDIER_TEXTURES,
  SPRITE_ORIGIN,
  TRACER_FRAME,
} from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";
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
  /** The artist's rock / root pictures, or plain shapes when they did not load. */
  rock: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  root: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  active: boolean;
  lane: number;
  /** Collision width. */
  width: number;
}

interface Bullet {
  warning: Phaser.GameObjects.Rectangle;
  shot: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
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

/** Ranks of chasers behind each other, their size, spacing (px) and how much they close in per hit. */
const CHASER_COLUMNS = 3;
const CHASER_SCALE = 1.3;
const CHASER_SPACING = 66;
const CHASER_CLOSE_PER_HIT = 40;
/** Each rank is a little higher or lower in its lane, so the pack is not a grid. */
const CHASER_ROW_SHIFT = [-8, 8, 0] as const;
/** Which direction each row of `soldier_running.png` is drawn: true = faces right, false = left. */
const RUNNING_SHEET_FACES_RIGHT: readonly boolean[] = [true, false];
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

  private player!: Phaser.GameObjects.Sprite;
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
  private readonly chasers: Phaser.GameObjects.Sprite[] = [];
  private readonly chaserSpecs: { lane: number; col: number; phase: number }[] = [];
  /** How far (px) the squad has closed in on Kim Đồng, eased toward `hits x CHASER_CLOSE_PER_HIT`. */
  private closing = 0;
  private stopAmbience?: () => void;
  private stopRunnerMusic?: () => void;
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
    this.chaserSpecs.length = 0;
    this.closing = 0;
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
      () => this.stopRunnerMusic?.(),
      () => gameEvents.emit("controls:active", false),
    );
    // The chase has its own driving music, until the gunshot of the ending.
    this.stopRunnerMusic = this.audio.playRunnerBGM();
    if (process.env.NODE_ENV !== "production") {
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
    // The squad closes in a little with every hit Kim Đồng takes.
    this.closing += (this.hits * CHASER_CLOSE_PER_HIT - this.closing) * Math.min(1, dt * 4);
    this.placeChasers();
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
    this.placeChasers();

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

  /**
   * The squad chasing from the right: `CHASER_COLUMNS` ranks of one soldier per lane, staggered, so
   * it looks like a pack and not three men. The running sheet (rows: 0 and 1, two coats) is drawn
   * facing right and mirrored; the old walking sheets are the fallback.
   */
  private createChasers(): void {
    const running = this.textures.exists(ASSET_KEYS.soldierRunning);
    for (let i = 0; i < RUNNER.lanes * CHASER_COLUMNS; i++) {
      const lane = i % RUNNER.lanes;
      const col = Math.floor(i / RUNNER.lanes);
      const row = (lane + col) % 2;
      let chaser: Phaser.GameObjects.Sprite;
      if (running) {
        // Row 0 of the sheet runs to the right (mirror it); row 1 already runs to the left.
        chaser = this.add
          .sprite(0, 0, ASSET_KEYS.soldierRunning, row * 6)
          .setFlipX(RUNNING_SHEET_FACES_RIGHT[row] === true);
        // Each starts at another point of the stride so they do not run in step.
        chaser.anims.play({ key: runAnim(row), startFrame: Math.floor(Math.random() * 6) });
      } else {
        const texture = SOLDIER_TEXTURES[row % SOLDIER_TEXTURES.length]!;
        chaser = this.add.sprite(0, 0, texture, 0);
        chaser.anims.play(soldierAnim(texture, "left"));
      }
      chaser.setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y).setDepth(6 - col * 0.1);
      fitToWorld(chaser);
      chaser.setScale(chaser.scaleX * CHASER_SCALE, chaser.scaleY * CHASER_SCALE);
      this.chasers.push(chaser);
      this.chaserSpecs.push({ lane, col, phase: Math.random() * Math.PI * 2 });
    }
  }

  /** Where chaser `index` runs now: its rank behind the front, a little sway, and closer after hits. */
  private placeChasers(): void {
    const { width } = this.scale;
    this.chasers.forEach((chaser, index) => {
      const spec = this.chaserSpecs[index]!;
      const sway = Math.sin(this.elapsedMs / 230 + spec.phase) * 7;
      const baseX = width - 30 - spec.col * CHASER_SPACING - (spec.lane % 2) * 16;
      chaser.x = baseX + sway - this.closing;
      chaser.y =
        this.laneCenterY(spec.lane) + CHASER_ROW_SHIFT[spec.col % CHASER_ROW_SHIFT.length]!;
    });
  }
  private createPools(): void {
    const rockKey = ROCK_KEYS.find((key) => this.textures.exists(key));
    const hasRoots = this.textures.exists(ASSET_KEYS.rootObstacle);
    for (let i = 0; i < OBSTACLE_POOL; i++) {
      let rock: Obstacle["rock"];
      if (rockKey) {
        const picture = this.add.image(0, 4, rockKey);
        picture.setScale(62 / picture.width);
        rock = picture;
      } else {
        rock = this.add.circle(0, 0, 22, 0x78716c).setStrokeStyle(3, 0x292524);
      }
      const root = hasRoots
        ? this.add.sprite(0, 0, ASSET_KEYS.rootObstacle, 0).setDisplaySize(100, 67)
        : this.add.rectangle(0, 0, 84, 18, 0x5b3a1e).setStrokeStyle(3, 0x2a1a0c);
      const view = this.add.container(0, 0, [rock, root]).setDepth(5).setVisible(false);
      this.obstacles.push({ view, rock, root, active: false, lane: 0, width: 44 });
    }
    for (let i = 0; i < BULLET_POOL; i++) {
      const warning = this.add.rectangle(0, 0, 10, 6, 0xff3b3b, 0.5).setDepth(4).setVisible(false);
      // The artist's tracer picture (head to the right) flies to the left: mirrored.
      let shot: Bullet["shot"];
      if (this.textures.exists(ASSET_KEYS.bulletTracer)) {
        // Frame 0 of the sheet is the tracer (frame 1 is a hit spark); it is drawn in a 64 px
        // frame but is only TRACER_FRAME.length long, so scale by that.
        const scale = BULLET_LENGTH / TRACER_FRAME.length;
        shot = this.add
          .image(0, 0, ASSET_KEYS.bulletTracer, 0)
          .setScale(scale)
          .setFlipX(true)
          .setDepth(7)
          .setVisible(false);
      } else {
        shot = this.add.rectangle(0, 0, BULLET_LENGTH, 6, 0xff5252).setDepth(7).setVisible(false);
      }
      this.bullets.push({ warning, shot, state: "idle", lane: 0, timer: 0 });
    }
  }

  private createPlayer(): void {
    // Same sprite and origin as in the exploration scene: x / y are the feet.
    this.player = fitToWorld(
      this.add
        .sprite(0, 0, ASSET_KEYS.kimdong, 0)
        .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y)
        .setDepth(10),
    );
    // The run cycle is drawn facing right; the runner flees to the left.
    this.player.setFlipX(true);
    this.player.anims.play("run");
  }

  /** Run on the ground, play the jump pose while in the air. */
  private updatePlayerAnimation(airborne: boolean): void {
    const key = airborne ? "jump" : "run";
    if (this.player.anims.currentAnim?.key !== key) this.player.anims.play(key, true);
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
    this.updatePlayerAnimation(jumpOffset > 1);
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
    if ("setFrame" in obstacle.root) obstacle.root.setFrame(Math.random() < 0.5 ? 0 : 1);
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
    // Kim Đồng goes down (the artist's fall frames), else he just stops running.
    if (this.anims.exists(FALL_ANIM)) this.player.anims.play(FALL_ANIM);
    else this.player.anims.stop();
    this.time.delayedCall(1200, () => this.flyBirdAcross());
    this.stopRunnerMusic?.();
    this.stopRunnerMusic = undefined;

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

  /** A cuckoo (chim tu hú) flies across the sky while its call drifts in. */
  private flyBirdAcross(): void {
    if (!this.textures.exists(ASSET_KEYS.tuHuBird)) return;
    const { width, height } = this.scale;
    const bird = this.add
      .sprite(-50, height * 0.24, ASSET_KEYS.tuHuBird, 0)
      .setDisplaySize(64, 64)
      .setDepth(96);
    if (this.anims.exists(BIRD_ANIM)) bird.anims.play(BIRD_ANIM);
    this.tweens.add({
      targets: bird,
      x: width + 60,
      y: height * 0.3,
      duration: 4200,
      ease: "Sine.easeInOut",
      onComplete: () => bird.destroy(),
    });
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
