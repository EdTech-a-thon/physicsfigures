// Every choice the teacher makes on the Pulley Generator, with its default:
// the most common textbook version, an Atwood machine.

import { bool, choice, defineSettings, int, label, number } from '$lib/shared/settings'

export const pulleySettings = defineSettings({
  setup: choice('atwood', ['atwood', 'table', 'ramp']),
  /** The two objects: in an Atwood machine, the left and right ones; on a table or ramp, the one on it and the hanging one. */
  aLabel: label({ mode: 'text', text: 'm_1' }),
  aSize: number(1, 0.5, 2),
  bLabel: label({ mode: 'text', text: 'm_2' }),
  bSize: number(1, 0.5, 2),
  /** The object on a table or ramp: a block or a cart. */
  aKind: choice('block', ['block', 'cart']),
  /** Which hanging object hangs lower in an Atwood machine, if either. */
  lower: choice('neither', ['neither', 'a', 'b']),
  angle: int(30, 10, 60),
  angleLabel: label({ mode: 'text', text: 'theta' }),
  surface: choice('smooth', ['smooth', 'rough']),
  mirror: bool(false),
  color: bool(false),
})

export type PulleySettings = typeof pulleySettings.defaults
