import type Phaser from "phaser";

import type { Point } from "@/lib/engine";

import { SPEECH } from "../config";

interface Bubble {
  text: Phaser.GameObjects.Text;
  full: string;
  anchor: () => Point;
  /** ms since the bubble appeared. */
  age: number;
  holdMs: number;
}

export interface SayOptions {
  /** Text colour; guards and Chị Sáu are told apart by it. */
  color?: string;
  holdMs?: number;
}

const DEPTH = 6000;

/**
 * Floating monologues: a line of text typed out above a character's head (the typewriter effect of
 * the design), then faded away. One bubble per speaker. Everything advances with `update(dt)`, so a
 * paused game freezes the text too.
 */
export class SpeechBubbles {
  private readonly bubbles = new Map<string, Bubble>();
  private readonly cooldowns = new Map<string, number>();

  constructor(private readonly scene: Phaser.Scene) {}

  /** Show `text` above the point `anchor()` returns every frame (replaces the speaker's bubble). */
  say(speaker: string, anchor: () => Point, text: string, options: SayOptions = {}): void {
    this.dismiss(speaker);
    const label = this.scene.add
      .text(0, 0, "", {
        fontFamily: '"Roboto Slab", serif',
        fontSize: "15px",
        fontStyle: "bold",
        color: options.color ?? "#fff7d6",
        backgroundColor: "#0b0a09d0",
        padding: { x: 9, y: 6 },
        align: "center",
        wordWrap: { width: 230 },
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH);
    this.bubbles.set(speaker, {
      text: label,
      full: text,
      anchor,
      age: 0,
      holdMs: options.holdMs ?? SPEECH.holdMs,
    });
    this.place(this.bubbles.get(speaker)!);
  }

  /**
   * Like `say`, but only when the speaker has not spoken of this `kind` for `SPEECH.cooldownMs`
   * (so guards that mutter on their own never spam the screen). Returns whether it was said.
   */
  sayOnce(
    kind: string,
    speaker: string,
    anchor: () => Point,
    text: string,
    options?: SayOptions,
  ): boolean {
    if ((this.cooldowns.get(kind) ?? 0) > 0) return false;
    this.cooldowns.set(kind, SPEECH.cooldownMs);
    this.say(speaker, anchor, text, options);
    return true;
  }

  isSpeaking(speaker: string): boolean {
    return this.bubbles.has(speaker);
  }

  update(dt: number): void {
    const ms = dt * 1000;
    for (const [kind, left] of this.cooldowns) {
      if (left - ms <= 0) this.cooldowns.delete(kind);
      else this.cooldowns.set(kind, left - ms);
    }
    for (const [speaker, bubble] of this.bubbles) {
      bubble.age += ms;
      const typed = Math.min(bubble.full.length, Math.floor(bubble.age / SPEECH.typeMs));
      const typedMs = bubble.full.length * SPEECH.typeMs;
      if (bubble.text.text.length !== typed) bubble.text.setText(bubble.full.slice(0, typed));
      const sinceDone = bubble.age - typedMs;
      if (sinceDone > bubble.holdMs) {
        bubble.text.setAlpha(Math.max(0, 1 - (sinceDone - bubble.holdMs) / 400));
        if (sinceDone > bubble.holdMs + 400) {
          this.dismiss(speaker);
          continue;
        }
      }
      this.place(bubble);
    }
  }

  dismiss(speaker: string): void {
    const bubble = this.bubbles.get(speaker);
    if (!bubble) return;
    bubble.text.destroy();
    this.bubbles.delete(speaker);
  }

  clear(): void {
    for (const speaker of [...this.bubbles.keys()]) this.dismiss(speaker);
    this.cooldowns.clear();
  }

  private place(bubble: Bubble): void {
    const { x, y } = bubble.anchor();
    bubble.text.setPosition(Math.round(x), Math.round(y));
  }
}
