// Every choice the teacher makes on the Coil and Magnet Generator, with its
// default: the most common textbook version, a coil of 8 turns with a bar
// magnet approaching it north pole first.

import { bool, choice, defineSettings, int, label } from '$lib/shared/settings'

export const coilSettings = defineSettings({
  turns: int(8, 1, 20),
  source: choice('magnet', ['magnet', 'none']),
  /** The magnet's pole nearest the coil. */
  facing: choice('N', ['N', 'S']),
  distance: choice('outside', ['outside', 'mouth', 'inside']),
  motion: choice('toward', ['toward', 'away', 'none']),
  motionLabel: label({ mode: 'text', text: 'v' }),
  north: label({ mode: 'text', text: 'N' }),
  south: label({ mode: 'text', text: 'S' }),
  mirror: bool(false),
  color: bool(false),
})

export type CoilSettings = typeof coilSettings.defaults
