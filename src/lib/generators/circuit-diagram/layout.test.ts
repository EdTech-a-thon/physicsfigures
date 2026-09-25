import { describe, expect, test } from 'vitest'
import { buildCircuit, labelBox, partBox, type Box, type CircuitFigure, type Pt } from './layout'
import { cleanCircuit, DEFAULT_CIRCUIT, encodeCircuit, MAX_DEPTH, MAX_PARTS, newGroup, newPart, type Circuit, type Item, type PartKind } from './tree'

const p = (kind: PartKind = 'resistor', over: Partial<ReturnType<typeof newPart>> = {}) => ({ ...newPart(kind), ...over })
const series = (...items: Item[]) => newGroup('series', items)
const parallel = (...items: Item[]) => newGroup('parallel', items)
const loop = (...items: Item[]): Circuit => cleanCircuit({ items, current: null })
const shown = { mode: 'text' as const, text: '10 Omega' }

/** A small random number generator, so random circuits are the same every run. */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/** A random circuit the outline editor could make: within the part and depth limits, with some labels shown. */
function randomCircuit(rand: () => number): Circuit {
  let budget = MAX_PARTS - 1
  const kinds: PartKind[] = ['resistor', 'resistor', 'bulb', 'switch', 'ammeter', 'battery']
  const part = (): Item => {
    budget--
    const kind = kinds[Math.floor(rand() * kinds.length)]
    return p(kind, { value: rand() < 0.4 ? { mode: rand() < 0.5 ? 'text' : 'blank', text: '12.5 Omega' } : newPart(kind).value, open: rand() < 0.5, cells: rand() < 0.5 ? 2 : 1 })
  }
  const item = (depth: number, inParallel: boolean): Item => {
    if (budget < 2 || depth > MAX_DEPTH || rand() < 0.55) return part()
    const n = 2 + Math.floor(rand() * 2)
    return newGroup(inParallel ? 'series' : 'parallel', Array.from({ length: n }, () => (budget > 0 ? item(depth + 1, !inParallel) : part())))
  }
  const items: Item[] = [p('battery')]
  while (budget > 0 && items.length < 5) items.push(item(1, false))
  return cleanCircuit({ items, current: null })
}

const inside = (a: Box, b: Box, tol = 0) => a.left >= b.left - tol && a.right <= b.right + tol && a.top >= b.top - tol && a.bottom <= b.bottom + tol
const overlap = (a: Box, b: Box, tol = 1) => a.left < b.right - tol && b.left < a.right - tol && a.top < b.bottom - tol && b.top < a.bottom - tol
const segments = (fig: CircuitFigure) => fig.wires.flatMap((w) => w.slice(1).map((q, i) => [w[i], q] as const))
/** Does a straight wire pass through the inside of a box? */
function cuts([a, b]: readonly [Pt, Pt], box: Box, tol = 1.5): boolean {
  const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)]
  const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)]
  const acrossX = x0 === x1 ? x0 > box.left + tol && x0 < box.right - tol : x0 < box.right - tol && x1 > box.left + tol
  const acrossY = y0 === y1 ? y0 > box.top + tol && y0 < box.bottom - tol : y0 < box.bottom - tol && y1 > box.top + tol
  return acrossX && acrossY
}
/** Do two wires cross (rather than meet at an end or a T)? */
function cross([a, b]: readonly [Pt, Pt], [c, d]: readonly [Pt, Pt]): boolean {
  const h = a.y === b.y ? [a, b] : c.y === d.y ? [c, d] : null
  const v = a.x === b.x ? [a, b] : c.x === d.x ? [c, d] : null
  if (!h || !v || h === v) return false
  const [x0, x1] = [Math.min(h[0].x, h[1].x), Math.max(h[0].x, h[1].x)]
  const [y0, y1] = [Math.min(v[0].y, v[1].y), Math.max(v[0].y, v[1].y)]
  return v[0].x > x0 && v[0].x < x1 && h[0].y > y0 && h[0].y < y1
}

/** Everything a figure must get right, whatever the circuit. */
function checkFigure(fig: CircuitFigure) {
  const frame = { left: 0, right: fig.width, top: 0, bottom: fig.height }
  const parts = fig.parts.map(partBox)
  // Letters inside meters sit in their part's box; polarity marks must stay clear of everything.
  const marks = fig.letters.filter((l) => l.text === '+' || l.text === '−').map((l) => ({ left: l.x - 5, right: l.x + 5, top: l.y - 6, bottom: l.y + 6 }))
  const labels = [...fig.labels.map(labelBox), ...marks]
  for (const b of [...parts, ...labels]) expect(inside(b, frame, 0.5)).toBe(true)
  for (const q of fig.wires.flat()) expect(inside({ left: q.x, right: q.x, top: q.y, bottom: q.y }, frame)).toBe(true)
  const things = [...parts, ...labels]
  for (let i = 0; i < things.length; i++) for (let j = i + 1; j < things.length; j++) expect(overlap(things[i], things[j]), `boxes ${i} and ${j} overlap`).toBe(false)
  const wires = segments(fig)
  for (const w of wires) for (const b of things) expect(cuts(w, b), 'a wire runs through a part or label').toBe(false)
  for (let i = 0; i < wires.length; i++) for (let j = i + 1; j < wires.length; j++) expect(cross(wires[i], wires[j]), 'wires cross').toBe(false)
}

describe('the loop layout', () => {
  test('the default circuit: a battery on the left, the rest along the top', () => {
    const fig = buildCircuit(DEFAULT_CIRCUIT, { title: false, polarity: false })
    checkFigure(fig)
    const [battery, r1, r2, r3] = fig.parts
    expect(battery.angle).toBe(270)
    expect(battery.x).toBeLessThan(r1.x)
    for (const r of [r1, r2]) expect(r.angle).toBe(0)
    // R₃ is R₂'s parallel branch, below it inside the loop.
    expect(r3.x).toBeCloseTo(r2.x)
    expect(r3.y).toBeGreaterThan(r2.y)
    // Junction dots where the branches meet.
    expect(fig.dots).toHaveLength(2)
  })

  test('a battery later in the loop is brought round to the left', () => {
    const fig = buildCircuit(loop(p(), p(), p('battery')), { title: false, polarity: false })
    const battery = fig.parts.find((q) => q.part.kind === 'battery')!
    expect(battery.angle).toBe(270)
  })

  test('a long loop goes on down the right side, then back along the bottom', () => {
    const long = buildCircuit(loop(p('battery'), ...Array.from({ length: 7 }, () => p('resistor', { value: shown }))), { title: false, polarity: false })
    checkFigure(long)
    expect(new Set(long.parts.map((q) => q.angle))).toEqual(new Set([270, 0, 90]))
    const wide = { mode: 'text' as const, text: 'R_{heater} = 120 Omega' }
    const longer = buildCircuit(loop(p('battery'), ...Array.from({ length: 7 }, () => p('resistor', { name: wide, auto: false }))), { title: false, polarity: false })
    checkFigure(longer)
    expect(new Set(longer.parts.map((q) => q.angle))).toEqual(new Set([270, 0, 90, 180]))
  })

  test('nested groups fit inside one another', () => {
    const c = loop(p('battery'), parallel(p('resistor', { value: shown }), series(p('bulb', { value: shown }), parallel(p(), p('resistor', { value: shown }))), p()))
    checkFigure(buildCircuit(c, { title: false, polarity: false }))
  })

  test('wires are joined into long lines, not left in pieces', () => {
    const fig = buildCircuit(loop(p('battery'), p()), { title: false, polarity: false })
    // Two parts in a loop: one wire runs from the resistor round to the battery, one back.
    expect(fig.wires).toHaveLength(2)
  })

  test('a title makes room for itself above the circuit', () => {
    const plain = buildCircuit(DEFAULT_CIRCUIT, { title: false, polarity: false })
    const titled = buildCircuit(DEFAULT_CIRCUIT, { title: true, polarity: false })
    expect(titled.height).toBeGreaterThan(plain.height)
    expect(Math.min(...titled.wires.flat().map((q) => q.y))).toBeGreaterThan(titled.title!.y)
  })

  test('names go on the outside of the loop and values on the inside', () => {
    const value = { mode: 'text' as const, text: '12 V' }
    const fig = buildCircuit(loop(p('battery', { value }), p('resistor', { value: shown })), { title: false, polarity: false })
    const [battery, resistor] = fig.parts
    const [bName, bValue, rName, rValue] = fig.labels
    // The battery is on the left side: its name to its left, its value to its right.
    expect(bName).toMatchObject({ anchor: 'end' })
    expect(bName.x).toBeLessThan(battery.x)
    expect(bValue).toMatchObject({ anchor: 'start' })
    expect(bValue.x).toBeGreaterThan(battery.x)
    // The resistor is along the top: its name above, its value below.
    expect(rName.y).toBeLessThan(resistor.y)
    expect(rValue.y).toBeGreaterThan(resistor.y)
  })

  test('polarity marks: + by the long plate, following a battery turned round', () => {
    const marks = (flip: boolean) => {
      const fig = buildCircuit(loop(p('battery', { flip }), p()), { title: false, polarity: true })
      const plus = fig.letters.find((l) => l.text === '+')!
      const minus = fig.letters.find((l) => l.text === '−')!
      return { plus, minus }
    }
    // On the left side the current travels up, so a battery's + faces up.
    const up = marks(false)
    expect(up.plus.y).toBeLessThan(up.minus.y)
    const down = marks(true)
    expect(down.plus.y).toBeGreaterThan(down.minus.y)
    expect(buildCircuit(loop(p('battery'), p()), { title: false, polarity: false }).letters).toHaveLength(0)
  })

  test('random circuits: nothing overlaps, no wires cross, everything fits', () => {
    const rand = random(7)
    for (let i = 0; i < 300; i++) {
      const c = randomCircuit(rand)
      try {
        checkFigure(buildCircuit(c, { title: false, polarity: i % 2 === 0 }))
      } catch (e) {
        throw new Error(`circuit ${encodeCircuit(c)}: ${e}`)
      }
    }
  })
})
