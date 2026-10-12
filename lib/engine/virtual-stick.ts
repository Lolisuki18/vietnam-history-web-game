/** A virtual joystick reading. `x`/`y` are the clamped thumb offset in px from the centre. */
export interface StickState {
  x: number;
  y: number;
  /** 0 (centred) to 1 (pushed to the edge). */
  force: number;
  /** Direction of the push in radians (screen coordinates: y grows downwards). */
  angle: number;
}

export interface StickDirections {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export function createStickState(): StickState {
  return { x: 0, y: 0, force: 0, angle: 0 };
}

export function createStickDirections(): StickDirections {
  return { left: false, right: false, up: false, down: false };
}

/**
 * Turn a pointer displacement (`dx`, `dy` px from the stick centre) into a stick reading,
 * clamping the thumb to `radius`. Writes into `out` so it can be called every move event
 * without allocating.
 */
export function resolveStick(dx: number, dy: number, radius: number, out: StickState): StickState {
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || radius <= 0) {
    out.x = 0;
    out.y = 0;
    out.force = 0;
    out.angle = 0;
    return out;
  }
  const scale = distance > radius ? radius / distance : 1;
  out.x = dx * scale;
  out.y = dy * scale;
  out.force = Math.min(1, distance / radius);
  out.angle = Math.atan2(dy, dx);
  return out;
}

/**
 * Digital 8-way direction of a stick reading, matching what the keyboard produces (WASD /
 * arrows). Below `deadZone` force nothing is pressed; `axisThreshold` is the minimum component
 * of the unit push direction on an axis (0.38 ≈ sin 22.5°, which splits the circle in 8 sectors).
 */
export function stickDirections(
  stick: StickState,
  out: StickDirections,
  deadZone = 0.3,
  axisThreshold = 0.38,
): StickDirections {
  if (stick.force < deadZone) {
    out.left = false;
    out.right = false;
    out.up = false;
    out.down = false;
    return out;
  }
  const nx = Math.cos(stick.angle);
  const ny = Math.sin(stick.angle);
  out.right = nx > axisThreshold;
  out.left = nx < -axisThreshold;
  out.down = ny > axisThreshold;
  out.up = ny < -axisThreshold;
  return out;
}
