import { describe, expect, it } from "vitest";

import {
  createStickDirections,
  createStickState,
  resolveStick,
  stickDirections,
} from "./virtual-stick";

const pressed = (dx: number, dy: number, radius = 100) => {
  const stick = resolveStick(dx, dy, radius, createStickState());
  const dirs = stickDirections(stick, createStickDirections());
  return Object.entries(dirs)
    .filter(([, on]) => on)
    .map(([name]) => name)
    .sort();
};

describe("resolveStick", () => {
  it("reports angle and force for a partial push", () => {
    const stick = resolveStick(30, 40, 100, createStickState());
    expect(stick.force).toBeCloseTo(0.5);
    expect(stick.angle).toBeCloseTo(Math.atan2(40, 30));
    expect(stick.x).toBe(30);
    expect(stick.y).toBe(40);
  });

  it("clamps the thumb to the radius and caps the force at 1", () => {
    const stick = resolveStick(300, 400, 100, createStickState());
    expect(stick.force).toBe(1);
    expect(Math.hypot(stick.x, stick.y)).toBeCloseTo(100);
  });

  it("is centred for no displacement or a zero radius", () => {
    expect(resolveStick(0, 0, 100, createStickState()).force).toBe(0);
    expect(resolveStick(10, 10, 0, createStickState()).force).toBe(0);
  });

  it("writes into the given object", () => {
    const out = createStickState();
    expect(resolveStick(10, 0, 100, out)).toBe(out);
  });
});

describe("stickDirections", () => {
  it("maps the four cardinal pushes", () => {
    expect(pressed(80, 0)).toEqual(["right"]);
    expect(pressed(-80, 0)).toEqual(["left"]);
    expect(pressed(0, 80)).toEqual(["down"]);
    expect(pressed(0, -80)).toEqual(["up"]);
  });

  it("maps the diagonals to two keys, like holding two arrows", () => {
    expect(pressed(70, 70)).toEqual(["down", "right"]);
    expect(pressed(-70, -70)).toEqual(["left", "up"]);
    expect(pressed(70, -70)).toEqual(["right", "up"]);
    expect(pressed(-70, 70)).toEqual(["down", "left"]);
  });

  it("ignores pushes inside the dead zone", () => {
    expect(pressed(20, 0)).toEqual([]);
    expect(pressed(0, 0)).toEqual([]);
  });

  it("treats a slightly off-axis push as a single direction", () => {
    expect(pressed(90, 20)).toEqual(["right"]);
    expect(pressed(20, -90)).toEqual(["up"]);
  });

  it("clears previously pressed directions", () => {
    const dirs = createStickDirections();
    stickDirections(resolveStick(80, 0, 100, createStickState()), dirs);
    expect(dirs.right).toBe(true);
    stickDirections(createStickState(), dirs);
    expect(dirs.right).toBe(false);
  });
});
