import { describe, expect, test } from 'vitest'
import { buildIncline } from './incline'
import { inclineSettings } from './settings'

const make = (over: Partial<typeof inclineSettings.defaults> = {}) => buildIncline({ ...inclineSettings.defaults, ...over })

describe('the ramp', () => {
  test('its slope rises at the chosen angle', () => {
    for (const angle of [5, 30, 60]) {
      const { ramp } = make({ angle })
      const rise = ramp.foot.y - ramp.top.y
      const run = ramp.top.x - ramp.foot.x
      expect((Math.atan2(rise, run) * 180) / Math.PI).toBeCloseTo(angle, 1) // coordinates are rounded to 0.01
    }
  })

  test('everything fits in the figure at any angle and object size', () => {
    for (const angle of [5, 20, 45, 60]) {
      for (const objectSize of [0.5, 1, 2]) {
        for (const object of ['block', 'ball', 'cart'] as const) {
          const f = make({ angle, objectSize, object, lengthMark: true, heightMark: true })
          for (const p of f.extent) {
            expect(p.x).toBeGreaterThanOrEqual(0)
            expect(p.x).toBeLessThanOrEqual(f.width)
            expect(p.y).toBeGreaterThanOrEqual(0)
            expect(p.y).toBeLessThanOrEqual(f.height)
          }
        }
      }
    }
  })
})

describe('the object', () => {
  test('sits on the slope, tilted with it', () => {
    const f = make({ angle: 35 })
    const { foot, top } = f.ramp
    // its resting point is on the line from the foot to the top
    const cross = (top.x - foot.x) * (f.object.at.y - foot.y) - (top.y - foot.y) * (f.object.at.x - foot.x)
    const distance = Math.abs(cross) / Math.hypot(top.x - foot.x, top.y - foot.y)
    expect(distance).toBeLessThan(0.05)
    expect(f.object.tilt).toBe(-35)
  })

  test('its middle is above the slope by half its height, whatever its size', () => {
    for (const objectSize of [0.5, 2]) {
      const f = make({ objectSize })
      const d = Math.hypot(f.object.middle.x - f.object.at.x, f.object.middle.y - f.object.at.y)
      expect(d).toBeCloseTo(f.object.height / 2)
    }
  })

  test('slides along the ramp', () => {
    expect(make({ position: 0.8 }).object.at.x).toBeGreaterThan(make({ position: 0.3 }).object.at.x)
  })
})

describe('marks', () => {
  test('the height mark is as tall as the ramp', () => {
    const f = make({ heightMark: true })
    expect(Math.abs(f.heightMark!.y1 - f.heightMark!.y2)).toBeCloseTo(f.ramp.foot.y - f.ramp.top.y)
  })

  test('the length mark is as long as the slope and runs parallel to it', () => {
    const f = make({ lengthMark: true, angle: 25 })
    const m = f.lengthMark!
    const slope = Math.hypot(f.ramp.top.x - f.ramp.foot.x, f.ramp.top.y - f.ramp.foot.y)
    expect(Math.hypot(m.x2 - m.x1, m.y2 - m.y1)).toBeCloseTo(slope)
    expect(Math.atan2(m.y1 - m.y2, m.x2 - m.x1)).toBeCloseTo((25 * Math.PI) / 180)
  })

  test('none unless asked for', () => {
    expect(make().lengthMark).toBeNull()
    expect(make().heightMark).toBeNull()
  })

  test('a rough surface is hatched', () => {
    expect(make().hatches).toHaveLength(0)
    expect(make({ surface: 'rough' }).hatches.length).toBeGreaterThan(5)
  })
})
