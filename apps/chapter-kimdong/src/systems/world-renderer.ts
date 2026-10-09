import { distanceToPolyline, sampleCatmullRom, type Point } from "@vhg/engine";
import Phaser from "phaser";

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
  bushDark: 0x14301a,
  bushMid: 0x1d4325,
  bushLeaf: 0x2f6a38,
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

function drawBushes(g: Phaser.GameObjects.Graphics, rng: Phaser.Math.RandomDataGenerator): void {
  for (const bush of BUSHES) {
    g.fillStyle(COLORS.bushDark, 1);
    g.fillCircle(bush.x, bush.y, bush.r);
    g.fillStyle(COLORS.bushMid, 1);
    g.fillCircle(bush.x - bush.r * 0.15, bush.y - bush.r * 0.15, bush.r * 0.8);
    g.fillStyle(COLORS.bushLeaf, 1);
    for (let i = 0; i < 9; i++) {
      const angle = rng.realInRange(0, Math.PI * 2);
      const dist = rng.realInRange(0, bush.r * 0.7);
      g.fillCircle(bush.x + Math.cos(angle) * dist, bush.y + Math.sin(angle) * dist, 4);
    }
    g.lineStyle(2, 0x0c2010, 0.9);
    g.strokeCircle(bush.x, bush.y, bush.r);
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
export function createWorldImage(scene: Phaser.Scene): Phaser.GameObjects.Image {
  if (!scene.textures.exists(WORLD_TEXTURE_KEY)) {
    const rng = new Phaser.Math.RandomDataGenerator(["kim-dong-world"]);
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    drawGround(g, rng);
    drawTrails(g);
    drawRiver(g);
    drawOutpost(g);
    drawScenery(g, rng);
    drawBushes(g, rng);
    drawTree(g);
    g.generateTexture(WORLD_TEXTURE_KEY, WORLD.width, WORLD.height);
    g.destroy();
  }
  return scene.add.image(0, 0, WORLD_TEXTURE_KEY).setOrigin(0, 0).setDepth(0);
}
