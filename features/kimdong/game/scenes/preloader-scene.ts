import Phaser from "phaser";

import { LoadingBar } from "@/lib/game/loading-bar";

import { createAnimations } from "../assets/animations";
import {
  ASSET_KEYS,
  ASSET_URLS,
  AUDIO_KEYS,
  AUDIO_URLS,
  EMOTE_SHEET,
  imageUrl,
  LETTER_SHEET,
  LOOSE_IMAGE_KEYS,
  SFX_SHEET,
  SPRITE_FRAME,
} from "../assets/manifest";
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
    this.load.spritesheet(ASSET_KEYS.khoXanh, ASSET_URLS.khoXanh, frame);
    this.load.spritesheet(ASSET_KEYS.ducThanh, ASSET_URLS.ducThanh, frame);
    this.load.spritesheet(ASSET_KEYS.sfx, ASSET_URLS.sfx, {
      frameWidth: SFX_SHEET.frameSize,
      frameHeight: SFX_SHEET.frameSize,
    });
    this.load.spritesheet(ASSET_KEYS.letter, ASSET_URLS.letter, {
      frameWidth: LETTER_SHEET.frameWidth,
      frameHeight: LETTER_SHEET.frameHeight,
    });
    this.load.spritesheet(ASSET_KEYS.emotes, ASSET_URLS.emotes, {
      frameWidth: EMOTE_SHEET.frameSize,
      frameHeight: EMOTE_SHEET.frameSize,
    });
    this.load.spritesheet(ASSET_KEYS.soldierSleeping, ASSET_URLS.soldierSleeping, frame);
    this.load.spritesheet(ASSET_KEYS.soldierShooting, ASSET_URLS.soldierShooting, frame);
    this.load.spritesheet(ASSET_KEYS.soldierRunning, ASSET_URLS.soldierRunning, frame);
    this.load.spritesheet(ASSET_KEYS.kimdongClimb, ASSET_URLS.kimdongClimb, frame);
    this.load.spritesheet(ASSET_KEYS.kimdongShoot, ASSET_URLS.kimdongShoot, frame);
    this.load.spritesheet(ASSET_KEYS.kimdongFall, ASSET_URLS.kimdongFall, frame);
    this.load.spritesheet(ASSET_KEYS.kimdongHideRock, ASSET_URLS.kimdongHideRock, frame);
    this.load.image(ASSET_KEYS.tree, ASSET_URLS.tree);
    this.load.image(ASSET_KEYS.tower, ASSET_URLS.tower);
    for (const key of LOOSE_IMAGE_KEYS) this.load.image(key, imageUrl(key));

    // Audio assets: load every sound defined in AUDIO_URLS
    for (const [name, url] of Object.entries(AUDIO_URLS)) {
      const audioKey = AUDIO_KEYS[name as keyof typeof AUDIO_KEYS];
      if (audioKey) this.load.audio(audioKey, url);
    }
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
    createAnimations(this.anims, this.textures);

    this.scene.start("stealth");
  }

  private onProgress(value: number): void {
    this.loadingBar.setProgress(value);
  }

  private onFileError(file: Phaser.Loader.File): void {
    this.failed.push(file.key);
  }
}
