// Where everything in a Coil and Magnet figure goes, before mirroring: the
// magnet on the left, the coil on the right, the whole thing centered.
//
// The coil is seen from the side as a helix. Each turn is a front half (drawn
// over the magnet) and a back half (drawn behind it); the back halves slant,
// so the wire runs on into the next turn. Both ends of the wire come off the
// bottom of the coil as leads.

import type { Segment } from '$lib/shared/vector'
import type { CoilSettings } from './settings'

export const WIDTH = 640
export const HEIGHT = 360
const CY = 170
/** Half the coil's height, half a loop's width seen edge-on, and the gap between turns. */
export const COIL_R = 62
const LOOP_RX = 13
const PITCH = 18
const LEAD = 38

const MAGNET_LENGTH = 150
const MAGNET_HEIGHT = 46
const GAP_OUTSIDE = 70
const MOTION_LENGTH = 76

export interface Magnet {
  x: number
  y: number
  length: number
  height: number
  /** The pole on the side toward the coil. */
  near: 'N' | 'S'
}

export interface CoilFigure {
  width: number
  height: number
  cy: number
  /** Leftmost and rightmost drawn points, after centering. */
  left: number
  right: number
  coil: {
    /** Centers of the first and last turns' loops. */
    left: number
    right: number
    loopRx: number
    r: number
    front: string[]
    back: string[]
    leads: Segment[]
  }
  magnet: Magnet | null
  motion: Segment | null
}

const f = (n: number) => Math.round(n * 100) / 100
const k = 4 / 3 // cubic control distance for a half ellipse

export function buildCoilFigure(s: CoilSettings): CoilFigure {
  const coilLength = (s.turns - 1) * PITCH
  // Lay out from x = 0, then shift everything to center it.
  let coilLeft = 0
  let magnet: Magnet | null = null
  if (s.source === 'magnet') {
    let right: number
    if (s.distance === 'outside') right = coilLeft - LOOP_RX - GAP_OUTSIDE
    else if (s.distance === 'mouth') right = coilLeft
    else right = coilLeft + coilLength / 2 + MAGNET_LENGTH / 2
    magnet = { x: right - MAGNET_LENGTH, y: CY - MAGNET_HEIGHT / 2, length: MAGNET_LENGTH, height: MAGNET_HEIGHT, near: s.facing }
  }

  const drawnLeft = Math.min(coilLeft - LOOP_RX * k, magnet ? magnet.x : Infinity)
  const drawnRight = Math.max(coilLeft + coilLength + LOOP_RX, magnet ? magnet.x + magnet.length : -Infinity)
  const shift = (WIDTH - (drawnRight - drawnLeft)) / 2 - drawnLeft
  coilLeft += shift
  if (magnet) magnet.x += shift

  const top = CY - COIL_R
  const bottom = CY + COIL_R
  const xs = Array.from({ length: s.turns }, (_, i) => coilLeft + i * PITCH)
  const front = xs.map((x) => `M${f(x)},${top} C${f(x + k * LOOP_RX)},${top} ${f(x + k * LOOP_RX)},${bottom} ${f(x)},${bottom}`)
  // The first back half rises straight up the first loop; the rest slant on
  // from one turn's bottom to the next turn's top.
  const back = xs.map((x, i) => {
    const from = i === 0 ? x : xs[i - 1]
    return `M${f(from)},${bottom} C${f(from - k * LOOP_RX)},${bottom} ${f(x - k * LOOP_RX)},${top} ${f(x)},${top}`
  })
  const leads: Segment[] = [xs[0], xs.at(-1)!].map((x) => ({ x1: f(x), y1: bottom, x2: f(x), y2: bottom + LEAD }))

  let motion: Segment | null = null
  if (magnet && s.motion !== 'none') {
    const mid = magnet.x + magnet.length / 2
    // Above the magnet, or above the coil when the magnet is in it.
    const y = s.distance === 'outside' ? magnet.y - 30 : top - 28
    const dir = s.motion === 'toward' ? 1 : -1
    motion = { x1: f(mid - (dir * MOTION_LENGTH) / 2), y1: y, x2: f(mid + (dir * MOTION_LENGTH) / 2), y2: y }
  }

  return {
    width: WIDTH,
    height: HEIGHT,
    cy: CY,
    left: f(drawnLeft + shift),
    right: f(drawnRight + shift),
    coil: { left: f(xs[0]), right: f(xs.at(-1)!), loopRx: LOOP_RX, r: COIL_R, front, back, leads },
    magnet,
    motion,
  }
}
