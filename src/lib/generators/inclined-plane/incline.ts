// Where everything in an Inclined Plane figure goes, before mirroring: a ramp
// rising to the right from its foot, with the angle at the foot, the object
// resting on the slope, and the ground beneath. The ramp is as big as fits
// with everything else, then the whole figure is centered.

import type { Point } from '$lib/shared/field'
import { labelRuns, type Label } from '$lib/shared/label'
import { objectHeight, objectWidth, type ObjectKind } from '$lib/shared/objects'
import { labelPoint, type LabeledVector, type Segment } from '$lib/shared/vector'
import type { InclineSettings } from './settings'

export const WIDTH = 640
export const HEIGHT = 400
const MARGIN = 18
const ARC_R = 46
const LABEL_GAP = 20
/** Room the angle's label needs between the slope and the ground. */
const LABEL_ROOM = 30
const LABEL_SIZE = 22
const HEIGHT_MARK_GAP = 28
const LENGTH_MARK_GAP = 24
const GROUND_OVERHANG = 30
const HATCH_SPACING = 13
const HATCH_LENGTH = 9
/** Vectors are drawn about the right size, not to scale. */
const VECTOR_LENGTH = 72
const MOTION_LENGTH = 56
const MOTION_GAP = 20

export type VectorKind = 'gravity' | 'normal' | 'friction' | 'applied' | 'velocity' | 'acceleration'

export type FigureVector = LabeledVector<VectorKind>

export interface InclineFigure {
  width: number
  height: number
  ramp: { foot: Point; corner: Point; top: Point }
  object: {
    kind: ObjectKind
    size: number
    /** Where it rests on the slope (its bottom middle), and its tilt in degrees. */
    at: Point
    tilt: number
    middle: Point
    height: number
    width: number
  }
  /** The angle's arc at the foot, and where its label goes (the label's middle). */
  arc: string
  angleLabelAt: Point
  lengthMark: Segment | null
  lengthLabelAt: Point | null
  heightMark: Segment | null
  heightLabelAt: Point | null
  /** Short lines from the ends of the slope or ramp out to a mark. */
  extensions: Segment[]
  /** Hatching under a rough slope. */
  hatches: Segment[]
  ground: Segment
  groundHatches: Segment[]
  vectors: FigureVector[]
  /** Every outermost point drawn, for fitting (and tests). */
  extent: Point[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })
const seg = (a: Point, b: Point): Segment => ({ x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) })

/** The figure with the ramp's foot at (0, 0) and its base `base` long. */
function layout(s: InclineSettings, base: number): InclineFigure {
  const a = (s.angle * Math.PI) / 180
  const rise = base * Math.tan(a)
  const foot = pt(0, 0)
  const corner = pt(base, 0)
  const top = pt(base, -rise)
  const slope = base / Math.cos(a)
  // Along the slope (up it), and out of it (away from the ramp).
  const u = { x: Math.cos(a), y: -Math.sin(a) }
  const n = { x: -Math.sin(a), y: -Math.cos(a) }
  const along = (p: Point, d: number, q = u) => pt(p.x + q.x * d, p.y + q.y * d)

  const kind = s.object as ObjectKind
  const oh = objectHeight(kind, s.objectSize)
  const ow = objectWidth(kind, s.objectSize)
  // Keep the whole object on the slope.
  const reach = Math.min(Math.max(s.position * slope, ow / 2), slope - ow / 2)
  const at = along(foot, reach)
  const middle = along(at, oh / 2, n)
  const corners = [along(at, -ow / 2), along(at, ow / 2)].flatMap((p) => [p, along(p, oh, n)])

  // On a shallow ramp the arc and its label move out from the foot, to where
  // the gap between the slope and the ground is tall enough for the label.
  // The label sits past the arc, pushed out by about half its width.
  // A ramp too shallow for that has its label just above the slope instead,
  // beside the end of the arc.
  const labelWidth = [...labelRuns(s.angleLabel.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.5
  const wanted = Math.max(ARC_R + LABEL_GAP, LABEL_ROOM / Math.tan(a))
  const labelR = Math.min(wanted, base * 0.45)
  const arcR = labelR - LABEL_GAP
  const arc = `M${r2(arcR)},0 A${r2(arcR)},${r2(arcR)} 0 0 0 ${r2(u.x * arcR)},${r2(u.y * arcR)}`
  const half = a / 2
  const angleLabelAt =
    wanted <= labelR
      ? pt(Math.cos(half) * labelR + Math.max(0, labelWidth / 2 - 8), -Math.sin(half) * labelR - 2)
      : along(along(foot, arcR + labelWidth / 2), LABEL_SIZE * 0.8, n)

  const extensions: Segment[] = []
  let lengthMark: Segment | null = null
  let lengthLabelAt: Point | null = null
  if (s.lengthMark) {
    // Parallel to the slope, out past the object, with lines out to it from both ends.
    const off = oh + LENGTH_MARK_GAP
    const from = along(foot, off, n)
    const to = along(top, off, n)
    lengthMark = seg(from, to)
    extensions.push(seg(along(foot, 6, n), along(foot, off + 6, n)), seg(along(top, 6, n), along(top, off + 6, n)))
    lengthLabelAt = along(along(from, slope / 2), LABEL_GAP, n)
  }
  let heightMark: Segment | null = null
  let heightLabelAt: Point | null = null
  if (s.heightMark) {
    const x = base + HEIGHT_MARK_GAP
    heightMark = seg(pt(x, 0), pt(x, -rise))
    extensions.push(seg(pt(base + 6, -rise), pt(x + 6, -rise)))
    heightLabelAt = pt(x + LABEL_GAP, -rise / 2)
  }

  const hatches: Segment[] = []
  if (s.surface === 'rough') {
    // Slanted ticks just under the slope, inside the ramp, clear of the angle's arc and label.
    for (let d = arcR + LABEL_GAP * 2 + labelWidth; d < slope - 4; d += HATCH_SPACING) {
      const p = along(foot, d)
      hatches.push(seg(p, pt(p.x - n.x * HATCH_LENGTH - u.x * HATCH_LENGTH * 0.7, p.y - n.y * HATCH_LENGTH - u.y * HATCH_LENGTH * 0.7)))
    }
  }

  const ground = seg(pt(-GROUND_OVERHANG, 0), pt(base + GROUND_OVERHANG + (s.heightMark ? HEIGHT_MARK_GAP : 0), 0))
  const groundHatches: Segment[] = []
  for (let x = ground.x1 + 4; x < ground.x2; x += HATCH_SPACING) groundHatches.push(seg(pt(x + HATCH_LENGTH * 0.8, 0), pt(x, HATCH_LENGTH)))

  // Vectors. Forces start at the edge of the object, in the direction they
  // point: gravity straight down, the normal force straight out of the slope,
  // the applied force along the slope at mid-height, and friction along the
  // slope at the contact surface. Velocity and acceleration ride above the
  // object, set off to one side so they don't cross the normal force.
  const toEdge = (d: Point) => {
    if (kind === 'ball') return oh / 2
    const du = Math.abs(d.x * u.x + d.y * u.y)
    const dn = Math.abs(d.x * n.x + d.y * n.y)
    return Math.min(du > 1e-9 ? ow / 2 / du : Infinity, dn > 1e-9 ? oh / 2 / dn : Infinity)
  }
  const widthOf = (l: Label) => [...labelRuns(l.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.45
  const vectors: FigureVector[] = []
  const add = (kind: VectorKind, from: Point, d: Point, length: number, label: Label, side?: 1 | -1) => {
    const v = seg(from, along(from, length, d))
    const w = widthOf(label)
    const labelAt =
      side === undefined
        ? labelPoint(v, { at: 'tip', gap: 12 + (w / 2) * Math.abs(d.x) + 11 * Math.abs(d.y) })
        : labelPoint(v, { at: 'middle', side, gap: 16 })
    vectors.push({ kind, v, label, labelAt: pt(labelAt.x, labelAt.y) })
  }
  const slopeDir = (dir: 'up' | 'down') => (dir === 'up' ? u : { x: -u.x, y: -u.y })
  if (s.gravity) {
    const d = { x: 0, y: 1 }
    add('gravity', along(middle, toEdge(d), d), d, VECTOR_LENGTH, s.gravityLabel)
  }
  if (s.normal) add('normal', along(middle, toEdge(n), n), n, VECTOR_LENGTH, s.normalLabel)
  if (s.applied !== 'none') {
    const d = slopeDir(s.applied)
    add('applied', along(middle, toEdge(d), d), d, VECTOR_LENGTH, s.appliedLabel)
  }
  if (s.friction !== 'none') {
    const d = slopeDir(s.friction)
    // Just clear of the slope, so the arrow's white outline doesn't break the slope's line.
    add('friction', along(along(at, ow / 2, d), 9, n), d, VECTOR_LENGTH * 0.85, s.frictionLabel)
  }
  let lane = oh / 2 + MOTION_GAP
  for (const [kind, dir, label] of [
    ['velocity', s.velocity, s.velocityLabel],
    ['acceleration', s.acceleration, s.accelerationLabel],
  ] as const) {
    if (dir === 'none') continue
    const d = slopeDir(dir)
    // Label on the outer side of the arrow (side 1 is to the left of the way it points).
    add(kind, along(along(middle, lane, n), 14, d), d, MOTION_LENGTH, label, dir === 'up' ? 1 : -1)
    lane += MOTION_GAP + 18
  }

  const labelBox = (p: Point | null, w = 16) => (p ? [pt(p.x - w, p.y - 14), pt(p.x + w, p.y + 14)] : [])
  const extent = [
    foot,
    corner,
    top,
    pt(ground.x1, HATCH_LENGTH),
    pt(ground.x2, HATCH_LENGTH),
    ...corners,
    ...labelBox(angleLabelAt),
    ...(lengthMark ? [pt(lengthMark.x1, lengthMark.y1), pt(lengthMark.x2, lengthMark.y2)] : []),
    ...labelBox(lengthLabelAt),
    ...labelBox(heightLabelAt, 24),
    ...vectors.flatMap((v) => [pt(v.v.x2, v.v.y2), ...labelBox(v.labelAt, widthOf(v.label) / 2 + 6)]),
  ]

  return {
    width: WIDTH,
    height: HEIGHT,
    ramp: { foot, corner, top },
    object: { kind, size: s.objectSize, at, tilt: -s.angle, middle, height: oh, width: ow },
    arc,
    angleLabelAt,
    lengthMark,
    lengthLabelAt,
    heightMark,
    heightLabelAt,
    extensions,
    hatches,
    ground,
    groundHatches,
    vectors,
    extent,
  }
}

const bounds = (points: Point[]) => ({
  left: Math.min(...points.map((p) => p.x)),
  right: Math.max(...points.map((p) => p.x)),
  top: Math.min(...points.map((p) => p.y)),
  bottom: Math.max(...points.map((p) => p.y)),
})

function shifted(f: InclineFigure, dx: number, dy: number): InclineFigure {
  const p = (q: Point) => pt(q.x + dx, q.y + dy)
  const sg = (q: Segment) => seg(p({ x: q.x1, y: q.y1 }), p({ x: q.x2, y: q.y2 }))
  return {
    ...f,
    ramp: { foot: p(f.ramp.foot), corner: p(f.ramp.corner), top: p(f.ramp.top) },
    object: { ...f.object, at: p(f.object.at), middle: p(f.object.middle) },
    arc: f.arc, // drawn relative to the foot
    angleLabelAt: p(f.angleLabelAt),
    lengthMark: f.lengthMark && sg(f.lengthMark),
    lengthLabelAt: f.lengthLabelAt && p(f.lengthLabelAt),
    heightMark: f.heightMark && sg(f.heightMark),
    heightLabelAt: f.heightLabelAt && p(f.heightLabelAt),
    extensions: f.extensions.map(sg),
    hatches: f.hatches.map(sg),
    ground: sg(f.ground),
    groundHatches: f.groundHatches.map(sg),
    vectors: f.vectors.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
    extent: f.extent.map(p),
  }
}

export function buildIncline(s: InclineSettings): InclineFigure {
  const room = { w: WIDTH - 2 * MARGIN, h: HEIGHT - 2 * MARGIN }
  // The biggest ramp that fits with everything around it.
  let base = room.w
  let f = layout(s, base)
  for (let i = 0; i < 80; i++) {
    const b = bounds(f.extent)
    if (b.right - b.left <= room.w && b.bottom - b.top <= room.h) break
    base *= 0.96
    f = layout(s, base)
  }
  const b = bounds(f.extent)
  return shifted(f, (WIDTH - (b.right - b.left)) / 2 - b.left, (HEIGHT - (b.bottom - b.top)) / 2 - b.top)
}
