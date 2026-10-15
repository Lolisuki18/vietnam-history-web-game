import { distanceToPolyline, isInsideCircle } from "@/lib/engine";

import { BRIDGES, BUSHES, RIVER_POLYLINE, RIVER_WIDTH, ROCK_COVERS } from "../world-data";

/** True when the point is inside any hiding bush. */
export function isInBush(x: number, y: number): boolean {
  for (const bush of BUSHES) {
    if (isInsideCircle(x, y, bush.x, bush.y, bush.r)) return true;
  }
  return false;
}

/** True when the point is behind a hiding rock. */
export function isInRockCover(x: number, y: number): boolean {
  for (const rock of ROCK_COVERS) {
    if (isInsideCircle(x, y, rock.x, rock.y, rock.r)) return true;
  }
  return false;
}

/** True when the point is on the bridge or the stepping stones (dry, in plain sight). */
export function isOnCrossing(x: number, y: number): boolean {
  return BRIDGES.some(
    (crossing) =>
      x >= crossing.x &&
      x <= crossing.x + crossing.w &&
      y >= crossing.y &&
      y <= crossing.y + crossing.h,
  );
}

/** True when the point is in the stream (close enough to its centre line), and not on a crossing. */
export function isInWater(x: number, y: number): boolean {
  return distanceToPolyline(x, y, RIVER_POLYLINE) <= RIVER_WIDTH / 2 && !isOnCrossing(x, y);
}
