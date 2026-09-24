// Every generator on the site. The directory and its search, page titles
// and the sitemap all read this list, so adding a generator means adding its
// folder and one entry here.

import type { Component } from 'svelte'
import CoilMagnetPreview from './coil-and-magnet/Preview.svelte'

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
