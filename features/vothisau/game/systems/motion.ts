import type { Point } from "@/lib/engine";

import type { Circle, Rect } from "../world-data";

/** Point on the flight of a thrown object: a straight line from `from` to `to`, lifted by an arc. */
export function arcPoint(from: Point, to: Point, t: number, height: number): Point {
  const k = Math.min(1, Math.max(0, t));
  return {
    x: from.x + (to.x - from.x) * k,
    y: from.y + (to.y - from.y) * k - 4 * height * k * (1 - k),
  };
}

/**
 * A value that sweeps back and forth between `min` and `max` (a triangle wave): `periodMs` is the
 * time for the whole trip there and back. `elapsedMs` = 0 gives `min`.
 */
export function sweep(elapsedMs: number, periodMs: number, min: number, max: number): number {
  const phase = (((elapsedMs % periodMs) + periodMs) % periodMs) / periodMs;
  const wave = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  return min + (max - min) * wave;
}

/** True when a square of half-size `r` centred on (x, y) overlaps any of the rectangles. */
export function overlapsAny(x: number, y: number, r: number, rects: readonly Rect[]): boolean {
  for (const rect of rects) {
    if (x + r > rect.x && x - r < rect.x + rect.w && y + r > rect.y && y - r < rect.y + rect.h) {
      return true;
    }
  }
  return false;
}

/**
 * Move `pos` by (dx, dy) without entering any rectangle, sliding along them. When one axis is
 * blocked and almost no movement is left on the other, the body is nudged sideways (toward
 * `prefer`) so a chaser does not stick to a wall that is straight ahead of it.
 */
export function slideMove(
  pos: Point,
  dx: number,
  dy: number,
  r: number,
  rects: readonly Rect[],
  prefer: Point = pos,
): void {
  const freeX = !overlapsAny(pos.x + dx, pos.y, r, rects);
  const freeY = !overlapsAny(pos.x, pos.y + dy, r, rects);
  if (freeX) pos.x += dx;
  if (freeY) pos.y += dy;
  if (!freeX && Math.abs(dy) < Math.abs(dx) * 0.4) {
    const nudge = Math.abs(dx) * (prefer.y >= pos.y ? 1 : -1);
    if (!overlapsAny(pos.x, pos.y + nudge, r, rects)) pos.y += nudge;
  } else if (!freeY && Math.abs(dx) < Math.abs(dy) * 0.4) {
    const nudge = Math.abs(dy) * (prefer.x >= pos.x ? 1 : -1);
    if (!overlapsAny(pos.x + nudge, pos.y, r, rects)) pos.x += nudge;
  }
}

/**
 * Distance a ray from (ox, oy) travels in direction `angle` before it hits a rectangle, capped at
 * `range` (slab method). Used to clip the vision cones against walls and stalls.
 */
export function rayDistance(
  ox: number,
  oy: number,
  angle: number,
  range: number,
  rects: readonly Rect[],
): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = range;
  for (const rect of rects) {
    let t0 = 0;
    let t1 = best;
    // X slab.
    if (dx === 0) {
      if (ox < rect.x || ox > rect.x + rect.w) continue;
    } else {
      const a = (rect.x - ox) / dx;
      const b = (rect.x + rect.w - ox) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
    if (t0 > t1) continue;
    // Y slab.
    if (dy === 0) {
      if (oy < rect.y || oy > rect.y + rect.h) continue;
    } else {
      const a = (rect.y - oy) / dy;
      const b = (rect.y + rect.h - oy) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
    if (t0 > t1) continue;
    if (t0 < best) best = t0;
  }
  return Math.max(0, best);
}

/** True when the line from (ax, ay) to (bx, by) is not blocked by any rectangle. */
export function hasClearLine(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  rects: readonly Rect[],
): boolean {
  const distance = Math.hypot(bx - ax, by - ay);
  if (distance === 0) return true;
  return rayDistance(ax, ay, Math.atan2(by - ay, bx - ax), distance, rects) >= distance - 0.5;
}

/** The first circle that contains the point, if any. */
export function circleAt<T extends Circle>(
  circles: readonly T[],
  x: number,
  y: number,
): T | undefined {
  return circles.find((c) => (x - c.x) ** 2 + (y - c.y) ** 2 <= c.r * c.r);
}
