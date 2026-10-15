import Phaser from "phaser";

import { createChapterProgress, segmentIntersectsRect } from "@/lib/engine";

import { SOLDIER_TEXTURES } from "../assets/manifest";
import { GameAudio } from "../audio";
import { ALERT, CLIMAX, PEBBLE, PLAYER } from "../config";
import { plugDebugHandlers } from "../debug";
import { DucThanh } from "../entities/duc-thanh";
import { Guard } from "../entities/guard";
import { LetterPickup } from "../entities/letter-pickup";
import { Player } from "../entities/player";
import { Squad } from "../entities/squad";
import { gameEvents, hostEvents } from "../events";
import { sendToHost } from "../host-bridge";
import { touchInput } from "../input-state";
import { AlertMeter } from "../systems/alert-meter";
import { OxygenMeter } from "../systems/oxygen-meter";
import { PebbleThrower } from "../systems/pebble";
import {
  createBushes,
  createOutpostFence,
  createProps,
  createWorld,
} from "../systems/world-renderer";
import { isInBush, isInWater } from "../systems/zones";
import { KIMDONG_ID, type DialogueId } from "../../types";
import {
  GUARD_ROUTES,
  LETTER_SPOTS,
  OUTPOST_GATE,
  OUTPOST_WALLS,
  PLAYER_START,
  TREE,
  VIEW,
  WORLD,
  type Rect,
} from "../world-data";

type SceneState =
  "waiting" | "intro" | "explore" | "rhythm" | "climax" | "ambush" | "caught" | "finished";

const MIN_ZOOM = 0.5;

/** Time between the last letter and the ambush event, so its toast can be read. */
const CLIMAX_DELAY_MS = 3000;
/** How long the camera keeps shaking once the stone has landed. */
const AMBUSH_SHAKE_MS = 1100;

interface SceneData {
  /** Skip the "waiting for host:start" step (used when the host restarts the chapter). */
  autostart?: boolean;
}

type MovementKeys = Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;

/** Main exploration scene: Kim Đồng sneaks through the Cao Bằng forest. */
export class StealthScene extends Phaser.Scene {
  private player!: Player;
  private guards: Guard[] = [];
  private letters: LetterPickup[] = [];
  private collected = 0;
  private alert = new AlertMeter();
  private oxygen!: OxygenMeter;
  private thrower!: PebbleThrower;
  private solids: Phaser.GameObjects.Rectangle[] = [];
  private gate!: Phaser.GameObjects.Rectangle;
  private audio!: GameAudio;
  /** Stop functions of the looping music: the calm forest theme and the tense one. */
  private stopMusic?: () => void;
  private stopTension?: () => void;
  /** Seconds until the next footstep / splash sound. */
  private stepTimer = 0;
  private wasSwimming = false;
  private squad!: Squad;
  private ducThanh!: DucThanh;
  /** Pulsing ring + label that tell the player where the old tree is, until it has been used. */
  private treeHint: Phaser.GameObjects.GameObject[] = [];
  private rhythmDone = false;
  /** Number and a sample of the solid props (reported by the dev-only `debugStats`). */
  private blockerCount = 0;
  private blockerSample: number[][] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: MovementKeys;
  private state: SceneState = "waiting";
  private autostart = false;
  /** Last position on dry land: where the player is put back after running out of air. */
  private readonly lastDry = { x: PLAYER_START.x, y: PLAYER_START.y };
  private readonly pointerWorld = new Phaser.Math.Vector2();
  /** Unit vector of the last movement direction (where a touch-thrown pebble goes). */
  private readonly facing = { x: 1, y: 0 };
  private controlsActive = false;
  /** This frame's movement input (axes, before speed) – drives the walking animation. */
  private readonly moveInput = { x: 0, y: 0 };
  /** Dev-only virtual keys driven by `debugHold` (always false in production). */
  private readonly debugInput = { left: false, right: false, up: false, down: false };
  /** Teardown callbacks (listeners, timers) run once when the scene shuts down. */
  private readonly cleanups: Array<() => void> = [];

  constructor() {
    super("stealth");
  }

  init(data: SceneData): void {
    this.autostart = data.autostart === true;
    this.state = "waiting";
    this.guards = [];
    this.letters = [];
    this.collected = 0;
    this.rhythmDone = false;
    this.controlsActive = false;
    this.facing.x = 1;
    this.facing.y = 0;
    this.treeHint = [];
    this.cleanups.length = 0;
  }

  create(): void {
    createWorld(this);
    createBushes(this);
    const blockers = createProps(this);
    this.blockerCount = blockers.length;
    this.blockerSample = blockers.slice(0, 40).map((b) => [Math.round(b.x), Math.round(b.y)]);
    this.createSolids();
    this.createTreeHint();
    this.audio = new GameAudio(this);
    this.squad = new Squad(this);
    this.ducThanh = new DucThanh(this, PLAYER_START.x + 70, PLAYER_START.y + 20);

    this.player = new Player(this, PLAYER_START.x, PLAYER_START.y);
    this.physics.add.collider(this.player.sprite, this.solids);
    // Trees, rocks, stumps and the watchtower are solid too.
    this.physics.add.collider(this.player.sprite, blockers);
    this.oxygen = new OxygenMeter(this);
    this.thrower = new PebbleThrower(this, (x, y) => this.onNoise(x, y));
    // Patrols mix French soldiers and "lính khố xanh" (colonial native guards).
    this.guards = GUARD_ROUTES.map(
      (route, index) => new Guard(this, route, SOLDIER_TEXTURES[index % SOLDIER_TEXTURES.length]),
    );
    this.letters = LETTER_SPOTS.map((spot) => new LetterPickup(this, spot.x, spot.y));
    this.alert = new AlertMeter();
    this.alert.reset();

    this.setupCamera();
    this.setupInput();
    this.setupHostEvents();
    this.setupDebug();

    if (!this.scene.isActive("ui")) this.scene.launch("ui");
    gameEvents.emit("reset", undefined);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    if (this.autostart) this.begin();
    else sendToHost({ type: "chapter:ready" });
  }

  override update(time: number, delta: number): void {
    // Clamp so a long frame (e.g. after a tab switch) cannot teleport guards or drain the air.
    const dt = Math.min(delta, 50) / 1000;
    const playing = this.state === "explore";
    const px = this.player.x;
    const py = this.player.y;

    const inWater = isInWater(px, py);
    const inBush = !inWater && isInBush(px, py);
    const hidden = inWater || inBush;
    this.player.setAlpha(inWater ? PLAYER.waterAlpha : hidden ? PLAYER.bushAlpha : 1);

    if (playing) {
      this.movePlayer(inWater ? PLAYER.waterSpeedFactor : inBush ? PLAYER.bushSpeedFactor : 1);
      if (!inWater) {
        this.lastDry.x = px;
        this.lastDry.y = py;
      }
      if (this.oxygen.update(dt, inWater)) this.onOutOfAir();
    } else {
      this.player.body.setVelocity(0, 0);
      this.moveInput.x = 0;
      this.moveInput.y = 0;
    }
    this.player.animate(this.moveInput.x, this.moveInput.y, inWater, inBush);
    if (playing) this.updateSounds(dt, inWater);

    let seen = false;
    for (const guard of this.guards) {
      if (this.state !== "caught") guard.update(dt);
      if (playing && !hidden && guard.canSee(px, py) && this.hasLineOfSight(guard, px, py)) {
        guard.noteSighting(px, py);
        seen = true;
      }
    }

    if (playing) {
      if (seen) this.alert.raise(ALERT.seeRate, dt);
      else this.alert.decay(ALERT.decayRate, dt);
      if (this.alert.isFull) this.onCaught();
      this.checkLetterPickup(px, py);
      if (!this.rhythmDone && Math.hypot(px - TREE.x, py - TREE.y) <= TREE.triggerRadius) {
        this.startRhythm();
      }
    }
    this.alert.flush(time);
    this.syncControlsVisibility();

    this.oxygen.syncVisuals(px, py);
  }

  /** Footsteps on land, splashes in the stream, and the tense music while the alert is high. */
  private updateSounds(dt: number, inWater: boolean): void {
    const moving = this.moveInput.x !== 0 || this.moveInput.y !== 0;
    if (inWater && !this.wasSwimming) this.audio.splash();
    this.wasSwimming = inWater;
    if (moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        if (inWater) this.audio.splash(0.25);
        else this.audio.footstep(0.28);
        this.stepTimer = inWater ? 0.9 : 0.95;
      }
    } else {
      this.stepTimer = 0;
    }

    // Hysteresis: the tense theme starts at 45 % and only stops once the alert is nearly gone.
    const level = this.alert.value;
    if (!this.stopTension && level >= 45) this.stopTension = this.audio.playTensionBGM();
    else if (this.stopTension && level < 15) {
      this.stopTension();
      this.stopTension = undefined;
    }
  }

  /** Walls (and the gate while it is closed) block a guard's view of the player. */
  private hasLineOfSight(guard: Guard, px: number, py: number): boolean {
    for (const wall of OUTPOST_WALLS) {
      if (segmentIntersectsRect(guard.x, guard.y, px, py, wall.x, wall.y, wall.w, wall.h)) {
        return false;
      }
    }
    if (this.rhythmDone) return true;
    const gate = OUTPOST_GATE;
    return !segmentIntersectsRect(guard.x, guard.y, px, py, gate.x, gate.y, gate.w, gate.h);
  }

  /** The host pressed Start: show the briefing first, the player can move once it is closed. */
  private begin(): void {
    if (this.state !== "waiting") return;
    this.state = "intro";
    sendToHost({ type: "chapter:phase", phase: "intro" });
    sendToHost({ type: "chapter:dialogue", id: "intro" });
  }

  private onDialogueClosed(id: DialogueId): void {
    if (id === "intro" && this.state === "intro") {
      this.state = "explore";
      this.stopMusic?.();
      this.stopMusic = this.audio.startAmbience();
      sendToHost({ type: "chapter:phase", phase: "explore" });
    }
  }

  private checkLetterPickup(px: number, py: number): void {
    for (const letter of this.letters) {
      if (letter.isNear(px, py)) {
        letter.take();
        this.collectLetter();
      }
    }
  }

  private collectLetter(): void {
    this.collected += 1;
    sendToHost({
      type: "chapter:progress",
      progress: createChapterProgress(KIMDONG_ID, this.collected, LETTER_SPOTS.length),
    });
    sendToHost({ type: "chapter:letter", index: this.collected - 1 });
    if (this.collected >= LETTER_SPOTS.length) {
      this.time.delayedCall(CLIMAX_DELAY_MS, () => this.startClimax());
    }
  }

  /** Phase 3: all letters found, the squad springs the ambush and the player must react. */
  private startClimax(): void {
    if (this.state !== "explore") {
      // Busy (rhythm mini-game, being caught, ...): try again shortly.
      this.time.delayedCall(500, () => this.startClimax());
      return;
    }
    this.state = "climax";
    sendToHost({ type: "chapter:phase", phase: "climax" });
    const view = this.cameras.main.worldView;
    this.squad.enter(view);
    // The cadre is coming up the path from behind, right into the ambush.
    this.ducThanh.walkTo(this.player.x - 70, this.player.y, { x: view.x - 60, y: this.player.y });
    gameEvents.emit("climax:start", undefined);
  }

  private onClimaxResult(acted: boolean): void {
    if (this.state !== "climax") return;
    if (!acted) {
      gameEvents.emit("banner", { text: "Quá muộn! Cán bộ sắp rơi vào ổ phục kích…", ms: 1700 });
      this.time.delayedCall(CLIMAX.retryDelayMs, () => {
        if (this.state === "climax") gameEvents.emit("climax:start", undefined);
      });
      return;
    }
    // Throw a stone at the squad; when it lands the soldiers turn on the player.
    this.state = "ambush";
    this.thrower.throw(this.player, this.squad.center);
    this.time.delayedCall(PEBBLE.flightMs + 80, () => this.onAmbushSprung());
  }

  private onAmbushSprung(): void {
    this.cameras.main.shake(AMBUSH_SHAKE_MS, 0.025);
    this.audio.gunshot();
    this.squad.fireAt(this.player);
    this.time.delayedCall(CLIMAX.fireMs, () => this.beginRunner());
  }

  private beginRunner(): void {
    const camera = this.cameras.main;
    camera.fadeOut(450, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.state = "finished";
      this.scene.start("runner", { lettersCollected: this.collected });
    });
  }

  private movePlayer(speedFactor: number): void {
    // One merged input: keyboard (WASD / arrows) OR the virtual joystick (OR dev cheats).
    const left =
      this.cursors?.left.isDown || this.wasd?.A.isDown || touchInput.left || this.debugInput.left;
    const right =
      this.cursors?.right.isDown ||
      this.wasd?.D.isDown ||
      touchInput.right ||
      this.debugInput.right;
    const up =
      this.cursors?.up.isDown || this.wasd?.W.isDown || touchInput.up || this.debugInput.up;
    const down =
      this.cursors?.down.isDown || this.wasd?.S.isDown || touchInput.down || this.debugInput.down;

    let dx = (right ? 1 : 0) - (left ? 1 : 0);
    let dy = (down ? 1 : 0) - (up ? 1 : 0);
    // Normalise so diagonal movement is not faster (no allocation per frame).
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    if (dx !== 0 || dy !== 0) {
      // Remember where the player looks: the action button throws a pebble that way.
      const length = Math.hypot(dx, dy);
      this.facing.x = dx / length;
      this.facing.y = dy / length;
    }
    this.moveInput.x = dx;
    this.moveInput.y = dy;
    const speed = PLAYER.speed * speedFactor;
    this.player.body.setVelocity(dx * speed, dy * speed);
  }

  private onNoise(x: number, y: number): void {
    this.audio.thud();
    for (const guard of this.guards) guard.hearNoise(x, y);
  }

  /** Phase 2: the player reached the old tree and hoots like a cuckoo to warn the cadre. */
  private startRhythm(): void {
    if (this.state !== "explore") return;
    this.state = "rhythm";
    sendToHost({ type: "chapter:phase", phase: "rhythm" });
    gameEvents.emit("rhythm:start", undefined);
  }

  private onRhythmNote(hit: boolean): void {
    if (!hit) this.alert.add(ALERT.rhythmMissPenalty);
  }

  private onRhythmDone(misses: number): void {
    if (this.state !== "rhythm") return;
    this.rhythmDone = true;
    this.destroyTreeHint();
    this.openGate();
    this.state = "explore";
    sendToHost({ type: "chapter:phase", phase: "explore" });
    gameEvents.emit("banner", {
      text:
        misses === 0
          ? "Cán bộ đi qua an toàn. Cổng trạm gác đã mở!"
          : "Lính đã chú ý, nhưng cổng trạm gác đã mở!",
      ms: 2400,
    });
  }

  private openGate(): void {
    (this.gate.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.tweens.add({
      targets: this.gate,
      scaleY: 0.1,
      alpha: 0.25,
      duration: 700,
      onComplete: () => this.gate.setVisible(false),
    });
  }

  private createTreeHint(): void {
    const ring = this.add
      .circle(TREE.x, TREE.y, TREE.triggerRadius)
      .setStrokeStyle(4, 0xfff2a8, 0.9)
      .setFillStyle()
      .setDepth(7);
    this.tweens.add({
      targets: ring,
      alpha: 0.25,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const label = this.add
      .text(TREE.x, TREE.y - TREE.r - 34, "Cây cổ thụ – điểm báo hiệu", {
        fontFamily: "sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#fff7d6",
        stroke: "#10281a",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(7);
    this.treeHint = [ring, label];
  }

  private destroyTreeHint(): void {
    for (const object of this.treeHint) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.treeHint = [];
  }

  private tryThrowAtPointer(): void {
    if (this.state !== "explore") return;
    const pointer = this.input.activePointer;
    this.cameras.main.getWorldPoint(pointer.x, pointer.y, this.pointerWorld);
    this.player.playThrow(this.pointerWorld.x);
    this.thrower.throw(this.player, this.pointerWorld);
  }

  /** Touch action button: throw a pebble a short way in front of the player. */
  private throwForward(): void {
    if (this.state !== "explore") return;
    const reach = PEBBLE.range * 0.75;
    this.player.playThrow(this.player.x + this.facing.x);
    this.thrower.throw(this.player, {
      x: this.player.x + this.facing.x * reach,
      y: this.player.y + this.facing.y * reach,
    });
  }

  /** Tell the UI scene when the virtual controls should be on screen (only on change). */
  private syncControlsVisibility(): void {
    const active =
      this.state === "explore" ||
      this.state === "rhythm" ||
      this.state === "climax" ||
      this.state === "caught";
    if (active === this.controlsActive) return;
    this.controlsActive = active;
    gameEvents.emit("controls:active", active);
  }

  private onOutOfAir(): void {
    this.alert.add(ALERT.drownPenalty);
    this.player.teleport(this.lastDry.x, this.lastDry.y);
    gameEvents.emit("banner", { text: "Hụt hơi! Tiếng động làm lính chú ý", ms: 1600 });
  }

  private onCaught(): void {
    if (this.state !== "explore") return;
    this.state = "caught";
    gameEvents.emit("banner", { text: "Bị lính phát hiện! Quay lại điểm xuất phát", ms: 1800 });

    const camera = this.cameras.main;
    camera.fadeOut(450, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.teleport(PLAYER_START.x, PLAYER_START.y);
      this.lastDry.x = PLAYER_START.x;
      this.lastDry.y = PLAYER_START.y;
      for (const guard of this.guards) guard.reset();
      this.alert.reset();
      this.oxygen.reset();
      camera.fadeIn(450, 0, 0, 0);
      this.state = "explore";
    });
  }

  private createSolids(): void {
    const makeSolid = (rect: Rect, fill: number, stroke: number): Phaser.GameObjects.Rectangle => {
      const solid = this.add
        .rectangle(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h, fill)
        .setStrokeStyle(2, stroke)
        .setDepth(10);
      this.physics.add.existing(solid, true);
      return solid;
    };
    this.solids = OUTPOST_WALLS.map((wall) => makeSolid(wall, 0x3b2a1a, 0x1c130a));
    // The bamboo fence picture replaces the plain wall rectangles; they stay as the collision.
    if (createOutpostFence(this)) for (const solid of this.solids) solid.setVisible(false);
    this.gate = makeSolid(OUTPOST_GATE, 0x8a5a2b, 0x3d2610);
    this.solids.push(this.gate);
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD.width, WORLD.height);
    camera.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

    const applyZoom = (): void => {
      const { width, height } = this.scale;
      // Never zoom out below MIN_ZOOM, or a phone held upright would show a tiny world.
      camera.setZoom(Math.max(MIN_ZOOM, Math.min(width / VIEW.width, height / VIEW.height)));
    };
    applyZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, applyZoom);
    this.cleanups.push(() => this.scale.off(Phaser.Scale.Events.RESIZE, applyZoom));
  }

  private setupInput(): void {
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      // With the virtual controls on, touches steer / press the action button, never aim.
      if (touchInput.enabled) return;
      if (pointer.leftButtonDown()) this.tryThrowAtPointer();
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys("W,A,S,D") as MovementKeys;
    keyboard.on("keydown-G", () => this.tryThrowAtPointer());
  }

  private setupHostEvents(): void {
    this.cleanups.push(
      hostEvents.on("start", () => this.begin()),
      hostEvents.on("dialogue-closed", (id) => this.onDialogueClosed(id)),
      gameEvents.on("rhythm:note", ({ hit }) => this.onRhythmNote(hit)),
      gameEvents.on("rhythm:done", ({ misses }) => this.onRhythmDone(misses)),
      gameEvents.on("climax:result", ({ acted }) => this.onClimaxResult(acted)),
      gameEvents.on("touch:action", () => this.throwForward()),
    );
  }

  /**
   * Dev-only cheats (see debug.ts). The handlers are closures inside the DEV branch so the whole
   * block is removed from production bundles.
   * - `win`: finish the chapter right away.
   * - goto `pos:x,y` teleports the player, `throw:x,y` throws a pebble at a world point,
   *   `letter` collects the next letter, `climax` starts the ambush, `runner` jumps to the runner.
   */
  private setupDebug(): void {
    if (process.env.NODE_ENV === "production") return;

    const win = (): void => {
      if (this.state === "finished") return;
      this.state = "finished";
      sendToHost({ type: "chapter:phase", phase: "ending" });
      sendToHost({
        type: "chapter:complete",
        outcome: { lettersCollected: 5, survivedSeconds: 0, hits: 0 },
      });
    };

    const goto = (target: string): void => {
      if (target === "letter") {
        const next = this.letters.find((letter) => !letter.isTaken);
        if (next && this.state === "explore") {
          next.take();
          this.collectLetter();
        }
        return;
      }
      if (target === "skip-intro") {
        this.onDialogueClosed("intro");
        return;
      }
      if (target === "climax") {
        this.startClimax();
        return;
      }
      if (target === "runner") {
        this.beginRunner();
        return;
      }
      const match = /^(pos|throw):(-?\d+),(-?\d+)$/.exec(target);
      if (!match) return;
      const x = Number(match[2]);
      const y = Number(match[3]);
      if (match[1] === "pos") this.player.teleport(x, y);
      else this.thrower.throw(this.player, { x, y });
    };

    const hold = (direction: string, ms: number): void => {
      if (!(direction in this.debugInput)) return;
      const key = direction as keyof typeof this.debugInput;
      this.debugInput[key] = true;
      this.time.delayedCall(ms, () => {
        this.debugInput[key] = false;
      });
    };

    const state = (): Record<string, unknown> => ({
      scene: this.state,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      collected: this.collected,
      blockers: this.blockerCount,
      blockerSample: this.blockerSample,
      anim: this.player.animation,
      frame: this.player.sprite.frame.name,
    });

    this.cleanups.push(plugDebugHandlers({ win, goto, hold, state }));
  }

  private onShutdown(): void {
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    // The next scene decides whether the controls come back (the runner turns them on again).
    gameEvents.emit("controls:active", false);
    this.stopMusic?.();
    this.stopMusic = undefined;
    this.stopTension?.();
    this.stopTension = undefined;
    this.thrower.destroy();
    this.oxygen.destroy();
    for (const guard of this.guards) guard.destroy();
    for (const letter of this.letters) letter.destroy();
    this.squad.destroy();
    this.ducThanh.destroy();
    this.destroyTreeHint();
  }
}
