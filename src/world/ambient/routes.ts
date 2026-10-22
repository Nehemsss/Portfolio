/**
 * Closed loop around the outside of the archipelago through open water only (XZ points).
 * Verified offline against every island/islet: closest approach ≈ 17.5 units from any shore.
 * Used by the whale, and (scaled slightly outward) by the Halloween ghost ship.
 */
export const OUTER_ROUTE: [number, number][] = [
  [0, 68], [50, 62], [85, 35], [102, -5], [116, -48], [104, -96], [52, -116],
  [0, -124], [-52, -116], [-104, -96], [-116, -48], [-102, -5], [-85, 35], [-50, 62],
]
