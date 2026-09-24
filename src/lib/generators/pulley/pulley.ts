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
const GROUND_Y = HEIGHT - 30
const HATCH_SPACING = 13
const HATCH_LENGTH = 9
const TABLE_TOP = 170
const TABLE_LEFT = 50
const TABLE_EDGE = 400
const TABLE_THICK = 16
const LEG = 14
/** How far below the wheel a hanging object's top is, when there's room. */
const HANG_DROP = 110
const MAX_RAMP_BASE = 380
const FIT_MARGIN = 14
const GROUND_OVERHANG = 30
/** The least string below a wheel before its hanging object, and the gap left above the ground. */
const MIN_DROP = 58
const GROUND_CLEAR = 12
const ARC_R = 44
const ANGLE_LABEL_R = 68

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
  /** A hatched ceiling the wheel hangs from, and the rods and brackets holding wheels up. */
  ceiling: Segment | null
  rods: Segment[]
  /** Hatched ground or floor. */
  ground: Segment | null
  groundHatches: Segment[]
  /** A table: its top surface's height, the slab and legs. */
  table: { top: number; slab: { x: number; y: number; w: number; h: number }; legs: { x: number; y: number; w: number; h: number }[] } | null
  /** A ramp: its three corners, the angle's arc (from the foot) and where its label goes. */
  ramp: { foot: Point; corner: Point; top: Point; arc: string; angleLabelAt: Point } | null
  /** A block a low ramp stands on, so there's room below its pulley for the hanging object. */
  platform: { x: number; y: number; w: number; h: number } | null
  /** Hatching under a rough table or slope. */
  hatches: Segment[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })

const seg = (a: Point, b: Point): Segment => ({ x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) })
const empty = { ground: null, groundHatches: [], table: null, ramp: null, platform: null, hatches: [] as Segment[] }

/** An object resting at `at` (its bottom middle), tilted by `tilt` degrees; `n` points out of the surface. */
function resting(which: 'a' | 'b', kind: ObjectKind, size: number, at: Point, tilt: number, n: Point): PlacedObject {
  const h = objectHeight(kind, size)
  return { kind, size, at, tilt, middle: pt(at.x + (n.x * h) / 2, at.y + (n.y * h) / 2), height: h, width: objectWidth(kind, size), which }
}

function groundHatches(g: Segment): Segment[] {
  const out: Segment[] = []
  for (let x = g.x1 + 4; x < g.x2; x += HATCH_SPACING) out.push(seg(pt(x + HATCH_LENGTH * 0.8, g.y1), pt(x, g.y1 + HATCH_LENGTH)))
  return out
}

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
    ...empty,
  }
}

/** Where a hanging object goes below a wheel: a good way down, but clear of the ground. */
function hangBelow(which: 'a' | 'b', wheel: Wheel, size: number): PlacedObject {
  const h = objectHeight('block', size)
  return hanging(which, wheel.cx + wheel.r, Math.min(wheel.cy + HANG_DROP, GROUND_Y - 12 - h), size)
}

/** A block or cart on a table, tied level over a pulley at the table's edge to a hanging object. */
function table(s: PulleySettings): PulleyFigure {
  const kind = s.aKind as ObjectKind
  const ha = objectHeight(kind, s.aSize)
  const wa = objectWidth(kind, s.aSize)
  const stringY = TABLE_TOP - ha / 2
  const r = WHEEL_R
  const wheel: Wheel = { cx: TABLE_EDGE + r * 0.6, cy: stringY + r, r }
  const a = resting('a', kind, s.aSize, pt(TABLE_EDGE - 90 - wa / 2, TABLE_TOP), 0, { x: 0, y: -1 })
  const b = hangBelow('b', wheel, s.bSize)
  const hatches: Segment[] = []
  if (s.surface === 'rough') {
    for (let x = TABLE_LEFT + 6; x < TABLE_EDGE - 4; x += HATCH_SPACING) hatches.push(seg(pt(x, TABLE_TOP), pt(x - 6, TABLE_TOP + HATCH_LENGTH)))
  }
  const legTop = TABLE_TOP + TABLE_THICK
  const ground = seg(pt(20, GROUND_Y), pt(WIDTH - 20, GROUND_Y))
  return {
    width: WIDTH,
    height: HEIGHT,
    wheels: [wheel],
    strings: [
      [pt(a.at.x + wa / 2, stringY), pt(wheel.cx, wheel.cy - r)],
      [pt(wheel.cx + r, wheel.cy), pt(b.at.x, b.at.y - b.height)],
    ],
    // From the top of the wheel round to its right-hand side.
    arcs: [{ wheel, from: 270, to: 360 }],
    objects: [a, b],
    ceiling: null,
    // A bracket from the table's corner to the wheel's axle.
    rods: [seg(pt(TABLE_EDGE, TABLE_TOP + TABLE_THICK / 2), pt(wheel.cx, wheel.cy))],
    ground,
    groundHatches: groundHatches(ground),
    table: {
      top: TABLE_TOP,
      slab: { x: TABLE_LEFT, y: TABLE_TOP, w: TABLE_EDGE - TABLE_LEFT, h: TABLE_THICK },
      legs: [TABLE_LEFT + 12, TABLE_EDGE - 12 - LEG].map((x) => ({ x, y: legTop, w: LEG, h: GROUND_Y - legTop })),
    },
    ramp: null,
    platform: null,
    hatches,
  }
}

/**
 * A block or cart on a ramp, tied over a pulley at the ramp's top to a
 * hanging object. The string runs parallel to the slope from the middle of
 * the object's up-slope face, so the wheel sits one radius below that line,
 * far enough past the ramp's top for the hanging object to clear the ramp.
 * A ramp too low for the hanging object to hang below its pulley stands on a
 * platform. The ramp is as big as fits, and the whole figure is centered.
 */
function ramp(s: PulleySettings): PulleyFigure {
  const room = { left: FIT_MARGIN, right: WIDTH - FIT_MARGIN, top: FIT_MARGIN }
  const fits = (f: ReturnType<typeof rampAt>) => {
    const b = boundsOf(f.extent)
    return b.right - b.left <= room.right - room.left && b.top >= room.top
  }
  // The biggest ramp that fits, with the hanging object a good way below its
  // pulley if there's room, or else as little string as looks right.
  let base = MAX_RAMP_BASE
  let f = rampAt(s, base, HANG_DROP)
  for (let i = 0; i < 80 && !fits(f); i++) {
    f = rampAt(s, base, MIN_DROP)
    if (fits(f)) break
    base *= 0.95
    f = rampAt(s, base, HANG_DROP)
  }
  const b = boundsOf(f.extent)
  return shiftX(f, (WIDTH - (b.right - b.left)) / 2 - b.left)
}

function rampAt(s: PulleySettings, base: number, wantDrop: number): PulleyFigure & { extent: Point[] } {
  const a = (s.angle * Math.PI) / 180
  const u = { x: Math.cos(a), y: -Math.sin(a) }
  const n = { x: -Math.sin(a), y: -Math.cos(a) }
  const along = (p: Point, d: number, q: Point = u) => pt(p.x + q.x * d, p.y + q.y * d)
  const kind = s.aKind as ObjectKind
  const ha = objectHeight(kind, s.aSize)
  const wa = objectWidth(kind, s.aSize)
  const hb = objectHeight('block', s.bSize)
  const wb = objectWidth('block', s.bSize)
  const r = WHEEL_R
  const off = ha / 2 // the string's height above the slope
  const rise = base * Math.tan(a)
  // Along the slope from the top until the hanging string clears the ramp's side.
  const reach = Math.max(0, (wb / 2 + 8 - r - n.x * (off - r)) / u.x)
  // How far the wheel's middle is below the ramp's top, and so how high the ramp must stand
  // for the hanging object to fit below the wheel.
  const wheelBelowTop = u.y * reach + n.y * (off - r)
  const needed = wheelBelowTop + wantDrop + hb + GROUND_CLEAR // from the ramp's top down to the ground
  const lift = Math.max(0, needed - rise)

  const x0 = 0
  const footY = GROUND_Y - lift
  const foot = pt(x0, footY)
  const corner = pt(x0 + base, footY)
  const top = pt(x0 + base, footY - rise)
  const c = along(along(top, reach), off - r, n)
  const wheel: Wheel = { cx: c.x, cy: c.y, r }
  const slope = base / Math.cos(a)
  const obj = resting('a', kind, s.aSize, along(foot, slope * 0.45), -s.angle, n)
  const drop = Math.min(wantDrop, GROUND_Y - GROUND_CLEAR - hb - wheel.cy)
  const b = hanging('b', wheel.cx + r, wheel.cy + drop, s.bSize)
  const leave = along(c, r, n) // where the string meets the wheel

  const hatches: Segment[] = []
  if (s.surface === 'rough') {
    for (let d = ANGLE_LABEL_R + 30; d < slope - 4; d += HATCH_SPACING) {
      const p = along(foot, d)
      hatches.push(seg(p, pt(p.x - n.x * HATCH_LENGTH - u.x * HATCH_LENGTH * 0.7, p.y - n.y * HATCH_LENGTH - u.y * HATCH_LENGTH * 0.7)))
    }
  }
  const half = a / 2
  const ground = seg(pt(-GROUND_OVERHANG, GROUND_Y), pt(Math.max(wheel.cx + r + wb / 2, x0 + base) + GROUND_OVERHANG, GROUND_Y))
  // The object's four corners, for fitting.
  const corners = [along(obj.at, -wa / 2), along(obj.at, wa / 2)].flatMap((p) => [p, along(p, ha, n)])
  return {
    width: WIDTH,
    height: HEIGHT,
    wheels: [wheel],
    strings: [
      [along(obj.middle, wa / 2), leave],
      [pt(wheel.cx + r, wheel.cy), pt(b.at.x, b.at.y - b.height)],
    ],
    // From where the string meets the wheel, over the top, round to its right-hand side.
    arcs: [{ wheel, from: (Math.atan2(n.y, n.x) * 180) / Math.PI + 360, to: 360 }],
    objects: [obj, b],
    ceiling: null,
    rods: [seg(top, c)],
    ground,
    groundHatches: groundHatches(ground),
    table: null,
    ramp: {
      foot,
      corner,
      top,
      arc: `M${ARC_R},0 A${ARC_R},${ARC_R} 0 0 0 ${r2(u.x * ARC_R)},${r2(u.y * ARC_R)}`,
      angleLabelAt: pt(foot.x + Math.cos(half) * ANGLE_LABEL_R + 6, foot.y - Math.sin(half) * ANGLE_LABEL_R - 2),
    },
    platform: lift > 0 ? { x: x0, y: footY, w: base, h: lift } : null,
    hatches,
    extent: [foot, top, ...corners, pt(wheel.cx - r, wheel.cy - r), pt(wheel.cx + r, wheel.cy - r), pt(b.at.x + b.width / 2, b.at.y), pt(b.at.x - b.width / 2, b.at.y)],
  }
}

const boundsOf = (points: Point[]) => ({
  left: Math.min(...points.map((p) => p.x)),
  right: Math.max(...points.map((p) => p.x)),
  top: Math.min(...points.map((p) => p.y)),
})

/** The figure moved sideways by dx. */
function shiftX(f: PulleyFigure & { extent?: Point[] }, dx: number): PulleyFigure {
  const p = (q: Point) => pt(q.x + dx, q.y)
  const sg = (q: Segment) => seg(p({ x: q.x1, y: q.y1 }), p({ x: q.x2, y: q.y2 }))
  const wheels = f.wheels.map((w) => ({ ...w, cx: r2(w.cx + dx) }))
  return {
    ...f,
    wheels,
    strings: f.strings.map((st) => st.map(p)),
    arcs: f.arcs.map((a) => ({ ...a, wheel: wheels[f.wheels.indexOf(a.wheel)] })),
    objects: f.objects.map((o) => ({ ...o, at: p(o.at), middle: p(o.middle) })),
    ceiling: f.ceiling && sg(f.ceiling),
    rods: f.rods.map(sg),
    ground: f.ground && sg(f.ground),
    groundHatches: f.groundHatches.map(sg),
    table: f.table,
    ramp: f.ramp && { ...f.ramp, foot: p(f.ramp.foot), corner: p(f.ramp.corner), top: p(f.ramp.top), angleLabelAt: p(f.ramp.angleLabelAt) },
    platform: f.platform && { ...f.platform, x: r2(f.platform.x + dx) },
    hatches: f.hatches.map(sg),
  }
}

export function buildPulley(s: PulleySettings): PulleyFigure {
  if (s.setup === 'table') return table(s)
  if (s.setup === 'ramp') return ramp(s)
  return atwood(s)
}
