// Every generator on the site. The directory and its search, page titles
// and the sitemap all read this list, so adding a generator means adding its
// folder and one entry here.
//
// The Coil and Magnet (coil-and-magnet/) and Circuit Diagram (circuit-diagram/)
// generators are switched off for now: they have no entry here and no page.
// Restore both to bring one back.

import type { Component } from 'svelte'
import FreeBodyPreview from './free-body-diagram/Preview.svelte'
import InclinedPlanePreview from './inclined-plane/Preview.svelte'
import PulleyPreview from './pulley/Preview.svelte'

export interface Generator {
  id: string
  /** page title, e.g. "Free Body Diagram Generator" */
  name: string
  /** its address on the site */
  path: string
  /** one line for the directory card */
  blurb: string
  /** the page's search engine description */
  description: string
  /** words teachers might search for instead of the name */
  keywords: string[]
  /** component drawing a sample figure */
  Preview: Component
}

export const GENERATORS: Generator[] = [
  {
    id: 'free-body-diagram',
    name: 'Free Body Diagram Generator',
    path: '/free-body-diagram',
    blurb: 'A dot or block with every force on it, and nothing else.',
    description:
      'Make a printable free body diagram for your class: a dot or block with up to eight forces at any angle, with equal forces drawn equal, angles and components marked, and every label written or left blank, then copy it into a worksheet or test.',
    keywords: [
      'free body diagram', 'fbd', 'force diagram', 'forces', 'force', 'gravity', 'weight', 'normal force', 'friction',
      'tension', 'applied force', 'spring', 'air resistance', 'drag', 'net force', 'equilibrium', 'balanced',
      'unbalanced', 'components', 'newton', "newton's laws", 'dot', 'particle', 'mechanics', 'printable',
    ],
    Preview: FreeBodyPreview,
  },
  {
    id: 'inclined-plane',
    name: 'Inclined Plane Generator',
    path: '/inclined-plane',
    blurb: 'A block, ball or cart on a ramp, with its angle and forces.',
    description:
      'Make a printable inclined plane figure for your class: a block, ball or cart on a ramp at any angle, with the angle, length and height labeled or left blank, then copy it into a worksheet or test.',
    keywords: [
      'incline', 'inclined plane', 'ramp', 'slope', 'wedge', 'block', 'ball', 'cart', 'angle', 'theta', 'friction',
      'rough', 'smooth', 'free body diagram', 'fbd', 'forces', 'normal force', 'gravity', 'newton', "newton's laws", 'sliding',
      'rolling', 'mechanics', 'printable',
    ],
    Preview: InclinedPlanePreview,
  },
  {
    id: 'pulley',
    name: 'Pulley Generator',
    path: '/pulley',
    blurb: 'Objects on strings over pulleys, from an Atwood machine up.',
    description:
      'Make a printable pulley figure for your class: an Atwood machine, a block on a table or ramp tied over a pulley to a hanging mass, or a block and tackle, with the masses labeled or left blank, then copy it into a worksheet or test.',
    keywords: [
      'pulley', 'pulleys', 'atwood', 'atwood machine', 'string', 'rope', 'tension', 'hanging mass', 'block', 'table',
      'ramp', 'block and tackle', 'mechanical advantage', 'strands', 'free body diagram', 'fbd', 'forces', 'newton',
      "newton's laws", 'mechanics', 'printable',
    ],
    Preview: PulleyPreview,
  },
]

export const findGenerator = (path: string) => GENERATORS.find((g) => g.path === path)

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

/** Generators matching a search. Every word typed must start some word in the
 *  generator's name, blurb or keywords, so "free bo" finds the Free Body Diagram. */
export function searchGenerators(query: string): Generator[] {
  const wanted = words(query)
  if (!wanted.length) return GENERATORS
  return GENERATORS.filter((g) => {
    const have = words([g.name, g.blurb, ...g.keywords].join(' '))
    return wanted.every((w) => have.some((h) => h.startsWith(w)))
  })
}
