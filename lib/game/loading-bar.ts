import Phaser from "phaser";

const BAR_WIDTH = 320;
const BAR_HEIGHT = 18;

/**
 * A centred title with a progress bar for a preloader scene. Call `setProgress` from the loader's
 * progress event; it follows window resizes and removes its resize listener when the scene shuts
 * down.
 */
export class LoadingBar {
  private readonly title: Phaser.GameObjects.Text;
  private readonly back: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    label = "Đang tải…",
  ) {
    const { width, height } = scene.scale;
    this.title = scene.add
      .text(width / 2, height / 2 - 34, label, {
        fontFamily: "sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#fff7d6",
      })
      .setOrigin(0.5);
    this.back = scene.add
      .rectangle(width / 2, height / 2, BAR_WIDTH, BAR_HEIGHT, 0x000000, 0.5)
      .setStrokeStyle(2, 0xffe08a);
    this.fill = scene.add
      .rectangle(width / 2 - BAR_WIDTH / 2 + 2, height / 2, 1, BAR_HEIGHT - 4, 0xfacc15)
      .setOrigin(0, 0.5);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition),
    );
  }

  /** `value` is 0-1. */
  setProgress(value: number): void {
    this.fill.setSize(Math.max(1, (BAR_WIDTH - 4) * value), BAR_HEIGHT - 4);
  }

  private readonly reposition = (): void => {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    this.title.setPosition(w / 2, h / 2 - 34);
    this.back.setPosition(w / 2, h / 2);
    this.fill.setPosition(w / 2 - BAR_WIDTH / 2 + 2, h / 2);
  };
}
