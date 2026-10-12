import { distanceToPolyline, isInsideCircle } from "@/lib/engine";

import { BUSHES, RIVER_POLYLINE, RIVER_WIDTH } from "../world-data";

/** True when the point is inside any hiding bush. */
export function isInBush(x: number, y: number): boolean {
  for (const bush of BUSHES) {
    if (isInsideCircle(x, y, bush.x, bush.y, bush.r)) return true;
  }
  return false;
}

/** True when the point is in the stream (close enough to its centre line). */
export function isInWater(x: number, y: number): boolean {
  return distanceToPolyline(x, y, RIVER_POLYLINE) <= RIVER_WIDTH / 2;
}
