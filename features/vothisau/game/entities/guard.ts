import type Phaser from "phaser";

import { isPointInCone, rotateToward, type Point } from "@/lib/engine";

import { fallAnim, soldierAnim } from "../assets/animations";
import {
  DOWN_COLUMNS,
  DOWN_FRAMES,
  DOWN_SHEETS,
  EMOTE_SHEET,
  LOGICAL_FRAME,
  SOLDIER_SHEET,
  SPRITE_ORIGIN,
} from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";
import { GUARD } from "../config";
import { hasClearLine, rayDistance, slideMove } from "../systems/motion";
import type { GuardRoute, Rect } from "../world-data";

export type GuardState = "patrol" | "investigate" | "watching" | "chase" | "stunned" | "down";
type InvestigatePhase = "moving" | "inspecting";

interface ConeStyle {
  color: number;
  alpha: number;
}

/** Yellow while on patrol, orange when suspicious, red when the player is seen (the design's colours). */
const CONE_STYLES: Record<"patrol" | "investigate" | "watching" | "chase", ConeStyle> = {
  patrol: { color: 0xfff3a0, alpha: 0.22 },
  investigate: { color: 0xffb347, alpha: 0.28 },
  watching: { color: 0xff3b3b, alpha: 0.36 },
  // A running soldier's beam is only a hint: the whole screen would be red otherwise.
  chase: { color: 0xff3b3b, alpha: 0.14 },
};

const CONE_STEPS = 14;
const ARRIVE_DISTANCE = 8;
const INSPECT_SWEEP_AMPLITUDE = 0.7;
const INSPECT_SWEEP_SPEED = 3;
const CONE_DEPTH = 5200;

export type GuardEvent = "alert" | "question";

/**
 * An enemy soldier. It patrols a route (or stands and looks around), goes to check noises, stares
 * at the player when it sees them, and in the escape it runs them down. The vision cone is a
 * flashlight beam: it is clipped by walls, stalls and trees (a cheap ray cast), and the player is
 * only seen when the line to them is clear too.
 */
export class Guard {
  x: number;
  y: number;
  facing = 0;
  /** The guard ignores the player (the gate guards, after the player was waved through). */
  blind = false;
  /** 1 = normal sight; above 1 after a wrong answer at the checkpoint (the net tightens). */
  coneScale = 1;
  state: GuardState = "patrol";

  private investigatePhase: InvestigatePhase = "moving";
  private waypoint = 0;
  private direction = 1;
  private readonly target: Point = { x: 0, y: 0 };
  private watchAngle = 0;
  /** Remaining ms for `watching`, `inspecting`, `stunned`. */
  private timer = 0;
  private inspectClock = 0;
  private inspectBaseAngle = 0;
  private scanIndex = 0;
  private scanTimer = 0;
  private stunThenChase = false;
  private moving = false;
  private lookingLeft = true;
  private animKey: string | null = null;

  private readonly cone: Phaser.GameObjects.Graphics;
  private readonly container: Phaser.GameObjects.Container;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly icon: Phaser.GameObjects.Text;
  private readonly emote?: Phaser.GameObjects.Sprite;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly route: GuardRoute,
    private readonly blockers: readonly Rect[],
    private readonly onEvent?: (event: GuardEvent, guard: Guard) => void,
  ) {
    const start = route.path[0]!;
    this.x = start.x;
    this.y = start.y;
    this.cone = scene.add.graphics().setDepth(CONE_DEPTH);

    this.sprite = fitToWorld(
      scene.add
        .sprite(0, 0, route.texture, SOLDIER_SHEET.rows.left * SOLDIER_SHEET.columns)
        .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y),
    );
    const bubbleY = -LOGICAL_FRAME.height * SPRITE_ORIGIN.y - 18;
    this.icon = scene.add
      .text(0, bubbleY, "", { fontFamily: "sans-serif", fontSize: "22px", fontStyle: "bold" })
      .setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [this.sprite];
    if (
      scene.textures.exists(EMOTE_SHEET.key) &&
      scene.textures.get(EMOTE_SHEET.key).frameTotal > 2
    ) {
      this.emote = scene.add
        .sprite(0, bubbleY, EMOTE_SHEET.key, EMOTE_SHEET.frames.question)
        .setDisplaySize(26, 26)
        .setVisible(false);
      parts.push(this.emote);
    } else {
      parts.push(this.icon);
    }
    this.container = scene.add.container(this.x, this.y, parts).setDepth(this.y);
    this.reset();
  }

  /** Where speech bubbles stand: above the head and the emote. */
  get head(): Point {
    return { x: this.x, y: this.y - LOGICAL_FRAME.height * SPRITE_ORIGIN.y - 40 };
  }

  get isActive(): boolean {
    return this.state !== "stunned" && this.state !== "down";
  }

  /** Put the guard back on its route start in the patrol state. */
  reset(): void {
    const start = this.route.path[0]!;
    this.x = start.x;
    this.y = start.y;
    this.direction = this.route.reverse ? -1 : 1;
    this.waypoint = this.route.reverse ? this.route.path.length - 1 : 1 % this.route.path.length;
    this.scanIndex = 0;
    this.scanTimer = this.route.scan?.dwellMs[0] ?? 0;
    if (this.route.scan) {
      this.facing = this.route.scan.angles[0];
    } else {
      const first = this.route.path[this.waypoint]!;
      this.facing = Math.atan2(first.y - this.y, first.x - this.x);
    }
    this.sprite.setAngle(0).setAlpha(1);
    this.restoreWalkSheet();
    this.enterState("patrol");
    this.syncVisuals();
  }

  /** True when the guard can see (px, py): inside the cone, and nothing in between. */
  sees(px: number, py: number): boolean {
    if (this.blind || !this.isActive || this.state === "chase") return false;
    const range = GUARD.coneRange * this.coneScale;
    if (!isPointInCone(px, py, this.x, this.y, this.facing, GUARD.coneHalfAngle, range))
      return false;
    return hasClearLine(this.x, this.y, px, py, this.blockers);
  }

  /** The player is in view: stop and stare. Call every frame the player is seen. */
  noteSighting(px: number, py: number): void {
    if (!this.isActive || this.state === "chase") return;
    this.watchAngle = Math.atan2(py - this.y, px - this.x);
    this.timer = GUARD.watchMs;
    if (this.state !== "watching") this.enterState("watching");
  }

  /** A noise at (x, y): go and check it out, unless busy staring or running. */
  hearNoise(x: number, y: number, radius: number = GUARD.hearingRadius): void {
    if (this.blind || (this.state !== "patrol" && this.state !== "investigate")) return;
    if (Math.hypot(x - this.x, y - this.y) > radius) return;
    this.target.x = x;
    this.target.y = y;
    this.investigatePhase = "moving";
    this.enterState("investigate");
  }

  /** Run the player down (the escape). A stunned guard starts as soon as it has recovered. */
  beginChase(): void {
    if (this.state === "down") return;
    if (this.state === "stunned") {
      this.stunThenChase = true;
      return;
    }
    this.enterState("chase");
  }

  /** Knocked silly by the blast. */
  stun(ms: number, thenChase: boolean): void {
    if (this.state === "down") return;
    this.timer = ms;
    this.stunThenChase = thenChase;
    this.enterState("stunned");
    // Staggering: the first frame of the fall, when the artwork exists.
    const down = this.downArt();
    if (down) this.showDownFrame(down.key, down.row * DOWN_COLUMNS + DOWN_FRAMES.stagger);
  }

  /** Dead or out cold: lies on the ground and plays no part any more. */
  fall(): void {
    this.enterState("down");
    const down = this.downArt();
    if (down && this.scene.anims.exists(fallAnim(this.route.texture))) {
      // Stagger, fall, lie down: the drawn animation, held on its last frame.
      this.showDownFrame(down.key, down.row * DOWN_COLUMNS + DOWN_FRAMES.stagger);
      this.sprite.anims.play(fallAnim(this.route.texture));
      return;
    }
    // No artwork yet: lie on the side.
    this.sprite.setAngle(90).setAlpha(0.85);
    this.sprite.anims.stop();
  }

  /** The sheet and row of this soldier's fall, if its picture has been loaded. */
  private downArt(): { key: string; row: number } | null {
    const art = DOWN_SHEETS[this.route.texture];
    return this.scene.textures.exists(art.key) ? art : null;
  }

  /** Show a frame of a fall sheet (drawn facing right: mirrored when the soldier looks left). */
  private showDownFrame(key: string, frame: number): void {
    this.sprite.anims.stop();
    this.sprite.setTexture(key, frame);
    this.sprite.setFlipX(this.lookingLeft);
  }

  /** Back to the walking sheet after a stagger (or a restart). */
  private restoreWalkSheet(): void {
    if (this.sprite.texture.key === this.route.texture) return;
    this.sprite.setTexture(this.route.texture, SOLDIER_SHEET.rows.left * SOLDIER_SHEET.columns);
    this.sprite.setFlipX(false);
  }

  /** Look toward a point (used for the guard's shout or a stare). */
  face(px: number, py: number): void {
    this.facing = Math.atan2(py - this.y, px - this.x);
  }

  update(dt: number, player: Point, chaseSpeedFactor: number = GUARD.chaseSpeedFactor): void {
    this.moving = false;
    switch (this.state) {
      case "patrol":
        if (this.route.scan) this.updateScan(dt);
        else this.updatePatrol(dt);
        break;
      case "investigate":
        this.updateInvestigate(dt);
        break;
      case "watching":
        this.updateWatching(dt);
        break;
      case "chase":
        this.updateChase(dt, player, chaseSpeedFactor);
        break;
      case "stunned":
        this.timer -= dt * 1000;
        if (this.timer <= 0) {
          if (this.stunThenChase) this.enterState("chase");
          else this.resumePatrol();
        }
        break;
      case "down":
        break;
    }
    this.syncVisuals();
  }

  destroy(): void {
    this.cone.destroy();
    this.container.destroy();
  }

  private updatePatrol(dt: number): void {
    const next = this.route.path[this.waypoint]!;
    if (this.moveToward(next.x, next.y, GUARD.speed, dt)) this.advanceWaypoint();
  }

  /** Stand on the post and look one way, then the other. */
  private updateScan(dt: number): void {
    const scan = this.route.scan!;
    const post = this.route.path[0]!;
    // After a detour (a noise), walk back to the post first.
    if (Math.hypot(post.x - this.x, post.y - this.y) > ARRIVE_DISTANCE) {
      this.moveToward(post.x, post.y, GUARD.speed, dt);
      return;
    }
    this.facing = rotateToward(
      this.facing,
      scan.angles[this.scanIndex]!,
      GUARD.turnRate * 0.8 * dt,
    );
    this.scanTimer -= dt * 1000;
    if (this.scanTimer <= 0) {
      this.scanIndex = 1 - this.scanIndex;
      this.scanTimer = scan.dwellMs[this.scanIndex]!;
    }
  }

  private updateInvestigate(dt: number): void {
    if (this.investigatePhase === "moving") {
      if (this.moveToward(this.target.x, this.target.y, GUARD.investigateSpeed, dt)) {
        this.investigatePhase = "inspecting";
        this.emote?.setFrame(EMOTE_SHEET.frames.dots);
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

  private updateChase(dt: number, player: Point, factor: number): void {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.facing = rotateToward(this.facing, Math.atan2(dy, dx), GUARD.turnRate * 3 * dt);
    if (distance < 1) return;
    const step = GUARD.speed * factor * dt;
    const pos = { x: this.x, y: this.y };
    slideMove(
      pos,
      (dx / distance) * step,
      (dy / distance) * step,
      GUARD.bodyRadius,
      this.blockers,
      player,
    );
    this.moving = Math.hypot(pos.x - this.x, pos.y - this.y) > 0.01;
    this.x = pos.x;
    this.y = pos.y;
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
    const previous = this.state;
    this.state = state;
    if (previous === "stunned" && state !== "down") this.restoreWalkSheet();
    if (state !== previous) {
      if (state === "watching") this.onEvent?.("alert", this);
      else if (state === "investigate") this.onEvent?.("question", this);
    }
    const shown = state === "watching" || state === "chase";
    this.icon.setText(shown ? "!" : state === "investigate" ? "?" : "");
    this.icon.setColor(shown ? "#ff5252" : "#ffd54f");
    if (this.emote) {
      this.emote.setVisible(state === "watching" || state === "chase" || state === "investigate");
      this.emote.setFrame(shown ? EMOTE_SHEET.frames.alert : EMOTE_SHEET.frames.question);
    }
  }

  private coneStyle(): ConeStyle | null {
    switch (this.state) {
      case "patrol":
        return CONE_STYLES.patrol;
      case "investigate":
        return CONE_STYLES.investigate;
      case "watching":
        return CONE_STYLES.watching;
      case "chase":
        return CONE_STYLES.chase;
      default:
        return null;
    }
  }

  /** The beam, clipped by whatever is in the way. */
  private drawCone(): void {
    this.cone.clear();
    const style = this.coneStyle();
    if (!style || this.blind) return;
    const range = GUARD.coneRange * this.coneScale;
    const half = GUARD.coneHalfAngle;
    this.cone.fillStyle(style.color, style.alpha);
    this.cone.lineStyle(2, style.color, Math.min(1, style.alpha + 0.25));
    this.cone.beginPath();
    this.cone.moveTo(this.x, this.y);
    for (let i = 0; i <= CONE_STEPS; i++) {
      const angle = this.facing - half + (2 * half * i) / CONE_STEPS;
      const length = rayDistance(this.x, this.y, angle, range, this.blockers);
      this.cone.lineTo(this.x + Math.cos(angle) * length, this.y + Math.sin(angle) * length);
    }
    this.cone.closePath();
    this.cone.fillPath();
    this.cone.strokePath();
  }

  private syncVisuals(): void {
    this.container
      .setPosition(this.x, this.y)
      .setDepth(this.state === "down" ? this.y - 1 : this.y);
    this.drawCone();
    this.updateAnimation();
  }

  /** Walk left or right depending on where the guard looks; stand on the first frame when still. */
  private updateAnimation(): void {
    if (this.state === "down") return;
    if (this.state === "stunned" && this.sprite.texture.key !== this.route.texture) return;
    const horizontal = Math.cos(this.facing);
    // Dead zone so a guard walking straight up / down does not flicker between the two rows.
    if (Math.abs(horizontal) > 0.2) this.lookingLeft = horizontal < 0;
    const key = soldierAnim(this.route.texture, this.lookingLeft ? "left" : "right");

    if (this.moving) {
      // Keep the feet in step with the ground: faster while hurrying.
      this.sprite.anims.timeScale =
        this.state === "chase"
          ? GUARD.chaseSpeedFactor
          : this.state === "investigate"
            ? GUARD.investigateSpeed / GUARD.speed
            : 1;
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
}
