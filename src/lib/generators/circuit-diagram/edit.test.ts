import { describe, expect, test } from 'vitest'
import { addPart, canMove, cantAdd, cantRemove, itemAt, moveItem, removeItem, setKind } from './edit'
import { cleanCircuit, DEFAULT_CIRCUIT, encodeCircuit, newGroup, newPart, partsOf, type Circuit, type Item, type PartKind } from './tree'

const p = (kind: PartKind = 'resistor', over: Partial<ReturnType<typeof newPart>> = {}) => ({ ...newPart(kind), ...over })
const loop = (...items: Item[]): Circuit => cleanCircuit({ items, current: null })
const shape = (c: Circuit) => encodeCircuit(c).replace(/[nvmij@]'(\\.|[^'])*'/g, '')
const names = (c: Circuit) => [...partsOf(c.items)].map((part) => part.name.text)
const point = (text: string) => ({ mode: 'text' as const, text })

describe('adding parts', () => {
  test('in series: after the part, in the same run', () => {
    const { circuit, path } = addPart(DEFAULT_CIRCUIT, [1], 'series')
    expect(shape(circuit)).toBe('b.r.r.[r.r]')
    expect(path).toEqual([2])
    expect(names(circuit)).toEqual(['epsilon', 'R_1', 'R_2', 'R_3', 'R_4'])
  })

  test('in series with a branch: the branch becomes a series run', () => {
    const { circuit, path } = addPart(DEFAULT_CIRCUIT, [2, 1], 'series', 'bulb')
    expect(shape(circuit)).toBe('b.r.[r.(r.l)]')
    expect(path).toEqual([2, 1, 1])
  })

  test('in parallel: a group round the part, or a new branch in its group', () => {
    const wrapped = addPart(DEFAULT_CIRCUIT, [1], 'parallel')
    expect(shape(wrapped.circuit)).toBe('b.[r.r].[r.r]')
    expect(wrapped.path).toEqual([1, 1])
    const branch = addPart(DEFAULT_CIRCUIT, [2, 0], 'parallel')
    expect(shape(branch.circuit)).toBe('b.r.[r.r.r]')
    expect(branch.path).toEqual([2, 1])
  })

  test('a current arrow stays with its branch when the branch becomes a series run', () => {
    const arrow = { dir: 'forward' as const, label: point('I_1') }
    const c = loop(p('battery'), newGroup('parallel', [p('resistor', { current: arrow }), p()]))
    const { circuit } = addPart(c, [1, 0], 'series')
    const run = itemAt(circuit, [1, 0])
    expect(run.type).toBe('series')
    expect(run.current).toEqual(arrow)
  })

  test('a point in the gap after a part moves on to the new part after it', () => {
    const c = loop(p('battery'), p('resistor', { point: point('A') }), p())
    const { circuit } = addPart(c, [1], 'series')
    expect([...partsOf(circuit.items)].map((q) => q.point?.text ?? null)).toEqual([null, null, 'A', null])
  })

  test('not past the part limit or the depth limit', () => {
    const full = loop(p('battery'), ...Array.from({ length: 7 }, () => p()))
    expect(cantAdd(full, [1], 'series')).toMatch(/up to 8 parts/)
    const deep = loop(p('battery'), newGroup('parallel', [p(), newGroup('series', [p(), newGroup('parallel', [p(), p()])])]))
    // The innermost group is 3 deep: a part there can join its group, but not be wrapped in another.
    expect(cantAdd(deep, [1, 1, 1, 0], 'parallel')).toBeNull()
    expect(cantAdd(deep, [1, 1, 1, 0], 'series')).toMatch(/3 deep/)
    expect(cantAdd(DEFAULT_CIRCUIT, [1], 'parallel')).toBeNull()
  })
})

describe('removing and moving', () => {
  test('removing a branch of a two-branch group leaves the other in series', () => {
    expect(shape(removeItem(DEFAULT_CIRCUIT, [2, 1]))).toBe('b.r.r')
  })

  test("the last part can't be removed", () => {
    expect(cantRemove(loop(p('battery')), [0])).not.toBeNull()
    expect(cantRemove(DEFAULT_CIRCUIT, [0])).toBeNull()
  })

  test('a removed part leaves its point in the gap', () => {
    const c = loop(p('battery'), p('resistor'), p('resistor', { point: point('B') }), p())
    expect([...partsOf(removeItem(c, [2]).items)].map((q) => q.point?.text ?? null)).toEqual([null, 'B', null])
  })

  test('moving swaps parts but leaves points in their gaps, and renumbers', () => {
    const c = loop(p('battery'), p('resistor', { point: point('A') }), p('bulb'), p())
    expect(canMove(c, [0], -1)).toBe(false)
    const { circuit, path } = moveItem(c, [1], 1)
    expect(shape(circuit)).toBe('b.l.r.r')
    expect(path).toEqual([2])
    expect([...partsOf(circuit.items)].map((q) => q.point?.text ?? null)).toEqual([null, 'A', null, null])
    expect(names(circuit)).toEqual(['epsilon', 'L', 'R_1', 'R_2'])
  })

  test('a renamed part keeps its name as the others renumber round it', () => {
    const c = structuredClone(DEFAULT_CIRCUIT)
    ;[...partsOf(c.items)][2].name.text = 'R_x'
    expect(names(removeItem(c, [1]))).toEqual(['epsilon', 'R_x', 'R'])
  })
})

describe('changing kind', () => {
  test('starts the kind afresh but keeps where it is', () => {
    const c = loop(p('battery'), p('resistor', { value: { mode: 'text', text: '4 Omega' }, point: point('A') }))
    const next = setKind(c, [1], 'switch')
    const part = itemAt(next, [1])
    expect(part).toMatchObject({ kind: 'switch', value: { mode: 'text', text: '' }, point: point('A'), name: { text: 'S' } })
  })
})
