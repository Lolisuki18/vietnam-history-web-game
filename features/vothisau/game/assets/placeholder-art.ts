import type Phaser from "phaser";

import {
  BAY_KEY,
  CAI_TONG_KEY,
  IMAGE_KEYS,
  LOGICAL_FRAME,
  NPC_SHEET,
  PAPER_SHEET,
  PROP_KEYS,
  PROPS,
  SAU_KEY,
  SAU_SHEET,
  SOLDIER_KEYS,
  SOLDIER_SHEET,
  VILLAGER_KEYS,
  type PropKey,
} from "./manifest";

/**
 * Stand-in artwork drawn with Graphics and baked into textures that have exactly the same keys,
 * frame sizes and sheet layouts as the real files in `public/assets/vothisau`. When a file is
 * missing the game uses these; drop the real file in and it takes over.
 */

const FRAME_W = LOGICAL_FRAME.width;
const FRAME_H = LOGICAL_FRAME.height;
/** The people are drawn for a 32 wide frame: centre them in the wider one. */
const DRAW_X = (FRAME_W - 32) / 2;
const SKIN = 0xf2c9a0;

type Drawer = (g: Phaser.GameObjects.Graphics) => void;

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

/* ----------------------------------------- people ----------------------------------------- */

type Facing = "down" | "up" | "left" | "right";
type Pose = "walk" | "sneak" | "throw" | "interact" | "hide" | "scared" | "stand";

interface Look {
  top: number;
  topDark: number;
  bottom: number;
  hair: number;
  hat?: "kepi" | "helmet" | "conical" | "cap" | "towel";
  hatColor?: number;
  /** A colour stripe across the chest / a scarf. */
  accent?: number;
  /** The accent is a scarf at the neck instead of a stripe across the chest. */
  scarf?: boolean;
  armed?: boolean;
}

const LOOKS: Record<string, Look> = {
  [SAU_KEY]: {
    top: 0x2f6f73,
    topDark: 0x1f4a4d,
    bottom: 0x15151c,
    hair: 0x14110f,
    accent: 0xd8423b,
    scarf: true,
  },
  [SOLDIER_KEYS[0]]: {
    top: 0x8c8a52,
    topDark: 0x5f5d33,
    bottom: 0x4b4a2c,
    hair: 0x3a2a1a,
    hat: "helmet",
    hatColor: 0x3f4a2c,
    armed: true,
  },
  [SOLDIER_KEYS[1]]: {
    top: 0x5f7080,
    topDark: 0x3e4c58,
    bottom: 0x2e3640,
    hair: 0x1a1a1a,
    hat: "kepi",
    hatColor: 0x3e4c58,
    armed: true,
    accent: 0xb91c1c,
  },
  [CAI_TONG_KEY]: {
    top: 0x1d1d22,
    topDark: 0x0f0f12,
    bottom: 0x2a2a30,
    hair: 0x111111,
    hat: "cap",
    hatColor: 0x111114,
    accent: 0xd8423b,
    armed: true,
  },
  [BAY_KEY]: {
    top: 0x6b4a2b,
    topDark: 0x4a321b,
    bottom: 0x3a2a1c,
    hair: 0xdddddd,
    hat: "towel",
    hatColor: 0xe9e2cf,
  },
  [VILLAGER_KEYS[0]]: {
    top: 0xb98a4a,
    topDark: 0x8a6431,
    bottom: 0x3b2c1f,
    hair: 0x1a1410,
    hat: "conical",
    hatColor: 0xdcc57d,
  },
  [VILLAGER_KEYS[1]]: {
    top: 0x4b6a9b,
    topDark: 0x34496d,
    bottom: 0x2a2a2a,
    hair: 0x1a1410,
    hat: "conical",
    hatColor: 0xcdb56e,
  },
  [VILLAGER_KEYS[2]]: {
    top: 0x9a4a3a,
    topDark: 0x6e3025,
    bottom: 0x2d2d2d,
    hair: 0x2a1f18,
    accent: 0xe9e2cf,
  },
  [VILLAGER_KEYS[3]]: {
    top: 0x2e3d7a,
    topDark: 0x1d274f,
    bottom: 0x222222,
    hair: 0x1a1410,
    hat: "conical",
    hatColor: 0xdcc57d,
  },
  [VILLAGER_KEYS[4]]: {
    top: 0x8a452a,
    topDark: 0x5e2f1d,
    bottom: 0x242424,
    hair: 0x2a1f18,
    hat: "towel",
    hatColor: 0xe9e2cf,
  },
};

/** One person in a 32 x 48 box whose top-left corner is (x0, y0). */
function drawPerson(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  look: Look,
  facing: Facing,
  step: number,
  pose: Pose,
): void {
  const crouch = pose === "sneak" ? 7 : pose === "hide" ? 14 : pose === "scared" ? 10 : 0;
  const bob = step % 2 === 1 && (pose === "walk" || pose === "sneak" || pose === "stand") ? 1 : 0;
  const side = facing === "left" || facing === "right";
  const dir = facing === "left" ? -1 : 1;

  // Legs: they swap every frame while walking.
  g.fillStyle(look.bottom, 1);
  if (pose === "walk" || pose === "sneak") {
    const a = step % 2 === 0 ? 0 : -3;
    const b = step % 2 === 0 ? -3 : 0;
    if (side) {
      g.fillRect(x0 + 12 + (step % 2) * 2, y0 + 35 + a + crouch, 5, 10 - crouch / 2);
      g.fillRect(x0 + 16 - (step % 2) * 2, y0 + 35 + b + crouch, 5, 10 - crouch / 2);
    } else {
      g.fillRect(x0 + 9, y0 + 35 + a + crouch, 6, 10 - crouch / 2);
      g.fillRect(x0 + 17, y0 + 35 + b + crouch, 6, 10 - crouch / 2);
    }
  } else {
    g.fillRect(x0 + 9, y0 + 35 + crouch, 6, 10 - crouch / 2);
    g.fillRect(x0 + 17, y0 + 35 + crouch, 6, 10 - crouch / 2);
  }

  // Body.
  const bodyTop = y0 + 19 + bob + crouch;
  g.fillStyle(look.topDark, 1);
  g.fillRect(x0 + 7, bodyTop - 1, 18, 18 - crouch / 2);
  g.fillStyle(look.top, 1);
  g.fillRect(x0 + 8, bodyTop, 16, 16 - crouch / 2);
  if (look.accent) {
    g.fillStyle(look.accent, 1);
    if (look.scarf) {
      // Chị Sáu: a checked scarf at the neck.
      g.fillRect(x0 + 10, bodyTop, 12, 3);
    } else g.fillRect(x0 + 8, bodyTop + 5, 16, 2);
  }
  if (look.armed && pose !== "scared") {
    g.fillStyle(0x3f3f46, 1);
    if (side) g.fillRect(dir > 0 ? x0 + 24 : x0 + 4, y0 + 16 + bob, 3, 20);
    else g.fillRect(x0 + 25, y0 + 17 + bob, 3, 19);
  }

  // Arms: raised for the throw, forward for interacting, over the head when scared.
  g.fillStyle(look.topDark, 1);
  if (pose === "throw") {
    g.fillRect(x0 + (dir > 0 ? 22 : 8), bodyTop - 10, 4, 14);
  } else if (pose === "interact") {
    g.fillRect(x0 + (side ? (dir > 0 ? 22 : 6) : 22), bodyTop + 2, 4, 9);
  } else if (pose === "scared") {
    g.fillRect(x0 + 6, bodyTop - 8, 4, 9);
    g.fillRect(x0 + 22, bodyTop - 8, 4, 9);
  } else {
    g.fillRect(x0 + 5, bodyTop + 1, 3, 10);
    g.fillRect(x0 + 24, bodyTop + 1, 3, 10);
  }

  // Head.
  const headY = y0 + 13 + bob + crouch;
  g.fillStyle(SKIN, 1);
  g.fillCircle(x0 + 16, headY, 6);
  g.fillStyle(look.hair, 1);
  if (facing === "up") g.fillCircle(x0 + 16, headY - 1, 6);
  else g.fillRect(x0 + 10, headY - 6, 12, 4);
  // Eyes show where the person looks.
  g.fillStyle(0x1f2937, 1);
  if (facing === "down") {
    g.fillRect(x0 + 13, headY, 2, 2);
    g.fillRect(x0 + 18, headY, 2, 2);
  } else if (side) {
    g.fillRect(x0 + (dir > 0 ? 19 : 11), headY, 2, 2);
  }
  // Hat.
  if (look.hat && look.hatColor !== undefined) {
    g.fillStyle(look.hatColor, 1);
    if (look.hat === "conical")
      g.fillTriangle(x0 + 3, headY - 3, x0 + 29, headY - 3, x0 + 16, headY - 15);
    else if (look.hat === "helmet") g.fillEllipse(x0 + 16, headY - 5, 22, 11);
    else if (look.hat === "kepi") g.fillRect(x0 + 9, headY - 9, 14, 6);
    else if (look.hat === "cap") g.fillRect(x0 + 9, headY - 8, 14, 5);
    else g.fillEllipse(x0 + 16, headY - 6, 15, 7);
  }
  // Chị Sáu's hair falls over the shoulder in a braid.
  if (look === LOOKS[SAU_KEY] && facing !== "down") {
    g.fillStyle(look.hair, 1);
    g.fillRect(x0 + (facing === "right" ? 8 : 22), headY, 3, 14);
  }
}

function bakePeople(scene: Phaser.Scene): void {
  const textures = scene.textures;

  const bakeSheet = (
    key: string,
    columns: number,
    rows: number,
    draw: (
      g: Phaser.GameObjects.Graphics,
      x: number,
      y: number,
      row: number,
      column: number,
    ) => void,
  ): void => {
    if (textures.exists(key)) return;
    bake(scene, key, columns * FRAME_W, rows * FRAME_H, (g) => {
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          draw(g, column * FRAME_W + DRAW_X, row * FRAME_H, row, column);
        }
      }
    });
    addSheetFrames(scene, key, columns, rows);
  };

  const sauLook = LOOKS[SAU_KEY]!;
  const sauRows: Facing[] = ["down", "left", "right", "up"];
  bakeSheet(
    SAU_KEY,
    SAU_SHEET.columns,
    Object.keys(SAU_SHEET.rows).length,
    (g, x, y, row, column) => {
      if (row < 4) drawPerson(g, x, y, sauLook, sauRows[row]!, column, "walk");
      else if (row === SAU_SHEET.rows.sneak) drawPerson(g, x, y, sauLook, "right", column, "sneak");
      else if (row === SAU_SHEET.rows.throw) drawPerson(g, x, y, sauLook, "right", column, "throw");
      else if (row === SAU_SHEET.rows.interact)
        drawPerson(g, x, y, sauLook, "right", column, "interact");
      else drawPerson(g, x, y, sauLook, "right", column, "hide");
    },
  );

  for (const key of [...SOLDIER_KEYS, CAI_TONG_KEY]) {
    const look = LOOKS[key]!;
    bakeSheet(key, SOLDIER_SHEET.columns, 2, (g, x, y, row, column) => {
      drawPerson(g, x, y, look, row === SOLDIER_SHEET.rows.left ? "left" : "right", column, "walk");
    });
  }

  const npcFrame =
    (look: Look) =>
    (g: Phaser.GameObjects.Graphics, x: number, y: number, row: number, column: number) => {
      if (row === NPC_SHEET.rows.idle)
        drawPerson(g, x, y, look, column % 2 === 0 ? "down" : "down", column, "stand");
      else drawPerson(g, x, y, look, "down", column, "scared");
    };
  for (const key of VILLAGER_KEYS) bakeSheet(key, NPC_SHEET.columns, 2, npcFrame(LOOKS[key]!));
  bakeSheet(BAY_KEY, NPC_SHEET.columns, 2, npcFrame(LOOKS[BAY_KEY]!));
}

/* ----------------------------------------- props ------------------------------------------ */

function drawTree(g: Phaser.GameObjects.Graphics, w: number, h: number, variant: 0 | 1): void {
  const cx = w / 2;
  g.fillStyle(0x3a2a1c, 1);
  g.fillRect(cx - 11, h * 0.4, 22, h * 0.6);
  g.fillStyle(0x56402b, 1);
  g.fillRect(cx - 8, h * 0.4, 8, h * 0.6);
  // The rubber tree is grooved with tapping cuts.
  g.lineStyle(2, 0x241a10, 1);
  for (let y = h * 0.55; y < h * 0.95; y += 16) g.lineBetween(cx - 10, y, cx + 4, y + 8);
  const leaf = variant === 0 ? [0x16341f, 0x1f4a2b, 0x2a6038] : [0x14301f, 0x1b4326, 0x25573a];
  g.fillStyle(leaf[0]!, 1);
  g.fillCircle(cx, h * 0.22, w * 0.46);
  g.fillStyle(leaf[1]!, 1);
  g.fillCircle(cx - w * 0.2, h * 0.28, w * 0.3);
  g.fillCircle(cx + w * 0.22, h * 0.26, w * 0.3);
  g.fillStyle(leaf[2]!, 1);
  g.fillCircle(cx - w * 0.08, h * 0.14, w * 0.2);
  g.fillCircle(cx + w * 0.16, h * 0.2, w * 0.15);
}

function drawBush(g: Phaser.GameObjects.Graphics, w: number, h: number, variant: 0 | 1): void {
  const base = variant === 0 ? [0x14301a, 0x1d4325, 0x2f6a38] : [0x172d1a, 0x214a2a, 0x387a41];
  g.fillStyle(base[0]!, 1);
  g.fillEllipse(w / 2, h * 0.6, w, h * 0.8);
  g.fillStyle(base[1]!, 1);
  g.fillEllipse(w / 2 - 6, h * 0.55, w * 0.78, h * 0.62);
  g.fillStyle(base[2]!, 1);
  for (let i = 0; i < 14; i++) {
    const angle = i * 2.399;
    const dist = 6 + ((i * 17) % 34);
    g.fillCircle(w / 2 + Math.cos(angle) * dist * 1.3, h * 0.55 + Math.sin(angle) * dist * 0.5, 6);
  }
}

function drawCanopyStall(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  roof: [number, number],
  goods: number,
): void {
  // Counter.
  g.fillStyle(0x5a3c22, 1);
  g.fillRect(8, h - 56, w - 16, 50);
  g.fillStyle(0x7a5430, 1);
  g.fillRect(8, h - 56, w - 16, 10);
  // Goods on the counter.
  g.fillStyle(goods, 1);
  for (let i = 0; i < 9; i++) g.fillCircle(24 + i * ((w - 48) / 8), h - 60, 7);
  // Posts and a striped cloth roof.
  g.fillStyle(0x3a2814, 1);
  g.fillRect(10, 20, 6, h - 26);
  g.fillRect(w - 16, 20, 6, h - 26);
  for (let i = 0; i < 10; i++) {
    g.fillStyle(i % 2 === 0 ? roof[0] : roof[1], 1);
    g.fillRect(2 + i * ((w - 4) / 10), 10, (w - 4) / 10, 34);
  }
}

function drawProp(g: Phaser.GameObjects.Graphics, key: PropKey): void {
  const { w, h } = PROPS[key];
  switch (key) {
    case "prop_rubber_tree_a":
      drawTree(g, w, h, 0);
      break;
    case "prop_rubber_tree_b":
      drawTree(g, w, h, 1);
      break;
    case "prop_bush_a":
      drawBush(g, w, h, 0);
      break;
    case "prop_bush_b":
      drawBush(g, w, h, 1);
      break;
    case "prop_fern":
      g.lineStyle(3, 0x2f6a38, 1);
      for (let i = -3; i <= 3; i++)
        g.lineBetween(w / 2, h, w / 2 + i * 10, h * 0.2 + Math.abs(i) * 5);
      break;
    case "prop_leaf_pile":
      g.fillStyle(0x6e4a22, 1);
      g.fillEllipse(w / 2, h / 2, w, h);
      g.fillStyle(0x8a6030, 1);
      for (let i = 0; i < 6; i++) g.fillCircle(10 + i * 8, h / 2 + (i % 2) * 4 - 2, 4);
      break;
    case "prop_log":
      g.fillStyle(0x4a3220, 1);
      g.fillRoundedRect(0, 8, w, h - 8, 10);
      g.fillStyle(0x6a4a2d, 1);
      g.fillRect(8, 12, w - 16, 6);
      break;
    case "prop_post_bay":
      // A dugout post: a mound of earth, a timber frame and a dark doorway.
      g.fillStyle(0x3a2a1c, 1);
      g.fillEllipse(w / 2, h * 0.7, w, h * 0.6);
      g.fillStyle(0x5a3c22, 1);
      g.fillRect(w * 0.18, h * 0.3, w * 0.64, h * 0.55);
      g.fillStyle(0x0b0b0b, 1);
      g.fillRect(w * 0.4, h * 0.5, w * 0.2, h * 0.35);
      g.fillStyle(0x7a5430, 1);
      g.fillRect(w * 0.12, h * 0.24, w * 0.76, 12);
      break;
    case "prop_stall_a":
      drawCanopyStall(g, w, h, [0xb23a2e, 0xe9e2cf], 0xe0a030);
      break;
    case "prop_stall_b":
      drawCanopyStall(g, w, h, [0x3a6a4a, 0xcdb56e], 0xb8452f);
      break;
    case "prop_stall_fruit":
      drawCanopyStall(g, w, h, [0xcdb56e, 0x8a6a30], 0x6ab04c);
      break;
    case "prop_rope_stall":
      drawCanopyStall(g, w, h, [0x3a5a8a, 0xe9e2cf], 0xd8a040);
      // The hanging goods and their rope.
      g.lineStyle(3, 0xc9b27a, 1);
      g.lineBetween(30, 46, w - 30, 46);
      g.fillStyle(0x8a5a2b, 1);
      for (let i = 0; i < 4; i++) g.fillEllipse(48 + i * 36, 62, 22, 16);
      break;
    case "prop_cart":
      g.fillStyle(0x6a4a2d, 1);
      g.fillRect(10, 16, w - 40, h - 44);
      g.fillStyle(0x4a321b, 1);
      g.fillRect(10, 16, w - 40, 8);
      g.fillRect(w - 30, h - 40, 28, 4);
      g.fillStyle(0x2a1c10, 1);
      g.fillCircle(30, h - 14, 14);
      g.fillCircle(w - 60, h - 14, 14);
      g.fillStyle(0x8a5a2b, 1);
      g.fillCircle(30, h - 14, 6);
      g.fillCircle(w - 60, h - 14, 6);
      break;
    case "prop_well":
      g.fillStyle(0x6b6b66, 1);
      g.fillEllipse(w / 2, h * 0.68, w * 0.9, h * 0.52);
      g.fillStyle(0x0d0d10, 1);
      g.fillEllipse(w / 2, h * 0.62, w * 0.6, h * 0.34);
      g.fillStyle(0x4a321b, 1);
      g.fillRect(8, h * 0.1, 6, h * 0.55);
      g.fillRect(w - 14, h * 0.1, 6, h * 0.55);
      g.fillRect(8, h * 0.1, w - 16, 6);
      break;
    case "prop_crate":
      g.fillStyle(0x8a6030, 1);
      g.fillRect(0, 8, w, h - 8);
      g.lineStyle(3, 0x4a321b, 1);
      g.strokeRect(2, 10, w - 4, h - 12);
      g.lineBetween(2, 10, w - 2, h - 2);
      break;
    case "prop_wall_brick":
      g.fillStyle(0x8a5a3c, 1);
      g.fillRect(0, 0, w, h);
      g.lineStyle(2, 0x5a3624, 1);
      for (let y = 0; y < h; y += 20) {
        g.lineBetween(0, y, w, y);
        for (let x = (y / 20) % 2 === 0 ? 0 : 16; x < w; x += 32) g.lineBetween(x, y, x, y + 20);
      }
      break;
    case "prop_gate_barrier":
      g.fillStyle(0x3a2814, 1);
      g.fillRect(4, 10, 10, h - 14);
      g.fillRect(w - 14, 10, 10, h - 14);
      for (let i = 0; i < 6; i++) {
        g.fillStyle(i % 2 === 0 ? 0xb23a2e : 0xe9e2cf, 1);
        g.fillRect(14 + i * ((w - 28) / 6), 30, (w - 28) / 6, 12);
      }
      break;
    case "prop_tunnel_hatch":
      g.fillStyle(0x6b6b66, 1);
      g.fillEllipse(w / 2, h * 0.6, w, h * 0.8);
      g.fillStyle(0x0a0a0d, 1);
      g.fillEllipse(w / 2, h * 0.58, w * 0.74, h * 0.58);
      break;
  }
}

function bakeProps(scene: Phaser.Scene): void {
  for (const key of PROP_KEYS) {
    if (scene.textures.exists(key)) continue;
    const { w, h } = PROPS[key];
    bake(scene, key, w, h, (g) => drawProp(g, key));
  }
}

/* ----------------------------------- ground and items ------------------------------------- */

function bakeGround(scene: Phaser.Scene): void {
  const make = (key: string, base: number, dark: number, light: number, seed: number): void => {
    if (scene.textures.exists(key)) return;
    bake(scene, key, 256, 256, (g) => {
      g.fillStyle(base, 1);
      g.fillRect(0, 0, 256, 256);
      let a = seed;
      const next = (): number => {
        a = (a * 1664525 + 1013904223) >>> 0;
        return a / 4294967296;
      };
      for (let i = 0; i < 160; i++) {
        g.fillStyle(next() < 0.5 ? dark : light, 0.55);
        g.fillCircle(next() * 256, next() * 256, 1 + next() * 3);
      }
    });
  };
  make(IMAGE_KEYS.groundForest, 0x4e2f20, 0x3d2418, 0x65402b, 17);
  make(IMAGE_KEYS.groundMarket, 0x93673f, 0x7d5330, 0xa97c50, 43);
}

function bakeItems(scene: Phaser.Scene): void {
  const textures = scene.textures;
  if (!textures.exists(PAPER_SHEET.key)) {
    bake(scene, PAPER_SHEET.key, 48, 48, (g) => {
      g.fillStyle(0x92400e, 1);
      g.fillRect(6, 10, 36, 28);
      g.fillStyle(0xf3e3b0, 1);
      g.fillRect(8, 12, 32, 24);
      g.lineStyle(2, 0x92400e, 1);
      g.lineBetween(8, 12, 24, 26);
      g.lineBetween(40, 12, 24, 26);
    });
  }
  if (!textures.exists(IMAGE_KEYS.pebble)) {
    bake(scene, IMAGE_KEYS.pebble, 24, 24, (g) => {
      g.fillStyle(0x57534e, 1);
      g.fillEllipse(12, 13, 18, 14);
      g.fillStyle(0xa8a29e, 1);
      g.fillEllipse(10, 11, 10, 7);
    });
  }
  if (!textures.exists(IMAGE_KEYS.grenade)) {
    bake(scene, IMAGE_KEYS.grenade, 32, 32, (g) => {
      g.fillStyle(0x3b4a2c, 1);
      g.fillEllipse(16, 18, 18, 22);
      g.fillStyle(0x56683f, 1);
      g.fillEllipse(13, 15, 7, 10);
      g.fillStyle(0x222222, 1);
      g.fillRect(12, 4, 8, 5);
      g.lineStyle(2, 0x999999, 1);
      g.lineBetween(20, 5, 27, 3);
    });
  }
}

/** Create a stand-in texture for every key whose real file did not load. */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  bakePeople(scene);
  bakeProps(scene);
  bakeGround(scene);
  bakeItems(scene);
}
