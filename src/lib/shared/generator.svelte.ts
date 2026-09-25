// A generator's live settings, set up the same way on every generator page:
// read from the page address on load (the server renders that same figure),
// written back to it as they change, with undo history and saved presets.
// Call during component setup.

import { afterNavigate, replaceState } from '$app/navigation'
import { page } from '$app/state'
import { createHistory } from './history.svelte'
import { createPresetStore } from './presetStore'
import type { SettingsDef } from './settings'

export function createGenerator<T extends object>(def: SettingsDef<T>, id: string) {
  let settings = $state(def.fromParams(page.url.searchParams))
  const clean = $derived(def.clean(settings))
  const query = $derived(def.toQuery(clean))

  // The router can't replace the address until the page has hydrated, which
  // matters when a link arrives written differently from how we'd write it.
  let routerReady = $state(false)
  afterNavigate(() => (routerReady = true))
  $effect(() => {
    const url = query ? `${page.url.pathname}?${query}` : page.url.pathname
    if (routerReady && url !== `${location.pathname}${location.search}`) replaceState(url, page.state)
  })

  const history = createHistory({
    read: () => $state.snapshot(clean) as T,
    write: (snap) => (settings = snap),
    keyOf: def.toQuery,
    tidy: def.clean,
    storageKey: `physicsfigures.${id}.history`,
  })

  return {
    /** The live settings, for binding form fields. */
    get settings() {
      return settings
    },
    set settings(value: T) {
      settings = value
    },
    /** The settings tidied, for drawing. */
    get clean() {
      return clean
    },
    history,
    presets: createPresetStore(`physicsfigures.${id}.presets`, def.clean),
    same: def.same,
  }
}

export type GeneratorState<T extends object> = ReturnType<typeof createGenerator<T>>
