// Where everything in a Free Body Diagram goes: the body alone, with every
// force drawn from its middle and each force's label past its tip. The
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

/** How far from the body's middle its edge is, going in direction `d`. */
function toEdge(kind: BodyKind, w: number, h: number, d: Point) {
  if (kind === 'dot') return DOT_R
  if (kind === 'ball') return h / 2
  return Math.min(Math.abs(d.x) > 1e-9 ? w / 2 / Math.abs(d.x) : Infinity, Math.abs(d.y) > 1e-9 ? h / 2 / Math.abs(d.y) : Infinity)
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
    const labelAt = labelPoint(v, { at: 'tip', gap: 12 + (lw / 2) * Math.abs(d.x) + 11 * Math.abs(d.y) })
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

  const extent = [
    pt(-w / 2, -h / 2),
    pt(w / 2, h / 2),
    ...forces.flatMap((f) => [pt(f.v.x2, f.v.y2), ...boxCorners(labelBox(f.labelAt, f.label))]),
    ...marks.flatMap((m) => [pt(m.ref.x2, m.ref.y2), ...boxCorners(labelBox(m.labelAt, m.label))]),
    ...components.flatMap((c) => [...boxCorners(labelBox(c.xLabelAt, c.xLabel)), ...boxCorners(labelBox(c.yLabelAt, c.yLabel))]),
  ]

  return {
    width: 0,
    height: 0,
    body: { kind, size: s.bodySize, middle, at: pt(0, h / 2), width: w, height: h },
    forces,
    marks,
    components,
    extent,
  }
}

const bounds = (points: Point[]) => ({
  left: Math.min(...points.map((p) => p.x)),
  right: Math.max(...points.map((p) => p.x)),
  top: Math.min(...points.map((p) => p.y)),
  bottom: Math.max(...points.map((p) => p.y)),
})

function shifted(f: FbdFigure, dx: number, dy: number): FbdFigure {
  const p = (q: Point) => pt(q.x + dx, q.y + dy)
  const sg = (q: Segment) => seg(p({ x: q.x1, y: q.y1 }), p({ x: q.x2, y: q.y2 }))
  return {
    ...f,
    body: { ...f.body, middle: p(f.body.middle), at: p(f.body.at) },
    forces: f.forces.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
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
