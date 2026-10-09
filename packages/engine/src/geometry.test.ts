import { describe, expect, it } from "vitest";

import {
  angleDifference,
  distanceToPolyline,
  distanceToSegment,
  isInsideCircle,
  isPointInCone,
  rotateToward,
  sampleCatmullRom,
  segmentIntersectsRect,
} from "./geometry";

describe("segmentIntersectsRect", () => {
  // Rectangle spanning x 10..20, y 10..20.
  const hit = (x1: number, y1: number, x2: number, y2: number) =>
    segmentIntersectsRect(x1, y1, x2, y2, 10, 10, 10, 10);

  it("detects a segment crossing the rectangle", () => {
    expect(hit(0, 15, 30, 15)).toBe(true);
    expect(hit(0, 0, 30, 30)).toBe(true);
  });

  it("detects a segment that starts or ends inside", () => {
    expect(hit(15, 15, 40, 15)).toBe(true);
    expect(hit(0, 0, 15, 15)).toBe(true);
  });

  it("rejects segments that stop short or pass beside it", () => {
    expect(hit(0, 15, 9, 15)).toBe(false);
    expect(hit(0, 0, 30, 5)).toBe(false);
    expect(hit(25, 0, 25, 30)).toBe(false);
  });

  it("handles axis-parallel segments outside and on the boundary", () => {
    expect(hit(0, 5, 30, 5)).toBe(false);
    expect(hit(0, 10, 30, 10)).toBe(true);
  });

  it("is direction independent", () => {
    expect(hit(30, 15, 0, 15)).toBe(true);
    expect(hit(9, 15, 0, 15)).toBe(false);
  });
});

describe("angleDifference", () => {
  it("wraps across the -PI/PI boundary", () => {
    expect(angleDifference(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(-0.2);
    expect(angleDifference(-Math.PI + 0.1, Math.PI - 0.1)).toBeCloseTo(0.2);
  });

  it("is zero for equal angles", () => {
    expect(angleDifference(1, 1)).toBe(0);
  });
});

describe("rotateToward", () => {
  it("snaps to the target when within the step", () => {
    expect(rotateToward(0, 0.05, 0.1)).toBe(0.05);
  });

  it("takes the short way round", () => {
    expect(rotateToward(Math.PI - 0.05, -Math.PI + 0.05, 0.02)).toBeCloseTo(Math.PI - 0.03);
  });
});

describe("distanceToSegment / distanceToPolyline", () => {
  it("measures perpendicular distance inside the segment", () => {
    expect(distanceToSegment(5, 3, 0, 0, 10, 0)).toBe(3);
  });

  it("clamps to the end points", () => {
    expect(distanceToSegment(13, 4, 0, 0, 10, 0)).toBe(5);
  });

  it("handles degenerate segments", () => {
    expect(distanceToSegment(3, 4, 0, 0, 0, 0)).toBe(5);
  });

  it("returns the closest segment of a polyline", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(distanceToPolyline(12, 5, line)).toBe(2);
  });
});

describe("isInsideCircle", () => {
  it("includes the boundary", () => {
    expect(isInsideCircle(3, 4, 0, 0, 5)).toBe(true);
    expect(isInsideCircle(3, 4.1, 0, 0, 5)).toBe(false);
  });
});

describe("isPointInCone", () => {
  const half = Math.PI / 6; // 30 degrees

  it("sees points in front within range", () => {
    expect(isPointInCone(100, 0, 0, 0, 0, half, 200)).toBe(true);
  });

  it("does not see points behind", () => {
    expect(isPointInCone(-100, 0, 0, 0, 0, half, 200)).toBe(false);
  });

  it("does not see points beyond the range", () => {
    expect(isPointInCone(250, 0, 0, 0, 0, half, 200)).toBe(false);
  });

  it("does not see points outside the half-angle", () => {
    expect(isPointInCone(100, 100, 0, 0, 0, half, 200)).toBe(false);
  });

  it("respects the facing direction across the angle wrap", () => {
    expect(isPointInCone(-100, 5, 0, 0, Math.PI, half, 200)).toBe(true);
  });
});

describe("sampleCatmullRom", () => {
  const control = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 0 },
  ];

  it("passes through every control point", () => {
    const samples = sampleCatmullRom(control, 4);
    expect(samples).toHaveLength(2 * 4 + 1);
    expect(samples[0]).toEqual(control[0]);
    expect(samples[4]!.x).toBeCloseTo(10);
    expect(samples[4]!.y).toBeCloseTo(10);
    expect(samples.at(-1)).toEqual(control[2]);
  });

  it("returns copies when there is nothing to interpolate", () => {
    const single = [{ x: 1, y: 2 }];
    const result = sampleCatmullRom(single, 4);
    expect(result).toEqual(single);
    expect(result[0]).not.toBe(single[0]);
  });
});
