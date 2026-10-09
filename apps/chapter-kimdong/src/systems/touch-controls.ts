import {
  createStickDirections,
  createStickState,
  resolveStick,
  stickDirections,
} from "@vhg/engine";
import type Phaser from "phaser";

import { gameEvents } from "../events";
import { clearTouchDirections, touchInput } from "../input-state";

const MARGIN = 28;
const DEPTH = 200;
/** How much bigger than the drawn circle the touch target is (fat fingers). */
const GRAB_FACTOR = 1.6;
const NO_POINTER = -1;

/**
 * On-screen controls for touch devices: a virtual joystick (bottom-left) and an action button
 * (bottom-right). Drawn on the UI scene so they stay on top and never scroll with the camera.
 *
 * Every control remembers the id of the finger that grabbed it, so the player can steer and
 * press the action button at the same time (multi-touch). The joystick is read as the same
 * 8-way direction flags the keyboard produces (see `touchInput`).
 */
export class TouchControls {
  private readonly base: Phaser.GameObjects.Arc;
  private readonly thumb: Phaser.GameObjects.Arc;
  private readonly button: Phaser.GameObjects.Arc;
  private readonly buttonLabel: Phaser.GameObjects.Text;

  private enabled = false;
  private active = false;
  private stickPointer = NO_POINTER;
  private buttonPointer = NO_POINTER;

  private baseX = 0;
  private baseY = 0;
  private baseRadius = 70;
  private buttonX = 0;
  private buttonY = 0;
  private buttonRadius = 56;

  private readonly stick = createStickState();
  private readonly directions = createStickDirections();

  constructor(private readonly scene: Phaser.Scene) {
    // Mouse + 4 touch points, so two or three fingers can be down at once.
    scene.input.addPointer(2);

    this.base = scene.add
      .circle(0, 0, 70, 0xffffff, 0.12)
      .setStrokeStyle(3, 0xffffff, 0.4)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.thumb = scene.add
      .circle(0, 0, 32, 0xffffff, 0.38)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.button = scene.add
      .circle(0, 0, 56, 0xdc2626, 0.32)
      .setStrokeStyle(3, 0xffffff, 0.55)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.buttonLabel = scene.add
      .text(0, 0, "HÀNH\nĐỘNG", {
        fontFamily: "sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    scene.input.on("pointerdown", this.onDown);
    scene.input.on("pointermove", this.onMove);
    scene.input.on("pointerup", this.onUp);
    scene.input.on("pointerupoutside", this.onUp);
    this.refresh();
  }

  /** Switch the whole feature on/off (touch device or small window). */
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    touchInput.enabled = enabled;
    this.refresh();
  }

  /** Show the controls only while the game is actually being played. */
  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    this.refresh();
  }

  layout(width: number, height: number): void {
    const size = Math.min(width, height);
    this.baseRadius = Math.max(48, Math.min(80, size * 0.14));
    this.buttonRadius = Math.max(40, Math.min(64, size * 0.115));
    this.baseX = MARGIN + this.baseRadius;
    this.baseY = height - MARGIN - this.baseRadius;
    this.buttonX = width - MARGIN - this.buttonRadius;
    this.buttonY = height - MARGIN - this.buttonRadius;

    this.base.setPosition(this.baseX, this.baseY).setRadius(this.baseRadius);
    this.thumb.setRadius(this.baseRadius * 0.46);
    this.button.setPosition(this.buttonX, this.buttonY).setRadius(this.buttonRadius);
    this.buttonLabel.setPosition(this.buttonX, this.buttonY);
    this.centreThumb();
  }

  destroy(): void {
    this.scene.input.off("pointerdown", this.onDown);
    this.scene.input.off("pointermove", this.onMove);
    this.scene.input.off("pointerup", this.onUp);
    this.scene.input.off("pointerupoutside", this.onUp);
    this.releaseAll();
    touchInput.enabled = false;
    this.base.destroy();
    this.thumb.destroy();
    this.button.destroy();
    this.buttonLabel.destroy();
  }

  private get visible(): boolean {
    return this.enabled && this.active;
  }

  private refresh(): void {
    const visible = this.visible;
    touchInput.visible = visible;
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
    this.button.setVisible(visible);
    this.buttonLabel.setVisible(visible);
    if (!visible) this.releaseAll();
  }

  private readonly onDown = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible) return;
    if (
      this.stickPointer === NO_POINTER &&
      Math.hypot(pointer.x - this.baseX, pointer.y - this.baseY) <= this.baseRadius * GRAB_FACTOR
    ) {
      this.stickPointer = pointer.id;
      this.updateStick(pointer);
      return;
    }
    if (
      this.buttonPointer === NO_POINTER &&
      Math.hypot(pointer.x - this.buttonX, pointer.y - this.buttonY) <=
        this.buttonRadius * GRAB_FACTOR
    ) {
      this.buttonPointer = pointer.id;
      this.button.setFillStyle(0xdc2626, 0.6).setScale(0.92);
      gameEvents.emit("touch:action", undefined);
    }
  };

  private readonly onMove = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id === this.stickPointer) this.updateStick(pointer);
  };

  private readonly onUp = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id === this.stickPointer) this.releaseStick();
    else if (pointer.id === this.buttonPointer) this.releaseButton();
  };

  private updateStick(pointer: Phaser.Input.Pointer): void {
    resolveStick(pointer.x - this.baseX, pointer.y - this.baseY, this.baseRadius, this.stick);
    stickDirections(this.stick, this.directions);
    touchInput.left = this.directions.left;
    touchInput.right = this.directions.right;
    touchInput.up = this.directions.up;
    touchInput.down = this.directions.down;
    this.thumb.setPosition(this.baseX + this.stick.x, this.baseY + this.stick.y);
    this.thumb.setAlpha(0.6 + 0.4 * this.stick.force);
  }

  private releaseStick(): void {
    this.stickPointer = NO_POINTER;
    resolveStick(0, 0, this.baseRadius, this.stick);
    clearTouchDirections();
    this.centreThumb();
  }

  private releaseButton(): void {
    this.buttonPointer = NO_POINTER;
    this.button.setFillStyle(0xdc2626, 0.32).setScale(1);
  }

  private releaseAll(): void {
    this.releaseStick();
    this.releaseButton();
  }

  private centreThumb(): void {
    this.thumb.setPosition(this.baseX, this.baseY).setAlpha(1);
  }
}
