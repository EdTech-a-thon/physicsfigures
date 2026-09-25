import { describe, expect, test } from 'vitest'
import { searchGenerators } from '$lib/generators'
import { buildFbd, DOT_R, UNIT } from './fbd'
import { fbdSettings, STARTERS, starterForce, type FbdSettings, type Force } from './settings'

const make = (over: Partial<FbdSettings> = {}) => buildFbd({ ...fbdSettings.defaults, ...over })
const force = (angle: number, length = 1, text = 'F'): Force => ({ angle, length, label: { mode: 'text', text } })
const length = (v: { x1: number; y1: number; x2: number; y2: number }) => Math.hypot(v.x2 - v.x1, v.y2 - v.y1)
const angleOf = (v: { x1: number; y1: number; x2: number; y2: number }) =>
  ((Math.atan2(v.y1 - v.y2, v.x2 - v.x1) * 180) / Math.PI + 360) % 360

describe('the default figure', () => {
  test('is a dot with gravity down and the normal force up, drawn equal', () => {
    const f = make()
    expect(f.body.kind).toBe('dot')
    expect(f.forces.map((v) => v.label.text)).toEqual(['F_g', 'F_N'])
    expect(angleOf(f.forces[0].v)).toBeCloseTo(270)
    expect(angleOf(f.forces[1].v)).toBeCloseTo(90)
    expect(length(f.forces[0].v)).toBeCloseTo(length(f.forces[1].v))
  })
})

describe('forces', () => {
  test('every tail is at the middle of the body', () => {
    for (const body of ['dot', 'block', 'ball', 'cart'] as const) {
      const f = make({ body, forces: [force(0), force(37), force(200)] })
      for (const v of f.forces) {
        expect(v.v.x1).toBeCloseTo(f.body.middle.x)
        expect(v.v.y1).toBeCloseTo(f.body.middle.y)
      }
    }
  })

  test('each points at its angle, counterclockwise from the right', () => {
    for (const angle of [0, 30, 90, 135, 180, 250, 359]) {
      expect(angleOf(make({ forces: [force(angle)] }).forces[0].v)).toBeCloseTo(angle, 0)
    }
  })

  test('the part past the body is the relative length', () => {
    const f = make({ forces: [force(0, 0.5), force(90, 2)] })
    expect(length(f.forces[0].v) - DOT_R).toBeCloseTo(UNIT * 0.5)
    expect(length(f.forces[1].v) - DOT_R).toBeCloseTo(UNIT * 2)
    // On a block, equal forces reach equally far past its sides.
    const b = make({ body: 'block', forces: [force(0), force(90)] })
    expect(length(b.forces[0].v) - b.body.width / 2).toBeCloseTo(length(b.forces[1].v) - b.body.height / 2)
  })

  test('labels sit past the tip', () => {
    const [v] = make({ forces: [force(0)] }).forces
    expect(v.labelAt.x).toBeGreaterThan(v.v.x2)
    expect(v.labelAt.y).toBeCloseTo(v.v.y2)
  })

  test('Mirror sends each angle to 180° − angle', () => {
    const f = make({ mirror: true, forces: [force(30), force(90), force(270), force(0)] })
    expect(f.forces.map((v) => Math.round(angleOf(v.v)))).toEqual([150, 90, 270, 180])
  })
})

describe('the figure', () => {
  test('is cropped to what is drawn, and everything fits', () => {
    const small = make({ forces: [force(90, 0.25)] })
    const big = make({ forces: [force(0, 2), force(180, 2)] })
    expect(big.width).toBeGreaterThan(small.width)
    for (const f of [small, big, make({ body: 'cart', bodySize: 2, forces: STARTERS.map(starterForce) })]) {
      for (const p of f.extent) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(f.width)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThanOrEqual(f.height)
      }
    }
  })

  test('is drawn at the same scale whatever else is on it', () => {
    const a = make({ forces: [force(0)] })
    const b = make({ forces: [force(0), force(90, 2), force(200, 2)] })
    expect(length(a.forces[0].v)).toBeCloseTo(length(b.forces[0].v))
  })

  test('with no forces is just the body', () => {
    expect(make({ forces: [] }).forces).toEqual([])
  })
})

describe('settings', () => {
  test('round-trip through the address, including an empty list', () => {
    for (const s of [
      { ...fbdSettings.defaults, body: 'block' as const, forces: [force(37, 0.6, 'T_1'), force(143, 0.6, 'T_2'), force(270, 1.2, 'mg')] },
      { ...fbdSettings.defaults, forces: [] },
    ]) {
      expect(fbdSettings.fromParams(new URLSearchParams(fbdSettings.toQuery(s)))).toEqual(s)
    }
  })

  test('starter forces write short links', () => {
    const s = { ...fbdSettings.defaults, forces: [...fbdSettings.defaults.forces, starterForce(STARTERS[2])] }
    expect(decodeURIComponent(fbdSettings.toQuery(s))).toBe('forces=270,1,F_g;90,1,F_N;180,0.6,F_f')
  })

  test('the list is capped at 8 forces', () => {
    expect(fbdSettings.clean({ forces: Array.from({ length: 12 }, () => force(0)) }).forces).toHaveLength(8)
  })
})

describe('the directory', () => {
  test('free body diagram searches find this and the figures with forces on them', () => {
    for (const q of ['free body', 'fbd']) {
      expect(searchGenerators(q).map((g) => g.id)).toEqual(['free-body-diagram', 'inclined-plane', 'pulley'])
    }
  })
})
