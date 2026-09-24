// The bar magnet's field lines. Each loop is chosen by how high it passes over
// the middle of the magnet, evenly spaced up to the top of the figure, and the
// bottom half is the top half reflected, so the loops nest evenly and never
// cross (see $lib/shared/field). Two more lines run along the magnet's axis,
// straight out of the north face and into the south face. Loops keep their
// shape wherever the magnet is, so they are traced once per count, around a
// magnet at the origin, and moved.

import { arrowAlong, poleFaceField, traceThrough, type Point } from '$lib/shared/field'

export interface FieldLine {
  kind: 'loop' | 'axis'
  points: Point[]
  arrow: { x: number; y: number; angle: number } | null
}

const cache = new Map<string, Point[][]>()

/** Lines around a magnet `length` × `height` with its north end at x = length and its middle at y = 0. */
function linesNorthRight(length: number, height: number, count: number, reach: number): Point[][] {
  const key = `${length},${height},${count},${reach}`
  const hit = cache.get(key)
  if (hit) return hit
  const field = poleFaceField([
    { x: length, y0: -height / 2, y1: height / 2, q: 1 },
    { x: 0, y0: -height / 2, y1: height / 2, q: -1 },
  ])
  const inside = (p: Point) => p.x > -0.5 && p.x < length + 0.5 && p.y > -height / 2 - 0.5 && p.y < height / 2 + 0.5
  const bounds = { left: -length * 4, right: length * 5, top: -reach * 3, bottom: reach * 3 }
  const top = Array.from({ length: count }, (_, k) => {
    const d = (reach * (k + 1)) / count
    return traceThrough(field, { x: length / 2, y: -height / 2 - d }, { stop: inside, bounds })
  })
  const lines = [...top, ...top.map((line) => line.map((p) => ({ x: p.x, y: -p.y })))]
  cache.set(key, lines)
  return lines
}

interface MagnetBox {
  x: number
  y: number
  length: number
  height: number
  /** The pole at the right-hand end (the one nearer the coil). */
  near: 'N' | 'S'
}

/** How far past the magnet the axis lines run (the figure clips them), and where their arrowheads go. */
const AXIS_LENGTH = 700
const AXIS_ARROW = 48

/** The magnet's field lines in figure coordinates, `reach` being how far above the magnet the outermost loop passes. */
export function magnetFieldLines(m: MagnetBox, count: number, reach: number): FieldLine[] {
  const local = linesNorthRight(m.length, m.height, count, reach)
  const cy = m.y + m.height / 2
  const loops: FieldLine[] = local.map((line) => {
    // With south at the right-hand end, the lines are the same, reflected end to end.
    const points = line.map((p) => ({ x: m.x + (m.near === 'N' ? p.x : m.length - p.x), y: cy + p.y }))
    return { kind: 'loop', points, arrow: arrowAlong(points) }
  })
  const northX = m.near === 'N' ? m.x + m.length : m.x
  const southX = m.near === 'N' ? m.x : m.x + m.length
  const out = Math.sign(northX - southX) // the way out of the north face
  const axis: FieldLine[] = [
    {
      kind: 'axis',
      points: [{ x: northX, y: cy }, { x: northX + out * AXIS_LENGTH, y: cy }],
      arrow: { x: northX + out * AXIS_ARROW, y: cy, angle: out > 0 ? 0 : 180 },
    },
    {
      kind: 'axis',
      points: [{ x: southX - out * AXIS_LENGTH, y: cy }, { x: southX, y: cy }],
      arrow: { x: southX - out * (AXIS_ARROW - 12), y: cy, angle: out > 0 ? 0 : 180 },
    },
  ]
  return [...loops, ...axis]
}
