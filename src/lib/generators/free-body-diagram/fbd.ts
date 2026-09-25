// Where everything in a Free Body Diagram goes: the body alone, with every
// force drawn from its middle and each force's label past its tip (moved to
// a clear spot nearby if it would land on another; arrows never move). The
// figure is cropped to what's drawn, at the same scale every time, so two
// diagrams pasted side by side have arrows of the same size.
//
// Angles are in degrees counterclockwise from the right, the way teachers
// give them; Mirror turns each one into 180° − angle, so a mirrored figure
// is drawn directly and its labels need no special handling.

import { labelRuns, type Label } from '$lib/shared/label'
import { objectHeight, objectWidth, type ObjectKind } from '$lib/shared/objects'
import { labelPoint, type LabeledVector, type Point, type Segment } from '$lib/shared/vector'
import { onAxis, type FbdSettings } from './settings'

/** How long a force of length 1 is past the edge of the body. */
export const UNIT = 90
export const DOT_R = 6
/** How far past the body's farthest corner an angle mark's arc is, and how much farther each further arc from the same line. */
const ARC_GAP = 30
const ARC_STEP = 24
/** Velocity and acceleration: how long, and how far beside everything else. */
const MOTION_LENGTH = 64
const MOTION_GAP = 40
const MARGIN = 18
/** The smallest figure, so a body with one short force isn't a sliver. */
const MIN_SIZE = 160
export const LABEL_SIZE = 22

export type BodyKind = 'dot' | ObjectKind

export interface FigureForce extends LabeledVector<'force'> {
  /** Which force in the settings this is. */
  index: number
  /** Its angle as drawn, after Mirror. */
  angle: number
}

/** An angle mark: a dashed reference line from the body, and an arc from it to the force. */
export interface AngleMark {
  index: number
  ref: Segment
  /** The arc's ends, its radius, and its SVG sweep flag. */
  arc: { from: Point; to: Point; r: number; sweep: 0 | 1 }
  label: Label
  labelAt: Point
}

/** A force's components along the horizontal and vertical, with dotted guides from the force's tip. */
export interface Components {
  index: number
  x: Segment
  y: Segment
  guides: Segment[]
  xLabel: Label
  xLabelAt: Point
  yLabel: Label
  yLabelAt: Point
}

export interface FbdFigure {
  width: number
  height: number
  body: {
    kind: BodyKind
    size: number
    /** The body's middle, where every force starts. */
    middle: Point
    /** Where an object's bottom middle goes (objects are drawn from there). */
    at: Point
    width: number
    height: number
  }
  forces: FigureForce[]
  /** Velocity and acceleration, beside the body. */
  motion: LabeledVector<'velocity' | 'acceleration'>[]
  marks: AngleMark[]
  components: Components[]
  /** Every outermost point drawn, for fitting (and tests). */
  extent: Point[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })
const seg = (a: Point, b: Point): Segment => ({ x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) })

/** The angle as drawn: mirrored left to right if asked. */
export const drawnAngle = (angle: number, mirror: boolean) => (mirror ? (540 - angle) % 360 : angle)

/** A unit vector on the page (y down) pointing at `angle`. */
export function direction(angle: number): Point {
  const a = (angle * Math.PI) / 180
  // Rounded so that 90° is exactly up, not a hair to the right.
  return { x: Math.round(Math.cos(a) * 1e9) / 1e9, y: -Math.round(Math.sin(a) * 1e9) / 1e9 }
}

/** How wide a label is drawn, roughly. */
export const labelWidth = (l: Label) =>
  l.mode === 'blank' ? LABEL_SIZE * 2.4 : l.mode === 'none' ? 0 : [...labelRuns(l.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.45

/** A label's box, around its middle. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}
export const labelBox = (at: Point, l: Label): Box => ({ x: at.x, y: at.y, w: labelWidth(l) + 6, h: LABEL_SIZE + 4 })

const boxCorners = (b: Box) => (b.w <= 6 ? [] : [pt(b.x - b.w / 2, b.y - b.h / 2), pt(b.x + b.w / 2, b.y + b.h / 2)])

/** Do two label boxes overlap? Boxes of labels that are off never do. */
export const overlaps = (a: Box, b: Box, pad = 0) =>
  a.w > 6 && b.w > 6 && Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + pad

/** Does a segment pass through a box (shrunk by `shrink` on every side)? */
export function crosses(v: Segment, b: Box, shrink = 0) {
  const w = b.w / 2 - shrink
  const h = b.h / 2 - shrink
  if (w <= 0 || h <= 0) return false
  const steps = Math.max(1, Math.ceil(Math.hypot(v.x2 - v.x1, v.y2 - v.y1) / 3))
  for (let i = 0; i <= steps; i++) {
    const x = v.x1 + ((v.x2 - v.x1) * i) / steps
    const y = v.y1 + ((v.y2 - v.y1) * i) / steps
    if (Math.abs(x - b.x) < w && Math.abs(y - b.y) < h) return true
  }
  return false
}

/** A label to place: where it would go, the way it moves out (away from what it labels), and its text.
 *  `alt` is a second place it could go, on the other side of what it labels. */
export interface Placing {
  at: Point
  out: Point
  label: Label
  alt?: Point
}

/**
 * Labels placed one at a time, each at the first spot near where it would go
 * that's clear of the labels already placed, every arrow and line in
 * `lines`, and the body: first farther out, then to either side. A label
 * with no clear spot nearby stays where it would go.
 */
export function placeLabels(labels: Placing[], lines: Segment[], body: Box | null): Point[] {
  const steps: { e: number; l: number; cost: number }[] = []
  for (let e = 0; e <= 96; e += 8) for (const l of [0, 1, -1, 2, -2, 3, -3]) steps.push({ e, l, cost: e + 14 * Math.abs(l) })
  const placed: Box[] = []
  return labels.map((p) => {
    const side = { x: -p.out.y, y: p.out.x }
    const box = (at: Point) => labelBox(at, p.label)
    const clear = (b: Box) =>
      !placed.some((q) => overlaps(q, b, 2)) && !lines.some((v) => crosses(v, b)) && !(body && overlaps(body, b))
    // Spots near where it would go and, a little less wanted, near its other place (moving out the other way).
    const tries = [
      ...steps.map(({ e, l, cost }) => ({ cost, at: pt(p.at.x + p.out.x * e + side.x * l * 12, p.at.y + p.out.y * e + side.y * l * 12) })),
      ...(p.alt ? steps.map(({ e, l, cost }) => ({ cost: cost + 8, at: pt(p.alt!.x - p.out.x * e + side.x * l * 12, p.alt!.y - p.out.y * e + side.y * l * 12) })) : []),
    ].sort((a, b) => a.cost - b.cost)
    const best = labelWidth(p.label) > 0 ? (tries.find((t) => clear(box(t.at)))?.at ?? p.at) : p.at
    placed.push(box(best))
    return best
  })
}

/** Forces pointing exactly the same way, so one arrow hides the other: groups of their indexes. */
export function sameDirection(forces: { angle: number }[]): number[][] {
  const groups = new Map<number, number[]>()
  forces.forEach((f, i) => groups.set(f.angle, [...(groups.get(f.angle) ?? []), i]))
  return [...groups.values()].filter((g) => g.length > 1)
}

/** How far from the body's middle its edge is, going in direction `d`. */
function toEdge(kind: BodyKind, w: number, h: number, d: Point) {
  if (kind === 'dot') return DOT_R
  if (kind === 'ball') return h / 2
  return Math.min(Math.abs(d.x) > 1e-9 ? w / 2 / Math.abs(d.x) : Infinity, Math.abs(d.y) > 1e-9 ? h / 2 / Math.abs(d.y) : Infinity)
}

const bounds = (points: Point[]) => ({
  left: Math.min(...points.map((p) => p.x)),
  right: Math.max(...points.map((p) => p.x)),
  top: Math.min(...points.map((p) => p.y)),
  bottom: Math.max(...points.map((p) => p.y)),
})

/**
 * Velocity and acceleration in a column beside the diagram (to its right, or
 * its left when mirrored), a clear gap from the body and every force, each
 * with its label beside it on the side away from the diagram or above it.
 */
function motionBeside(s: FbdSettings, around: ReturnType<typeof bounds>): LabeledVector<'velocity' | 'acceleration'>[] {
  const wanted = [
    ['velocity', s.velocity, s.velocityAngle, s.velocityLabel],
    ['acceleration', s.acceleration, s.accelerationAngle, s.accelerationLabel],
  ] as const
  // Each one laid out around its own middle first.
  const cells = wanted
    .filter(([, on]) => on)
    .map(([kind, , angle, label]) => {
      const d = direction(drawnAngle(angle, s.mirror))
      const half = MOTION_LENGTH / 2
      const v = seg(pt(-d.x * half, -d.y * half), pt(d.x * half, d.y * half))
      const gap = 12 + (labelWidth(label) / 2) * Math.abs(d.y) + 11 * Math.abs(d.x)
      const away = s.mirror ? -1 : 1
      const [labelAt] = ([1, -1] as const)
        .map((side) => labelPoint(v, { at: 'middle', side, gap }))
        .sort((a, b) => b.x * away - b.y - (a.x * away - a.y))
      const box = bounds([pt(v.x1, v.y1), pt(v.x2, v.y2), ...boxCorners(labelBox(labelAt, label))])
      return { kind, v, label, labelAt, box }
    })
  const total = cells.reduce((sum, c) => sum + c.box.bottom - c.box.top, 0) + 16 * Math.max(0, cells.length - 1)
  let top = (around.top + around.bottom) / 2 - total / 2
  return cells.map((c) => {
    const dx = s.mirror ? around.left - MOTION_GAP - c.box.right : around.right + MOTION_GAP - c.box.left
    const dy = top - c.box.top
    top += c.box.bottom - c.box.top + 16
    return {
      kind: c.kind,
      v: seg(pt(c.v.x1 + dx, c.v.y1 + dy), pt(c.v.x2 + dx, c.v.y2 + dy)),
      label: c.label,
      labelAt: pt(c.labelAt.x + dx, c.labelAt.y + dy),
    }
  })
}

/** The figure with the body's middle at (0, 0). */
function layout(s: FbdSettings): FbdFigure {
  const kind = s.body as BodyKind
  const h = kind === 'dot' ? DOT_R * 2 : objectHeight(kind, s.bodySize)
  const w = kind === 'dot' ? DOT_R * 2 : objectWidth(kind, s.bodySize)
  const middle = pt(0, 0)

  const forces: FigureForce[] = s.forces.map((f, index) => {
    const angle = drawnAngle(f.angle, s.mirror)
    const d = direction(angle)
    // Every tail is at the middle; the part past the body's edge is the force's relative length.
    const reach = toEdge(kind, w, h, d) + UNIT * f.length
    const v = seg(middle, pt(d.x * reach, d.y * reach))
    const lw = labelWidth(f.label)
    const labelAt = labelPoint(v, { at: 'tip', gap: 12 + (lw / 2) * Math.abs(d.x) + 15 * Math.abs(d.y) })
    return { kind: 'force', index, angle, v, label: f.label, labelAt: pt(labelAt.x, labelAt.y) }
  })

  // Angle marks. The arc runs from the nearer half of the reference line to
  // the force, so it's never more than 90°, clear of the body's corners.
  // Arcs from the same half-line step outward so they don't lie on each other.
  const outside = kind === 'dot' ? DOT_R : kind === 'ball' ? h / 2 : Math.hypot(w, h) / 2
  const arcsFrom = new Map<number, number>()
  const marks: AngleMark[] = []
  const components: Components[] = []
  for (const f of forces) {
    const setting = s.forces[f.index]
    if (onAxis(setting.angle)) continue
    const d = direction(f.angle)
    if (setting.arc) {
      const refAngle = setting.from === 'h' ? (d.x > 0 ? 0 : 180) : d.y < 0 ? 90 : 270
      // How far the force is turned from the reference, counterclockwise.
      const delta = ((f.angle - refAngle + 540) % 360) - 180
      const n = arcsFrom.get(refAngle) ?? 0
      arcsFrom.set(refAngle, n + 1)
      const r = outside + ARC_GAP + n * ARC_STEP
      const rd = direction(refAngle)
      // The component along the same half-line already draws part of it.
      const along = setting.parts ? Math.abs(setting.from === 'h' ? f.v.x2 : f.v.y2) : 0
      const start = Math.max(toEdge(kind, w, h, rd), along)
      const end = Math.max(start, r + 16)
      const ref = seg(pt(rd.x * start, rd.y * start), pt(rd.x * end, rd.y * end))
      const mid = direction(refAngle + delta / 2)
      const lw = labelWidth(setting.arcLabel)
      const lr = r + 12 + (lw / 2) * Math.abs(mid.x) + 9 * Math.abs(mid.y)
      marks.push({
        index: f.index,
        ref,
        // On the page y points down, so counterclockwise is SVG's negative sweep.
        arc: { from: pt(rd.x * r, rd.y * r), to: pt(d.x * r, d.y * r), r, sweep: delta > 0 ? 0 : 1 },
        label: setting.arcLabel,
        labelAt: pt(mid.x * lr, mid.y * lr),
      })
    }
    if (setting.parts) {
      const tip = { x: f.v.x2, y: f.v.y2 }
      const xEnd = pt(tip.x, 0)
      const yEnd = pt(0, tip.y)
      // Each component's label goes on its far side from the force, clear of the body.
      const below = (kind === 'dot' ? 0 : h / 2) + 20
      const beside = (kind === 'dot' ? 0 : w / 2) + 12 + labelWidth(setting.yLabel) / 2
      components.push({
        index: f.index,
        x: seg(middle, xEnd),
        y: seg(middle, yEnd),
        guides: [seg(tip, xEnd), seg(tip, yEnd)],
        xLabel: setting.xLabel,
        xLabelAt: pt(tip.x / 2, tip.y < 0 ? below : -below),
        yLabel: setting.yLabel,
        yLabelAt: pt(tip.x > 0 ? -beside : beside, tip.y / 2),
      })
    }
  }

  // Labels that would land on another label or an arrow (forces pointing
  // almost the same way, an angle mark beside a component) move to a clear
  // spot nearby. No arrow moves.
  const unit = (p: Point) => {
    const n = Math.hypot(p.x, p.y) || 1
    return { x: p.x / n, y: p.y / n }
  }
  const labels = [
    ...forces.map((f) => ({ at: f.labelAt, out: direction(f.angle), label: f.label, put: (p: Point) => (f.labelAt = p) })),
    ...marks.map((m) => ({ at: m.labelAt, out: unit(m.labelAt), label: m.label, put: (p: Point) => (m.labelAt = p) })),
    ...components.flatMap((c) => [
      {
        at: c.xLabelAt,
        alt: pt(c.xLabelAt.x, -c.xLabelAt.y),
        out: { x: 0, y: Math.sign(c.xLabelAt.y) || 1 },
        label: c.xLabel,
        put: (p: Point) => (c.xLabelAt = p),
      },
      {
        at: c.yLabelAt,
        alt: pt(-c.yLabelAt.x, c.yLabelAt.y),
        out: { x: Math.sign(c.yLabelAt.x) || 1, y: 0 },
        label: c.yLabel,
        put: (p: Point) => (c.yLabelAt = p),
      },
    ]),
  ]
  // An arc as short straight pieces, for keeping labels off it.
  const arcPieces = (m: AngleMark) => {
    const a0 = Math.atan2(-m.arc.from.y, m.arc.from.x)
    let span = Math.atan2(-m.arc.to.y, m.arc.to.x) - a0
    span = ((span + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
    const at = (t: number) => pt(Math.cos(a0 + span * t) * m.arc.r, -Math.sin(a0 + span * t) * m.arc.r)
    return Array.from({ length: 8 }, (_, i) => seg(at(i / 8), at((i + 1) / 8)))
  }
  const lines = [
    ...forces.map((f) => f.v),
    ...components.flatMap((c) => [c.x, c.y]),
    ...marks.flatMap((m) => [m.ref, ...arcPieces(m)]),
  ]
  const bodyBox = kind === 'dot' ? null : { x: 0, y: 0, w: w + 4, h: h + 4 }
  placeLabels(labels, lines, bodyBox).forEach((p, i) => labels[i].put(p))

  const diagram = [
    pt(-w / 2, -h / 2),
    pt(w / 2, h / 2),
    ...forces.flatMap((f) => [pt(f.v.x2, f.v.y2), ...boxCorners(labelBox(f.labelAt, f.label))]),
    ...marks.flatMap((m) => [pt(m.ref.x2, m.ref.y2), ...boxCorners(labelBox(m.labelAt, m.label))]),
    ...components.flatMap((c) => [...boxCorners(labelBox(c.xLabelAt, c.xLabel)), ...boxCorners(labelBox(c.yLabelAt, c.yLabel))]),
  ]
  const motion = motionBeside(s, bounds(diagram))
  const extent = [...diagram, ...motion.flatMap((m) => [pt(m.v.x1, m.v.y1), pt(m.v.x2, m.v.y2), ...boxCorners(labelBox(m.labelAt, m.label))])]

  return {
    width: 0,
    height: 0,
    body: { kind, size: s.bodySize, middle, at: pt(0, h / 2), width: w, height: h },
    forces,
    motion,
    marks,
    components,
    extent,
  }
}


function shifted(f: FbdFigure, dx: number, dy: number): FbdFigure {
  const p = (q: Point) => pt(q.x + dx, q.y + dy)
  const sg = (q: Segment) => seg(p({ x: q.x1, y: q.y1 }), p({ x: q.x2, y: q.y2 }))
  return {
    ...f,
    body: { ...f.body, middle: p(f.body.middle), at: p(f.body.at) },
    forces: f.forces.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
    motion: f.motion.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
    marks: f.marks.map((m) => ({ ...m, ref: sg(m.ref), arc: { ...m.arc, from: p(m.arc.from), to: p(m.arc.to) }, labelAt: p(m.labelAt) })),
    components: f.components.map((c) => ({
      ...c,
      x: sg(c.x),
      y: sg(c.y),
      guides: c.guides.map(sg),
      xLabelAt: p(c.xLabelAt),
      yLabelAt: p(c.yLabelAt),
    })),
    extent: f.extent.map(p),
  }
}

export function buildFbd(s: FbdSettings): FbdFigure {
  const f = layout(s)
  const b = bounds(f.extent)
  const width = Math.ceil(Math.max(MIN_SIZE, b.right - b.left + 2 * MARGIN))
  const height = Math.ceil(Math.max(MIN_SIZE, b.bottom - b.top + 2 * MARGIN))
  return { ...shifted(f, (width - (b.right - b.left)) / 2 - b.left, (height - (b.bottom - b.top)) / 2 - b.top), width, height }
}
