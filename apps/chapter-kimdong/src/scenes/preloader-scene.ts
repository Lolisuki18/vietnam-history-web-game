import Phaser from "phaser";

import { createAnimations } from "../assets/animations";
import { ASSET_KEYS, ASSET_URLS, SPRITE_FRAME } from "../assets/manifest";
import { createPlaceholderTextures } from "../assets/placeholder-art";

const BAR_WIDTH = 320;
const BAR_HEIGHT = 18;

/**
 * Loads the artwork before the game starts and shows a loading bar. Files that cannot be
 * loaded (not drawn yet) are replaced by generated stand-ins, so the game never breaks.
 */
export class PreloaderScene extends Phaser.Scene {
  private barFill!: Phaser.GameObjects.Rectangle;
  private barBack!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private readonly failed: string[] = [];

  constructor() {
    super("preload");
  }

  init(): void {
    this.failed.length = 0;
  }

  preload(): void {
    this.createLoadingBar();

    this.load.on(Phaser.Loader.Events.PROGRESS, this.onProgress, this);
    // A missing file is expected until the artwork is added: remember it and carry on.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onFileError, this);

    const frame = { frameWidth: SPRITE_FRAME.width, frameHeight: SPRITE_FRAME.height };
    this.load.spritesheet(ASSET_KEYS.kimdong, ASSET_URLS.kimdong, frame);
    this.load.spritesheet(ASSET_KEYS.soldier, ASSET_URLS.soldier, frame);
    this.load.image(ASSET_KEYS.letter, ASSET_URLS.letter);
    this.load.image(ASSET_KEYS.bush, ASSET_URLS.bush);
    this.load.image(ASSET_KEYS.tiles, ASSET_URLS.tiles);
    this.load.tilemapTiledJSON(ASSET_KEYS.map, ASSET_URLS.map);
  }

  create(): void {
    this.load.off(Phaser.Loader.Events.PROGRESS, this.onProgress, this);
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onFileError, this);

    if (this.failed.length > 0) {
      console.info(
        `[kimdong] Using stand-in art for: ${this.failed.join(", ")} (add the files under public/assets to replace them).`,
      );
    }
    createPlaceholderTextures(this);
    createAnimations(this.anims);

    this.scene.start("stealth");
  }

  private createLoadingBar(): void {
    const { width, height } = this.scale;
    this.title = this.add
      .text(width / 2, height / 2 - 34, "Đang tải…", {
        fontFamily: "sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#fff7d6",
      })
      .setOrigin(0.5);
    this.barBack = this.add
      .rectangle(width / 2, height / 2, BAR_WIDTH, BAR_HEIGHT, 0x000000, 0.5)
      .setStrokeStyle(2, 0xffe08a);
    this.barFill = this.add
      .rectangle(width / 2 - BAR_WIDTH / 2 + 2, height / 2, 1, BAR_HEIGHT - 4, 0xfacc15)
      .setOrigin(0, 0.5);

    const reposition = (): void => {
      const w = this.scale.width;
      const h = this.scale.height;
      this.title.setPosition(w / 2, h / 2 - 34);
      this.barBack.setPosition(w / 2, h / 2);
      this.barFill.setPosition(w / 2 - BAR_WIDTH / 2 + 2, h / 2);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, reposition);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off(Phaser.Scale.Events.RESIZE, reposition),
    );
  }

  private onProgress(value: number): void {
    this.barFill.setSize(Math.max(1, (BAR_WIDTH - 4) * value), BAR_HEIGHT - 4);
  }

  private onFileError(file: Phaser.Loader.File): void {
    this.failed.push(file.key);
  }
}
