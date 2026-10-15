import type Phaser from "phaser";

import { RHYTHM_UI } from "../assets/manifest";
import type { GameAudio } from "../audio";
import { RHYTHM } from "../config";
import { gameEvents } from "../events";

export interface RhythmResult {
  hits: number;
  misses: number;
}

interface RhythmCallbacks {
  onNote: (hit: boolean) => void;
  onDone: (result: RhythmResult) => void;
}

type RoundState = "waiting" | "sweeping" | "judged";

/** How much bigger than the picture's own pixels the bar is drawn. */
const BAR_SCALE = 1.4;
const BAR_WIDTH = RHYTHM_UI.parts.track.w * BAR_SCALE;
const BAR_HEIGHT = RHYTHM_UI.parts.track.h * BAR_SCALE;
/** The cursor stops this far inside the ends of the bar, in px. */
const END_MARGIN = 14;
const PANEL = { width: BAR_WIDTH + 70, height: 190 } as const;

/**
 * The "chim tu hú" mini-game of the second stage: a cursor sweeps across a bar and the player
 * presses SPACE (or the action button) while it is over the lit zone in the middle, which makes
 * one long cuckoo call. Three calls in time are the safe signal; a mistimed one raises the alert.
 * Timing uses the scene clock, so it is independent of the frame rate. Uses the artist's bar
 * pictures when they loaded, plain shapes otherwise. Owns its display objects and the keyboard
 * listener; `destroy` releases both.
 */
export class RhythmGame {
  private readonly root: Phaser.GameObjects.Container;
  private readonly cursor: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private readonly status: Phaser.GameObjects.Text;
  private readonly dots: Phaser.GameObjects.Arc[] = [];
  private readonly popup?: { hit: Phaser.GameObjects.Image; miss: Phaser.GameObjects.Image };
  private readonly spark?: Phaser.GameObjects.Image;

  private round = 0;
  private state: RoundState = "waiting";
  /** Scene-clock time (ms) of the next state change: sweep start, or the end of the pause. */
  private nextAt = 0;
  private sweepStart = 0;
  private hits = 0;
  private misses = 0;
  private finishAt = 0;
  private finishing = false;
  private done = false;
  private offTouchAction?: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly audio: GameAudio,
    private readonly callbacks: RhythmCallbacks,
  ) {
    const parts = RHYTHM_UI.parts;
    const pictures = scene.textures.exists(RHYTHM_UI.key);
    if (pictures) {
      const texture = scene.textures.get(RHYTHM_UI.key);
      for (const [name, rect] of Object.entries(parts)) {
        if (!texture.has(name)) texture.add(name, 0, rect.x, rect.y, rect.w, rect.h);
      }
    }

    const panel = scene.add
      .rectangle(0, 0, PANEL.width, PANEL.height, 0x10151c, 0.82)
      .setStrokeStyle(3, 0xffe08a, 0.9);
    const title = scene.add
      .text(0, -PANEL.height / 2 + 24, "Tiếng chim tu hú – báo hiệu cho cán bộ", {
        fontFamily: "sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#fff7d6",
      })
      .setOrigin(0.5);
    this.status = scene.add
      .text(0, PANEL.height / 2 - 26, "Chuẩn bị…", {
        fontFamily: "sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const parts2: Phaser.GameObjects.GameObject[] = [panel, title, this.status];
    if (pictures) {
      const track = scene.add.image(0, 0, RHYTHM_UI.key, "track").setScale(BAR_SCALE);
      this.cursor = scene.add.image(-BAR_WIDTH / 2 + END_MARGIN, 0, RHYTHM_UI.key, "cursor");
      this.cursor.setScale(BAR_SCALE * 0.9);
      this.popup = {
        hit: scene.add.image(0, -BAR_HEIGHT - 8, RHYTHM_UI.key, "hit").setAlpha(0),
        miss: scene.add.image(0, -BAR_HEIGHT - 8, RHYTHM_UI.key, "miss").setAlpha(0),
      };
      parts2.push(track, this.cursor, this.popup.hit, this.popup.miss);
    } else {
      const track = scene.add
        .rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, 0x0c0f13)
        .setStrokeStyle(2, 0x6b7280);
      const zone = scene.add
        .rectangle(0, 0, RHYTHM.zoneHalf * BAR_WIDTH, BAR_HEIGHT, 0x1f6f43, 0.9)
        .setStrokeStyle(2, 0x6ee7a8);
      this.cursor = scene.add.rectangle(
        -BAR_WIDTH / 2 + END_MARGIN,
        0,
        12,
        BAR_HEIGHT + 8,
        0xffe08a,
      );
      parts2.push(track, zone, this.cursor);
    }
    if (scene.textures.exists(RHYTHM_UI.spark)) {
      this.spark = scene.add.image(0, 0, RHYTHM_UI.spark).setAlpha(0).setScale(1.6);
      parts2.push(this.spark);
    }

    // One dot per call: grey while waiting, gold when it hit, red when it missed.
    const dotY = BAR_HEIGHT / 2 + 30;
    for (let i = 0; i < RHYTHM.rounds; i++) {
      const dot = scene.add
        .circle((i - (RHYTHM.rounds - 1) / 2) * 34, dotY, 9, 0x4b5563)
        .setStrokeStyle(2, 0x111827);
      this.dots.push(dot);
      parts2.push(dot);
    }

    this.root = scene.add.container(0, 0, parts2).setDepth(50);
  }

  /** Begin the mini-game; `now` is the scene clock (ms). */
  start(now: number): void {
    this.nextAt = now + RHYTHM.startDelayMs;
    this.scene.input.keyboard?.on("keydown", this.onKeyDown);
    this.offTouchAction = gameEvents.on("touch:action", this.onTouchAction);
  }

  /** The game was frozen for `ms`: move every deadline so the pause does not count as a miss. */
  shift(ms: number): void {
    this.nextAt += ms;
    this.sweepStart += ms;
    this.finishAt += ms;
  }

  layout(width: number, height: number): void {
    const fit = Math.min(1, (width - 24) / PANEL.width, height / (PANEL.height + 140));
    // Below the middle of the screen, so the old tree Kim Đồng climbs stays in view above it.
    this.root.setPosition(width / 2, height * 0.74).setScale(fit);
  }

  update(now: number): void {
    if (this.done) return;
    if (this.finishing) {
      if (now >= this.finishAt) this.complete();
      return;
    }

    if (this.state === "waiting") {
      if (now >= this.nextAt) {
        this.state = "sweeping";
        this.sweepStart = now;
        this.status.setText("Bấm SPACE khi con trượt vào vùng sáng!").setColor("#ffffff");
      }
    }
    if (this.state === "sweeping") {
      const progress = (now - this.sweepStart) / this.sweepMs();
      if (progress >= 1) {
        this.judge(now, false);
      } else {
        this.cursor.x = this.cursorX(progress);
      }
    } else if (this.state === "judged" && now >= this.nextAt) {
      this.round += 1;
      if (this.round >= RHYTHM.rounds) {
        this.finishing = true;
        this.finishAt = now + RHYTHM.finishDelayMs;
        this.status
          .setText(
            this.misses === 0 ? "Cán bộ đi qua an toàn!" : "Cán bộ qua được, nhưng lính đã chú ý!",
          )
          .setColor(this.misses === 0 ? "#86efac" : "#fca5a5");
      } else {
        this.state = "waiting";
        this.nextAt = now + RHYTHM.gapMs;
        this.status.setText(`Tiếng thứ ${this.round + 1}…`).setColor("#ffffff");
      }
    }
  }

  private sweepMs(): number {
    return RHYTHM.sweepMs[Math.min(this.round, RHYTHM.sweepMs.length - 1)]!;
  }

  /** Cursor x for a sweep that is `progress` (0-1) done; the rounds alternate direction. */
  private cursorX(progress: number): number {
    const half = BAR_WIDTH / 2 - END_MARGIN;
    const along = this.round % 2 === 0 ? progress : 1 - progress;
    return -half + 2 * half * along;
  }

  /** Normalised position of the cursor: 0 in the middle of the bar, ±1 at its ends. */
  private cursorOffset(): number {
    return this.cursor.x / (BAR_WIDTH / 2 - END_MARGIN);
  }

  private judge(now: number, hit: boolean): void {
    this.state = "judged";
    this.nextAt = now + RHYTHM.gapMs;
    const dot = this.dots[this.round];
    if (hit) {
      this.hits++;
      this.audio.cuckoo(0.3);
      this.status.setText("Chuẩn!").setColor("#86efac");
      dot?.setFillStyle(0xfacc15);
      this.flash(this.popup?.hit);
      if (this.spark) {
        this.spark.setPosition(0, 0).setAlpha(1);
        this.scene.tweens.add({ targets: this.spark, alpha: 0, duration: 450 });
      }
    } else {
      this.misses++;
      this.status.setText("Trượt!").setColor("#fca5a5");
      dot?.setFillStyle(0xef4444);
      this.flash(this.popup?.miss);
    }
    this.callbacks.onNote(hit);
  }

  /** Pop a "Chuẩn!" / "Trượt!" label above the bar and fade it. */
  private flash(label?: Phaser.GameObjects.Image): void {
    if (!label) return;
    this.scene.tweens.killTweensOf(label);
    label.setAlpha(1);
    this.scene.tweens.add({ targets: label, alpha: 0, delay: 500, duration: 350 });
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Space" && !event.repeat) this.press();
  };

  /** The touch action button is the same as SPACE here. */
  private readonly onTouchAction = (): void => this.press();

  /** A press counts only during a sweep (an early tap before it starts is ignored). */
  private press(): void {
    if (this.finishing || this.done || this.state !== "sweeping") return;
    this.judge(this.scene.time.now, Math.abs(this.cursorOffset()) <= RHYTHM.zoneHalf);
  }

  private complete(): void {
    this.done = true;
    this.callbacks.onDone({ hits: this.hits, misses: this.misses });
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.onKeyDown);
    this.offTouchAction?.();
    for (const label of [this.popup?.hit, this.popup?.miss, this.spark]) {
      if (label) this.scene.tweens.killTweensOf(label);
    }
    this.root.destroy();
  }
}
