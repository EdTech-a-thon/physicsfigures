import { describe, expect, test } from 'vitest'
import { crosses } from '$lib/shared/field'
import { buildCoilFigure } from './coil'
import { coilSettings } from './settings'

const make = (over: Partial<typeof coilSettings.defaults> = {}) => buildCoilFigure({ ...coilSettings.defaults, ...over })

describe('the coil', () => {
  test('one front and one back half per turn, and two leads', () => {
    for (const turns of [1, 8, 20]) {
      const f = make({ turns })
      expect(f.coil.front).toHaveLength(turns)
      expect(f.coil.back).toHaveLength(turns)
      expect(f.coil.leads).toHaveLength(2)
    }
  })

  test('everything fits in the figure at any number of turns and distance', () => {
    for (const turns of [1, 5, 20]) {
      for (const distance of ['outside', 'mouth', 'inside'] as const) {
        const f = make({ turns, distance })
        expect(f.left).toBeGreaterThanOrEqual(0)
        expect(f.right).toBeLessThanOrEqual(f.width)
        // centered
        expect(Math.abs(f.left - (f.width - f.right))).toBeLessThan(1)
      }
    }
  })
})

describe('the magnet', () => {
  test('outside, at the mouth, or inside the coil', () => {
    const outside = make({ distance: 'outside' })
    expect(outside.magnet!.x + outside.magnet!.length).toBeLessThan(outside.coil.left)

    const mouth = make({ distance: 'mouth' })
    expect(mouth.magnet!.x + mouth.magnet!.length).toBeCloseTo(mouth.coil.left)

    const inside = make({ distance: 'inside', turns: 12 })
    const middle = inside.magnet!.x + inside.magnet!.length / 2
    expect(middle).toBeCloseTo((inside.coil.left + inside.coil.right) / 2)
  })

  test('the pole facing the coil is on the side toward it', () => {
    expect(make({ facing: 'N' }).magnet!.near).toBe('N')
    expect(make({ facing: 'S' }).magnet!.near).toBe('S')
  })

  test('no magnet', () => {
    expect(make({ source: 'none' }).magnet).toBeNull()
    expect(make({ source: 'none' }).motion).toBeNull()
  })
})

describe('the motion vector', () => {
  test('points toward or away from the coil', () => {
    const toward = make({ motion: 'toward' }).motion!
    expect(toward.x2).toBeGreaterThan(toward.x1)
    const away = make({ motion: 'away' }).motion!
    expect(away.x2).toBeLessThan(away.x1)
    expect(make({ motion: 'none' }).motion).toBeNull()
  })
})

describe('field lines', () => {
  test('as many above the magnet as below, and none without a magnet or when off', () => {
    expect(make({ lineCount: 3 }).fieldLines.filter((l) => l.kind === 'loop')).toHaveLength(6)
    expect(make({ lineCount: 3 }).fieldLines.filter((l) => l.kind === 'axis')).toHaveLength(2)
    expect(make({ source: 'none' }).fieldLines).toHaveLength(0)
    expect(make({ fieldLines: 'none' }).fieldLines).toHaveLength(0)
  })

  test('they never cross', () => {
    const lines = make({ lineCount: 5 }).fieldLines.map((l) => l.points)
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) expect(crosses(lines[i], lines[j])).toBe(false)
  })

  test('outside the magnet they run from its north pole to its south pole', () => {
    for (const facing of ['N', 'S'] as const) {
      const f = make({ facing })
      const m = f.magnet!
      const north = facing === 'N' ? m.x + m.length : m.x
      const south = facing === 'N' ? m.x : m.x + m.length
      const [outOfNorth, intoSouth] = f.fieldLines.filter((l) => l.kind === 'axis')
      expect(outOfNorth.points[0].x).toBe(north)
      expect(Math.sign(outOfNorth.points[1].x - north)).toBe(Math.sign(north - south)) // heading away from the magnet
      expect(intoSouth.points.at(-1)!.x).toBe(south)
      for (const { points } of f.fieldLines.filter((l) => l.kind === 'loop')) {
        expect(Math.abs(points[0].x - north)).toBeLessThan(Math.abs(points[0].x - south))
        expect(Math.abs(points.at(-1)!.x - south)).toBeLessThan(Math.abs(points.at(-1)!.x - north))
      }
    }
  })

  test('the outermost line stays inside the figure', () => {
    const f = make({ lineCount: 4 })
    const top = Math.min(...f.fieldLines.filter((l) => l.kind === 'loop').flatMap((l) => l.points.map((p) => p.y)))
    expect(top).toBeGreaterThan(0)
  })
})

describe('the meter', () => {
  test('off by default, wired to both leads when on', () => {
    expect(make().meter).toBeNull()
    const f = make({ meter: true })
    const m = f.meter!
    expect(m.wires).toHaveLength(2)
    // each wire starts at the end of a lead
    const ends = f.coil.leads.map((l) => `${l.x2},${l.y2}`)
    for (const w of m.wires) expect(ends).toContain(`${w[0].x},${w[0].y}`)
    // and ends on the meter's edge
    for (const w of m.wires) expect(Math.hypot(w.at(-1)!.x - m.cx, w.at(-1)!.y - m.cy)).toBeCloseTo(m.r, 0)
  })

  test('the needle leans left or right, stands up in the middle, or is left for students', () => {
    expect(make({ meter: true, needle: 'left' }).meter!.needle).toBeLessThan(0)
    expect(make({ meter: true, needle: 'right' }).meter!.needle).toBeGreaterThan(0)
    expect(make({ meter: true, needle: 'center' }).meter!.needle).toBe(0)
    expect(make({ meter: true, needle: 'blank' }).meter!.needle).toBeNull()
  })

  test('a coil of one turn still has room for its leads to reach the meter', () => {
    const f = make({ turns: 1, meter: true })
    const [a, b] = f.coil.leads
    expect(b.x2 - a.x2).toBeGreaterThan(f.meter!.r * 2)
    expect(f.left).toBeGreaterThanOrEqual(0)
  })

  test('it fits in the figure', () => {
    const m = make({ meter: true }).meter!
    expect(m.cy + m.r).toBeLessThan(make().height)
  })
})

describe('current arrows', () => {
  test('none by default; up or down the front of the coil', () => {
    expect(make().currentArrows).toHaveLength(0)
    const up = make({ current: 'up' }).currentArrows
    expect(up.length).toBeGreaterThan(0)
    for (const a of up) expect(a.angle).toBe(-90)
    for (const a of make({ current: 'down' }).currentArrows) expect(a.angle).toBe(90)
  })

  test('not crowded on a long coil', () => {
    expect(make({ current: 'up', turns: 20 }).currentArrows.length).toBeLessThanOrEqual(5)
    expect(make({ current: 'up', turns: 3 }).currentArrows).toHaveLength(3)
  })
})
