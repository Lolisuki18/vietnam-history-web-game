import type Phaser from "phaser";

import { ASSET_KEYS } from "../assets/manifest";
import { CLIMAX } from "../config";
import { gameEvents } from "../events";
import { touchInput } from "../input-state";

interface ClimaxCallbacks {
  /** `acted` is false when the countdown ran out. */
  onResult: (acted: boolean) => void;
}

/** The blinking [SPACE] picture is drawn this many times larger than its 160 x 64 frame. */
const PROMPT_SCALE = 1.9;
const BLINK_MS = 340;

/**
 * The 5 second decision of the ambush: a red alarm with a countdown. Pressing Space answers
 * "fire a shot to draw their fire"; running out of time answers "too late". The key hint is the
 * artist's blinking [SPACE] picture (text on touch screens, or when the picture did not load).
 * Owns its display objects, the blink timer and the keyboard listener.
 */
export class ClimaxPrompt {
  private readonly tint: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  private readonly countdown: Phaser.GameObjects.Text;
  private blink?: Phaser.Time.TimerEvent;
  private deadline = 0;
  private shownSeconds = -1;
  private finished = false;
  private offTouchAction?: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: ClimaxCallbacks,
  ) {
    this.tint = scene.add.rectangle(0, 0, 10, 10, 0xb91c1c, 0.22).setDepth(48);
    scene.tweens.add({ targets: this.tint, alpha: 0.08, duration: 450, yoyo: true, repeat: -1 });

    const style = { fontFamily: "sans-serif", fontStyle: "bold", align: "center" } as const;
    this.title = scene.add
      .text(0, 0, "PHÁT HIỆN Ổ PHỤC KÍCH!", {
        ...style,
        fontSize: "36px",
        color: "#ffe4e0",
        stroke: "#450a0a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(52);
    this.subtitle = scene.add
      .text(
        0,
        0,
        "Không kịp rồi! Các anh cán bộ đang đến ngay phía sau…\nMình phải thu hút hỏa lực!",
        {
          ...style,
          fontStyle: "italic",
          fontSize: "22px",
          color: "#fff7d6",
          stroke: "#450a0a",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(52);

    if (!touchInput.enabled && scene.textures.exists(ASSET_KEYS.spacePrompt)) {
      const prompt = scene.add
        .sprite(0, 0, ASSET_KEYS.spacePrompt, 0)
        .setScale(PROMPT_SCALE)
        .setDepth(52);
      this.hint = prompt;
      // Dark and lit frames take turns so the key is impossible to miss.
      let lit = false;
      this.blink = scene.time.addEvent({
        delay: BLINK_MS,
        loop: true,
        callback: () => {
          lit = !lit;
          prompt.setFrame(lit ? 1 : 0);
        },
      });
    } else {
      this.hint = scene.add
        .text(
          0,
          0,
          touchInput.enabled
            ? "Chạm nút HÀNH ĐỘNG – bắn súng đánh động!"
            : "Nhấn SPACE – bắn súng đánh động!",
          {
            ...style,
            fontSize: "26px",
            color: "#fff7d6",
            backgroundColor: "#000000b0",
            padding: { x: 18, y: 10 },
          },
        )
        .setOrigin(0.5)
        .setDepth(52);
    }
    this.countdown = scene.add
      .text(0, 0, "", {
        ...style,
        fontSize: "96px",
        color: "#ffffff",
        stroke: "#7f1d1d",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(52);
  }

  start(now: number): void {
    this.deadline = now + CLIMAX.decisionMs;
    this.scene.input.keyboard?.on("keydown", this.onKeyDown);
    this.offTouchAction = gameEvents.on("touch:action", () => this.finish(true));
  }

  /** The game was frozen for `ms`: move the deadline so the pause does not eat the countdown. */
  shift(ms: number): void {
    this.deadline += ms;
  }

  layout(width: number, height: number): void {
    this.tint.setPosition(width / 2, height / 2).setSize(width, height);
    this.title.setPosition(width / 2, height * 0.2);
    this.subtitle.setPosition(width / 2, height * 0.29);
    this.subtitle.setWordWrapWidth(Math.max(260, width * 0.86));
    this.countdown.setPosition(width / 2, height * 0.47);
    this.hint.setPosition(width / 2, height * 0.66);
  }

  update(now: number): void {
    if (this.finished) return;
    const remaining = this.deadline - now;
    if (remaining <= 0) {
      this.finish(false);
      return;
    }
    const seconds = Math.ceil(remaining / 1000);
    if (seconds !== this.shownSeconds) {
      this.shownSeconds = seconds;
      this.countdown.setText(String(seconds));
    }
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Space" && !event.repeat) this.finish(true);
  };

  private finish(acted: boolean): void {
    if (this.finished) return;
    this.finished = true;
    this.callbacks.onResult(acted);
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.onKeyDown);
    this.offTouchAction?.();
    this.blink?.remove();
    this.scene.tweens.killTweensOf(this.tint);
    this.tint.destroy();
    this.title.destroy();
    this.subtitle.destroy();
    this.hint.destroy();
    this.countdown.destroy();
  }
}
