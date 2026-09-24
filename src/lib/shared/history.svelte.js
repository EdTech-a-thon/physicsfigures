// Undo/redo for a generator's settings. A change is recorded once the
// settings have been still for a moment, so typing a title is one step rather
// than one per letter. Call during component setup.
//
// The history is kept in this browser's localStorage, so a refresh doesn't
// lose it. The page address still decides the figure on load: when it shows
// the figure the history was last on, the whole history comes back; when it
// shows another one (a shared link, say), that figure becomes a new step after
// the stored ones, so undo still reaches them.
//
//   read():      a plain snapshot of the current settings
//   write(snap): put a snapshot back as the live settings
//   keyOf(snap): a string that is equal when two snapshots draw the same figure
//   tidy(snap):  turns a stored snapshot into valid current settings
//   storageKey:  where in localStorage to keep the history

import { onMount } from 'svelte'

const LIMIT = 100

export function createHistory({ read, write, keyOf, tidy, storageKey, delay = 500 }) {
  let past = $state.raw([])
  let future = $state.raw([])
  let current = read()
  let currentKey = $state(keyOf(current))
  const liveKey = $derived(keyOf(read()))
  let timer
  let loaded = false

  onMount(() => {
    const stored = load()
    loaded = true
    if (!stored) return
    if (keyOf(stored.current) === currentKey) {
      past = stored.past
      future = stored.future
    } else {
      past = [...stored.past, stored.current].slice(-LIMIT)
      future = []
    }
  })

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (!data || !data.current || !Array.isArray(data.past) || !Array.isArray(data.future)) return null
      const list = (snaps) => snaps.filter((s) => s && typeof s === 'object').slice(-LIMIT).map(tidy)
      return { past: list(data.past), current: tidy(data.current), future: list(data.future) }
    } catch {
      return null
    }
  }

  // Save after every recorded step, undo or redo (not on every keystroke).
  $effect(() => {
    const data = { past, current, future }
    currentKey
    if (!loaded) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch {
      /* storage blocked or full: the history lasts until the page closes */
    }
  })

  function record() {
    clearTimeout(timer)
    if (liveKey === currentKey) return
    past = [...past, current].slice(-LIMIT)
    future = []
    current = read()
    currentKey = liveKey
  }

  $effect(() => {
    liveKey
    clearTimeout(timer)
    timer = setTimeout(record, delay)
    return () => clearTimeout(timer)
  })

  function go(to) {
    current = to
    currentKey = keyOf(to)
    write(structuredClone(to))
  }

  function undo() {
    record()
    if (!past.length) return
    future = [...future, current]
    go(past.at(-1))
    past = past.slice(0, -1)
  }
  function redo() {
    record()
    if (!future.length) return
    past = [...past, current].slice(-LIMIT)
    go(future.at(-1))
    future = future.slice(0, -1)
  }
  /** Cmd/Ctrl+Z and Shift+Cmd+Z / Ctrl+Y, outside text boxes (they keep their own undo). */
  function onkeydown(event) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return
    if (event.target.matches?.('input[type=text], input[type=number], input[type=search], textarea')) return
    const key = event.key.toLowerCase()
    if (key === 'z' && !event.shiftKey) undo()
    else if ((key === 'z' && event.shiftKey) || key === 'y') redo()
    else return
    event.preventDefault()
  }

  return {
    get canUndo() {
      return past.length > 0 || liveKey !== currentKey
    },
    get canRedo() {
      return future.length > 0
    },
    undo,
    redo,
    onkeydown,
  }
}
