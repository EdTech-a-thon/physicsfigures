import { describe, expect, test } from 'vitest'
import { decodeLabel, encodeLabel, italicPieces, labelFromText, labelRuns, labelToText, typeLabel, type Label } from './label'

describe('typing a label', () => {
  test.each([
    ['theta', 'θ'],
    ['30deg', '30°'],
    ['mu_k', 'μ_k'],
    ['Deltax', 'Δx'],
    ['2 kg', '2 kg'],
    ['omega', 'ω'],
    ['Omega', 'Ω'],
  ])('%s shows as %s', (typed, shown) => {
    expect(typeLabel(typed)).toBe(shown)
  })
})

describe('label text for the page address', () => {
  test.each([
    ['m_1', 'm_1'],
    ['F_N', 'F_N'],
    ['θ', 'theta'],
    ['30°', '30deg'],
    ['μ_k', 'mu_k'],
    ['v_{0x}', 'v_{0x}'],
    ['5 kg', '5 kg'],
    ['2.0 m/s^2', '2.0 m/s^2'],
    ['x^{-1}', 'x^{-1}'],
    ['Δx', 'Deltax'],
  ])('%s', (text, expected) => {
    const once = labelToText(labelFromText(text))
    expect(once).toBe(expected)
    expect(labelToText(labelFromText(once))).toBe(once)
  })
})

describe('runs for drawing a label', () => {
  test('subscripts and superscripts', () => {
    expect(labelRuns('F_N')).toEqual([
      { text: 'F', shift: null },
      { text: 'N', shift: 'sub' },
    ])
    expect(labelRuns('mu_k')).toEqual([
      { text: 'μ', shift: null },
      { text: 'k', shift: 'sub' },
    ])
    expect(labelRuns('2.0 m/s^2')).toEqual([
      { text: '2.0 m/s', shift: null },
      { text: '2', shift: 'super' },
    ])
    expect(labelRuns('v_{0x} = 3deg')).toEqual([
      { text: 'v', shift: null },
      { text: '0x', shift: 'sub' },
      { text: ' = 3°', shift: null },
    ])
  })
})

describe('a label in the page address', () => {
  const cases: [Label, string][] = [
    [{ mode: 'text', text: 'm_1' }, 'm_1'],
    [{ mode: 'blank', text: 'default' }, '~'],
    [{ mode: 'none', text: 'default' }, ''],
    [{ mode: 'text', text: '~x' }, '~~x'],
    [{ mode: 'text', text: '' }, '~_'],
    [{ mode: 'text', text: '~_' }, '~~_'],
  ]
  test.each(cases)('%o', (label, raw) => {
    expect(encodeLabel(label)).toBe(raw)
    expect(decodeLabel(raw, { mode: 'text', text: 'default' })).toEqual(label)
  })

  test('a missing label is the default, and blank drops its text from the address', () => {
    expect(encodeLabel({ mode: 'blank', text: 'm_1' })).toBe('~')
    expect(decodeLabel(null, { mode: 'text', text: 'θ' })).toEqual({ mode: 'text', text: 'θ' })
  })
})

describe('italics', () => {
  const italic = (text: string) => italicPieces(text).filter((p) => p.italic).map((p) => p.text)
  test('quantities in italics, units and words upright', () => {
    expect(italic('mg')).toEqual(['mg'])
    expect(italic('v')).toEqual(['v'])
    expect(italic('θ')).toEqual(['θ'])
    expect(italic('5 kg')).toEqual([])
    expect(italic('20 cm')).toEqual([])
    expect(italic('block')).toEqual([])
    expect(italic('F = ma')).toEqual(['F', 'ma'])
  })
})
