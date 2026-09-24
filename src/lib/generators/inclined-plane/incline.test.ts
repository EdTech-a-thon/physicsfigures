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

describe('vectors', () => {
  const all = {
    gravity: true,
    normal: true,
    friction: 'up',
    applied: 'down',
    velocity: 'down',
    acceleration: 'up',
  } as const
  const byKind = (f: ReturnType<typeof make>, kind: string) => f.vectors.find((v) => v.kind === kind)!.v
  const angleOf = (v: { x1: number; y1: number; x2: number; y2: number }) => (Math.atan2(-(v.y2 - v.y1), v.x2 - v.x1) * 180) / Math.PI

  test('none by default', () => {
    expect(make().vectors).toHaveLength(0)
  })

  test('gravity points straight down, the normal force straight out of the slope', () => {
    for (const angle of [10, 30, 55]) {
      const f = make({ ...all, angle })
      expect(angleOf(byKind(f, 'gravity'))).toBeCloseTo(-90, 1)
      expect(angleOf(byKind(f, 'normal'))).toBeCloseTo(90 + angle, 1)
    }
  })

  test('friction, applied force, velocity and acceleration run along the slope, up or down it', () => {
    const f = make({ ...all, angle: 30 })
    expect(angleOf(byKind(f, 'friction'))).toBeCloseTo(30, 1) // up the slope
    expect(angleOf(byKind(f, 'applied'))).toBeCloseTo(-150, 1) // down it
    expect(angleOf(byKind(f, 'velocity'))).toBeCloseTo(-150, 1)
    expect(angleOf(byKind(f, 'acceleration'))).toBeCloseTo(30, 1)
  })

  test('forces start at the edge of the object, not inside it', () => {
    const f = make({ ...all, angle: 30 })
    const m = f.object.middle
    const from = (kind: string) => {
      const v = byKind(f, kind)
      return Math.hypot(v.x1 - m.x, v.y1 - m.y)
    }
    expect(from('normal')).toBeCloseTo(f.object.height / 2, 0)
    // straight down meets the tilted block's bottom at a slant
    expect(from('gravity')).toBeCloseTo(f.object.height / 2 / Math.cos((30 * Math.PI) / 180), 0)
  })

  test('each vector has its own label', () => {
    const f = make({ ...all, gravityLabel: { mode: 'text', text: 'mg' } })
    expect(f.vectors.find((v) => v.kind === 'gravity')!.label.text).toBe('mg')
    for (const v of f.vectors) expect(v.labelAt).toBeTruthy()
  })

  test('everything still fits with every vector on', () => {
    for (const angle of [5, 30, 60]) {
      for (const object of ['block', 'ball', 'cart'] as const) {
        const f = make({ ...all, angle, object, objectSize: 2, lengthMark: true, heightMark: true })
        for (const p of f.extent) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(f.width)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThanOrEqual(f.height)
        }
      }
    }
  })
})
