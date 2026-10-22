/**
 * Mutable camera state written by CameraRig every frame, read by the minimap so its "up" matches
 * the screen's. Lives outside React/Zustand for the same reason as boatState.
 */
export const cameraState = {
  /** Horizontal orbit angle in radians; 0 = camera south (+Z) of the boat, looking north. */
  azimuth: 0,
}
