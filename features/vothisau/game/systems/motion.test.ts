import { describe, expect, it } from "vitest";

import type { Rect } from "../world-data";
import {
  arcPoint,
  circleAt,
  hasClearLine,
  overlapsAny,
  rayDistance,
  slideMove,
  sweep,
} from "./motion";

const wall: Rect = { x: 100, y: 0, w: 20, h: 200 };

describe("arcPoint", () => {
  it("starts and ends on the line between the two points", () => {
    const from = { x: 0, y: 100 };
    const to = { x: 200, y: 100 };
    expect(arcPoint(from, to, 0, 80)).toEqual(from);
    expect(arcPoint(from, to, 1, 80)).toEqual(to);
  });

  it("is lifted by the full height in the middle", () => {
    const middle = arcPoint({ x: 0, y: 100 }, { x: 200, y: 100 }, 0.5, 80);
    expect(middle.x).toBe(100);
    expect(middle.y).toBe(20);
  });

  it("clamps t outside 0..1", () => {
    expect(arcPoint({ x: 0, y: 0 }, { x: 10, y: 0 }, 5, 40).x).toBe(10);
    expect(arcPoint({ x: 0, y: 0 }, { x: 10, y: 0 }, -3, 40).x).toBe(0);
  });
});

describe("sweep", () => {
  it("goes min → max → min over one period", () => {
    expect(sweep(0, 1000, 0, 1)).toBe(0);
    expect(sweep(500, 1000, 0, 1)).toBe(1);
    expect(sweep(1000, 1000, 0, 1)).toBeCloseTo(0);
    expect(sweep(250, 1000, 10, 20)).toBeCloseTo(15);
  });

  it("repeats and never leaves the range", () => {
    for (let t = -3000; t < 6000; t += 137) {
      const value = sweep(t, 1500, 110, 340);
      expect(value).toBeGreaterThanOrEqual(110);
      expect(value).toBeLessThanOrEqual(340);
    }
  });
});

describe("overlapsAny / slideMove", () => {
  it("detects a square touching a rectangle", () => {
    expect(overlapsAny(95, 50, 10, [wall])).toBe(true);
    expect(overlapsAny(80, 50, 10, [wall])).toBe(false);
  });

  it("stops at a wall and slides along it", () => {
    const pos = { x: 85, y: 50 };
    slideMove(pos, 10, 10, 10, [wall]);
    expect(pos.x).toBe(85); // blocked in x
    expect(pos.y).toBe(60); // free in y
  });

  it("nudges sideways when walking straight into a wall", () => {
    const pos = { x: 85, y: 50 };
    slideMove(pos, 10, 0, 10, [wall], { x: 300, y: 150 });
    expect(pos.x).toBe(85);
    expect(pos.y).toBeGreaterThan(50); // pushed toward the target's side
  });
});

describe("rayDistance / hasClearLine", () => {
  it("stops at the first rectangle", () => {
    expect(rayDistance(0, 50, 0, 300, [wall])).toBeCloseTo(100);
  });

  it("goes the whole range when nothing is in the way", () => {
    expect(rayDistance(0, 50, Math.PI, 300, [wall])).toBe(300);
    expect(rayDistance(0, 250, 0, 300, [wall])).toBe(300);
  });

  it("tells whether the line between two points is blocked", () => {
    expect(hasClearLine(0, 50, 200, 50, [wall])).toBe(false);
    expect(hasClearLine(0, 250, 200, 250, [wall])).toBe(true);
    expect(hasClearLine(0, 50, 90, 50, [wall])).toBe(true);
  });
});

describe("circleAt", () => {
  it("finds the circle that holds a point", () => {
    const circles = [
      { x: 0, y: 0, r: 10 },
      { x: 100, y: 100, r: 20 },
    ];
    expect(circleAt(circles, 105, 95)).toBe(circles[1]);
    expect(circleAt(circles, 50, 50)).toBeUndefined();
  });
});
