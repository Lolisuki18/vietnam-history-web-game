import type Phaser from "phaser";

import { ASSET_KEYS, KIMDONG_SHEET, SOLDIER_SHEET, SPRITE_FRAME } from "./manifest";

/**
 * Stand-in artwork drawn with Graphics and baked into textures that have exactly the same
 * keys, frame sizes and sheet layouts as the real files in `public/assets`. When a file is
 * missing the game uses these, so it always runs; drop the real file in and it takes over.
 */

const SKIN = 0xf2c9a0;
const FRAME_W = SPRITE_FRAME.width;
const FRAME_H = SPRITE_FRAME.height;

type Drawer = (g: Phaser.GameObjects.Graphics) => void;

/** Bake `draw` into a texture of the given size. */
function bake(scene: Phaser.Scene, key: string, width: number, height: number, draw: Drawer): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

/** Register the numbered frames of a baked sheet so animations can refer to them by index. */
function addSheetFrames(scene: Phaser.Scene, key: string, columns: number, rows: number): void {
  const texture = scene.textures.get(key);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      texture.add(row * columns + column, 0, column * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
    }
  }
}

function drawKimDongFrame(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  row: number,
  column: number,
): void {
  const rows = KIMDONG_SHEET.rows;
  const bob = column % 2 === 1 ? 2 : 0;
  const swimming = row === rows.swim;

  if (!swimming) {
    // Legs: the two legs alternate every frame.
    g.fillStyle(0x1e3a8a, 1);
    g.fillRect(x0 + 9, y0 + 34 + (column % 2 === 1 ? -2 : 0), 6, 10);
    g.fillRect(x0 + 17, y0 + 34 + (column % 2 === 1 ? 0 : -2), 6, 10);
  }
  // Indigo shirt with a white outline.
  const bodyTop = y0 + (swimming ? 25 : 19) + bob;
  const bodyHeight = swimming ? 9 : 16;
  g.fillStyle(0xffffff, 1);
  g.fillRect(x0 + 7, bodyTop - 1, 18, bodyHeight + 2);
  g.fillStyle(0x2f6fdb, 1);
  g.fillRect(x0 + 8, bodyTop, 16, bodyHeight);
  // Head and hat.
  const headY = y0 + (swimming ? 19 : 13) + bob;
  g.fillStyle(SKIN, 1);
  g.fillCircle(x0 + 16, headY, 7);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(x0 + 16, headY - 6, 22, 9);
  g.lineStyle(1, 0xcbd5e1, 1);
  g.strokeEllipse(x0 + 16, headY - 6, 22, 9);
  // Face: eyes show where the character looks; seen from behind there are none.
  g.fillStyle(0x1f2937, 1);
  if (row === rows.down || swimming) {
    g.fillRect(x0 + 12, headY - 1, 2, 2);
    g.fillRect(x0 + 19, headY - 1, 2, 2);
  } else if (row === rows.left) {
    g.fillRect(x0 + 11, headY - 1, 2, 2);
  } else if (row === rows.right) {
    g.fillRect(x0 + 20, headY - 1, 2, 2);
  } else {
    g.fillStyle(0x3b2a1a, 1);
    g.fillCircle(x0 + 16, headY - 1, 5);
  }
  if (swimming) {
    // Water ripples over the lower half.
    g.fillStyle(0x7cc0f0, 0.85);
    g.fillEllipse(x0 + 16, y0 + 33 + (bob ? 1 : 0), 30, 7);
    g.fillStyle(0xbfe3fa, 0.8);
    g.fillEllipse(x0 + 16, y0 + 33 + (bob ? 1 : 0), 20, 3);
  }
}

function drawSoldierFrame(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  row: number,
  column: number,
): void {
  const facingLeft = row === SOLDIER_SHEET.rows.left;
  const bob = column % 2 === 1 ? 2 : 0;

  g.fillStyle(0x4b4a2c, 1);
  g.fillRect(x0 + 9, y0 + 34 + (column % 2 === 1 ? -2 : 0), 6, 10);
  g.fillRect(x0 + 17, y0 + 34 + (column % 2 === 1 ? 0 : -2), 6, 10);
  // Khaki uniform.
  g.fillStyle(0x8c8a52, 1);
  g.fillRect(x0 + 8, y0 + 19 + bob, 16, 16);
  g.fillStyle(0x5f5d33, 1);
  g.fillRect(x0 + 8, y0 + 30 + bob, 16, 3);
  // Rifle.
  g.fillStyle(0x3f3f46, 1);
  g.fillRect(facingLeft ? x0 + 2 : x0 + 25, y0 + 16 + bob, 4, 18);
  // Head, eye and helmet.
  g.fillStyle(SKIN, 1);
  g.fillCircle(x0 + 16, y0 + 13 + bob, 6);
  g.fillStyle(0x1f2937, 1);
  g.fillRect(facingLeft ? x0 + 12 : x0 + 19, y0 + 12 + bob, 2, 2);
  g.fillStyle(0x3f4a2c, 1);
  g.fillEllipse(x0 + 16, y0 + 8 + bob, 24, 11);
  g.fillStyle(0xb91c1c, 1);
  g.fillRect(x0 + 13, y0 + 9 + bob, 6, 2);
}

function drawLetter(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x92400e, 1);
  g.fillRect(0, 0, 28, 20);
  g.fillStyle(0xfacc15, 1);
  g.fillRect(2, 2, 24, 16);
  g.lineStyle(2, 0x92400e, 1);
  g.beginPath();
  g.moveTo(2, 2);
  g.lineTo(14, 11);
  g.lineTo(26, 2);
  g.strokePath();
}

function drawBush(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x14301a, 1);
  g.fillCircle(64, 64, 62);
  g.fillStyle(0x1d4325, 1);
  g.fillCircle(56, 56, 50);
  g.fillStyle(0x2f6a38, 1);
  // A fixed pattern of leaves (deterministic, so the fallback always looks the same).
  for (let i = 0; i < 16; i++) {
    const angle = i * 2.399;
    const dist = 10 + ((i * 17) % 38);
    g.fillCircle(64 + Math.cos(angle) * dist, 64 + Math.sin(angle) * dist, 6);
  }
  g.lineStyle(3, 0x0c2010, 1);
  g.strokeCircle(64, 64, 61);
}

/**
 * Create stand-in textures for every key in `missing`. Keys that loaded fine (the real files
 * exist) are skipped. The tileset / tilemap have no stand-in: without them the baked world
 * of `world-renderer.ts` is used instead.
 */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const textures = scene.textures;

  if (!textures.exists(ASSET_KEYS.kimdong)) {
    const { columns, rows } = KIMDONG_SHEET;
    const rowCount = Object.keys(rows).length;
    bake(scene, ASSET_KEYS.kimdong, columns * FRAME_W, rowCount * FRAME_H, (g) => {
      for (let row = 0; row < rowCount; row++) {
        for (let column = 0; column < columns; column++) {
          drawKimDongFrame(g, column * FRAME_W, row * FRAME_H, row, column);
        }
      }
    });
    addSheetFrames(scene, ASSET_KEYS.kimdong, columns, rowCount);
  }

  if (!textures.exists(ASSET_KEYS.soldier)) {
    const { columns, rows } = SOLDIER_SHEET;
    const rowCount = Object.keys(rows).length;
    bake(scene, ASSET_KEYS.soldier, columns * FRAME_W, rowCount * FRAME_H, (g) => {
      for (let row = 0; row < rowCount; row++) {
        for (let column = 0; column < columns; column++) {
          drawSoldierFrame(g, column * FRAME_W, row * FRAME_H, row, column);
        }
      }
    });
    addSheetFrames(scene, ASSET_KEYS.soldier, columns, rowCount);
  }

  if (!textures.exists(ASSET_KEYS.letter)) bake(scene, ASSET_KEYS.letter, 28, 20, drawLetter);
  if (!textures.exists(ASSET_KEYS.bush)) bake(scene, ASSET_KEYS.bush, 128, 128, drawBush);
}
