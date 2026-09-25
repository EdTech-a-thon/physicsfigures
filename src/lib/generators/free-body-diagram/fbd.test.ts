import { describe, expect, test } from 'vitest'
import { searchGenerators } from '$lib/generators'
import { buildFbd, DOT_R, UNIT } from './fbd'
import { componentLabel, fbdSettings, STARTERS, starterForce, type FbdSettings, type Force } from './settings'

const make = (over: Partial<FbdSettings> = {}) => buildFbd({ ...fbdSettings.defaults, ...over })
const ROW = fbdSettings.clean({ forces: [{}] }).forces[0]
const force = (angle: number, length = 1, text = 'F', over: Partial<Force> = {}): Force => ({
  ...structuredClone(ROW),
  angle,
  length,
  label: { mode: 'text', text },
  ...over,
})
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

describe('angle marks', () => {
  // The angle an arc spans, from its reference end to its force end, counterclockwise.
  const spanOf = (f: ReturnType<typeof make>, i = 0) => {
    const { arc } = f.marks[i]
    const c = f.body.middle
    const at = (p: { x: number; y: number }) => (Math.atan2(c.y - p.y, p.x - c.x) * 180) / Math.PI
    return ((at(arc.to) - at(arc.from) + 540) % 360) - 180
  }
  const refAngle = (f: ReturnType<typeof make>, i = 0) => angleOf(f.marks[i].ref)

  test('measure from the nearer half of the reference line, in every quadrant', () => {
    const cases: [number, 'h' | 'v', number, number][] = [
      // angle, measured from, reference half-line, signed span
      [30, 'h', 0, 30],
      [150, 'h', 180, -30],
      [200, 'h', 180, 20],
      [300, 'h', 0, -60],
      [30, 'v', 90, -60],
      [120, 'v', 90, 30],
      [200, 'v', 270, -70],
      [340, 'v', 270, 70],
    ]
    for (const [angle, from, ref, span] of cases) {
      const f = make({ forces: [force(angle, 1, 'F', { arc: true, from })] })
      expect(refAngle(f)).toBeCloseTo(ref, 0)
      expect(spanOf(f)).toBeCloseTo(span, 0)
      // the arc's sweep flag turns it the same way
      expect(f.marks[0].arc.sweep).toBe(span > 0 ? 0 : 1)
    }
  })

  test('arcs from the same half-line step outward', () => {
    const f = make({ forces: [force(30, 1, 'F', { arc: true }), force(60, 1, 'F', { arc: true })] })
    expect(f.marks[1].arc.r).toBeGreaterThan(f.marks[0].arc.r)
  })

  test('clear the corners of a block', () => {
    const f = make({ body: 'block', forces: [force(45, 1, 'F', { arc: true })] })
    expect(f.marks[0].arc.r).toBeGreaterThan(Math.hypot(f.body.width, f.body.height) / 2)
  })

  test('none for a force along an axis, or unless asked for', () => {
    expect(make({ forces: [force(90, 1, 'F', { arc: true, parts: true })] }).marks).toEqual([])
    expect(make({ forces: [force(90, 1, 'F', { arc: true, parts: true })] }).components).toEqual([])
    expect(make({ forces: [force(30)] }).marks).toEqual([])
  })

  test("don't draw the reference line over the force's own component", () => {
    const f = make({ forces: [force(30, 1.5, 'F', { arc: true, parts: true })] })
    const [c] = f.components
    const [m] = f.marks
    expect(m.ref.x1).toBeGreaterThanOrEqual(c.x.x2 - 0.01)
  })

  test('mirror with the force', () => {
    const f = make({ mirror: true, forces: [force(30, 1, 'F', { arc: true })] })
    expect(refAngle(f)).toBeCloseTo(180, 0)
    expect(spanOf(f)).toBeCloseTo(-30, 0)
  })
})

describe('components', () => {
  test('add up to the force, along the horizontal and vertical', () => {
    for (const angle of [30, 135, 210, 320]) {
      for (const body of ['dot', 'block'] as const) {
        const f = make({ body, forces: [force(angle, 1.3, 'F', { parts: true })] })
        const [v] = f.forces
        const [c] = f.components
        expect(c.x.y2).toBeCloseTo(c.x.y1) // horizontal
        expect(c.y.x2).toBeCloseTo(c.y.x1) // vertical
        expect(c.x.x1 + (c.x.x2 - c.x.x1) + (c.y.x2 - c.y.x1)).toBeCloseTo(v.v.x2)
        expect(c.y.y1 + (c.x.y2 - c.x.y1) + (c.y.y2 - c.y.y1)).toBeCloseTo(v.v.y2)
      }
    }
  })

  test('labels sit on the far side from the force', () => {
    const f = make({ forces: [force(30, 1, 'F', { parts: true })] })
    const [c] = f.components
    expect(c.xLabelAt.y).toBeGreaterThan(f.body.middle.y) // force is above, label below
    expect(c.yLabelAt.x).toBeLessThan(f.body.middle.x) // force is to the right, label to the left
  })

  test('are named after their force', () => {
    expect(componentLabel('T', 'x')).toBe('T_x')
    expect(componentLabel('F_g', 'y')).toBe('F_{gy}')
    expect(componentLabel('F_{air}', 'x')).toBe('F_{airx}')
    expect(componentLabel('F', 'x')).toBe('F_x')
  })
})

describe('velocity and acceleration', () => {
  const points = (f: ReturnType<typeof make>) =>
    f.forces.flatMap((v) => [v.v.x2, v.labelAt.x]).concat(f.body.middle.x + f.body.width / 2)

  test('sit beside everything else, clear of the body and every force', () => {
    for (const body of ['dot', 'block'] as const) {
      const f = make({ body, forces: STARTERS.map(starterForce), velocity: true, velocityAngle: 0, acceleration: true, accelerationAngle: 200 })
      expect(f.motion.map((m) => m.kind)).toEqual(['velocity', 'acceleration'])
      const rightmost = Math.max(...points(f))
      for (const m of f.motion) expect(Math.min(m.v.x1, m.v.x2)).toBeGreaterThan(rightmost + 20)
    }
  })

  test('point where they are set, and stack without overlapping', () => {
    const f = make({ velocity: true, velocityAngle: 90, acceleration: true, accelerationAngle: 90 })
    expect(angleOf(f.motion[0].v)).toBeCloseTo(90)
    const [a, b] = f.motion
    expect(Math.min(b.v.y1, b.v.y2)).toBeGreaterThan(Math.max(a.v.y1, a.v.y2))
  })

  test('go on the left when mirrored', () => {
    const f = make({ mirror: true, velocity: true, velocityAngle: 30 })
    const leftmost = Math.min(...f.forces.flatMap((v) => [v.v.x2, v.labelAt.x]))
    expect(Math.max(f.motion[0].v.x1, f.motion[0].v.x2)).toBeLessThan(leftmost)
    expect(angleOf(f.motion[0].v)).toBeCloseTo(150, 0)
  })

  test('none unless asked for', () => {
    expect(make().motion).toEqual([])
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

  test('angle marks and components round-trip, and old links without them still work', () => {
    const s = { ...fbdSettings.defaults, forces: [force(37, 1, 'T', { arc: true, from: 'v' as const, parts: true, xLabel: { mode: 'blank' as const, text: 'F_x' } })] }
    expect(fbdSettings.fromParams(new URLSearchParams(fbdSettings.toQuery(s)))).toEqual(s)
    expect(fbdSettings.fromParams(new URLSearchParams('forces=37,1,T')).forces[0]).toEqual(force(37, 1, 'T'))
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
