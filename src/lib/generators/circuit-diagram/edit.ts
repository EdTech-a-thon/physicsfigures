// The outline editor's changes to a circuit. An item is found by its path:
// its index in the loop, then in each group down to it. Every change is made
// on a copy by `edit`, which first notes which parts the teacher renamed, then
// tidies the tree and renumbers the rest.

import { depthOf, MAX_DEPTH, MAX_PARTS, newGroup, newPart, partsOf, renumber, settle, tidy, type Circuit, type Item, type Part, type PartKind } from './tree'

export type Path = number[]

export interface Place {
  /** The run the item is in: the loop, a series group's items or a parallel group's branches. */
  list: Item[]
  index: number
  within: 'loop' | 'series' | 'parallel'
  /** How many groups the item is inside. */
  level: number
}

export function place(circuit: Circuit, path: Path): Place {
  let list = circuit.items
  let within: Place['within'] = 'loop'
  for (const i of path.slice(0, -1)) {
    const group = list[i]
    if (!group || group.type === 'part') throw new Error(`no group at ${path}`)
    list = group.items
    within = group.type
  }
  const index = path.at(-1)!
  if (!list[index]) throw new Error(`no item at ${path}`)
  return { list, index, within, level: path.length - 1 }
}

export const itemAt = (circuit: Circuit, path: Path): Item => {
  const p = place(circuit, path)
  return p.list[p.index]
}

/** Make a change on a copy of the circuit, then tidy and renumber it. */
export function edit(circuit: Circuit, change: (c: Circuit) => void): Circuit {
  const next = structuredClone(circuit)
  settle(next)
  change(next)
  return renumber(tidy(next))
}

const partCount = (circuit: Circuit) => [...partsOf(circuit.items)].length

/** Why a part can't be added next to this item, or null when it can. */
export function cantAdd(circuit: Circuit, path: Path, how: 'series' | 'parallel'): string | null {
  if (partCount(circuit) >= MAX_PARTS) return `A circuit can have up to ${MAX_PARTS} parts.`
  const p = place(circuit, path)
  const item = p.list[p.index]
  // Joining the run it's in, or a group of that kind, needs no new group;
  // otherwise the item is wrapped in one, one level deeper.
  const joins = item.type === how || (how === 'parallel' ? p.within === 'parallel' : p.within !== 'parallel')
  if (!joins && p.level + 1 + depthOf(item) > MAX_DEPTH) return `Groups can only go ${MAX_DEPTH} deep.`
  return null
}

/**
 * A new part next to the item at `path`, in series (after it) or in parallel
 * (a new branch beside it), and the new part's path once the circuit is tidied.
 */
export function addPart(circuit: Circuit, path: Path, how: 'series' | 'parallel', kind: PartKind = 'resistor'): { circuit: Circuit; path: Path } {
  const part = newPart(kind)
  const next = edit(circuit, (c) => {
    const { list, index, within } = place(c, path)
    const item = list[index]
    if (how === 'series' ? within !== 'parallel' : within === 'parallel') {
      // The run is already the right kind: the part goes in after the item.
      // In a series run it takes over the gap after the item, and its point.
      if (how === 'series') {
        part.point = item.point
        item.point = null
      }
      list.splice(index + 1, 0, part)
    } else if (how === 'series') {
      // A branch becomes a series run of it and the new part; the run is the branch now, so it takes the arrow.
      const run = newGroup('series', [{ ...item, current: null }, part])
      run.current = item.current
      list[index] = run
    } else {
      // A part in a series run gets a parallel group round it, which takes over the gap after it.
      const group = newGroup('parallel', [{ ...item, point: null }, part])
      group.point = item.point
      list[index] = group
    }
  })
  return { circuit: next, path: pathOf(next, part) }
}

/** Where an item ended up, by its identity after tidying (tidying copies items but keeps parts' labels). */
function pathOf(circuit: Circuit, target: Part): Path {
  const find = (items: Item[], at: Path): Path | null => {
    for (const [i, item] of items.entries()) {
      if (item.type === 'part' ? item.name === target.name : false) return [...at, i]
      if (item.type !== 'part') {
        const found = find(item.items, [...at, i])
        if (found) return found
      }
    }
    return null
  }
  return find(circuit.items, []) ?? []
}

/** Why this item can't be removed, or null when it can. */
export function cantRemove(circuit: Circuit, path: Path): string | null {
  return path.length === 1 && circuit.items.length === 1 ? 'The circuit needs at least one part.' : null
}

export function removeItem(circuit: Circuit, path: Path): Circuit {
  return edit(circuit, (c) => {
    const { list, index, within } = place(c, path)
    const [gone] = list.splice(index, 1)
    // In a series run the two gaps either side join; a point in either stays.
    if (within !== 'parallel' && gone.point) {
      const before = list[index - 1] ?? (within === 'loop' ? list.at(-1) : undefined)
      if (before && !before.point) before.point = gone.point
    }
  })
}

/** Whether an item can move up (−1) or down (+1) in its run. */
export function canMove(circuit: Circuit, path: Path, by: -1 | 1): boolean {
  const { list, index } = place(circuit, path)
  return index + by >= 0 && index + by < list.length
}

/** Swap an item with the one before or after it. Points stay in their gaps; a branch keeps its arrow. */
export function moveItem(circuit: Circuit, path: Path, by: -1 | 1): { circuit: Circuit; path: Path } {
  const next = edit(circuit, (c) => {
    const { list, index } = place(c, path)
    const other = index + by
    const a = list[index]
    const b = list[other]
    ;[a.point, b.point] = [b.point, a.point]
    list[index] = b
    list[other] = a
  })
  return { circuit: next, path: [...path.slice(0, -1), path.at(-1)! + by] }
}

function* itemsOf(items: Item[]): Generator<Item> {
  for (const item of items) {
    yield item
    if (item.type !== 'part') yield* itemsOf(item.items)
  }
}

/** The first letter no point uses yet, for a new point. */
export function nextLetter(circuit: Circuit): string {
  const used = new Set([...itemsOf(circuit.items)].map((i) => i.point?.text))
  return [...'ABCDEFGHJKLMNPQRSTUVWXYZ'].find((l) => !used.has(l)) ?? 'P'
}

/** A label for a new branch's current arrow: I₁, I₂… after those already used. */
export function nextCurrentLabel(circuit: Circuit): string {
  const used = new Set([...itemsOf(circuit.items)].map((i) => i.current?.label.text))
  for (let n = 1; ; n++) if (!used.has(`I_${n}`)) return `I_${n}`
}

/** Change a part's kind, starting its value and kind options afresh. */
export function setKind(circuit: Circuit, path: Path, kind: PartKind): Circuit {
  return edit(circuit, (c) => {
    const { list, index } = place(c, path)
    const old = list[index] as Part
    if (old.kind === kind) return
    const fresh = newPart(kind)
    list[index] = {
      ...fresh,
      name: old.auto ? fresh.name : old.name,
      auto: old.auto,
      value: { ...fresh.value, mode: old.value.mode },
      voltmeter: old.voltmeter,
      current: old.current,
      point: old.point,
    }
  })
}
