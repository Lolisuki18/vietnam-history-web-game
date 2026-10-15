import Phaser from "phaser";

import { TouchControls } from "@/lib/game/touch-controls";
import { wantsTouchControls } from "@/lib/game/touch-input";

import { ASSET_KEYS } from "../assets/manifest";
import { GameAudio } from "../audio";
import { gameEvents } from "../events";
import { touchInput } from "../input-state";
import { ClimaxPrompt } from "../systems/climax-prompt";
import { RhythmGame } from "../systems/rhythm-game";

/**
 * Screen-space Phaser overlay running above the gameplay scenes (no camera zoom, so
 * positions are plain pixels). Shows short banners, hosts the rhythm mini-game and the
 * ambush prompt, and draws the virtual touch controls.
 */
export class UiScene extends Phaser.Scene {
  private banner!: Phaser.GameObjects.Text;
  private bannerTween?: Phaser.Tweens.Tween;
  private rhythm?: RhythmGame;
  private climax?: ClimaxPrompt;
  private pebbleCounter?: {
    panel: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
    label: Phaser.GameObjects.Text;
  };
  private touchControls!: TouchControls;
  private audio!: GameAudio;
  private readonly cleanups: Array<() => void> = [];

  constructor() {
    super("ui");
  }

  create(): void {
    this.audio = new GameAudio(this);
    this.banner = this.add
      .text(0, 0, "", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        backgroundColor: "#000000b0",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0);

    this.createPebbleCounter();

    this.touchControls = new TouchControls(this, touchInput, () =>
      gameEvents.emit("touch:action", undefined),
    );

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.cleanups.push(
      () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this),
      gameEvents.on("banner", ({ text, ms }) => this.showBanner(text, ms)),
      gameEvents.on("rhythm:start", () => this.startRhythm()),
      gameEvents.on("climax:start", () => this.startClimax()),
      gameEvents.on("reset", () => this.clearOverlays()),
      gameEvents.on("pebbles", ({ count, max }) => this.showPebbles(count, max)),
      gameEvents.on("resumed", (frozenMs) => {
        this.rhythm?.shift(frozenMs);
        this.climax?.shift(frozenMs);
      }),
      gameEvents.on("controls:active", (active) => this.touchControls.setActive(active)),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touchControls.destroy();
      this.destroyGameOverlays();
      this.bannerTween?.stop();
      for (const cleanup of this.cleanups.splice(0)) cleanup();
    });
  }

  override update(time: number): void {
    this.rhythm?.update(time);
    this.climax?.update(time);
  }

  /** The pebble supply: the pebble picture and "3/6", under the web HUD at the top right. */
  private createPebbleCounter(): void {
    const panel = this.add
      .rectangle(0, 0, 92, 34, 0x0c0a09, 0.85)
      .setStrokeStyle(2, 0xf59e0b, 1)
      .setDepth(60);
    const icon = this.textures.exists(ASSET_KEYS.pebbleItem)
      ? this.add.image(0, 0, ASSET_KEYS.pebbleItem, 0).setDisplaySize(26, 26).setDepth(61)
      : this.add.circle(0, 0, 8, 0xa8a29e).setStrokeStyle(2, 0x44403c).setDepth(61);
    const label = this.add
      .text(0, 0, "", {
        fontFamily: '"Roboto Slab", serif',
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fde68a",
      })
      .setOrigin(0, 0.5)
      .setDepth(61);
    this.pebbleCounter = { panel, icon, label };
    this.setPebbleCounterVisible(false); // shown once the stealth scene reports its supply
  }

  private showPebbles(count: number, max: number): void {
    const counter = this.pebbleCounter;
    if (!counter) return;
    counter.label.setText(`${count}/${max}`).setColor(count === 0 ? "#fca5a5" : "#fde68a");
    this.setPebbleCounterVisible(true);
  }

  private setPebbleCounterVisible(visible: boolean): void {
    const counter = this.pebbleCounter;
    if (!counter) return;
    counter.panel.setVisible(visible);
    counter.icon.setVisible(visible);
    counter.label.setVisible(visible);
  }

  private layout(): void {
    const { width, height } = this.scale;
    const counter = this.pebbleCounter;
    if (counter) {
      // Under the alert meter on a wide screen; below the whole web HUD on a phone held upright.
      const x = width - 66;
      const y = width < 640 ? 150 : 82;
      counter.panel.setPosition(x, y);
      counter.icon.setPosition(x - 28, y);
      counter.label.setPosition(x - 8, y);
    }
    // Below the web HUD, which fills the top ~160px on a phone held upright.
    this.banner.setPosition(width / 2, Math.max(height * 0.3, 130));
    this.banner.setWordWrapWidth(Math.max(200, width * 0.8));
    this.rhythm?.layout(width, height);
    this.climax?.layout(width, height);
    this.touchControls.setEnabled(wantsTouchControls(this.sys.game, width));
    this.touchControls.layout(width, height);
  }

  private startRhythm(): void {
    this.rhythm?.destroy();
    const rhythm = new RhythmGame(this, this.audio, {
      onNote: (hit) => gameEvents.emit("rhythm:note", { hit }),
      onDone: (result) => {
        rhythm.destroy();
        if (this.rhythm === rhythm) this.rhythm = undefined;
        gameEvents.emit("rhythm:done", result);
      },
    });
    this.rhythm = rhythm;
    rhythm.layout(this.scale.width, this.scale.height);
    rhythm.start(this.time.now);
  }

  private startClimax(): void {
    this.climax?.destroy();
    const climax = new ClimaxPrompt(this, {
      onResult: (acted) => {
        climax.destroy();
        if (this.climax === climax) this.climax = undefined;
        gameEvents.emit("climax:result", { acted });
      },
    });
    this.climax = climax;
    climax.layout(this.scale.width, this.scale.height);
    climax.start(this.time.now);
  }

  private destroyGameOverlays(): void {
    this.rhythm?.destroy();
    this.rhythm = undefined;
    this.climax?.destroy();
    this.climax = undefined;
  }

  private clearOverlays(): void {
    this.destroyGameOverlays();
    this.touchControls.setActive(false);
    this.bannerTween?.stop();
    this.banner.setAlpha(0);
    // A new scene starts: the pebble counter comes back when it reports its supply.
    this.setPebbleCounterVisible(false);
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
