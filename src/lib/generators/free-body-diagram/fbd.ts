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
import type { FbdSettings } from './settings'

/** How long a force of length 1 is past the edge of the body. */
export const UNIT = 90
export const DOT_R = 6
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

  const extent = [
    pt(-w / 2, -h / 2),
    pt(w / 2, h / 2),
    ...forces.flatMap((f) => [pt(f.v.x2, f.v.y2), ...boxCorners(labelBox(f.labelAt, f.label))]),
  ]

  return {
    width: 0,
    height: 0,
    body: { kind, size: s.bodySize, middle, at: pt(0, h / 2), width: w, height: h },
    forces,
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
