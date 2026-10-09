/**
 * Direction flags written by the virtual joystick and read by the gameplay scenes every frame,
 * next to the keyboard. A plain mutable object so reading it never allocates.
 */
export const touchInput = {
  /** The on-screen controls are switched on (touch device or small window). */
  enabled: false,
  /** The controls are currently on screen (they are hidden outside active gameplay). */
  visible: false,
  left: false,
  right: false,
  up: false,
  down: false,
};

export function clearTouchDirections(): void {
  touchInput.left = false;
  touchInput.right = false;
  touchInput.up = false;
  touchInput.down = false;
}
