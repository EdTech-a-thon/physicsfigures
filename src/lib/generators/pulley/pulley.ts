// Where everything in a Pulley figure goes, before mirroring: the wheels,
// the strings (each a run of straight pieces and arcs round wheels), the
// objects, and what the wheels hang from. Strings are always drawn taut:
// straight between the points where they leave a wheel or meet an object.

import type { Point } from '$lib/shared/field'
import { objectHeight, objectWidth, type ObjectKind } from '$lib/shared/objects'
import type { Segment } from '$lib/shared/vector'
import type { PulleySettings } from './settings'

export const WIDTH = 640
export const HEIGHT = 420
const WHEEL_R = 34
const OBJECT_GAP = 18
const CEILING_Y = 34
const CEILING_HALF = 110
const HANG_TOP = 250
const LOWER_BY = 60
const BOTTOM_MARGIN = 16

export interface Wheel {
  cx: number
  cy: number
  r: number
}

export interface PlacedObject {
  kind: ObjectKind
  size: number
  /** Its bottom middle, and its tilt in degrees. */
  at: Point
  tilt: number
  middle: Point
  height: number
  width: number
  which: 'a' | 'b'
}

export interface PulleyFigure {
  width: number
  height: number
  wheels: Wheel[]
  /** Each string as the points it runs through; `arcs` are the parts wrapped round wheels. */
  strings: Point[][]
  arcs: { wheel: Wheel; from: number; to: number }[]
  objects: PlacedObject[]
  /** A hatched ceiling the wheel hangs from, and the rods holding wheels up. */
  ceiling: Segment | null
  rods: Segment[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })

function hanging(which: 'a' | 'b', x: number, top: number, size: number): PlacedObject {
  const h = objectHeight('block', size)
  return {
    kind: 'block',
    size,
    at: pt(x, top + h),
    tilt: 0,
    middle: pt(x, top + h / 2),
    height: h,
    width: objectWidth('block', size),
    which,
  }
}

/** An Atwood machine: two objects hanging over one fixed pulley. */
function atwood(s: PulleySettings): PulleyFigure {
  const wa = objectWidth('block', s.aSize)
  const wb = objectWidth('block', s.bSize)
  // Big objects need a bigger wheel to hang side by side.
  const r = Math.max(WHEEL_R, (wa / 2 + wb / 2 + OBJECT_GAP) / 2)
  const wheel: Wheel = { cx: WIDTH / 2, cy: CEILING_Y + 40 + r, r }
  const tallest = Math.max(objectHeight('block', s.aSize), objectHeight('block', s.bSize))
  const top = Math.min(HANG_TOP, HEIGHT - BOTTOM_MARGIN - tallest - LOWER_BY)
  const a = hanging('a', wheel.cx - r, top + (s.lower === 'a' ? LOWER_BY : 0), s.aSize)
  const b = hanging('b', wheel.cx + r, top + (s.lower === 'b' ? LOWER_BY : 0), s.bSize)
  return {
    width: WIDTH,
    height: HEIGHT,
    wheels: [wheel],
    strings: [
      [pt(wheel.cx - r, wheel.cy), pt(a.at.x, a.at.y - a.height)],
      [pt(wheel.cx + r, wheel.cy), pt(b.at.x, b.at.y - b.height)],
    ],
    // Over the top of the wheel, from its left side to its right.
    arcs: [{ wheel, from: 180, to: 360 }],
    objects: [a, b],
    ceiling: { x1: wheel.cx - CEILING_HALF, y1: CEILING_Y, x2: wheel.cx + CEILING_HALF, y2: CEILING_Y },
    rods: [{ x1: wheel.cx, y1: CEILING_Y, x2: wheel.cx, y2: wheel.cy }],
  }
}

export function buildPulley(s: PulleySettings): PulleyFigure {
  return atwood(s)
}
