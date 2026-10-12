import Phaser from "phaser";

import { LoadingBar } from "@/lib/game/loading-bar";

import { createAnimations } from "../assets/animations";
import { ASSET_KEYS, ASSET_URLS, SPRITE_FRAME } from "../assets/manifest";
import { createPlaceholderTextures } from "../assets/placeholder-art";

/**
 * Loads the artwork before the game starts and shows a loading bar. Files that cannot be
 * loaded (not drawn yet) are replaced by generated stand-ins, so the game never breaks.
 */
export class PreloaderScene extends Phaser.Scene {
  private loadingBar!: LoadingBar;
  private readonly failed: string[] = [];

  constructor() {
    super("preload");
  }

  init(): void {
    this.failed.length = 0;
  }

  preload(): void {
    this.loadingBar = new LoadingBar(this);

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

  private onProgress(value: number): void {
    this.loadingBar.setProgress(value);
  }

  private onFileError(file: Phaser.Loader.File): void {
    this.failed.push(file.key);
  }
}
