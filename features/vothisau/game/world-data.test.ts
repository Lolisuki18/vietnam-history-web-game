import { describe, expect, it } from "vitest";

import { LORE } from "../data/story";

import {
  ALL_LEVELS,
  CAI_TONG_ROUTE,
  EXIT,
  FOREST,
  GATE_TRIGGER,
  MARKET,
  MARKET_CROWDS,
  MARKET_WALL,
  ROPE,
  THROW_ZONE,
  levelBlockers,
  type LevelDef,
  type Rect,
} from "./world-data";
import { overlapsAny } from "./systems/motion";

const CELL = 10;
/** Half the player's hitbox, plus a little room. */
const PLAYER_R = 13;

/** The cells a player can reach from `from` (4-way flood fill on a grid, blockers inflated). */
function reachable(level: LevelDef, extra: Rect[] = []): (x: number, y: number) => boolean {
  const rects = [...levelBlockers(level), ...extra];
  const cols = Math.ceil(level.world.w / CELL);
  const rows = Math.ceil(level.world.h / CELL);
  const seen = new Uint8Array(cols * rows);
  const free = (c: number, r: number): boolean =>
    c >= 0 &&
    r >= 0 &&
    c < cols &&
    r < rows &&
    !overlapsAny(c * CELL + CELL / 2, r * CELL + CELL / 2, PLAYER_R, rects);
  const startC = Math.floor(level.start.x / CELL);
  const startR = Math.floor(level.start.y / CELL);
  const stack: number[] = [startR * cols + startC];
  seen[startR * cols + startC] = 1;
  while (stack.length > 0) {
    const index = stack.pop()!;
    const c = index % cols;
    const r = Math.floor(index / cols);
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nc = c + dc;
      const nr = r + dr;
      const next = nr * cols + nc;
      if (!free(nc, nr) || seen[next]) continue;
      seen[next] = 1;
      stack.push(next);
    }
  }
  return (x, y) => seen[Math.floor(y / CELL) * cols + Math.floor(x / CELL)] === 1;
}

describe.each(ALL_LEVELS.map((level) => [level.id, level] as const))("%s level", (_id, level) => {
  const blockers = levelBlockers(level);

  it("puts the start, the checkpoints and the papers on open ground", () => {
    const places = [level.start, ...level.checkpoints, ...level.papers, ...level.pebbles];
    for (const place of places) {
      expect(overlapsAny(place.x, place.y, 8, blockers), `${place.x},${place.y}`).toBe(false);
    }
  });

  it("keeps every guard waypoint out of walls and stalls", () => {
    for (const guard of level.guards) {
      for (const point of guard.path) {
        expect(overlapsAny(point.x, point.y, 12, blockers), `${point.x},${point.y}`).toBe(false);
      }
    }
  });

  it("keeps everything inside the world", () => {
    const inside = (x: number, y: number): boolean =>
      x > 0 && y > 0 && x < level.world.w && y < level.world.h;
    expect(inside(level.start.x, level.start.y)).toBe(true);
    for (const paper of level.papers) expect(inside(paper.x, paper.y)).toBe(true);
    for (const guard of level.guards) {
      for (const point of guard.path) expect(inside(point.x, point.y)).toBe(true);
    }
  });

  it("can reach every paper, pebble and checkpoint from the start", () => {
    const canReach = reachable(level);
    for (const place of [...level.papers, ...level.pebbles, ...level.checkpoints]) {
      expect(canReach(place.x, place.y), `${place.x},${place.y}`).toBe(true);
    }
  });

  it("gives every paper a different index that exists in LORE", () => {
    const indices = level.papers.map((paper) => paper.index);
    expect(new Set(indices).size).toBe(indices.length);
    for (const index of indices) expect(LORE[index]).toBeDefined();
  });
});

describe("forest", () => {
  it("can be walked from the start to the end paper (and the hideout)", () => {
    const canReach = reachable(FOREST);
    const end = FOREST.papers.find((paper) => paper.final)!;
    expect(canReach(end.x, end.y)).toBe(true);
  });

  it("holds exactly one paper that ends the act", () => {
    expect(FOREST.papers.filter((paper) => paper.final)).toHaveLength(1);
  });

  it("has bushes on open ground", () => {
    for (const bush of FOREST.bushes) {
      expect(overlapsAny(bush.x, bush.y, 4, levelBlockers(FOREST))).toBe(false);
    }
  });
});

describe("market", () => {
  it("can be crossed from the entrance to the throw zone and the exit", () => {
    const canReach = reachable(MARKET);
    expect(canReach(GATE_TRIGGER.x + 10, GATE_TRIGGER.y + GATE_TRIGGER.h / 2)).toBe(true);
    expect(canReach(THROW_ZONE.x, THROW_ZONE.y)).toBe(true);
    expect(canReach(EXIT.x, EXIT.y)).toBe(true);
    expect(canReach(ROPE.x, ROPE.y + 40)).toBe(true);
  });

  it("can only be crossed through the gate", () => {
    const plug: Rect = {
      x: MARKET_WALL.x - 5,
      y: MARKET_WALL.gapTop,
      w: MARKET_WALL.w + 10,
      h: MARKET_WALL.gapBottom - MARKET_WALL.gapTop,
    };
    const canReach = reachable(MARKET, [plug]);
    expect(canReach(THROW_ZONE.x, THROW_ZONE.y)).toBe(false);
    expect(canReach(EXIT.x, EXIT.y)).toBe(false);
  });

  it("asks the checkpoint question before the gate, on the player's side", () => {
    expect(GATE_TRIGGER.x + GATE_TRIGGER.w).toBeLessThanOrEqual(MARKET_WALL.x);
    expect(GATE_TRIGGER.y).toBeGreaterThanOrEqual(MARKET_WALL.gapTop - 20);
  });

  it("has two gate guards and a Cai Tòng route that is walkable", () => {
    expect(MARKET.guards.filter((guard) => guard.gate)).toHaveLength(2);
    for (const point of CAI_TONG_ROUTE.path) {
      expect(overlapsAny(point.x, point.y, 12, levelBlockers(MARKET))).toBe(false);
    }
  });

  it("puts the throw zone inside a crowd (a place to throw from unseen)", () => {
    const inside = MARKET_CROWDS.some(
      (crowd) => Math.hypot(crowd.x - THROW_ZONE.x, crowd.y - THROW_ZONE.y) <= crowd.radius,
    );
    expect(inside).toBe(true);
  });

  it("keeps the throw zone within grenade range of Cai Tòng's walk", () => {
    const nearest = Math.min(
      ...CAI_TONG_ROUTE.path.map((p) => Math.hypot(p.x - THROW_ZONE.x, p.y - THROW_ZONE.y)),
    );
    expect(nearest).toBeLessThan(340);
  });
});
