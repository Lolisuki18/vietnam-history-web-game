export interface Point {
  x: number;
  y: number;
}

const TWO_PI = Math.PI * 2;

/** Smallest signed difference between two angles in radians, in (-PI, PI]. */
export function angleDifference(a: number, b: number): number {
  let diff = (a - b) % TWO_PI;
  if (diff > Math.PI) diff -= TWO_PI;
  else if (diff <= -Math.PI) diff += TWO_PI;
  return diff;
}

/** Rotate `current` toward `target` by at most `maxStep` radians. */
export function rotateToward(current: number, target: number, maxStep: number): number {
  const diff = angleDifference(target, current);
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

/** Distance from point (px, py) to the segment (ax, ay)-(bx, by). */
export function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distance from a point to the closest segment of an open polyline. */
export function distanceToPolyline(px: number, py: number, points: readonly Point[]): number {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const d = distanceToSegment(px, py, a.x, a.y, b.x, b.y);
    if (d < best) best = d;
  }
  return best;
}

/** True when (px, py) lies inside the circle centred on (cx, cy). */
export function isInsideCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/**
 * True when the segment (x1, y1)-(x2, y2) touches the axis-aligned rectangle
 * (rx, ry, rw, rh). Liang–Barsky clipping, no allocation.
 */
export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;

  // Clip against one edge: `p` is the direction component, `q` the signed distance to the edge.
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  return (
    clip(-dx, x1 - rx) && clip(dx, rx + rw - x1) && clip(-dy, y1 - ry) && clip(dy, ry + rh - y1)
  );
}

/**
 * True when (px, py) is inside a vision cone: apex (ox, oy), centre direction `facing`
 * (radians), half-angle `halfAngle` (radians) and length `range`.
 */
export function isPointInCone(
  px: number,
  py: number,
  ox: number,
  oy: number,
  facing: number,
  halfAngle: number,
  range: number,
): boolean {
  const dx = px - ox;
  const dy = py - oy;
  if (dx * dx + dy * dy > range * range) return false;
  return Math.abs(angleDifference(Math.atan2(dy, dx), facing)) <= halfAngle;
}

/**
 * Sample a Catmull-Rom spline through `points` (uniform parameterisation).
 * Returns `samplesPerSegment` points per span plus the final control point.
 */
export function sampleCatmullRom(points: readonly Point[], samplesPerSegment: number): Point[] {
  const count = points.length;
  if (count < 2) return points.map((p) => ({ ...p }));
  const result: Point[] = [];
  for (let i = 0; i < count - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(i + 2, count - 1)]!;
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const blend = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      result.push({ x: blend(p0.x, p1.x, p2.x, p3.x), y: blend(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  result.push({ ...points[count - 1]! });
  return result;
}
