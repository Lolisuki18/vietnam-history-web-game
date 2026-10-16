import Phaser from "phaser";

import { TouchControls } from "@/lib/game/touch-controls";
import { wantsTouchControls } from "@/lib/game/touch-input";

import { IMAGE_KEYS } from "../assets/manifest";
import { gameEvents } from "../events";
import { touchInput } from "../input-state";

/**
 * Screen-space Phaser overlay running above the levels (no camera zoom, so positions are plain
 * pixels). Shows short banners and the pebble count, and draws the virtual touch controls.
 */
export class UiScene extends Phaser.Scene {
  private banner!: Phaser.GameObjects.Text;
  private bannerTween?: Phaser.Tweens.Tween;
  private counter?: {
    panel: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
  };
  private touchControls!: TouchControls;
  private readonly cleanups: Array<() => void> = [];

  constructor() {
    super("ui");
  }

  create(): void {
    this.banner = this.add
      .text(0, 0, "", {
        fontFamily: '"Roboto Slab", serif',
        fontSize: "24px",
        fontStyle: "bold",
        color: "#fff7d6",
        align: "center",
        backgroundColor: "#000000b0",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0);

    this.createCounter();
    this.touchControls = new TouchControls(this, touchInput, () =>
      gameEvents.emit("touch:action", undefined),
    );
    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    this.cleanups.push(
      () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this),
      gameEvents.on("banner", ({ text, ms }) => this.showBanner(text, ms)),
      gameEvents.on("reset", () => this.clearOverlays()),
      gameEvents.on("pebbles", ({ count, max }) => this.showPebbles(count, max)),
      gameEvents.on("controls:active", (active) => this.touchControls.setActive(active)),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touchControls.destroy();
      this.bannerTween?.stop();
      for (const cleanup of this.cleanups.splice(0)) cleanup();
    });
  }

  /** The pebble supply (forest only): the pebble picture and "3/6", under the web HUD. */
  private createCounter(): void {
    const panel = this.add
      .rectangle(0, 0, 92, 34, 0x0c0a09, 0.85)
      .setStrokeStyle(2, 0xb45309, 1)
      .setDepth(60);
    const icon = this.add.image(0, 0, IMAGE_KEYS.pebble).setDisplaySize(24, 24).setDepth(61);
    const label = this.add
      .text(0, 0, "", {
        fontFamily: '"Roboto Slab", serif',
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fde68a",
      })
      .setOrigin(0, 0.5)
      .setDepth(61);
    this.counter = { panel, icon, label };
    this.setCounterVisible(false);
  }

  private showPebbles(count: number, max: number): void {
    const counter = this.counter;
    if (!counter) return;
    if (max <= 0) {
      this.setCounterVisible(false);
      return;
    }
    counter.label.setText(`${count}/${max}`).setColor(count === 0 ? "#fca5a5" : "#fde68a");
    this.setCounterVisible(true);
  }

  private setCounterVisible(visible: boolean): void {
    const counter = this.counter;
    if (!counter) return;
    counter.panel.setVisible(visible);
    counter.icon.setVisible(visible);
    counter.label.setVisible(visible);
  }

  private layout(): void {
    const { width, height } = this.scale;
    const counter = this.counter;
    if (counter) {
      // Under the alert meter on a wide screen; below the whole web HUD on a phone held upright.
      const x = width - 66;
      const y = width < 640 ? 150 : 82;
      counter.panel.setPosition(x, y);
      counter.icon.setPosition(x - 28, y);
      counter.label.setPosition(x - 8, y);
    }
    this.banner.setPosition(width / 2, Math.max(height * 0.3, 130));
    this.banner.setWordWrapWidth(Math.max(200, width * 0.8));
    this.touchControls.setEnabled(wantsTouchControls(this.sys.game, width));
    this.touchControls.layout(width, height);
  }

  private clearOverlays(): void {
    this.touchControls.setActive(false);
    this.bannerTween?.stop();
    this.banner.setAlpha(0);
  }

  private showBanner(text: string, ms: number): void {
    this.bannerTween?.stop();
    this.banner.setText(text).setAlpha(1);
    this.bannerTween = this.tweens.add({
      targets: this.banner,
      alpha: 0,
      delay: Math.max(0, ms - 400),
      duration: 400,
    });
  }
}
