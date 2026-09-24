import { describe, expect, test } from 'vitest'
import { buildPulley } from './pulley'
import { pulleySettings } from './settings'

const make = (over: Partial<typeof pulleySettings.defaults> = {}) => buildPulley({ ...pulleySettings.defaults, ...over })

describe('Atwood machine', () => {
  test('two objects hang on strings straight down from either side of the wheel', () => {
    for (const [aSize, bSize] of [[1, 1], [0.5, 2], [2, 2]]) {
      const f = make({ aSize, bSize })
      const [wheel] = f.wheels
      expect(f.objects).toHaveLength(2)
      for (const [i, side] of [[0, -1], [1, 1]] as const) {
        const string = f.strings[i]
        const top = string[0]
        const bottom = string.at(-1)!
        // leaves the wheel at its side
        expect(top.x).toBeCloseTo(wheel.cx + side * wheel.r)
        expect(top.y).toBeCloseTo(wheel.cy)
        // straight down, to the top middle of its object
        expect(bottom.x).toBeCloseTo(top.x)
        const o = f.objects[i]
        expect(bottom.x).toBeCloseTo(o.at.x)
        expect(bottom.y).toBeCloseTo(o.at.y - o.height)
      }
    }
  })

  test("big objects don't overlap: the wheel grows to keep them apart", () => {
    const f = make({ aSize: 2, bSize: 2 })
    const [a, b] = f.objects
    expect(a.at.x + a.width / 2).toBeLessThan(b.at.x - b.width / 2)
  })

  test('either object can hang lower', () => {
    const even = make()
    expect(even.objects[0].at.y).toBe(even.objects[1].at.y)
    const aLower = make({ lower: 'a' })
    expect(aLower.objects[0].at.y).toBeGreaterThan(aLower.objects[1].at.y)
    const bLower = make({ lower: 'b' })
    expect(bLower.objects[1].at.y).toBeGreaterThan(bLower.objects[0].at.y)
  })

  test('everything fits in the figure', () => {
    for (const lower of ['neither', 'a', 'b'] as const) {
      const f = make({ aSize: 2, bSize: 2, lower })
      for (const o of f.objects) {
        expect(o.at.y).toBeLessThanOrEqual(f.height)
        expect(o.at.y - o.height).toBeGreaterThan(0)
      }
    }
  })
})

const angleOf = (a: { x: number; y: number }, b: { x: number; y: number }) => (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI

describe('table and hanging mass', () => {
  test('the object rests on the table; its string runs level to the top of the wheel, then straight down', () => {
    for (const aSize of [0.5, 1, 2]) {
      for (const aKind of ['block', 'cart'] as const) {
        const f = make({ setup: 'table', aSize, aKind })
        const [a, b] = f.objects
        const [wheel] = f.wheels
        expect(a.at.y).toBeCloseTo(f.table!.top)
        const [level, hang] = f.strings
        expect(level[0].y).toBeCloseTo(level[1].y) // level
        expect(level[0].y).toBeCloseTo(a.middle.y) // from the middle of the object's side
        expect(level[0].x).toBeCloseTo(a.at.x + a.width / 2)
        expect(level[1].x).toBeCloseTo(wheel.cx) // to the top of the wheel
        expect(level[1].y).toBeCloseTo(wheel.cy - wheel.r)
        expect(hang[0].x).toBeCloseTo(wheel.cx + wheel.r) // down from its side
        expect(hang.at(-1)!.x).toBeCloseTo(b.at.x)
        expect(hang.at(-1)!.y).toBeCloseTo(b.at.y - b.height)
      }
    }
  })

  test('a rough table is hatched', () => {
    expect(make({ setup: 'table' }).hatches).toHaveLength(0)
    expect(make({ setup: 'table', surface: 'rough' }).hatches.length).toBeGreaterThan(5)
  })
})

describe('ramp and hanging mass', () => {
  test('the string runs parallel to the slope, touching the wheel', () => {
    for (const angle of [10, 30, 60]) {
      for (const aSize of [0.5, 1, 2]) {
        const f = make({ setup: 'ramp', angle, aSize })
        const [slope] = f.strings
        const [wheel] = f.wheels
        expect(angleOf(slope[0], slope[1])).toBeCloseTo(angle, 1)
        // the wheel's middle is one radius from the string's line
        const [p, q] = slope
        const dist = Math.abs((q.x - p.x) * (wheel.cy - p.y) - (q.y - p.y) * (wheel.cx - p.x)) / Math.hypot(q.x - p.x, q.y - p.y)
        expect(dist).toBeCloseTo(wheel.r, 0)
        // and meets the object in the middle of its up-slope face
        const a = f.objects[0]
        expect(Math.hypot(p.x - a.middle.x, p.y - a.middle.y)).toBeCloseTo(a.width / 2, 0)
      }
    }
  })

  test('the hanging object is clear of the ramp and everything fits', () => {
    for (const angle of [10, 12, 35, 60]) {
      for (const [bSize, aKind, aSize] of [[0.5, 'block', 2], [2, 'block', 2], [1, 'cart', 1], [2, 'cart', 0.5]] as const) {
        const f = make({ setup: 'ramp', angle, bSize, aSize, aKind })
        const b = f.objects[1]
        expect(b.at.x - b.width / 2).toBeGreaterThan(f.ramp!.top.x)
        // every corner of every object, and the wheel, inside the figure
        for (const o of f.objects) {
          const t = (o.tilt * Math.PI) / 180
          const u = { x: Math.cos(t), y: Math.sin(t) }
          const n = { x: Math.sin(t), y: -Math.cos(t) }
          for (const [du, dn] of [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1]]) {
            const x = o.at.x + u.x * du * o.width + n.x * dn * o.height
            const y = o.at.y + u.y * du * o.width + n.y * dn * o.height
            expect(x).toBeGreaterThanOrEqual(0)
            expect(x).toBeLessThanOrEqual(f.width)
            expect(y).toBeGreaterThanOrEqual(0)
            expect(y).toBeLessThanOrEqual(f.height)
          }
        }
        expect(f.wheels[0].cy - f.wheels[0].r).toBeGreaterThan(0)
        // the hanging object is below its wheel, with string between
        expect(b.at.y - b.height).toBeGreaterThan(f.wheels[0].cy + 20)
      }
    }
  })
})

  test('a low ramp stands on a platform so the hanging object has room below the pulley', () => {
    expect(make({ setup: 'ramp', angle: 45 }).platform).toBeNull()
    expect(make({ setup: 'ramp', angle: 10 }).platform).not.toBeNull()
  })

describe('block and tackle', () => {
  test('the load is held up by the chosen number of strands', () => {
    for (const strands of [1, 2, 3, 4]) {
      const f = make({ setup: 'tackle', strands })
      expect(f.tackle!.supporting).toHaveLength(strands)
      // plus the free end the effort pulls on
      expect(f.tackle!.effort).toBeTruthy()
    }
  })

  test('every strand hangs straight up and down', () => {
    for (const strands of [1, 2, 3, 4]) {
      for (const string of make({ setup: 'tackle', strands }).strings) {
        for (let i = 1; i < string.length; i++) expect(string[i].x).toBeCloseTo(string[i - 1].x)
      }
    }
  })

  test('fixed pulleys above, movable ones below with the load', () => {
    const count = (strands: number) => {
      const f = make({ setup: 'tackle', strands })
      const [top] = f.wheels.map((w) => w.cy).sort((a, b) => a - b)
      return { fixed: f.wheels.filter((w) => w.cy === top).length, movable: f.wheels.filter((w) => w.cy !== top).length }
    }
    expect(count(1)).toEqual({ fixed: 1, movable: 0 })
    expect(count(2)).toEqual({ fixed: 1, movable: 1 })
    expect(count(3)).toEqual({ fixed: 2, movable: 1 })
    expect(count(4)).toEqual({ fixed: 2, movable: 2 })
  })

  test('the load fits, and the free end is clear of it', () => {
    for (const strands of [1, 2, 3, 4]) {
      for (const loadSize of [0.5, 2]) {
        const f = make({ setup: 'tackle', strands, loadSize })
        const [load] = f.objects
        expect(load.at.y).toBeLessThanOrEqual(f.height)
        const effortX = f.tackle!.effort.x
        expect(Math.abs(effortX - load.at.x)).toBeGreaterThan(load.width / 2 + 6)
      }
    }
  })
})
