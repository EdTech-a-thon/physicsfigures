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
