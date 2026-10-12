import type Phaser from "phaser";

import { CLIMAX } from "../config";
import { gameEvents } from "../events";
import { touchInput } from "../input-state";

interface ClimaxCallbacks {
  /** `acted` is false when the countdown ran out. */
  onResult: (acted: boolean) => void;
}

/**
 * The 5 second decision of the ambush: a red alarm with a countdown. Pressing Space answers
 * "throw a stone"; running out of time answers "too late". Owns its display objects and the
 * keyboard listener.
 */
export class ClimaxPrompt {
  private readonly tint: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly countdown: Phaser.GameObjects.Text;
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
      .text(0, 0, "Phát hiện địch phục kích cán bộ!\nCần làm gì?!", {
        ...style,
        fontSize: "34px",
        color: "#ffe4e0",
        stroke: "#450a0a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(52);
    this.hint = scene.add
      .text(
        0,
        0,
        touchInput.enabled
          ? "Chạm nút HÀNH ĐỘNG – ném đá đánh lạc hướng!"
          : "Nhấn SPACE – ném đá đánh lạc hướng!",
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

  layout(width: number, height: number): void {
    this.tint.setPosition(width / 2, height / 2).setSize(width, height);
    this.title.setPosition(width / 2, height * 0.26);
    this.countdown.setPosition(width / 2, height * 0.46);
    this.hint.setPosition(width / 2, height * 0.64);
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
    this.scene.tweens.killTweensOf(this.tint);
    this.tint.destroy();
    this.title.destroy();
    this.hint.destroy();
    this.countdown.destroy();
  }
}
