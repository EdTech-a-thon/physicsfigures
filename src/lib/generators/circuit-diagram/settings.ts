// Every choice the teacher makes on the Circuit Diagram Generator, with its
// default: a battery, R₁ in series, then R₂ in parallel with R₃. The circuit
// itself is one setting, a series/parallel tree (see tree.ts).

import { bool, choice, defineSettings, label } from '$lib/shared/settings'
import { circuitField, DEFAULT_CIRCUIT } from './tree'

export const circuitSettings = defineSettings({
  circuit: circuitField(DEFAULT_CIRCUIT),
  /** US symbols (zigzag resistor, looped bulb filament) or IEC ones (box resistor, crossed bulb). */
  symbols: choice('us', ['us', 'iec']),
  /** + and − beside each battery. */
  polarity: bool(false),
  title: label({ mode: 'none', text: '' }),
  mirror: bool(false),
  color: bool(false),
})

export type CircuitSettings = typeof circuitSettings.defaults
