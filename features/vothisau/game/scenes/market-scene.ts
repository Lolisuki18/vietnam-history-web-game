import type Phaser from "phaser";

import type { Point } from "@/lib/engine";

import { PROPS } from "../assets/manifest";
import { ALERT, ESCAPE, GRENADE, GUARD } from "../config";
import { Guard } from "../entities/guard";
import { Npc } from "../entities/npc";
import { sendToHost } from "../host-bridge";
import { run, runStats } from "../run-state";
import { AimOverlay, spawnExplosion, throwGrenade } from "../systems/effects";
import { circleAt, sweep } from "../systems/motion";
import {
  CAI_TONG_ROUTE,
  CRATE_DROP,
  EXIT,
  GATE_TRIGGER,
  MARKET,
  MARKET_CROWDS,
  ROPE,
  THROW_ZONE,
  type Rect,
} from "../world-data";
import {
  CAI_TONG_BLAST_SHOUT,
  CAI_TONG_BUYER_PASS,
  CAI_TONG_LINES,
  GUARD_LINES,
  SAU_THOUGHTS,
  VILLAGER_LINES,
} from "../../data/story";
import type { ChoiceId, ChoiceOption } from "../../types";

import { LevelScene } from "./level-scene";

const CAI_TONG_TRIGGER_RADIUS = 140;
const ROPE_REACH = 70;

const inRect = (rect: Rect, x: number, y: number): boolean =>
  x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

/** What the frozen game is waiting for. */
type Pending = "checkpoint" | "caitong" | "qte" | null;

/**
 * Act 2 – Đất Đỏ market in daylight. Blend into the crowds to pass the soldiers, answer the
 * checkpoint, deal with Cai Tòng (play the buyer or strike at once), throw the grenade and run for
 * the tunnel while every soldier chases at double speed.
 */
export class MarketScene extends LevelScene {
  private crowds: { x: number; y: number; r: number; npcs: Npc[] }[] = [];
  private crowdSeen = new Set<number>();
  private caiTong!: Guard;
  private gateGuards: Guard[] = [];
  private gateResolved = false;
  private caiTongResolved = false;
  private caiTongCooldown = 0;
  private ropeCut = false;
  private pending: Pending = null;
  private aimClock = 0;
  private readonly aimTarget: Point = { x: 0, y: 0 };
  private aim!: AimOverlay;
  private zoneRing!: Phaser.GameObjects.Arc;
  private ropeRing!: Phaser.GameObjects.Arc;
  private exitHatch!: Phaser.GameObjects.Image;
  private exitLabel!: Phaser.GameObjects.Text;
  private readonly escapeStart: Point = { x: 0, y: 0 };
  private drumTimer = 0;
  private chasing = false;
  private extras: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(MARKET);
  }

  protected override get chatterLines(): readonly string[] {
    return GUARD_LINES.market;
  }

  protected override get seeRate(): number {
    return ALERT.marketSeeRate;
  }

  /** The soldiers of the market, plus Cai Tòng walking around the well. */
  protected override createGuards(): Guard[] {
    const guards = super.createGuards();
    this.gateGuards = guards.filter((guard) => guard.route.gate);
    this.caiTong = new Guard(this, CAI_TONG_ROUTE, this.blockers, (event, guard) =>
      this.onGuardReacted(event, guard),
    );
    guards.push(this.caiTong);
    return guards;
  }

  /** The scene object is reused by a restart: every flag goes back to how a new run starts. */
  protected override onInit(): void {
    this.crowds = [];
    this.crowdSeen.clear();
    this.gateGuards = [];
    this.gateResolved = false;
    this.caiTongResolved = false;
    this.caiTongCooldown = 0;
    this.ropeCut = false;
    this.pending = null;
    this.aimClock = 0;
    this.drumTimer = 0;
    this.chasing = false;
    this.extras = [];
  }

  protected override onCreate(): void {
    this.crowds = MARKET_CROWDS.map((crowd) => ({
      x: crowd.x,
      y: crowd.y,
      r: crowd.radius,
      npcs: crowd.members.map(
        (member, index) =>
          new Npc(this, member.texture, crowd.x + member.dx, crowd.y + member.dy, index % 2 === 0),
      ),
    }));
    // The soft circle on the ground that shows where a group hides the player.
    for (const crowd of this.crowds) {
      this.extras.push(
        this.add
          .circle(crowd.x, crowd.y + 6, crowd.r, 0xffffff, 0.07)
          .setStrokeStyle(2, 0xffffff, 0.22)
          .setDepth(-5),
      );
    }

    this.ropeRing = this.add
      .circle(ROPE.x, ROPE.y, 22)
      .setStrokeStyle(3, 0xffe9a0, 0.9)
      .setDepth(5300);
    this.tweens.add({ targets: this.ropeRing, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
    this.zoneRing = this.add
      .circle(THROW_ZONE.x, THROW_ZONE.y, THROW_ZONE.r)
      .setStrokeStyle(4, 0xff6a4a, 0.9)
      .setDepth(5300)
      .setVisible(false);
    this.tweens.add({ targets: this.zoneRing, alpha: 0.3, duration: 650, yoyo: true, repeat: -1 });

    const hatch = PROPS.prop_tunnel_hatch;
    this.exitHatch = this.add
      .image(EXIT.x, EXIT.y + 30, "prop_tunnel_hatch")
      .setOrigin(0.5, 1)
      .setDisplaySize(hatch.w, hatch.h)
      .setDepth(EXIT.y)
      .setVisible(false);
    this.exitLabel = this.add
      .text(EXIT.x, EXIT.y - 56, "Lối thoát ngầm", {
        fontFamily: '"Roboto Slab", serif',
        fontSize: "17px",
        fontStyle: "bold",
        color: "#fff2c0",
        backgroundColor: "#000000b0",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(6100)
      .setVisible(false);
    this.aim = new AimOverlay(this);
  }

  protected override onBegin(): void {
    // Normally the forest handed the grenade over; a direct start (a dev cheat) gets one too.
    run.hasGrenade = true;
    sendToHost({ type: "chapter:phase", phase: "market" });
    sendToHost({ type: "chapter:grenade", has: true });
    this.cleanups.push(this.audio.music("bgmMarket", 0.3), this.audio.crowdMurmur());
    this.time.delayedCall(700, () => {
      if (this.mode === "play") this.think(SAU_THOUGHTS.marketStart[0]);
    });
  }

  protected override isBlended(x: number, y: number): boolean {
    if (this.mode === "escape" || this.mode === "throw") return false;
    return circleAt(this.crowds, x, y) !== undefined;
  }

  /* ------------------------------------------ per frame ---------------------------------------- */

  protected override onFrame(dt: number): void {
    this.caiTongCooldown = Math.max(0, this.caiTongCooldown - dt);
    const px = this.player.x;
    const py = this.player.y;

    if (this.mode === "play") {
      this.zoneRing.setVisible(this.gateResolved && run.hasGrenade);
      this.updatePrompt(px, py);
      this.updateCrowdTalk(px, py);
      this.updateCaiTongTalk();
      if (!this.gateResolved && inRect(GATE_TRIGGER, px, py)) this.askCheckpoint();
      else if (this.shouldChallenge(px, py)) this.askCaiTong();
    } else if (this.mode === "aim") {
      this.updateAim(dt);
    } else if (this.mode === "escape") {
      this.updateEscape(dt, px, py);
    } else {
      this.setPrompt(null);
    }
    this.exitLabel.y = EXIT.y - 56 + Math.sin(this.time.now / 250) * 4;
  }

  private inThrowZone(px: number, py: number): boolean {
    return (px - THROW_ZONE.x) ** 2 + (py - THROW_ZONE.y) ** 2 <= THROW_ZONE.r ** 2;
  }

  private updatePrompt(px: number, py: number): void {
    if (!this.ropeCut && Math.hypot(px - ROPE.x, py - ROPE.y) <= ROPE_REACH) {
      this.setPrompt("[Space] Cắt dây thả hàng hóa");
    } else if (this.gateResolved && run.hasGrenade && this.inThrowZone(px, py)) {
      this.setPrompt("[Space] Ngắm ném lựu đạn");
    } else {
      this.setPrompt(null);
    }
  }

  /** The first time the player stands in a group's circle, a villager mutters a line. */
  private updateCrowdTalk(px: number, py: number): void {
    const crowd = circleAt(this.crowds, px, py);
    if (!crowd) return;
    const index = this.crowds.indexOf(crowd);
    if (this.crowdSeen.has(index)) return;
    this.crowdSeen.add(index);
    const speaker = crowd.npcs[0];
    if (!speaker) return;
    const line = VILLAGER_LINES[this.crowdSeen.size % VILLAGER_LINES.length]!;
    this.bubbles.say(`villager-${index}`, () => speaker.head, line, { color: "#ffe9b0" });
    if (this.crowdSeen.size === 1) this.thinkOnce("crowd", SAU_THOUGHTS.crowd[0]);
  }

  private updateCaiTongTalk(): void {
    if (!this.caiTong.isActive || this.caiTong.state === "down") return;
    const distance = Math.hypot(this.caiTong.x - this.player.x, this.caiTong.y - this.player.y);
    if (distance > 420) return;
    const line = CAI_TONG_LINES[Math.floor(Math.random() * CAI_TONG_LINES.length)]!;
    this.bubbles.sayOnce("cai-tong", "cai-tong", () => this.caiTong.head, line, {
      color: "#ff9f9f",
    });
  }

  protected override onGuardReacted(event: "alert" | "question", guard: Guard): void {
    if (event === "alert" && this.mode === "play") {
      this.bubbles.sayOnce(
        "guard-alert",
        `guard-${this.guards.indexOf(guard)}`,
        () => guard.head,
        GUARD_LINES.alert[0],
        {
          color: "#ff9f9f",
        },
      );
    }
  }

  /* ------------------------------------- the checkpoint and Cai Tòng ---------------------------- */

  private askCheckpoint(): void {
    this.setMode("frozen");
    this.pending = "checkpoint";
    this.setPrompt(null);
    sendToHost({ type: "chapter:phase", phase: "checkpoint" });
    sendToHost({ type: "chapter:choice", id: "checkpoint" });
  }

  /** Cai Tòng walks up to a player who is not hidden: he asks what is in the basket. */
  private shouldChallenge(px: number, py: number): boolean {
    if (!this.gateResolved || this.caiTongResolved || this.caiTongCooldown > 0) return false;
    if (this.caiTong.state === "down" || this.caiTong.state === "stunned") return false;
    if (this.isBlended(px, py)) return false;
    return Math.hypot(this.caiTong.x - px, this.caiTong.y - py) <= CAI_TONG_TRIGGER_RADIUS;
  }

  private askCaiTong(): void {
    this.setMode("frozen");
    this.pending = "caitong";
    this.setPrompt(null);
    this.caiTong.face(this.player.x, this.player.y);
    sendToHost({ type: "chapter:choice", id: "caitong" });
  }

  protected override onChoiceMade(id: ChoiceId, option: ChoiceOption): void {
    if (this.mode !== "frozen" || this.pending !== id) return;
    if (id === "checkpoint") {
      this.pending = null;
      this.resolveCheckpoint(option === "a");
      return;
    }
    // Cai Tòng: A = play the buyer (a timing game follows), B = strike now, no answer = fail.
    if (option === "a") {
      this.pending = "qte";
      sendToHost({ type: "chapter:qte" });
    } else if (option === "b") {
      this.pending = null;
      this.caiTongResolved = true;
      this.throwPointBlank();
    } else {
      this.pending = null;
      this.failBuyer();
    }
  }

  protected override onQteDone(passed: boolean): void {
    if (this.mode !== "frozen" || this.pending !== "qte") return;
    this.pending = null;
    if (!passed) {
      this.failBuyer();
      return;
    }
    run.playedBuyer = 1;
    this.caiTongResolved = true;
    this.caiTongCooldown = 99;
    this.bubbles.say("cai-tong", () => this.caiTong.head, CAI_TONG_BUYER_PASS, {
      color: "#ff9f9f",
    });
    this.banner("Cai Tòng bỏ đi. Tìm chỗ ném lựu đạn!", 2400);
    sendToHost({ type: "chapter:phase", phase: "target" });
    this.setMode("play");
  }

  private resolveCheckpoint(correct: boolean): void {
    this.gateResolved = true;
    this.setCheckpoint(1);
    sendToHost({ type: "chapter:phase", phase: "target" });
    if (correct) {
      run.checkpointPassed = 1;
      for (const guard of this.gateGuards) guard.blind = true;
      const guard = this.gateGuards[0];
      if (guard) {
        this.bubbles.say("gate", () => guard.head, "Đi đi, đừng lảng vảng ở đây!", {
          color: "#ffd9a0",
        });
      }
      this.banner("Lính cho qua. Tìm Cai Tòng giữa chợ!", 2400);
    } else {
      run.checkpointPassed = 0;
      this.alert.set(ALERT.checkpointFail);
      this.tightenNet();
      for (const guard of this.gateGuards) guard.noteSighting(this.player.x, this.player.y);
      this.banner("Lính sinh nghi! Vòng vây thu hẹp lại...", 2600);
    }
    this.setMode("play");
  }

  private failBuyer(): void {
    this.caiTongResolved = true;
    this.caiTongCooldown = 99;
    this.alert.set(ALERT.buyerFail);
    this.tightenNet();
    this.caiTong.noteSighting(this.player.x, this.player.y);
    this.banner("Hắn sinh nghi! Phải tìm chỗ khuất ngay!", 2400);
    sendToHost({ type: "chapter:phase", phase: "target" });
    this.setMode("play");
  }

  /* --------------------------------------------- rope ------------------------------------------- */

  private cutRope(): void {
    this.ropeCut = true;
    this.ropeRing.destroy();
    this.player.pose("interact", ROPE.x);
    this.audio.ropeCut();
    this.setPrompt(null);
    this.time.delayedCall(450, () => {
      // The hanging crates drop onto the stones: a loud crash that draws the guards.
      const crates = [-24, 0, 24].map((dx, i) =>
        this.add
          .image(CRATE_DROP.x + dx, CRATE_DROP.y - 140 - i * 20, "prop_crate")
          .setDisplaySize(PROPS.prop_crate.w * 0.8, PROPS.prop_crate.h * 0.8)
          .setDepth(5300),
      );
      this.tweens.add({
        targets: crates,
        y: CRATE_DROP.y,
        duration: 380,
        ease: "Quad.easeIn",
        onComplete: () => {
          this.audio.crateFall();
          this.cameras.main.shake(180, 0.006);
          this.makeNoise(CRATE_DROP.x, CRATE_DROP.y, 520);
          this.banner("Hàng hóa rơi! Lính chạy tới xem...", 2200);
          this.time.delayedCall(2500, () =>
            crates.forEach((crate) => crate.setDepth(CRATE_DROP.y)),
          );
        },
      });
    });
  }

  /* ------------------------------------------- the grenade -------------------------------------- */

  protected override onAction(): void {
    const px = this.player.x;
    const py = this.player.y;
    if (this.mode === "play") {
      if (!this.ropeCut && Math.hypot(px - ROPE.x, py - ROPE.y) <= ROPE_REACH) this.cutRope();
      else if (this.gateResolved && run.hasGrenade && this.inThrowZone(px, py)) this.startAim();
    } else if (this.mode === "aim") {
      this.releaseGrenade();
    }
  }

  private startAim(): void {
    this.setMode("aim");
    this.aimClock = 0;
    this.think("Một quả duy nhất... phải ném cho trúng.");
    sendToHost({ type: "chapter:phase", phase: "target" });
  }

  private updateAim(dt: number): void {
    this.aimClock += dt * 1000;
    this.setPrompt("[Space] Ném!");
    const dx = this.caiTong.x - this.player.x;
    const dy = this.caiTong.y - this.player.y;
    const length = Math.hypot(dx, dy) || 1;
    const distance = sweep(this.aimClock, GRENADE.sweepMs, GRENADE.minRange, GRENADE.maxRange);
    this.aimTarget.x = this.player.x + (dx / length) * distance;
    this.aimTarget.y = this.player.y + (dy / length) * distance;
    this.aim.show(this.player, this.aimTarget);
  }

  private releaseGrenade(): void {
    this.aim.hide();
    this.setPrompt(null);
    const target = { x: this.aimTarget.x, y: this.aimTarget.y };
    this.launch(
      target,
      GRENADE.flightMs,
      () => Math.hypot(this.caiTong.x - target.x, this.caiTong.y - target.y) <= GRENADE.killRadius,
    );
  }

  /** Option B: Cai Tòng is right there; the grenade cannot miss. */
  private throwPointBlank(): void {
    this.launch({ x: this.caiTong.x, y: this.caiTong.y }, 420, () => true);
  }

  private launch(target: Point, flightMs: number, isHit: () => boolean): void {
    this.setMode("throw");
    this.player.pose("throw", target.x);
    this.audio.grenadeThrow();
    throwGrenade(this, this.player, target, flightMs, () => this.explode(target, isHit()));
  }

  private explode(at: Point, hit: boolean): void {
    // Whatever was being muttered is forgotten: the shout is what counts now.
    this.bubbles.clear();
    spawnExplosion(this, at.x, at.y);
    this.audio.explosion();
    this.cameras.main.shake(900, 0.02);
    this.cameras.main.flash(260, 255, 244, 214);
    run.hasGrenade = false;
    run.grenadeHit = hit ? 1 : 0;
    sendToHost({ type: "chapter:grenade", has: false });

    if (hit) this.caiTong.fall();
    for (const guard of this.guards) {
      if (guard.state === "down") continue;
      const distance = Math.hypot(guard.x - at.x, guard.y - at.y);
      if (distance <= GRENADE.stunRadius) guard.stun(GRENADE.stunMs, true);
    }
    for (const crowd of this.crowds) {
      for (const npc of crowd.npcs) npc.scare(at.x, at.y, GRENADE.scatterRadius, this.level.world);
    }
    const shouter = this.guards.find((guard) => guard.isActive) ?? this.caiTong;
    this.bubbles.say("shout", () => shouter.head, CAI_TONG_BLAST_SHOUT, {
      color: "#ff9f9f",
      holdMs: 2200,
    });

    this.escapeStart.x = this.player.x;
    this.escapeStart.y = this.player.y;
    this.alert.reset();
    this.beginEscape();
  }

  /* ------------------------------------------- the escape --------------------------------------- */

  private beginEscape(): void {
    this.setMode("escape");
    sendToHost({ type: "chapter:phase", phase: "escape" });
    this.exitHatch.setVisible(true);
    this.exitLabel.setVisible(true);
    this.zoneRing.setVisible(false);
    this.cleanups.push(this.audio.music("bgmChase", 0.4));
    this.time.delayedCall(300, () => this.audio.policeWhistle());
    this.banner("Chạy! Tới lối thoát ngầm ở góc chợ!", 3000);
    this.chasing = false;
    this.time.delayedCall(ESCAPE.startDelayMs, () => this.startChase());
  }

  private startChase(): void {
    this.chasing = true;
    for (const guard of this.guards) guard.beginChase();
  }

  private updateEscape(dt: number, px: number, py: number): void {
    this.setPrompt(null);
    // The war drum: a beat about twice a second, faster when a soldier is close.
    this.drumTimer -= dt;
    if (this.drumTimer <= 0) {
      this.audio.drum();
      this.drumTimer = 0.5;
    }
    if (Math.hypot(px - EXIT.x, py - EXIT.y) <= ESCAPE.exitRadius) {
      this.finishAct();
      return;
    }
    if (!this.chasing) return;
    for (const guard of this.guards) {
      if (guard.state === "chase" && Math.hypot(guard.x - px, guard.y - py) <= GUARD.catchRadius) {
        this.onEscapeCaught();
        return;
      }
    }
  }

  private onEscapeCaught(): void {
    this.setMode("caught");
    run.timesCaught += 1;
    this.banner("Bị bắt kịp! Chạy lại nào!", 1600);
    this.fadeThen(450, () => {
      this.player.teleport(this.escapeStart.x, this.escapeStart.y);
      for (const guard of this.guards) {
        if (guard.state !== "down") guard.reset();
      }
      this.cameras.main.fadeIn(450, 0, 0, 0);
      this.setMode("escape");
      this.chasing = false;
      this.time.delayedCall(1500, () => this.startChase());
    });
  }

  private finishAct(): void {
    this.stop();
    this.fadeThen(800, () => sendToHost({ type: "chapter:escaped", stats: runStats() }));
  }

  /* ------------------------------------------- debugging --------------------------------------- */

  protected override debugTarget(target: string): boolean {
    switch (target) {
      case "gate":
        this.player.teleport(GATE_TRIGGER.x + 20, GATE_TRIGGER.y + 60);
        return true;
      case "pass":
        this.resolveCheckpoint(true);
        this.player.teleport(700, 1170);
        return true;
      case "zone":
        this.gateResolved = true;
        this.player.teleport(THROW_ZONE.x, THROW_ZONE.y);
        return true;
      case "exit":
        this.player.teleport(EXIT.x - 120, EXIT.y + 60);
        return true;
      case "blast":
        this.explode({ x: this.caiTong.x, y: this.caiTong.y }, true);
        return true;
      case "caitong":
        this.gateResolved = true;
        this.player.teleport(this.caiTong.x + 60, this.caiTong.y);
        return true;
      default:
        return false;
    }
  }

  protected override onShutdownExtra(): void {
    for (const crowd of this.crowds) for (const npc of crowd.npcs) npc.destroy();
    this.crowds = [];
    this.crowdSeen.clear();
    this.aim.destroy();
    this.extras = [];
  }
}
