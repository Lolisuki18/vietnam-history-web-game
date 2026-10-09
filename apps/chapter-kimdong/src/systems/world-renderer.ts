import { distanceToPolyline, sampleCatmullRom, type Point } from "@vhg/engine";
import Phaser from "phaser";

import { ASSET_KEYS, BUSH_DISPLAY_FACTOR } from "../assets/manifest";
import {
  BUSHES,
  GUARD_ROUTES,
  LETTER_SPOTS,
  OUTPOST,
  PLAYER_START,
  RIVER_POLYLINE,
  RIVER_WIDTH,
  TRAILS,
  TREE,
  WORLD,
} from "../world-data";

export const WORLD_TEXTURE_KEY = "kimdong-world";

const COLORS = {
  ground: 0x2c5a35,
  groundPatch: 0x356b3f,
  groundDark: 0x234a2c,
  trailEdge: 0x6b4d31,
  trail: 0x8a6a45,
  bank: 0x4f4a2f,
  water: 0x2f7bc0,
  waterLight: 0x7cc0f0,
  outpostFloor: 0x4a4034,
  treeShadow: 0x143020,
  treeCanopy: 0x1f4a2a,
  treeLight: 0x2f6b3b,
  trunk: 0x4a3320,
} as const;

function strokePolyline(g: Phaser.GameObjects.Graphics, points: readonly Point[]): void {
  const first = points[0];
  if (!first) return;
  g.beginPath();
  g.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i]!.x, points[i]!.y);
  g.strokePath();
}

function drawGround(g: Phaser.GameObjects.Graphics, rng: Phaser.Math.RandomDataGenerator): void {
  g.fillStyle(COLORS.ground, 1);
  g.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let i = 0; i < 110; i++) {
    g.fillStyle(rng.pick([COLORS.groundPatch, COLORS.groundDark]), 0.55);
    g.fillCircle(rng.between(0, WORLD.width), rng.between(0, WORLD.height), rng.between(30, 110));
  }
}

function drawTrails(g: Phaser.GameObjects.Graphics): void {
  for (const trail of TRAILS) {
    const points = sampleCatmullRom(trail, 10);
    g.lineStyle(72, COLORS.trailEdge, 1);
    strokePolyline(g, points);
    g.lineStyle(58, COLORS.trail, 1);
    strokePolyline(g, points);
  }
}

function drawRiver(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(RIVER_WIDTH + 34, COLORS.bank, 1);
  strokePolyline(g, RIVER_POLYLINE);
  g.lineStyle(RIVER_WIDTH, COLORS.water, 1);
  strokePolyline(g, RIVER_POLYLINE);
  // Light streaks give the water some flow.
  g.lineStyle(5, COLORS.waterLight, 0.45);
  for (const offset of [-26, 22]) {
    strokePolyline(
      g,
      RIVER_POLYLINE.map((p) => ({ x: p.x + offset, y: p.y })),
    );
  }
}

function drawOutpost(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLORS.outpostFloor, 1);
  g.fillRect(OUTPOST.x, OUTPOST.y, OUTPOST.w, OUTPOST.h);
  g.fillStyle(0x5b4a37, 1);
  for (const crate of [
    { x: OUTPOST.x + 50, y: OUTPOST.y + 40 },
    { x: OUTPOST.x + 360, y: OUTPOST.y + 280 },
    { x: OUTPOST.x + 380, y: OUTPOST.y + 50 },
  ]) {
    g.fillRect(crate.x, crate.y, 36, 36);
  }
}

function drawTree(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLORS.treeShadow, 0.5);
  g.fillCircle(TREE.x + 14, TREE.y + 16, TREE.r + 6);
  g.fillStyle(COLORS.trunk, 1);
  g.fillCircle(TREE.x, TREE.y, 26);
  g.fillStyle(COLORS.treeCanopy, 1);
  g.fillCircle(TREE.x, TREE.y, TREE.r);
  g.fillStyle(COLORS.treeLight, 1);
  g.fillCircle(TREE.x - 22, TREE.y - 22, TREE.r * 0.55);
  g.fillCircle(TREE.x + 26, TREE.y + 8, TREE.r * 0.4);
  g.lineStyle(3, 0x10281a, 1);
  g.strokeCircle(TREE.x, TREE.y, TREE.r);
}

/** Decorative trees: scattered everywhere except near gameplay-relevant spots. */
function drawScenery(g: Phaser.GameObjects.Graphics, rng: Phaser.Math.RandomDataGenerator): void {
  const keepClear: { x: number; y: number; r: number }[] = [
    { x: PLAYER_START.x, y: PLAYER_START.y, r: 220 },
    { x: TREE.x, y: TREE.y, r: TREE.r + 120 },
    { x: OUTPOST.x + OUTPOST.w / 2, y: OUTPOST.y + OUTPOST.h / 2, r: 330 },
    ...LETTER_SPOTS.map((p) => ({ ...p, r: 120 })),
    ...BUSHES.map((b) => ({ x: b.x, y: b.y, r: b.r + 70 })),
    ...GUARD_ROUTES.flatMap((route) => route.path.map((p) => ({ ...p, r: 90 }))),
  ];
  const trailPoints = TRAILS.flatMap((trail) => sampleCatmullRom(trail, 4));

  let placed = 0;
  for (let attempt = 0; attempt < 600 && placed < 130; attempt++) {
    const x = rng.between(0, WORLD.width);
    const y = rng.between(0, WORLD.height);
    const radius = rng.between(26, 52);
    if (distanceToPolyline(x, y, RIVER_POLYLINE) < RIVER_WIDTH / 2 + radius + 30) continue;
    if (keepClear.some((c) => Math.hypot(x - c.x, y - c.y) < c.r + radius)) continue;
    if (trailPoints.some((p) => Math.hypot(x - p.x, y - p.y) < 55 + radius)) continue;

    g.fillStyle(COLORS.treeShadow, 0.45);
    g.fillCircle(x + 8, y + 10, radius + 3);
    g.fillStyle(COLORS.treeCanopy, 1);
    g.fillCircle(x, y, radius);
    g.fillStyle(COLORS.treeLight, 1);
    g.fillCircle(x - radius * 0.28, y - radius * 0.28, radius * 0.55);
    placed++;
  }
}

/**
 * Paint the static world once into a texture and return an image showing it.
 * Baking avoids re-running ~1000 draw commands on every frame, and the texture is reused
 * when the scene restarts.
 */
function createBakedWorld(scene: Phaser.Scene): Phaser.GameObjects.Image {
  if (!scene.textures.exists(WORLD_TEXTURE_KEY)) {
    const rng = new Phaser.Math.RandomDataGenerator(["kim-dong-world"]);
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    drawGround(g, rng);
    drawTrails(g);
    drawRiver(g);
    drawOutpost(g);
    drawScenery(g, rng);
    drawTree(g);
    g.generateTexture(WORLD_TEXTURE_KEY, WORLD.width, WORLD.height);
    g.destroy();
  }
  return scene.add.image(0, 0, WORLD_TEXTURE_KEY).setOrigin(0, 0).setDepth(0);
}

/** Tile layers whose name starts with this are drawn above the characters (tree canopies...). */
const ABOVE_LAYER_PREFIX = "above";
const ABOVE_LAYER_DEPTH = 30;

/**
 * Build the environment from the Tiled map (`level1.json` + `forest_tiles.png`) when both were
 * loaded. The map is only scenery: it is stretched to the world size and every tile layer is
 * created in file order. Returns false (and leaves nothing behind) when the files are missing
 * or unusable, so the caller can fall back to the baked world.
 */
function createTilemapWorld(scene: Phaser.Scene): boolean {
  if (!scene.cache.tilemap.exists(ASSET_KEYS.map) || !scene.textures.exists(ASSET_KEYS.tiles)) {
    return false;
  }
  try {
    const map = scene.make.tilemap({ key: ASSET_KEYS.map });
    const tilesetName = map.tilesets[0]?.name;
    const tileset = tilesetName ? map.addTilesetImage(tilesetName, ASSET_KEYS.tiles) : null;
    if (!tileset || map.layers.length === 0) return false;

    const scaleX = WORLD.width / map.widthInPixels;
    const scaleY = WORLD.height / map.heightInPixels;
    let created = 0;
    map.layers.forEach((layerData, index) => {
      const layer = map.createLayer(layerData.name, tileset, 0, 0);
      if (!layer) return;
      layer.setScale(scaleX, scaleY);
      layer.setDepth(
        layerData.name.toLowerCase().startsWith(ABOVE_LAYER_PREFIX)
          ? ABOVE_LAYER_DEPTH
          : index * 0.01,
      );
      created++;
    });
    return created > 0;
  } catch (error) {
    console.warn("[kimdong] level1.json could not be used, drawing the built-in world.", error);
    return false;
  }
}

/** The ground, river, trails and trees: from the tilemap if there is one, else drawn in code. */
export function createWorld(scene: Phaser.Scene): void {
  if (!createTilemapWorld(scene)) createBakedWorld(scene);
}

/** The hiding bushes. Their hiding radius (world-data.ts) is what counts, not the image. */
export function createBushes(scene: Phaser.Scene): void {
  for (const bush of BUSHES) {
    const image = scene.add.image(bush.x, bush.y, ASSET_KEYS.bush).setDepth(3);
    image.setScale((bush.r * BUSH_DISPLAY_FACTOR) / Math.max(image.width, image.height));
  }
}
