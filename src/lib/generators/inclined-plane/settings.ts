// Every choice the teacher makes on the Inclined Plane Generator, with its
// default: the most common textbook version, a block on a 30° ramp.

import { bool, choice, defineSettings, int, label, number } from '$lib/shared/settings'

export const inclineSettings = defineSettings({
  object: choice('block', ['block', 'ball', 'cart']),
  objectLabel: label({ mode: 'text', text: 'm' }),
  objectSize: number(1, 0.5, 2),
  /** How far up the ramp the object sits, from its foot (0) to its top (1). */
  position: number(0.55, 0.2, 0.85),
  angle: int(30, 5, 60),
  angleLabel: label({ mode: 'text', text: 'theta' }),
  lengthMark: bool(false),
  lengthLabel: label({ mode: 'text', text: 'L' }),
  heightMark: bool(false),
  heightLabel: label({ mode: 'text', text: 'h' }),
  surface: choice('smooth', ['smooth', 'rough']),
  mirror: bool(false),
  color: bool(false),
})

export type InclineSettings = typeof inclineSettings.defaults
