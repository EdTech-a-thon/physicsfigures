// Where everything in a Pulley figure goes, before mirroring: the wheels,
// the strings (each a run of straight pieces and arcs round wheels), the
// objects, and what the wheels hang from. Strings are always drawn taut:
// straight between the points where they leave a wheel or meet an object.

import type { Point } from '$lib/shared/field'
import { objectHeight, objectWidth, type ObjectKind } from '$lib/shared/objects'
import type { Label } from '$lib/shared/label'
import { labelPoint, type LabeledVector, type Segment } from '$lib/shared/vector'
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
const TACKLE_R = 24
/** How far the movable pulleys hang below the fixed ones, when there's room. */
const TACKLE_SPAN = 150
const BAR_GAP = 14
const HOOK = 18
const FIT_MARGIN = 14
const GROUND_OVERHANG = 30
/** The least string below a wheel before its hanging object, and the gap left above the ground. */
const MIN_DROP = 58
const GROUND_CLEAR = 12
const ARC_R = 44
const ANGLE_LABEL_R = 68

export type VectorKind = 'tension' | 'gravity' | 'normal' | 'friction' | 'acceleration'

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
  which: 'a' | 'b' | 'load'
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
  /**
   * A block and tackle: the bar the movable pulleys hang from (and the load
   * from it), the hook from the bar to the load, the strands holding the load
   * up (each as the index of its string), and the free end the effort pulls.
   */
  tackle: { bar: Segment | null; hook: Segment | null; supporting: number[]; effort: Point } | null
  vectors: LabeledVector<VectorKind>[]
  /** Hatching under a rough table or slope. */
  hatches: Segment[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })

const seg = (a: Point, b: Point): Segment => ({ x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) })
const empty = { ground: null, groundHatches: [], table: null, ramp: null, platform: null, tackle: null, hatches: [] as Segment[], vectors: [] }

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

function hanging(which: PlacedObject['which'], x: number, top: number, size: number): PlacedObject {
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

/** Room to leave below a hanging object for its gravity vector and label. */
const belowFor = (s: PulleySettings) => (s.gravity ? VECTOR_LENGTH + 34 : 0)
/** Room to leave above the object on a table or ramp for its normal force or acceleration, and their labels. */
const aboveFor = (s: PulleySettings) => Math.max(s.normal ? VECTOR_LENGTH + 34 : 0, s.acceleration !== 'none' ? 50 : 0)

/** An Atwood machine: two objects hanging over one fixed pulley. */
function atwood(s: PulleySettings): PulleyFigure {
  const wa = objectWidth('block', s.aSize)
  const wb = objectWidth('block', s.bSize)
  // Big objects need a bigger wheel to hang side by side.
  const r = Math.max(WHEEL_R, (wa / 2 + wb / 2 + OBJECT_GAP) / 2)
  const wheel: Wheel = { cx: WIDTH / 2, cy: CEILING_Y + 40 + r, r }
  const tallest = Math.max(objectHeight('block', s.aSize), objectHeight('block', s.bSize))
  const lowerBy = s.lower === 'neither' ? 0 : LOWER_BY
  // As high as leaves room below, but always a string's length below the wheel;
  // when that runs out of room, the figure grows.
  const top = Math.max(wheel.cy + Math.max(MIN_DROP, r + 24), Math.min(HANG_TOP, HEIGHT - BOTTOM_MARGIN - tallest - lowerBy - belowFor(s)))
  const a = hanging('a', wheel.cx - r, top + (s.lower === 'a' ? LOWER_BY : 0), s.aSize)
  const b = hanging('b', wheel.cx + r, top + (s.lower === 'b' ? LOWER_BY : 0), s.bSize)
  return {
    width: WIDTH,
    height: Math.max(HEIGHT, Math.ceil(Math.max(a.at.y, b.at.y) + belowFor(s) + BOTTOM_MARGIN)),
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

/** Where a hanging object goes below a wheel: a good way down, but clear of the ground (and of room for its gravity vector). */
function hangBelow(which: 'a' | 'b', wheel: Wheel, size: number, below: number, groundY = GROUND_Y): PlacedObject {
  const h = objectHeight('block', size)
  const top = Math.max(wheel.cy + Math.max(MIN_DROP, wheel.r + 24), Math.min(wheel.cy + HANG_DROP, groundY - GROUND_CLEAR - h - below))
  return hanging(which, wheel.cx + wheel.r, top, size)
}

/** A block or cart on a table, tied level over a pulley at the table's edge to a hanging object. */
function table(s: PulleySettings): PulleyFigure {
  const kind = s.aKind as ObjectKind
  const ha = objectHeight(kind, s.aSize)
  const wa = objectWidth(kind, s.aSize)
  // The table stands lower when a tall object and the vectors above it need the room.
  const tableTop = Math.max(TABLE_TOP, FIT_MARGIN + ha + aboveFor(s))
  const stringY = tableTop - ha / 2
  const r = WHEEL_R
  const wheel: Wheel = { cx: TABLE_EDGE + r * 0.6, cy: stringY + r, r }
  const a = resting('a', kind, s.aSize, pt(TABLE_EDGE - 90 - wa / 2, tableTop), 0, { x: 0, y: -1 })
  const b = hangBelow('b', wheel, s.bSize, belowFor(s))
  // And the floor drops (the figure growing) when the hanging object still needs more room.
  const groundY = Math.max(GROUND_Y, b.at.y + belowFor(s) + GROUND_CLEAR)
  const hatches: Segment[] = []
  if (s.surface === 'rough') {
    for (let x = TABLE_LEFT + 6; x < TABLE_EDGE - 4; x += HATCH_SPACING) hatches.push(seg(pt(x, tableTop), pt(x - 6, tableTop + HATCH_LENGTH)))
  }
  const legTop = tableTop + TABLE_THICK
  const ground = seg(pt(20, groundY), pt(WIDTH - 20, groundY))
  return {
    width: WIDTH,
    height: Math.max(HEIGHT, groundY + 30),
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
    rods: [seg(pt(TABLE_EDGE, tableTop + TABLE_THICK / 2), pt(wheel.cx, wheel.cy))],
    ground,
    groundHatches: groundHatches(ground),
    table: {
      top: tableTop,
      slab: { x: TABLE_LEFT, y: tableTop, w: TABLE_EDGE - TABLE_LEFT, h: TABLE_THICK },
      legs: [TABLE_LEFT + 12, TABLE_EDGE - 12 - LEG].map((x) => ({ x, y: legTop, w: LEG, h: groundY - legTop })),
    },
    ramp: null,
    platform: null,
    tackle: null,
    hatches,
    vectors: [],
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
  const needed = wheelBelowTop + wantDrop + hb + GROUND_CLEAR + belowFor(s) // from the ramp's top down to the ground
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
  const drop = Math.min(wantDrop, GROUND_Y - GROUND_CLEAR - hb - belowFor(s) - wheel.cy)
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
    tackle: null,
    vectors: [],
    hatches,
    extent: [foot, top, ...corners, along(obj.middle, ha / 2 + aboveFor(s), n), pt(wheel.cx - r, wheel.cy - r), pt(wheel.cx + r, wheel.cy - r), pt(b.at.x + b.width / 2, b.at.y), pt(b.at.x - b.width / 2, b.at.y)],
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
    vectors: f.vectors,
  }
}

/**
 * A block and tackle: a load held up by `n` strands. The rope's strands hang
 * side by side, strand 0 being the free end the effort pulls down on. Fixed
 * pulleys at the top join strands 0–1 and 2–3; movable pulleys at the bottom,
 * on a bar the load hangs from, join strands 1–2 and 3–4. The rope's far end
 * is tied to the ceiling (even n) or the bar (odd n); with one strand there
 * are no movable pulleys and the load hangs from the rope itself.
 */
function tackle(s: PulleySettings): PulleyFigure {
  const n = s.strands
  const hl = objectHeight('block', s.loadSize)
  const wl = objectWidth('block', s.loadSize)
  // With one strand the load hangs beside the free end, so the wheel spreads them apart.
  const r = n === 1 ? Math.max(TACKLE_R, wl / 4 + 8) : TACKLE_R
  const d = 2 * r
  const x0 = WIDTH / 2 - (n * d) / 2
  const xs = Array.from({ length: n + 1 }, (_, j) => x0 + j * d)
  const topY = CEILING_Y + 44 + r
  const room = HEIGHT - BOTTOM_MARGIN - hl - HOOK - BAR_GAP - r - topY - belowFor(s)
  const bottomY = topY + Math.min(TACKLE_SPAN, room)
  const barY = bottomY + r + BAR_GAP

  const topPair = (j: number) => j - (j % 2) + 1 <= n // strand j meets a fixed pulley
  const bottomPair = (j: number) => {
    const q = j % 2 === 1 ? j : j - 1
    return q >= 1 && q + 1 <= n // strand j meets a movable pulley
  }
  const wheels: Wheel[] = []
  const arcs: PulleyFigure['arcs'] = []
  for (let j = 0; j + 1 <= n; j += 2) {
    const w = { cx: r2((xs[j] + xs[j + 1]) / 2), cy: r2(topY), r }
    wheels.push(w)
    arcs.push({ wheel: w, from: 180, to: 360 })
  }
  for (let j = 1; j + 1 <= n; j += 2) {
    const w = { cx: r2((xs[j] + xs[j + 1]) / 2), cy: r2(bottomY), r }
    wheels.push(w)
    arcs.push({ wheel: w, from: 0, to: 180 })
  }
  const movable = wheels.filter((w) => w.cy === r2(bottomY))

  // The load hangs from the middle of the bar, or from the rope with one strand.
  const bar = movable.length ? seg(pt(Math.min(...movable.map((w) => w.cx)) - r, barY), pt(Math.max(xs[n], ...movable.map((w) => w.cx + r)), barY)) : null
  const loadX = bar ? (bar.x1 + bar.x2) / 2 : xs[1]
  const loadTop = bar ? barY + HOOK : bottomY
  const load = hanging('load', loadX, loadTop, s.loadSize)
  const effortEnd = pt(xs[0], Math.min(bottomY + 50, HEIGHT - BOTTOM_MARGIN))

  const strings: Point[][] = [[pt(xs[0], topY), effortEnd]]
  const supporting: number[] = []
  for (let j = 1; j <= n; j++) {
    const upper = topPair(j) ? topY : CEILING_Y
    const lower = bottomPair(j) ? bottomY : bar ? barY : loadTop
    supporting.push(strings.length)
    strings.push([pt(xs[j], upper), pt(xs[j], lower)])
  }
  const rods = [
    ...wheels.filter((w) => w.cy === r2(topY)).map((w) => seg(pt(w.cx, CEILING_Y), pt(w.cx, w.cy))),
    ...movable.map((w) => seg(pt(w.cx, w.cy), pt(w.cx, barY))),
  ]
  return {
    width: WIDTH,
    height: HEIGHT,
    wheels,
    strings,
    arcs,
    objects: [load],
    ceiling: seg(pt(Math.min(xs[0], loadX - wl / 2) - 40, CEILING_Y), pt(Math.max(xs[n], loadX + wl / 2) + 40, CEILING_Y)),
    rods,
    ...empty,
    tackle: { bar, hook: bar ? seg(pt(loadX, barY), pt(loadX, loadTop)) : null, supporting, effort: effortEnd },
  }
}

const VECTOR_LENGTH = 60
const TENSION_LENGTH = 56
const ACCEL_LENGTH = 50
const LABEL_SIZE = 22

/** Along an object's surface (toward its right, before tilting) and out of it. */
function axes(o: PlacedObject) {
  const t = (o.tilt * Math.PI) / 180
  return { u: { x: Math.cos(t), y: Math.sin(t) }, n: { x: Math.sin(t), y: -Math.cos(t) } }
}

/**
 * The vectors the teacher turned on. Tension runs along each string at both
 * ends: away from the object it's tied to, and away from the pulley; a block
 * and tackle shows it once in every strand holding the load (pointing up) and
 * at the free end. Forces on objects start at their edge, as on the Inclined
 * Plane; acceleration rides beside each object.
 */
function vectorsFor(f: PulleyFigure, s: PulleySettings): LabeledVector<VectorKind>[] {
  const out: LabeledVector<VectorKind>[] = []
  const centerX = f.wheels.length ? f.wheels.reduce((sum, w) => sum + w.cx, 0) / f.wheels.length : WIDTH / 2
  const widthOf = (l: Label) => [...l.text].length * LABEL_SIZE * 0.42
  /** A vector from `from` in direction `d`, labeled past its tip or beside its middle (on the side away from the figure's middle). */
  const add = (kind: VectorKind, from: Point, d: Point, length: number, label: Label, at: 'tip' | 'side' = 'tip') => {
    const v = seg(from, pt(from.x + d.x * length, from.y + d.y * length))
    let labelAt: Point
    if (at === 'tip') {
      labelAt = labelPoint(v, { at: 'tip', gap: 12 + (widthOf(label) / 2) * Math.abs(d.x) + 11 * Math.abs(d.y) })
    } else {
      // Side 1 is to the left of the way it points; pick whichever side faces out (or up, for a level vector).
      const left = { x: d.y, y: -d.x }
      const mid = { x: (v.x1 + v.x2) / 2, y: (v.y1 + v.y2) / 2 }
      const out1 = Math.abs(left.x) > 0.3 ? left.x * (mid.x - centerX) > 0 : left.y < 0
      labelAt = labelPoint(v, { at: 'middle', side: out1 ? 1 : -1, gap: 12 + widthOf(label) / 2 })
    }
    out.push({ kind, v, label, labelAt: pt(labelAt.x, labelAt.y) })
  }
  const toward = (a: Point, b: Point) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    return { x: (b.x - a.x) / len, y: (b.y - a.y) / len }
  }
  const lengthOf = (st: Point[]) => Math.hypot(st.at(-1)!.x - st[0].x, st.at(-1)!.y - st[0].y)

  if (s.tension) {
    if (f.tackle) {
      for (const i of f.tackle.supporting) {
        const st = f.strings[i]
        const low = st[0].y > st.at(-1)!.y ? st[0] : st.at(-1)!
        add('tension', low, { x: 0, y: -1 }, Math.min(TENSION_LENGTH, lengthOf(st) * 0.42), s.tensionLabel, 'side')
      }
      add('tension', f.tackle.effort, { x: 0, y: 1 }, TENSION_LENGTH * 0.8, s.tensionLabel, 'side')
    } else {
      // Which end of each string is tied to an object: the first string's object end is
      // its last point in an Atwood machine and its first on a table or ramp.
      const objectEnd = s.setup === 'atwood' ? ['end', 'end'] : ['start', 'end']
      f.strings.forEach((st, i) => {
        const [tied, other] = objectEnd[i] === 'end' ? [st.at(-1)!, st[0]] : [st[0], st.at(-1)!]
        const length = Math.min(TENSION_LENGTH, lengthOf(st) * 0.42)
        add('tension', tied, toward(tied, other), length, s.tensionLabel, 'side')
        add('tension', other, toward(other, tied), length, s.tensionLabel, 'side')
      })
    }
  }

  const gravityLabel = (o: PlacedObject) => (o.which === 'a' ? s.aGravityLabel : o.which === 'b' ? s.bGravityLabel : s.loadGravityLabel)
  const toEdge = (o: PlacedObject, d: Point) => {
    const { u, n } = axes(o)
    const du = Math.abs(d.x * u.x + d.y * u.y)
    const dn = Math.abs(d.x * n.x + d.y * n.y)
    return Math.min(du > 1e-9 ? o.width / 2 / du : Infinity, dn > 1e-9 ? o.height / 2 / dn : Infinity)
  }
  const fromEdge = (o: PlacedObject, d: Point) => {
    const e = toEdge(o, d)
    return pt(o.middle.x + d.x * e, o.middle.y + d.y * e)
  }
  if (s.gravity) for (const o of f.objects) add('gravity', fromEdge(o, { x: 0, y: 1 }), { x: 0, y: 1 }, VECTOR_LENGTH, gravityLabel(o))

  const surface = s.setup === 'table' || s.setup === 'ramp' ? f.objects[0] : null
  if (surface) {
    const { u, n } = axes(surface)
    if (s.normal) add('normal', fromEdge(surface, n), n, VECTOR_LENGTH, s.normalLabel)
    if (s.friction !== 'none') {
      // Toward the pulley is +u: to the right on a table, up a ramp.
      const d = s.friction === 'toward' ? u : { x: -u.x, y: -u.y }
      const from = pt(surface.at.x + d.x * (surface.width / 2) + n.x * 9, surface.at.y + d.y * (surface.width / 2) + n.y * 9)
      add('friction', from, d, VECTOR_LENGTH * 0.85, s.frictionLabel)
    }
  }

  if (s.acceleration !== 'none') {
    const sign = s.acceleration === 'forward' ? 1 : -1
    for (const o of f.objects) {
      // Which way this object moves when the hanging one falls.
      let d: Point
      let from: Point
      if (o === surface) {
        const { u, n } = axes(o)
        d = { x: u.x * sign, y: u.y * sign }
        // Above the object, set off to one side so it doesn't cross the normal force.
        const lane = pt(o.middle.x + n.x * (o.height / 2 + 20), o.middle.y + n.y * (o.height / 2 + 20))
        from = pt(lane.x + d.x * 14, lane.y + d.y * 14)
      } else {
        // Going forward, the hanging (or right-hand) object falls; the other rises, as does a tackle's load.
        const up = o.which === 'b' ? sign < 0 : sign > 0
        d = { x: 0, y: up ? -1 : 1 }
        // Beside the object, on its outer side.
        const side = o.middle.x < centerX ? -1 : 1
        const x = o.middle.x + side * (o.width / 2 + 16)
        from = pt(x, o.middle.y - d.y * (ACCEL_LENGTH / 2))
      }
      add('acceleration', from, d, ACCEL_LENGTH, s.accelerationLabel, 'side')
    }
  }
  return out
}

export function buildPulley(s: PulleySettings): PulleyFigure {
  const f = s.setup === 'tackle' ? tackle(s) : s.setup === 'table' ? table(s) : s.setup === 'ramp' ? ramp(s) : atwood(s)
  const vectors = vectorsFor(f, s)
  // Should a vector or its label still reach past the bottom, the figure grows to hold it.
  const lowest = Math.max(...vectors.flatMap((v) => [v.v.y2, v.labelAt.y + 14]))
  return { ...f, vectors, height: Math.max(f.height, Math.ceil(lowest + 10)) }
}
