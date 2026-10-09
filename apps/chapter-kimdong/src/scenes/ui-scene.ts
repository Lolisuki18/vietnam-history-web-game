import Phaser from "phaser";

import { GameAudio } from "../audio";
import { gameEvents } from "../events";
import { ClimaxPrompt } from "../systems/climax-prompt";
import { RhythmGame } from "../systems/rhythm-game";
import { TouchControls } from "../systems/touch-controls";

/** Windows narrower than this get the on-screen controls even without a touch screen. */
const SMALL_WINDOW_WIDTH = 700;

/**
 * Whether to show the virtual controls: touch-capable device, or a small window. The URL can
 * force it either way (`?touch=1` / `?touch=0`), which is handy for testing on a desktop.
 */
function wantsTouchControls(game: Phaser.Game, width: number): boolean {
  const forced = new URLSearchParams(window.location.search).get("touch");
  if (forced === "1") return true;
  if (forced === "0") return false;
  return game.device.input.touch || width < SMALL_WINDOW_WIDTH;
}

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

    this.touchControls = new TouchControls(this);

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.cleanups.push(
      () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this),
      gameEvents.on("banner", ({ text, ms }) => this.showBanner(text, ms)),
      gameEvents.on("rhythm:start", () => this.startRhythm()),
      gameEvents.on("climax:start", () => this.startClimax()),
      gameEvents.on("reset", () => this.clearOverlays()),
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

  private layout(): void {
    const { width, height } = this.scale;
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
