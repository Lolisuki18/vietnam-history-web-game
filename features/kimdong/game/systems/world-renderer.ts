import { distanceToPolyline, sampleCatmullRom, type Point } from "@/lib/engine";
import Phaser from "phaser";

import {
  ASSET_KEYS,
  BUSH_DISPLAY_FACTOR,
  BUSH_KEYS,
  DECOR_KEYS,
  GROUND_KEYS,
  ROCK_KEYS,
  STUMP_KEYS,
} from "../assets/manifest";
import {
  BUSHES,
  GUARD_ROUTES,
  LETTER_SPOTS,
  OUTPOST,
  OUTPOST_WALLS,
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

/** Points along a guard's route (every ~50 px), so scenery never grows on the guards' path. */
function routePoints(path: readonly Point[], loop: boolean): { x: number; y: number; r: number }[] {
  const out: { x: number; y: number; r: number }[] = [];
  const count = loop ? path.length : path.length - 1;
  for (let i = 0; i < count; i++) {
    const a = path[i]!;
    const b = path[(i + 1) % path.length]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 50));
    for (let s = 0; s <= steps; s++) {
      out.push({ x: a.x + ((b.x - a.x) * s) / steps, y: a.y + ((b.y - a.y) * s) / steps, r: 70 });
    }
  }
  return out;
}

/** Spots the scenery must stay away from: gameplay-relevant places, paths and the river. */
function buildPlacement(): (x: number, y: number, radius: number) => boolean {
  const keepClear: { x: number; y: number; r: number }[] = [
    { x: PLAYER_START.x, y: PLAYER_START.y, r: 220 },
    { x: TREE.x, y: TREE.y, r: TREE.r + 120 },
    { x: OUTPOST.x + OUTPOST.w / 2, y: OUTPOST.y + OUTPOST.h / 2, r: 330 },
    ...LETTER_SPOTS.map((p) => ({ ...p, r: 120 })),
    ...BUSHES.map((b) => ({ x: b.x, y: b.y, r: b.r + 70 })),
    ...GUARD_ROUTES.flatMap((route) => routePoints(route.path, route.loop)),
  ];
  const trailPoints = TRAILS.flatMap((trail) => sampleCatmullRom(trail, 4));
  return (x, y, radius) =>
    distanceToPolyline(x, y, RIVER_POLYLINE) >= RIVER_WIDTH / 2 + radius + 30 &&
    !keepClear.some((c) => Math.hypot(x - c.x, y - c.y) < c.r + radius) &&
    !trailPoints.some((p) => Math.hypot(x - p.x, y - p.y) < 55 + radius);
}

/** Decorative trees: scattered everywhere except near gameplay-relevant spots. */
function drawScenery(g: Phaser.GameObjects.Graphics, rng: Phaser.Math.RandomDataGenerator): void {
  const isFree = buildPlacement();

  let placed = 0;
  for (let attempt = 0; attempt < 600 && placed < 130; attempt++) {
    const x = rng.between(0, WORLD.width);
    const y = rng.between(0, WORLD.height);
    const radius = rng.between(26, 52);
    if (!isFree(x, y, radius)) continue;

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
    // The old tree is a picture when the artwork loaded (see createProps); else it is drawn here.
    if (!scene.textures.exists(ASSET_KEYS.tree)) drawTree(g);
    g.generateTexture(WORLD_TEXTURE_KEY, WORLD.width, WORLD.height);
    g.destroy();
  }
  return scene.add.image(0, 0, WORLD_TEXTURE_KEY).setOrigin(0, 0).setDepth(0);
}

function strokeCanvasPath(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  width: number,
  style: string | CanvasPattern,
): void {
  const first = points[0];
  if (!first) return;
  ctx.lineWidth = width;
  ctx.strokeStyle = style;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i]!.x, points[i]!.y);
  ctx.stroke();
}

/**
 * Paint the world with the ground textures cut from the artist's `forest_tiles.png`: grass over
 * everything, the dirt texture inside the trails and the guard post, the water texture inside the
 * stream. Shapes still come from world-data.ts, so gameplay areas never depend on the artwork.
 * Returns false (nothing created) when a texture did not load, so the caller can draw the
 * built-in world instead.
 */
function createTextureWorld(scene: Phaser.Scene): boolean {
  const keys = Object.values(GROUND_KEYS);
  if (!keys.every((key) => scene.textures.exists(key))) return false;

  if (!scene.textures.exists(WORLD_TEXTURE_KEY)) {
    const canvas = scene.textures.createCanvas(WORLD_TEXTURE_KEY, WORLD.width, WORLD.height);
    if (!canvas) return false;
    const ctx = canvas.getContext();
    const pattern = (key: string): CanvasPattern | null =>
      ctx.createPattern(scene.textures.get(key).getSourceImage() as CanvasImageSource, "repeat");
    const grass = pattern(GROUND_KEYS.grass);
    const dirt = pattern(GROUND_KEYS.dirt);
    const water = pattern(GROUND_KEYS.water);
    if (!grass || !dirt || !water) return false;

    ctx.fillStyle = grass;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    for (const trail of TRAILS) {
      const points = sampleCatmullRom(trail, 10);
      strokeCanvasPath(ctx, points, 84, "rgba(28, 52, 18, 0.5)"); // shade under the grass fringe
      strokeCanvasPath(ctx, points, 66, "#5e4429");
      strokeCanvasPath(ctx, points, 58, dirt);
    }

    strokeCanvasPath(ctx, RIVER_POLYLINE, RIVER_WIDTH + 44, "rgba(24, 44, 16, 0.4)");
    strokeCanvasPath(ctx, RIVER_POLYLINE, RIVER_WIDTH + 22, "#5f5a45");
    strokeCanvasPath(ctx, RIVER_POLYLINE, RIVER_WIDTH + 8, "rgba(230, 248, 248, 0.6)");
    strokeCanvasPath(ctx, RIVER_POLYLINE, RIVER_WIDTH, water);

    ctx.fillStyle = dirt;
    ctx.fillRect(OUTPOST.x, OUTPOST.y, OUTPOST.w, OUTPOST.h);
    ctx.fillStyle = "rgba(34, 24, 14, 0.4)";
    ctx.fillRect(OUTPOST.x, OUTPOST.y, OUTPOST.w, OUTPOST.h);
    canvas.refresh();
  }
  scene.add.image(0, 0, WORLD_TEXTURE_KEY).setOrigin(0, 0).setDepth(0);
  return true;
}

/** The ground, river, trails and the guard post's floor: from the artwork, else drawn in code. */
export function createWorld(scene: Phaser.Scene): void {
  if (!createTextureWorld(scene)) createBakedWorld(scene);
}

/** The hiding bushes. Their hiding radius (world-data.ts) is what counts, not the image. */
export function createBushes(scene: Phaser.Scene): void {
  BUSHES.forEach((bush, index) => {
    const key = BUSH_KEYS[index % BUSH_KEYS.length]!;
    const image = scene.add.image(bush.x, bush.y, key).setDepth(3);
    image.setScale((bush.r * BUSH_DISPLAY_FACTOR) / Math.max(image.width, image.height));
    // Mirror every other bush so the same three pictures do not look copied.
    image.setFlipX(index % 2 === 1);
  });
}

/** Wide trees need to stand at their trunk: where the picture's feet are, as a share of height. */
const PROP_FEET = 0.92;

/** Solid footprint of a prop, as a share of its drawn width: `w` across, `d` deep at the feet. */
const SOLID = {
  tree: { w: 0.2, d: 0.1 },
  rock: { w: 0.7, d: 0.3 },
  stump: { w: 0.45, d: 0.25 },
} as const;

/**
 * The picture props: the old tree (the rhythm game's spot), the watchtower of the guard post,
 * trees, rocks and stumps scattered over the forest floor, ferns and tufts. Props whose artwork
 * did not load are skipped. Returns invisible static bodies for everything the player must not
 * walk through (trunks, rocks, stumps, the tower's feet); ferns, tufts and pebbles stay walkable.
 * Gameplay areas (bushes, stream, guard routes) come from world-data.ts.
 */
export function createProps(scene: Phaser.Scene): Phaser.GameObjects.Rectangle[] {
  const has = (key: string): boolean => scene.textures.exists(key);
  const blockers: Phaser.GameObjects.Rectangle[] = [];
  /** An invisible solid footprint standing on (x, y), `width` wide and `depth` deep. */
  const block = (x: number, y: number, width: number, depth: number): void => {
    const body = scene.add.rectangle(x, y - depth / 2, width, depth).setVisible(false);
    scene.physics.add.existing(body, true);
    blockers.push(body);
  };

  if (has(ASSET_KEYS.tree)) {
    const tree = scene.add.image(TREE.x, TREE.y + TREE.r * 0.9, ASSET_KEYS.tree);
    tree.setOrigin(0.5, PROP_FEET).setDepth(4);
    tree.setScale((TREE.r * 3.4) / tree.width);
    block(tree.x, tree.y, tree.displayWidth * SOLID.tree.w, tree.displayWidth * SOLID.tree.d);
  }

  if (has(ASSET_KEYS.tower)) {
    // The watchtower stands inside the yard, clear of the walls.
    const tower = scene.add.image(OUTPOST.x + OUTPOST.w - 130, OUTPOST.y + 240, ASSET_KEYS.tower);
    tower.setOrigin(0.5, PROP_FEET).setDepth(4);
    tower.setScale(230 / tower.height);
    block(tower.x, tower.y, tower.displayWidth * 0.5, 34);
  }

  const isFree = buildPlacement();
  const rng = new Phaser.Math.RandomDataGenerator(["kim-dong-props"]);
  /** Place one picture standing on (x, y); lower pictures are drawn over higher ones. */
  const place = (
    key: string,
    x: number,
    y: number,
    width: number,
    solid?: { w: number; d: number },
  ): void => {
    const image = scene.add
      .image(x, y, key)
      .setOrigin(0.5, PROP_FEET)
      .setDepth(3 + y / 100_000);
    image.setScale(width / image.width).setFlipX(rng.frac() < 0.5);
    if (solid) block(x, y, width * solid.w, width * solid.d);
  };
  const scatter = (
    keys: readonly string[],
    count: number,
    size: [number, number],
    footprint = 0.6,
    solid?: { w: number; d: number },
  ): void => {
    const available = keys.filter(has);
    if (available.length === 0) return;
    let placed = 0;
    for (let attempt = 0; attempt < 600 && placed < count; attempt++) {
      const x = rng.between(40, WORLD.width - 40);
      const y = rng.between(60, WORLD.height - 40);
      const width = rng.between(size[0], size[1]);
      if (!isFree(x, y, width * footprint)) continue;
      place(rng.pick(available), x, y, width, solid);
      placed++;
    }
  };
  // Big trees give the forest its canopy (the artwork's old banyan, smaller and in numbers).
  scatter([ASSET_KEYS.tree], 24, [190, 270], 0.3, SOLID.tree);
  scatter(ROCK_KEYS, 30, [46, 96], 0.6, SOLID.rock);
  scatter(STUMP_KEYS, 9, [90, 130], 0.6, SOLID.stump);
  scatter(DECOR_KEYS, 160, [44, 84], 0.4);
  scatter([ASSET_KEYS.pebbles], 14, [40, 62], 0.4);

  // Rocks along both banks of the stream (with gaps, so the player can still get into the water)
  // and grass tufts along the trails.
  const banks = RIVER_POLYLINE.filter((_, index) => index % 3 === 0);
  banks.forEach((point, index) => {
    if (index % 4 === 0) return;
    for (const side of [-1, 1]) {
      if (rng.frac() < 0.35) continue;
      place(
        rng.pick(ROCK_KEYS.filter(has)),
        point.x + side * (RIVER_WIDTH / 2 + rng.between(8, 26)),
        point.y + rng.between(-14, 14),
        rng.between(30, 56),
        SOLID.rock,
      );
    }
  });
  if (has("deco_tuft_a")) {
    for (const trail of TRAILS) {
      const points = sampleCatmullRom(trail, 4);
      for (let i = 0; i < points.length; i += 3) {
        const point = points[i]!;
        const next = points[Math.min(i + 1, points.length - 1)]!;
        const angle = Math.atan2(next.y - point.y, next.x - point.x) + Math.PI / 2;
        const side = rng.frac() < 0.5 ? -1 : 1;
        const reach = 40 + rng.between(0, 10);
        place(
          rng.pick(["deco_tuft_a", "deco_tuft_b"]),
          point.x + Math.cos(angle) * side * reach,
          point.y + Math.sin(angle) * side * reach,
          rng.between(26, 40),
        );
      }
    }
  }
  return blockers;
}

/**
 * The walls of the guard post as the artist's bamboo-stake fence: the front-view fence along the
 * north and south walls, a row of single stakes along the side walls. The invisible wall
 * rectangles in the scene still do the colliding. Returns false when the artwork is missing.
 */
export function createOutpostFence(scene: Phaser.Scene): boolean {
  if (!scene.textures.exists(ASSET_KEYS.fence) || !scene.textures.exists(ASSET_KEYS.fencePost)) {
    return false;
  }
  for (const wall of OUTPOST_WALLS) {
    if (wall.w >= wall.h) {
      const count = Math.ceil(wall.w / 130);
      const width = wall.w / count;
      for (let i = 0; i < count; i++) {
        const y = wall.y + wall.h + 6;
        const image = scene.add
          .image(wall.x + (i + 0.5) * width, y, ASSET_KEYS.fence)
          .setOrigin(0.5, 1)
          .setDepth(9 + y / 100_000);
        image.setScale((width + 4) / image.width);
      }
    } else {
      for (let y = wall.y + 10; y <= wall.y + wall.h + 10; y += 9) {
        const post = scene.add
          .image(wall.x + wall.w / 2, y, ASSET_KEYS.fencePost)
          .setOrigin(0.5, 1)
          .setDepth(9 + y / 100_000);
        post.setScale(62 / post.height);
      }
    }
  }
  return true;
}
