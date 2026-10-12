import type Phaser from "phaser";

/**
 * Direction flags written by the virtual joystick and read by the gameplay scenes every frame,
 * next to the keyboard. A plain mutable object so reading it never allocates. Every game creates
 * its own (`createTouchInput`), so two games can never see each other's input.
 */
export interface TouchInput {
  /** The on-screen controls are switched on (touch device or small window). */
  enabled: boolean;
  /** The controls are currently on screen (they are hidden outside active gameplay). */
  visible: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export function createTouchInput(): TouchInput {
  return { enabled: false, visible: false, left: false, right: false, up: false, down: false };
}

export function clearTouchDirections(input: TouchInput): void {
  input.left = false;
  input.right = false;
  input.up = false;
  input.down = false;
}

/** Back to the initial state (when the game is torn down). */
export function resetTouchInput(input: TouchInput): void {
  input.enabled = false;
  input.visible = false;
  clearTouchDirections(input);
}

/** Windows narrower than this get the on-screen controls even without a touch screen. */
const SMALL_WINDOW_WIDTH = 700;

/**
 * Whether to show the virtual controls: touch-capable device, or a small window. The URL can
 * force it either way (`?touch=1` / `?touch=0`), which is handy for testing on a desktop.
 */
export function wantsTouchControls(game: Phaser.Game, width: number): boolean {
  const forced = new URLSearchParams(window.location.search).get("touch");
  if (forced === "1") return true;
  if (forced === "0") return false;
  return game.device.input.touch || width < SMALL_WINDOW_WIDTH;
}
