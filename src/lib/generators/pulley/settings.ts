// Every choice the teacher makes on the Pulley Generator, with its default:
// the most common textbook version, an Atwood machine.

import { bool, choice, defineSettings, int, label, number } from '$lib/shared/settings'

export const pulleySettings = defineSettings({
  setup: choice('atwood', ['atwood', 'table', 'ramp', 'tackle']),
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
  /** A block and tackle: how many strands hold up its load. */
  strands: int(2, 1, 4),
  loadLabel: label({ mode: 'text', text: 'm' }),
  loadSize: number(1, 0.5, 2),
  // Vectors.
  tension: bool(false),
  tensionLabel: label({ mode: 'text', text: 'T' }),
  gravity: bool(false),
  aGravityLabel: label({ mode: 'text', text: 'm_1 g' }),
  bGravityLabel: label({ mode: 'text', text: 'm_2 g' }),
  loadGravityLabel: label({ mode: 'text', text: 'mg' }),
  /** The normal force and friction on the object on a table or ramp. Friction points toward or away from the pulley. */
  normal: bool(false),
  normalLabel: label({ mode: 'text', text: 'F_N' }),
  friction: choice('none', ['none', 'toward', 'away']),
  frictionLabel: label({ mode: 'text', text: 'F_f' }),
  /** Acceleration of every object. Forward is the way a hanging object falls (in a block and tackle, the load rising). */
  acceleration: choice('none', ['none', 'forward', 'backward']),
  accelerationLabel: label({ mode: 'text', text: 'a' }),
  mirror: bool(false),
  color: bool(false),
})

export type PulleySettings = typeof pulleySettings.defaults
