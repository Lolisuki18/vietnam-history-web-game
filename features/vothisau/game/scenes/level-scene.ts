import Phaser from "phaser";

import type { Point } from "@/lib/engine";

import { ALERT, GUARD, PEBBLES, PLAYER } from "../config";
import { plugDebugHandlers } from "../debug";
import { Guard, type GuardEvent } from "../entities/guard";
import { PaperPickup, PebblePickup } from "../entities/pickups";
import { Player } from "../entities/player";
import { gameEvents, hostEvents } from "../events";
import { sendToHost } from "../host-bridge";
import { touchInput } from "../input-state";
import { PAPER_TOTAL, run, runStats } from "../run-state";
import { GameAudio } from "../audio";
import { AlertMeter, reportProgress } from "../systems/alert-meter";
import { noiseRipple, PebbleThrower } from "../systems/effects";
import { circleAt } from "../systems/motion";
import { SpeechBubbles } from "../systems/speech-bubbles";
import { createSolids, createWorld, fadeOccluders } from "../systems/world-renderer";
import { levelBlockers, type LevelDef, type PaperSpawn, type Rect } from "../world-data";
import type { ChoiceId, ChoiceOption, DialogueId } from "../../types";

/**
 * waiting: the menu is up · play: sneaking · frozen: a dialogue or choice is open · aim / throw: the
 * grenade · escape: the chase · caught: fading back to the checkpoint · finished: done.
 */
export type Mode =
  "waiting" | "play" | "frozen" | "aim" | "throw" | "escape" | "caught" | "finished";

interface SceneData {
  /** Skip the "waiting for host:start" step (used by restarts and by the step from act 1 to 2). */
  autostart?: boolean;
}

type MovementKeys = Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;

const MIN_ZOOM = 0.5;
const SAU_COLOR = "#bfe9ff";
const CHATTER_RANGE = 380;

/**
 * What both acts share: the world, Chị Sáu, the soldiers and their sight, hiding, the alert meter,
 * the papers, floating text, the camera, the input and the way back to a checkpoint when caught.
 * `ForestScene` and `MarketScene` add what is special to their act.
 */
export abstract class LevelScene extends Phaser.Scene {
  protected player!: Player;
  protected guards: Guard[] = [];
  protected blockers: Rect[] = [];
  protected alert = new AlertMeter();
  protected audio!: GameAudio;
  protected bubbles!: SpeechBubbles;
  protected mode: Mode = "waiting";
  /** A wrong answer at the checkpoint: the soldiers see farther and the alert rises faster. */
  protected tightened = false;
  protected readonly cleanups: Array<() => void> = [];
  /** Unit vector of the last movement direction (where a pebble goes when thrown by a button). */
  protected readonly facing = { x: 0, y: -1 };
  /** This frame's movement input (axes, before speed). */
  protected readonly moveInput = { x: 0, y: 0 };
  protected checkpointIndex = 0;

  private occluders: Phaser.GameObjects.Image[] = [];
  private papers: PaperPickup[] = [];
  private pebblePickups: PebblePickup[] = [];
  private pebbles: number = PEBBLES.start;
  private thrower?: PebbleThrower;
  private prompt!: Phaser.GameObjects.Text;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: MovementKeys;
  private autostart = false;
  private stepTimer = 0;
  private chatterTimer = 6;
  private controlsActive = false;
  private lastHideThought = -100;
  private wasHidden = false;
  private readonly lastSting: Partial<Record<GuardEvent, number>> = {};
  private readonly thoughtsDone = new Set<string>();
  private readonly pointerWorld = new Phaser.Math.Vector2();
  /** Dev-only virtual keys driven by `debugHold` (always false in production). */
  private readonly debugInput = { left: false, right: false, up: false, down: false };
  private clock = 0;

  constructor(protected readonly level: LevelDef) {
    super(level.id);
  }

  /* ------------------------------------- hooks for the acts ------------------------------------ */

  /** Whether this act lets the player throw pebbles (the forest does). */
  protected get usesPebbles(): boolean {
    return false;
  }
  /** Called at the start of every (re)start: forget what the last run left behind. */
  protected onInit(): void {}
  protected onCreate(): void {}
  protected onBegin(): void {}
  /** Called every frame while the scene is running (after the shared logic). */
  protected onFrame(dt: number): void {
    void dt;
  }
  /** The action button / Space / E was pressed. */
  protected onAction(): void {}
  protected onPaperCollected(spawn: PaperSpawn): void {
    void spawn;
  }
  protected onDialogueClosed(id: DialogueId): void {
    void id;
  }
  protected onChoiceMade(id: ChoiceId, option: ChoiceOption): void {
    void [id, option];
  }
  protected onQteDone(passed: boolean): void {
    void passed;
  }
  /** Called after the player was put back at a checkpoint. */
  protected onRespawned(): void {}
  protected onShutdownExtra(): void {}
  /** Extra dev cheats: return true when `target` was handled. */
  protected debugTarget(target: string): boolean {
    void target;
    return false;
  }
  /** Is the player blended into a crowd right now? (the market answers yes inside a group's zone) */
  protected isBlended(x: number, y: number): boolean {
    void [x, y];
    return false;
  }
  /** What the soldiers mutter while they patrol. */
  protected get chatterLines(): readonly string[] {
    return [];
  }
  protected get seeRate(): number {
    return ALERT.seeRate;
  }

  /* ------------------------------------------ lifecycle ---------------------------------------- */

  init(data: SceneData): void {
    this.autostart = data.autostart === true;
    this.mode = "waiting";
    this.guards = [];
    this.papers = [];
    this.pebblePickups = [];
    this.pebbles = PEBBLES.start;
    this.thrower = undefined;
    this.tightened = false;
    this.checkpointIndex = 0;
    this.controlsActive = false;
    this.stepTimer = 0;
    this.chatterTimer = 6;
    this.clock = 0;
    this.wasHidden = false;
    this.facing.x = 0;
    this.facing.y = -1;
    this.thoughtsDone.clear();
    this.cleanups.length = 0;
    for (const key of Object.keys(this.lastSting)) delete this.lastSting[key as GuardEvent];
    this.onInit();
  }

  create(): void {
    this.occluders = createWorld(this, this.level);
    this.blockers = levelBlockers(this.level);
    const solids = createSolids(this, this.blockers);

    this.audio = new GameAudio(this);
    this.bubbles = new SpeechBubbles(this);
    this.alert = new AlertMeter();
    this.alert.reset();

    this.player = new Player(this, this.level.start.x, this.level.start.y);
    this.physics.add.collider(this.player.sprite, solids);

    this.guards = this.createGuards();
    this.papers = this.level.papers
      .filter((spawn) => !run.papers.has(spawn.index))
      .map((spawn) => new PaperPickup(this, spawn.index, spawn.x, spawn.y));
    this.pebblePickups = this.level.pebbles.map((spot) => new PebblePickup(this, spot.x, spot.y));

    this.prompt = this.add
      .text(0, 0, "", {
        fontFamily: '"Roboto Slab", serif',
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffe9a0",
        backgroundColor: "#000000b0",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6100)
      .setVisible(false);

    if (this.usesPebbles) {
      this.thrower = new PebbleThrower(this, (x, y) => this.onPebbleLanded(x, y));
      this.setPebbles(PEBBLES.start);
    } else {
      gameEvents.emit("pebbles", { count: 0, max: 0 });
    }

    this.setupCamera();
    this.setupInput();
    this.setupHostEvents();
    this.setupDebug();
    this.onCreate();

    if (!this.scene.isActive("ui")) this.scene.launch("ui");
    gameEvents.emit("reset", undefined);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    if (this.autostart) {
      this.cameras.main.fadeIn(500, 0, 0, 0);
      this.begin();
    } else {
      sendToHost({ type: "chapter:ready" });
    }
  }

  override update(_time: number, delta: number): void {
    if (this.mode === "waiting") return;
    // Clamp so a long frame (e.g. after a tab switch) cannot teleport guards.
    const dt = Math.min(delta, 50) / 1000;
    this.clock += dt;
    const px = this.player.x;
    const py = this.player.y;
    const canMove = this.mode === "play" || this.mode === "escape";

    const bush = circleAt(this.level.bushes, px, py);
    const blended = this.isBlended(px, py);
    const hidden = bush !== undefined;
    const concealed = hidden || blended;
    this.player.setAlpha(concealed ? PLAYER.hiddenAlpha : 1);
    fadeOccluders(this.occluders, px, py);

    if (canMove)
      this.movePlayer(hidden ? PLAYER.bushSpeedFactor : blended ? PLAYER.crowdSpeedFactor : 1);
    else {
      this.player.body.setVelocity(0, 0);
      this.moveInput.x = 0;
      this.moveInput.y = 0;
    }
    this.player.animate(this.moveInput.x, this.moveInput.y, concealed, hidden);
    // Inside a bush she stands over the foliage (seen through it, half transparent), not behind it.
    if (bush) this.player.sprite.setDepth(bush.y + bush.r * 0.55 + 1);
    if (canMove) this.updateFootsteps(dt, concealed);
    if (hidden && !this.wasHidden) this.onEnteredBush();
    this.wasHidden = hidden;

    // The soldiers.
    const me = { x: px, y: py };
    let seen = false;
    for (const guard of this.guards) {
      if (this.mode !== "caught") guard.update(dt, me, this.chaseFactor);
      if (this.mode !== "play" || hidden) continue;
      const close = Math.hypot(guard.x - px, guard.y - py) <= GUARD.closeInspectRadius;
      if (guard.sees(px, py) && (!blended || close)) {
        guard.noteSighting(px, py);
        seen = true;
      }
    }

    if (this.mode === "play") {
      if (seen) this.alert.raise(this.seeRate * (this.tightened ? 1.3 : 1), dt);
      else this.alert.decay(ALERT.decayRate, dt);
      if (this.alert.isFull) this.onCaught();
      this.updateCheckpoints();
      this.checkPapers(px, py);
      this.checkPebblePickups(px, py);
      this.updateChatter(dt);
    } else if (this.mode === "escape") {
      this.checkPapers(px, py);
    }
    this.alert.flush(dt);
    this.thrower?.update(dt);
    this.bubbles.update(dt);
    this.syncControlsVisibility();
    this.onFrame(dt);
  }

  /* ---------------------------------------- shared helpers -------------------------------------- */

  protected get chaseFactor(): number {
    return GUARD.chaseSpeedFactor;
  }

  protected createGuards(): Guard[] {
    return this.level.guards.map(
      (route) =>
        new Guard(this, route, this.blockers, (event, guard) => this.onGuardEvent(event, guard)),
    );
  }

  /** Chị Sáu's thought, typed above her head. */
  protected think(text: string): void {
    this.bubbles.say("sau", () => this.player.head, text, { color: SAU_COLOR });
  }

  /** Think `text` the first time `key` comes up, never again. */
  protected thinkOnce(key: string, text: string): void {
    if (this.thoughtsDone.has(key)) return;
    this.thoughtsDone.add(key);
    this.think(text);
  }

  protected setPrompt(text: string | null): void {
    if (!text) {
      this.prompt.setVisible(false);
      return;
    }
    const head = this.player.head;
    this.prompt
      .setText(text)
      .setPosition(head.x, head.y - 30)
      .setVisible(true);
  }

  protected banner(text: string, ms = 2200): void {
    gameEvents.emit("banner", { text, ms });
  }

  /** A noise the soldiers can hear (a pebble, falling crates). */
  protected makeNoise(x: number, y: number, radius: number = GUARD.hearingRadius): void {
    noiseRipple(this, x, y, Math.min(radius, 140));
    for (const guard of this.guards) guard.hearNoise(x, y, radius);
  }

  protected setMode(mode: Mode): void {
    this.mode = mode;
  }

  protected stop(): void {
    this.mode = "finished";
  }

  /** Fade out, then run `then` (the next scene or a respawn). */
  protected fadeThen(ms: number, then: () => void): void {
    const camera = this.cameras.main;
    camera.fadeOut(ms, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, then);
  }

  protected setCheckpoint(index: number): void {
    this.checkpointIndex = Math.max(this.checkpointIndex, index);
  }

  /* ------------------------------------------- sight -------------------------------------------- */

  private onGuardEvent(event: GuardEvent, guard: Guard): void {
    if (this.mode !== "play") return;
    const now = this.clock;
    const last = this.lastSting[event] ?? -10;
    if (now - last >= 0.6) {
      this.lastSting[event] = now;
      if (event === "alert") this.audio.alert();
      else this.audio.question();
    }
    if (event === "alert") {
      // Reinforcements: the soldiers nearby come to the spot where the player was seen.
      for (const other of this.guards) {
        if (other !== guard) other.hearNoise(this.player.x, this.player.y, GUARD.backupRadius);
      }
    }
    this.onGuardReacted(event, guard);
  }

  /** The soldier says something when it reacts ("?" / "!"). */
  protected onGuardReacted(event: GuardEvent, guard: Guard): void {
    void [event, guard];
  }

  /** From time to time a soldier near the player mutters to himself. */
  private updateChatter(dt: number): void {
    this.chatterTimer -= dt;
    if (this.chatterTimer > 0) return;
    this.chatterTimer = 7 + Math.random() * 6;
    const lines = this.chatterLines;
    if (lines.length === 0) return;
    const near = this.guards.filter(
      (guard) =>
        guard.state === "patrol" &&
        !guard.route.gate &&
        Math.hypot(guard.x - this.player.x, guard.y - this.player.y) < CHATTER_RANGE,
    );
    const guard = near[Math.floor(Math.random() * near.length)];
    if (!guard) return;
    const text = lines[Math.floor(Math.random() * lines.length)]!;
    this.bubbles.sayOnce(
      "guard-chatter",
      `guard-${this.guards.indexOf(guard)}`,
      () => guard.head,
      text,
      {
        color: "#ffd9a0",
      },
    );
  }

  private onEnteredBush(): void {
    const sinceLast = this.clock - this.lastHideThought;
    if (this.thoughtsDone.has("hide-first")) {
      if (sinceLast > 25) this.onHideAgain();
    } else {
      this.thoughtsDone.add("hide-first");
      this.lastHideThought = this.clock;
      this.onFirstHide();
    }
  }

  protected onFirstHide(): void {}
  protected onHideAgain(): void {
    this.lastHideThought = this.clock;
  }

  /* ------------------------------------- movement and input -------------------------------------- */

  private movePlayer(speedFactor: number): void {
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
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      this.facing.x = dx / length;
      this.facing.y = dy / length;
    }
    this.moveInput.x = dx;
    this.moveInput.y = dy;
    const speed = PLAYER.speed * speedFactor;
    this.player.body.setVelocity(dx * speed, dy * speed);
  }

  private updateFootsteps(dt: number, concealed: boolean): void {
    if (this.moveInput.x === 0 && this.moveInput.y === 0) {
      this.stepTimer = 0;
      return;
    }
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.audio.footstep(concealed ? 0.12 : 0.28);
      this.stepTimer = concealed ? 0.55 : 0.4;
    }
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    const { w, h } = this.level.world;
    camera.setBounds(0, 0, w, h);
    camera.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, w, h);

    const applyZoom = (): void => {
      const { width, height } = this.scale;
      // Never zoom out below MIN_ZOOM, or a phone held upright would show a tiny world.
      camera.setZoom(
        Math.max(MIN_ZOOM, Math.min(width / this.level.view.w, height / this.level.view.h)),
      );
    };
    applyZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, applyZoom);
    this.cleanups.push(() => this.scale.off(Phaser.Scale.Events.RESIZE, applyZoom));
  }

  private setupInput(): void {
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      // With the virtual controls on, touches steer / press the action button, never aim.
      if (touchInput.enabled || !pointer.leftButtonDown()) return;
      this.throwAtPointer();
    });
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys("W,A,S,D") as MovementKeys;
    keyboard.on("keydown-SPACE", () => this.action());
    keyboard.on("keydown-E", () => this.action());
    keyboard.on("keydown-G", () => this.throwAtPointer());
  }

  private setupHostEvents(): void {
    this.cleanups.push(
      hostEvents.on("start", () => this.begin()),
      hostEvents.on("dialogue-closed", (id) => this.onDialogueClosed(id)),
      hostEvents.on("choice-made", ({ id, option }) => this.onChoiceMade(id, option)),
      hostEvents.on("qte-done", ({ passed }) => this.onQteDone(passed)),
      gameEvents.on("touch:action", () => this.action()),
    );
  }

  /** The host pressed Start (or the previous act handed over): the level begins. */
  protected begin(): void {
    if (this.mode !== "waiting") return;
    this.mode = "play";
    sendToHost({ type: "chapter:act", act: this.level.act });
    this.onBegin();
  }

  private action(): void {
    if (this.mode === "waiting" || this.mode === "frozen" || this.mode === "caught") return;
    this.onAction();
  }

  private throwAtPointer(): void {
    if (!this.usesPebbles || this.mode !== "play") return;
    const pointer = this.input.activePointer;
    this.cameras.main.getWorldPoint(pointer.x, pointer.y, this.pointerWorld);
    this.throwPebble(this.pointerWorld);
  }

  /** Throw a pebble a short way ahead (the action button, Space). */
  protected throwPebbleForward(): void {
    if (!this.usesPebbles || this.mode !== "play") return;
    const reach = PEBBLES.range * 0.75;
    this.throwPebble({
      x: this.player.x + this.facing.x * reach,
      y: this.player.y + this.facing.y * reach,
    });
  }

  private throwPebble(target: Point): void {
    if (!this.thrower?.isReady) return;
    if (this.pebbles <= 0) {
      this.banner("Hết sỏi! Nhặt thêm dọc đường", 1300);
      return;
    }
    this.setPebbles(this.pebbles - 1);
    this.player.pose("throw", target.x);
    this.thrower.throw({ x: this.player.x, y: this.player.y }, target);
  }

  private setPebbles(count: number): void {
    this.pebbles = Math.max(0, Math.min(PEBBLES.max, count));
    gameEvents.emit("pebbles", { count: this.pebbles, max: PEBBLES.max });
  }

  private checkPebblePickups(px: number, py: number): void {
    for (const pebble of this.pebblePickups) {
      if (this.pebbles >= PEBBLES.max) return;
      if (!pebble.isNear(px, py)) continue;
      pebble.take();
      this.audio.footstep(0.2);
      this.setPebbles(this.pebbles + 1);
    }
    this.pebblePickups = this.pebblePickups.filter((pebble) => !pebble.isTaken);
  }

  private onPebbleLanded(x: number, y: number): void {
    this.audio.thud();
    this.makeNoise(x, y);
    this.pebblePickups.push(new PebblePickup(this, x, y));
  }

  /* ------------------------------------- papers and checkpoints ---------------------------------- */

  private checkPapers(px: number, py: number): void {
    for (const paper of this.papers) {
      if (!paper.isNear(px, py)) continue;
      paper.take();
      const spawn = this.level.papers.find((s) => s.index === paper.index);
      if (!spawn) continue;
      run.papers.add(spawn.index);
      run.lettersCollected += 1;
      this.audio.pickup();
      reportProgress(run.lettersCollected, PAPER_TOTAL);
      sendToHost({ type: "chapter:lore", index: spawn.index });
      this.onPaperCollected(spawn);
    }
    this.papers = this.papers.filter((paper) => !paper.isTaken);
  }

  private updateCheckpoints(): void {
    this.level.checkpoints.forEach((cp, index) => {
      if (cp.atY !== undefined && index > this.checkpointIndex && this.player.y <= cp.atY) {
        this.checkpointIndex = index;
      }
    });
  }

  /* ---------------------------------------- being caught ---------------------------------------- */

  private onCaught(): void {
    if (this.mode !== "play") return;
    this.mode = "caught";
    run.timesCaught += 1;
    this.banner("Bị lính phát hiện! Quay lại điểm an toàn", 1800);
    this.fadeThen(450, () => {
      const cp = this.level.checkpoints[this.checkpointIndex] ?? this.level.start;
      this.player.teleport(cp.x, cp.y);
      for (const guard of this.guards) guard.reset();
      this.tightened = false;
      for (const guard of this.guards) guard.coneScale = 1;
      this.alert.reset();
      this.cameras.main.fadeIn(450, 0, 0, 0);
      this.mode = "play";
      this.onRespawned();
    });
  }

  protected tightenNet(): void {
    this.tightened = true;
    for (const guard of this.guards) guard.coneScale = ALERT.tightenFactor;
  }

  /* ----------------------------------------- controls UI ---------------------------------------- */

  /** Tell the UI scene when the virtual controls should be on screen (only on change). */
  private syncControlsVisibility(): void {
    const active = this.mode === "play" || this.mode === "aim" || this.mode === "escape";
    if (active === this.controlsActive) return;
    this.controlsActive = active;
    gameEvents.emit("controls:active", active);
  }

  /* ------------------------------------------- debug -------------------------------------------- */

  /**
   * Dev-only cheats (see debug.ts). The handlers are closures inside the DEV branch so the whole
   * block is removed from production bundles. `pos:x,y` teleports, `letter` takes the next paper.
   */
  private setupDebug(): void {
    if (process.env.NODE_ENV === "production") return;

    const win = (): void => {
      if (this.mode === "finished") return;
      this.mode = "finished";
      sendToHost({ type: "chapter:escaped", stats: runStats() });
    };

    const goto = (target: string): void => {
      if (this.debugTarget(target)) return;
      if (target === "letter") {
        const next = this.papers[0];
        if (next) this.player.teleport(next.x, next.y);
        return;
      }
      const match = /^pos:(-?\d+),(-?\d+)$/.exec(target);
      if (match) this.player.teleport(Number(match[1]), Number(match[2]));
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
      scene: this.level.id,
      mode: this.mode,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      alert: Math.round(this.alert.value),
      papers: run.lettersCollected,
      hasGrenade: run.hasGrenade,
      checkpoint: this.checkpointIndex,
      guards: this.guards.map(
        (guard) => `${guard.state}@${Math.round(guard.x)},${Math.round(guard.y)}`,
      ),
      anim: this.player.animation,
    });

    this.cleanups.push(plugDebugHandlers({ win, goto, hold, state }));
  }

  private shutdown(): void {
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    gameEvents.emit("controls:active", false);
    this.onShutdownExtra();
    this.bubbles.clear();
    for (const guard of this.guards) guard.destroy();
    for (const paper of this.papers) paper.destroy();
    for (const pebble of this.pebblePickups) pebble.destroy();
    this.guards = [];
    this.papers = [];
    this.pebblePickups = [];
  }
}
