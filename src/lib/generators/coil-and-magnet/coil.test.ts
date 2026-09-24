import { describe, expect, test } from 'vitest'
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
