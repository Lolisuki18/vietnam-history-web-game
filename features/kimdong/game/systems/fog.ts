import type Phaser from "phaser";

import { ASSET_KEYS } from "../assets/manifest";

/**
 * Final opacity, drift speed (px/s) and picture scale of the mist layers. The pictures are already
 * translucent (about 18 % and 9 % opaque on average), so they are used at full strength: a far,
 * big, slow layer and two nearer ones drifting in opposite directions.
 */
const LAYERS = [
  { key: ASSET_KEYS.fogA, alpha: 0.8, speed: 7, scale: 1.8, offsetY: 200 },
  { key: ASSET_KEYS.fogA, alpha: 1, speed: 14, scale: 1, offsetY: 0 },
  { key: ASSET_KEYS.fogB, alpha: 1, speed: -22, scale: 1.3, offsetY: 90 },
] as const;
const FOG_DEPTH = 35;

/**
 * Mist that rolls over the forest in the middle of the chapter. Two screen-sized, seamless layers
 * drift in opposite directions. Does nothing when the pictures did not load. The camera zoom is
 * taken into account so the layers always cover the whole screen.
 */
export class Fog {
  private readonly layers: Phaser.GameObjects.TileSprite[] = [];
  private readonly specs: (typeof LAYERS)[number][] = [];
  private active = false;
  private lastKey = "";

  constructor(private readonly scene: Phaser.Scene) {
    for (const layer of LAYERS) {
      if (!scene.textures.exists(layer.key)) continue;
      const tile = scene.add
        .tileSprite(0, 0, 10, 10, layer.key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(FOG_DEPTH)
        .setAlpha(0);
      tile.setTileScale(layer.scale, layer.scale);
      tile.tilePositionY = layer.offsetY;
      this.layers.push(tile);
      this.specs.push(layer);
    }
  }

  get isActive(): boolean {
    return this.active;
  }

  /** Let the mist in over `ms` milliseconds. */
  fadeIn(ms: number): void {
    if (this.active || this.layers.length === 0) return;
    this.active = true;
    this.layers.forEach((layer, index) => {
      this.scene.tweens.add({ targets: layer, alpha: this.specs[index]!.alpha, duration: ms });
    });
  }

  update(dt: number): void {
    if (this.layers.length === 0) return;
    this.fit();
    this.layers.forEach((layer, index) => {
      layer.tilePositionX += this.specs[index]!.speed * dt;
    });
  }

  /** Cover the screen: a scroll-factor-0 object is scaled by the camera zoom about its centre. */
  private fit(): void {
    const camera = this.scene.cameras.main;
    const { width, height } = this.scene.scale;
    const key = `${width}x${height}@${camera.zoom}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    const w = width / camera.zoom;
    const h = height / camera.zoom;
    for (const layer of this.layers) {
      layer.setPosition((width - w) / 2, (height - h) / 2).setSize(w, h);
    }
  }

  destroy(): void {
    for (const layer of this.layers) {
      this.scene.tweens.killTweensOf(layer);
      layer.destroy();
    }
    this.layers.length = 0;
  }
}
