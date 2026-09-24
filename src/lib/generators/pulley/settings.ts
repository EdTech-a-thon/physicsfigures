// Every choice the teacher makes on the Pulley Generator, with its default:
// the most common textbook version, an Atwood machine.

import { bool, choice, defineSettings, label, number } from '$lib/shared/settings'

export const pulleySettings = defineSettings({
  /** The two objects: in an Atwood machine, the left and right ones. */
  aLabel: label({ mode: 'text', text: 'm_1' }),
  aSize: number(1, 0.5, 2),
  bLabel: label({ mode: 'text', text: 'm_2' }),
  bSize: number(1, 0.5, 2),
  /** Which hanging object hangs lower, if either. */
  lower: choice('neither', ['neither', 'a', 'b']),
  mirror: bool(false),
  color: bool(false),
})

export type PulleySettings = typeof pulleySettings.defaults
