import { describe, expect, test } from 'vitest'
import { bool, choice, defineSettings, int, label, number } from './settings'

const def = defineSettings({
  turns: int(8, 1, 20),
  size: number(1, 0.5, 2),
  source: choice('magnet', ['magnet', 'none']),
  mirror: bool(false),
  north: label({ mode: 'text', text: 'N' }),
})

describe('defineSettings', () => {
  test('defaults', () => {
    expect(def.defaults).toEqual({ turns: 8, size: 1, source: 'magnet', mirror: false, north: { mode: 'text', text: 'N' } })
  })

  test('clean keeps good values and fixes bad ones', () => {
    expect(def.clean({ turns: 50, size: 'x', source: 'battery', mirror: true, north: { mode: 'blank', text: 'N' } })).toEqual({
      turns: 20,
      size: 1,
      source: 'magnet',
      mirror: true,
      north: { mode: 'blank', text: 'N' },
    })
    expect(def.clean(null)).toEqual(def.defaults)
    expect(def.clean({ turns: 3.6 }).turns).toBe(4)
  })

  test('the address carries only what differs from the defaults', () => {
    expect(def.toQuery(def.defaults)).toBe('')
    const s = { ...def.defaults, turns: 3, mirror: true, north: { mode: 'none' as const, text: 'N' } }
    const query = def.toQuery(s)
    expect(query).toBe('turns=3&mirror=1&north=')
    expect(def.fromParams(new URLSearchParams(query))).toEqual(s)
  })

  test('labels round-trip through the address', () => {
    const s = { ...def.defaults, north: { mode: 'text' as const, text: 'm_1 theta' } }
    expect(def.fromParams(new URLSearchParams(def.toQuery(s)))).toEqual(s)
  })

  test('a bad link falls back to defaults', () => {
    expect(def.fromParams(new URLSearchParams('turns=abc&source=nope&mirror=maybe'))).toEqual(def.defaults)
  })

  test('same', () => {
    expect(def.same(def.defaults, { ...def.defaults })).toBe(true)
    expect(def.same(def.defaults, { ...def.defaults, turns: 2 })).toBe(false)
  })
})
