// A Vector's arrow, shared by every figure so they all look alike: a shaft
// and a solid triangular head whose point is exactly at the tip. Vectors are
// drawn about the right size, not to scale.

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Point {
  x: number
  y: number
}

export const VECTOR_WIDTH = 3
export const VECTOR_HEAD = 14

function unit(v: Segment) {
  const dx = v.x2 - v.x1
  const dy = v.y2 - v.y1
  const len = Math.hypot(dx, dy) || 1
  return { ux: dx / len, uy: dy / len, len }
}

/** The shaft (stopping where the head starts) and the head's three corners, tip first. */
export function arrow(v: Segment, head = VECTOR_HEAD): { shaft: Segment; head: Point[] } {
  const { ux, uy, len } = unit(v)
  const back = Math.min(head, len)
  const bx = v.x2 - ux * back
  const by = v.y2 - uy * back
  // The shaft ends inside the head so its square end never shows; a vector
  // shorter than its head is all head.
  const reach = len <= head ? 0 : len - head * 0.7
  const half = head * 0.42
  return {
    shaft: { x1: v.x1, y1: v.y1, x2: round(v.x1 + ux * reach), y2: round(v.y1 + uy * reach) },
    head: [
      { x: v.x2, y: v.y2 },
      { x: round(bx - uy * half), y: round(by + ux * half) },
      { x: round(bx + uy * half), y: round(by - ux * half) },
    ],
  }
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Where a vector's label goes: beside its middle (side 1 is above a vector
 * pointing right, side −1 below) or past its tip. The point is the middle of
 * the label, not its baseline.
 */
export function labelPoint(v: Segment, { at, side = 1, gap = 14 }: { at: 'middle' | 'tip'; side?: 1 | -1; gap?: number }): Point {
  const { ux, uy } = unit(v)
  if (at === 'tip') return { x: v.x2 + ux * gap, y: v.y2 + uy * gap }
  return { x: (v.x1 + v.x2) / 2 + uy * gap * side, y: (v.y1 + v.y2) / 2 - ux * gap * side }
}
