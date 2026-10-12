import type Phaser from "phaser";

import type { GameAudio } from "../audio";
import { RHYTHM, type RhythmKey } from "../config";
import { gameEvents } from "../events";
import { touchInput } from "../input-state";

type NoteState = "pending" | "hit" | "miss";

interface Note {
  key: RhythmKey;
  /** Scene-clock time (ms) at which the note reaches the hit line. */
  time: number;
  state: NoteState;
  view: Phaser.GameObjects.Container;
  box: Phaser.GameObjects.Rectangle;
}

export interface RhythmResult {
  hits: number;
  misses: number;
}

interface RhythmCallbacks {
  onNote: (hit: boolean) => void;
  onDone: (result: RhythmResult) => void;
}

const LANE = { width: 150, height: 360, hitY: 120 } as const;
const TOP_Y = -LANE.height / 2;
/** How long a judged note keeps sliding down before it disappears. */
const LINGER_MS = 450;

const KEY_LABELS: Record<RhythmKey, string> = { SPACE: "SPACE", LEFT: "←", UP: "↑", RIGHT: "→" };
const KEY_COLORS: Record<RhythmKey, number> = {
  SPACE: 0x6366f1,
  LEFT: 0xf59e0b,
  UP: 0x0ea5e9,
  RIGHT: 0xec4899,
};
const KEY_BY_CODE: Partial<Record<string, RhythmKey>> = {
  Space: "SPACE",
  ArrowLeft: "LEFT",
  ArrowUp: "UP",
  ArrowRight: "RIGHT",
};

const HIT_COLOR = 0x4ade80;
const MISS_COLOR = 0xef4444;

/**
 * The "chim tu hú" rhythm mini-game: notes fall down a lane and the player presses the shown
 * key (Space / arrows) as each one touches the hit line. Timing uses the scene clock, so it is
 * independent of the frame rate. Owns its display objects and the keyboard listener; `destroy`
 * releases both.
 */
export class RhythmGame {
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly root: Phaser.GameObjects.Container;
  private readonly status: Phaser.GameObjects.Text;
  private readonly notes: Note[] = [];
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
    this.dim = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.4).setDepth(49);

    const lane = scene.add
      .rectangle(0, 0, LANE.width, LANE.height, 0x10151c, 0.94)
      .setStrokeStyle(3, 0xffe08a, 0.9);
    const hitZone = scene.add.rectangle(0, LANE.hitY, LANE.width - 8, 64, 0xffe08a, 0.18);
    const hitLine = scene.add.rectangle(0, LANE.hitY, LANE.width, 4, 0xffe08a);
    const title = scene.add
      .text(0, TOP_Y - 44, "Tiếng chim tu hú – báo hiệu cho cán bộ", {
        fontFamily: "sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#fff7d6",
      })
      .setOrigin(0.5);
    this.status = scene.add
      .text(0, LANE.height / 2 + 34, "Chuẩn bị…", {
        fontFamily: "sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const noteViews = RHYTHM.keys.map((key) => {
      const box = scene.add
        .rectangle(0, 0, LANE.width - 28, 42, KEY_COLORS[key])
        .setStrokeStyle(2, 0xffffff);
      const label = scene.add
        .text(0, 0, touchInput.enabled ? "CHẠM" : KEY_LABELS[key], {
          fontFamily: "sans-serif",
          fontSize: "22px",
          fontStyle: "bold",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      const view = scene.add.container(0, -10_000, [box, label]);
      this.notes.push({ key, time: 0, state: "pending", view, box });
      return view;
    });

    this.root = scene.add
      .container(0, 0, [lane, hitZone, hitLine, title, this.status, ...noteViews])
      .setDepth(50);
  }

  /** Begin the mini-game; `now` is the scene clock (ms). */
  start(now: number): void {
    this.notes.forEach((note, index) => {
      note.time = now + RHYTHM.firstNoteMs + index * RHYTHM.intervalMs;
    });
    this.scene.input.keyboard?.on("keydown", this.onKeyDown);
    this.offTouchAction = gameEvents.on("touch:action", this.onTouchAction);
  }

  layout(width: number, height: number): void {
    this.dim.setPosition(width / 2, height / 2).setSize(width, height);
    const fit = Math.min(1, height / (LANE.height + 200));
    this.root.setPosition(width / 2, height / 2).setScale(fit);
  }

  update(now: number): void {
    if (this.done) return;
    if (this.finishing) {
      if (now >= this.finishAt) this.complete();
      return;
    }

    let pending = 0;
    for (const note of this.notes) {
      if (note.state === "pending") {
        if (now > note.time + RHYTHM.hitWindowMs) this.judge(note, false);
        else pending++;
      }
      this.placeNote(note, now);
    }

    if (pending === 0) {
      this.finishing = true;
      this.finishAt = now + RHYTHM.finishDelayMs;
      this.status
        .setText(
          this.misses === 0 ? "Cán bộ đi qua an toàn!" : "Cán bộ qua được, nhưng lính đã chú ý!",
        )
        .setColor(this.misses === 0 ? "#86efac" : "#fca5a5");
    } else if (now < this.notes[0]!.time - RHYTHM.fallMs) {
      this.status.setText("Chuẩn bị…").setColor("#ffffff");
    }
  }

  private placeNote(note: Note, now: number): void {
    const remaining = note.time - now;
    if (remaining > RHYTHM.fallMs || remaining < -LINGER_MS) {
      note.view.setVisible(false);
      return;
    }
    const progress = 1 - remaining / RHYTHM.fallMs;
    note.view.setVisible(true).setY(TOP_Y + progress * (LANE.hitY - TOP_Y));
  }

  private judge(note: Note, hit: boolean): void {
    note.state = hit ? "hit" : "miss";
    note.box.setFillStyle(hit ? HIT_COLOR : MISS_COLOR);
    if (hit) {
      this.hits++;
      this.audio.cuckoo();
      this.status.setText("Trúng nhịp!").setColor("#86efac");
    } else {
      this.misses++;
      this.status.setText("Trượt!").setColor("#fca5a5");
    }
    this.callbacks.onNote(hit);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const key = KEY_BY_CODE[event.code];
    if (key) this.press(key);
  };

  /** The touch action button has one button for every note: it matches whatever is due. */
  private readonly onTouchAction = (): void => this.press(null);

  /** Judge a press against the note that is currently within reach (`null` = any key counts). */
  private press(key: RhythmKey | null): void {
    if (this.finishing || this.done) return;
    const now = this.scene.time.now;
    const note = this.notes.find(
      (candidate) =>
        candidate.state === "pending" && Math.abs(now - candidate.time) <= RHYTHM.hitWindowMs,
    );
    // A press with no note in reach is ignored (no penalty for early taps).
    if (note) this.judge(note, key === null || note.key === key);
  }

  private complete(): void {
    this.done = true;
    this.callbacks.onDone({ hits: this.hits, misses: this.misses });
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.onKeyDown);
    this.offTouchAction?.();
    this.root.destroy();
    this.dim.destroy();
  }
}
