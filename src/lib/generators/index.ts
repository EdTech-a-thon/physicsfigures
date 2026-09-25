// Every generator on the site. The directory and its search, page titles
// and the sitemap all read this list, so adding a generator means adding its
// folder and one entry here.

import type { Component } from 'svelte'
import CoilMagnetPreview from './coil-and-magnet/Preview.svelte'
import InclinedPlanePreview from './inclined-plane/Preview.svelte'
import PulleyPreview from './pulley/Preview.svelte'
import CircuitDiagramPreview from './circuit-diagram/Preview.svelte'

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
    id: 'coil-and-magnet',
    name: 'Coil and Magnet Generator',
    path: '/coil-and-magnet',
    blurb: 'A coil of wire with a bar magnet moving toward or away from it.',
    description:
      'Make a printable electromagnetic induction figure for your class: a coil with any number of turns and a bar magnet moving toward or away from it, with its poles labeled, then copy it into a worksheet or test.',
    keywords: [
      'induction', 'electromagnetic induction', 'faraday', "faraday's law", 'lenz', "lenz's law", 'solenoid', 'coil',
      'loop', 'wire', 'magnet', 'bar magnet', 'north', 'south', 'pole', 'magnetic', 'magnetism', 'emf', 'flux',
      'electromagnet', 'galvanometer', 'current', 'printable',
    ],
    Preview: CoilMagnetPreview,
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
      'rough', 'smooth', 'free body diagram', 'forces', 'normal force', 'gravity', 'newton', "newton's laws", 'sliding',
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
      'ramp', 'block and tackle', 'mechanical advantage', 'strands', 'free body diagram', 'forces', 'newton',
      "newton's laws", 'mechanics', 'printable',
    ],
    Preview: PulleyPreview,
  },
  {
    id: 'circuit-diagram',
    name: 'Circuit Diagram Generator',
    path: '/circuit-diagram',
    blurb: 'A circuit schematic with parts in series and parallel.',
    description:
      'Make a printable circuit diagram for your class: batteries, resistors, bulbs, switches and meters in series and parallel, with their names and values labeled or left blank, then copy it into a worksheet or test.',
    keywords: [
      'circuit', 'circuits', 'schematic', 'electric', 'electricity', 'series', 'parallel', 'resistor', 'resistance',
      'ohm', "ohm's law", 'kirchhoff', "kirchhoff's laws", 'battery', 'cell', 'emf', 'bulb', 'lamp', 'switch', 'ammeter',
      'voltmeter', 'current', 'voltage', 'potential difference', 'equivalent resistance', 'printable',
    ],
    Preview: CircuitDiagramPreview,
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
