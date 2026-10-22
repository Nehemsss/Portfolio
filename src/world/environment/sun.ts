import { Vector3 } from 'three'

/** Direction toward the daytime sun. Shared by the sky, the directional light and the water glint. */
// Behind the starting camera (south-west, fairly high) so island fronts are lit on arrival.
export const SUN_DIRECTION = new Vector3(-0.45, 0.65, 0.6).normalize()
