import Phaser from "phaser";

import { LoadingBar } from "@/lib/game/loading-bar";

import { createAnimations } from "../assets/animations";
import {
  AUDIO_KEYS,
  AUDIO_URLS,
  EMOTE_SHEET,
  EXPLOSION_SHEET,
  IMAGE_URLS,
  PAPER_SHEET,
  SPRITE_FRAME,
  SPRITE_URLS,
  type AudioName,
} from "../assets/manifest";
import { createPlaceholderTextures } from "../assets/placeholder-art";

/** Images that hold several frames: key -> frame size. Every other image loads as one picture. */
const SHEETS: Readonly<Record<string, { frameWidth: number; frameHeight: number }>> = {
  [EMOTE_SHEET.key]: { frameWidth: EMOTE_SHEET.frameSize, frameHeight: EMOTE_SHEET.frameSize },
  [PAPER_SHEET.key]: { frameWidth: PAPER_SHEET.frame, frameHeight: PAPER_SHEET.frame },
  [EXPLOSION_SHEET.key]: { frameWidth: EXPLOSION_SHEET.frame, frameHeight: EXPLOSION_SHEET.frame },
};

/**
 * Loads the artwork before the game starts and shows a loading bar. Files that cannot be loaded
 * (not drawn yet) are replaced by generated stand-ins, so the game never breaks.
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
    this.loadingBar = new LoadingBar(this, "Đang tải…");
    this.load.on(Phaser.Loader.Events.PROGRESS, this.onProgress, this);
    // A missing file is expected until the artwork is added: remember it and carry on.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onFileError, this);

    for (const [key, url] of Object.entries(SPRITE_URLS)) {
      this.load.spritesheet(key, url, {
        frameWidth: SPRITE_FRAME.width,
        frameHeight: SPRITE_FRAME.height,
      });
    }
    for (const [key, url] of Object.entries(IMAGE_URLS)) {
      const sheet = SHEETS[key];
      if (sheet) this.load.spritesheet(key, url, sheet);
      else this.load.image(key, url);
    }
    for (const [name, url] of Object.entries(AUDIO_URLS)) {
      this.load.audio(AUDIO_KEYS[name as AudioName], url);
    }
  }

  create(): void {
    this.load.off(Phaser.Loader.Events.PROGRESS, this.onProgress, this);
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onFileError, this);

    if (this.failed.length > 0) {
      console.info(
        `[vothisau] Using stand-in art for ${this.failed.length} file(s) not made yet (see docs/VoThiSau/05-Asset-con-thieu.md).`,
      );
    }
    createPlaceholderTextures(this);
    createAnimations(this.anims, this.textures);
    this.scene.start("forest");
  }

  private onProgress(value: number): void {
    this.loadingBar.setProgress(value);
  }

  private onFileError(file: Phaser.Loader.File): void {
    this.failed.push(file.key);
  }
}
