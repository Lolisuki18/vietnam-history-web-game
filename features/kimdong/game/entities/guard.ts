import { isPointInCone, rotateToward, type Point } from "@/lib/engine";
import type Phaser from "phaser";

import { soldierAnim, type SoldierAnimKey } from "../assets/animations";
import {
  ASSET_KEYS,
  EMOTE_SHEET,
  LOGICAL_FRAME,
  SOLDIER_SHEET,
  SPRITE_ORIGIN,
  type SoldierTexture,
} from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";
import { GUARD } from "../config";
import type { GuardRoute } from "../world-data";

type GuardState = "patrol" | "investigate" | "watching";
type InvestigatePhase = "moving" | "inspecting";

interface ConeStyle {
  color: number;
  alpha: number;
}

const CONE_STYLES: Record<GuardState, ConeStyle> = {
  patrol: { color: 0xfff3a0, alpha: 0.2 },
  investigate: { color: 0xffb347, alpha: 0.26 },
  watching: { color: 0xff3b3b, alpha: 0.34 },
};

const CONE_STEPS = 10;
const ARRIVE_DISTANCE = 8;
const INSPECT_SWEEP_AMPLITUDE = 0.7;
const INSPECT_SWEEP_SPEED = 3;

/**
 * An enemy soldier. Patrols a route, goes to check noises (pebbles) and stares at the
 * player when spotted. The vision cone is drawn once and only rotated afterwards, and
 * `update` allocates nothing.
 */
export class Guard {
  x: number;
  y: number;
  facing = 0;

  private state: GuardState = "patrol";
  private investigatePhase: InvestigatePhase = "moving";
  private waypoint = 0;
  private direction = 1;
  private readonly target: Point = { x: 0, y: 0 };
  private watchAngle = 0;
  /** Remaining ms for `watching` / `inspecting`. */
  private timer = 0;
  private inspectClock = 0;
  private inspectBaseAngle = 0;

  private readonly container: Phaser.GameObjects.Container;
  private readonly cone: Phaser.GameObjects.Graphics;
  private readonly sprite: Phaser.GameObjects.Sprite;
  /** Speech-bubble emote above the head ("?" suspicious, "!" spotted); text when no art loaded. */
  private readonly icon: Phaser.GameObjects.Text;
  private readonly emote?: Phaser.GameObjects.Sprite;
  /** The guard moved during this update (drives the walking animation). */
  private moving = false;
  private lookingLeft = true;
  private animKey: SoldierAnimKey | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly route: GuardRoute,
    /** Which soldier sheet this guard uses (French soldier or "lính khố xanh"). */
    private readonly texture: SoldierTexture = ASSET_KEYS.soldier,
  ) {
    const start = route.path[0]!;
    this.x = start.x;
    this.y = start.y;

    // The container sits on the guard's logical position (the feet); the sprite's origin is at
    // its feet too, so the cone, the sprite and all hit tests share the same centre.
    this.cone = scene.add.graphics();
    this.sprite = fitToWorld(
      scene.add
        .sprite(0, 0, this.texture, SOLDIER_SHEET.rows.left * SOLDIER_SHEET.columns)
        .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y),
    );
    const bubbleY = -LOGICAL_FRAME.height * SPRITE_ORIGIN.y - 18;
    this.icon = scene.add
      .text(0, bubbleY, "", {
        fontFamily: "sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [this.cone, this.sprite];
    if (
      scene.textures.exists(ASSET_KEYS.emotes) &&
      scene.textures.get(ASSET_KEYS.emotes).frameTotal > 2
    ) {
      this.emote = scene.add
        .sprite(0, bubbleY, ASSET_KEYS.emotes, EMOTE_SHEET.frames.question)
        .setDisplaySize(26, 26)
        .setVisible(false);
      parts.push(this.emote);
    } else {
      parts.push(this.icon);
    }
    this.container = scene.add.container(this.x, this.y, parts).setDepth(15);

    this.reset();
  }

  /** Put the guard back on its route start in the patrol state. */
  reset(): void {
    const start = this.route.path[0]!;
    this.x = start.x;
    this.y = start.y;
    this.direction = this.route.reverse ? -1 : 1;
    this.waypoint = this.route.reverse ? this.route.path.length - 1 : 1 % this.route.path.length;
    const first = this.route.path[this.waypoint]!;
    this.facing = Math.atan2(first.y - this.y, first.x - this.x);
    this.enterState("patrol");
    this.syncVisuals();
  }

  /** True when the point is inside the guard's cone of vision. */
  canSee(px: number, py: number): boolean {
    return isPointInCone(px, py, this.x, this.y, this.facing, GUARD.coneHalfAngle, GUARD.coneRange);
  }

  /** The player is in view: stop and stare. Call every frame the player is visible. */
  noteSighting(px: number, py: number): void {
    this.watchAngle = Math.atan2(py - this.y, px - this.x);
    this.timer = GUARD.watchMs;
    if (this.state !== "watching") this.enterState("watching");
  }

  /** A noise at (x, y): go and check it out, unless busy staring at the player. */
  hearNoise(x: number, y: number): void {
    if (this.state === "watching") return;
    if (Math.hypot(x - this.x, y - this.y) > GUARD.hearingRadius) return;
    this.target.x = x;
    this.target.y = y;
    this.investigatePhase = "moving";
    this.enterState("investigate");
  }

  update(dt: number): void {
    this.moving = false;
    switch (this.state) {
      case "patrol":
        this.updatePatrol(dt);
        break;
      case "investigate":
        this.updateInvestigate(dt);
        break;
      case "watching":
        this.updateWatching(dt);
        break;
    }
    this.syncVisuals();
  }

  private updatePatrol(dt: number): void {
    const next = this.route.path[this.waypoint]!;
    if (this.moveToward(next.x, next.y, GUARD.speed, dt)) this.advanceWaypoint();
  }

  private updateInvestigate(dt: number): void {
    if (this.investigatePhase === "moving") {
      if (this.moveToward(this.target.x, this.target.y, GUARD.investigateSpeed, dt)) {
        this.investigatePhase = "inspecting";
        this.timer = GUARD.investigateMs;
        this.inspectClock = 0;
        this.inspectBaseAngle = this.facing;
      }
      return;
    }
    // Inspecting: sweep the cone left and right, then go back to patrolling.
    this.timer -= dt * 1000;
    this.inspectClock += dt;
    this.facing =
      this.inspectBaseAngle +
      Math.sin(this.inspectClock * INSPECT_SWEEP_SPEED) * INSPECT_SWEEP_AMPLITUDE;
    if (this.timer <= 0) this.resumePatrol();
  }

  private updateWatching(dt: number): void {
    this.facing = rotateToward(this.facing, this.watchAngle, GUARD.turnRate * 1.5 * dt);
    this.timer -= dt * 1000;
    if (this.timer <= 0) this.resumePatrol();
  }

  /** Move toward a point; returns true once it is reached. */
  private moveToward(tx: number, ty: number, speed: number, dt: number): boolean {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= ARRIVE_DISTANCE) return true;
    this.facing = rotateToward(this.facing, Math.atan2(dy, dx), GUARD.turnRate * dt);
    const step = Math.min(speed * dt, distance);
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
    this.moving = true;
    return false;
  }

  private advanceWaypoint(): void {
    const count = this.route.path.length;
    if (this.route.loop) {
      this.waypoint = (this.waypoint + this.direction + count) % count;
      return;
    }
    if (this.waypoint + this.direction < 0 || this.waypoint + this.direction >= count) {
      this.direction = -this.direction;
    }
    this.waypoint += this.direction;
  }

  /** Continue the route from the waypoint closest to where the guard stands now. */
  private resumePatrol(): void {
    let best = 0;
    let bestDistance = Infinity;
    this.route.path.forEach((point, index) => {
      const distance = Math.hypot(point.x - this.x, point.y - this.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    this.waypoint = best;
    this.enterState("patrol");
  }

  private enterState(state: GuardState): void {
    this.state = state;
    this.drawCone(CONE_STYLES[state]);
    this.icon.setText(state === "watching" ? "!" : state === "investigate" ? "?" : "");
    this.icon.setColor(state === "watching" ? "#ff5252" : "#ffd54f");
    if (this.emote) {
      this.emote.setVisible(state !== "patrol");
      this.emote.setFrame(
        state === "watching" ? EMOTE_SHEET.frames.alert : EMOTE_SHEET.frames.question,
      );
    }
  }

  private drawCone({ color, alpha }: ConeStyle): void {
    const range = GUARD.coneRange;
    const half = GUARD.coneHalfAngle;
    this.cone.clear();
    this.cone.fillStyle(color, alpha);
    this.cone.lineStyle(2, color, Math.min(1, alpha + 0.25));
    this.cone.beginPath();
    this.cone.moveTo(0, 0);
    for (let i = 0; i <= CONE_STEPS; i++) {
      const angle = -half + (2 * half * i) / CONE_STEPS;
      this.cone.lineTo(Math.cos(angle) * range, Math.sin(angle) * range);
    }
    this.cone.closePath();
    this.cone.fillPath();
    this.cone.strokePath();
  }

  private syncVisuals(): void {
    this.container.setPosition(this.x, this.y);
    this.cone.setRotation(this.facing);
    this.updateAnimation();
  }

  /** Walk left or right depending on where the guard looks; stand still on the first frame. */
  private updateAnimation(): void {
    const horizontal = Math.cos(this.facing);
    // Dead zone so a guard walking straight up/down does not flicker between the two sheets.
    if (Math.abs(horizontal) > 0.2) this.lookingLeft = horizontal < 0;
    const key: SoldierAnimKey = soldierAnim(this.texture, this.lookingLeft ? "left" : "right");

    if (this.moving) {
      if (key !== this.animKey || !this.sprite.anims.isPlaying) {
        this.animKey = key;
        this.sprite.anims.play(key, true);
      }
    } else if (this.animKey !== null || this.sprite.anims.isPlaying) {
      this.animKey = null;
      this.sprite.anims.stop();
    }
    if (!this.moving) {
      const row = this.lookingLeft ? SOLDIER_SHEET.rows.left : SOLDIER_SHEET.rows.right;
      this.sprite.setFrame(row * SOLDIER_SHEET.columns);
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
