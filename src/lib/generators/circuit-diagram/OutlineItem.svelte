<script lang="ts" module>
  import { labelRuns, type Label } from '$lib/shared/label'
  import type { PartKind } from './tree'

  export const KIND_NAMES: Record<PartKind, string> = { battery: 'Battery', resistor: 'Resistor', bulb: 'Bulb', switch: 'Switch', ammeter: 'Ammeter' }

  const SUB: Record<string, string> = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋' }
  const SUP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' }

  /** What to call an item when saying where something is: "R₁", "the parallel group". */
  export const itemName = (item: import('./tree').Item) =>
    item.type === 'part' ? plainLabel(item.name) || KIND_NAMES[item.kind].toLowerCase() : item.type === 'parallel' ? 'the parallel group' : 'the series run'

  /** A label as plain text for a summary: "R_1" reads R₁, "4 Omega" reads 4 Ω. */
  export function plainLabel(label: Label): string {
    if (label.mode === 'none') return ''
    if (label.mode === 'blank') return '___'
    return labelRuns(label.text)
      .map((r) => {
        const table = r.shift === 'sub' ? SUB : r.shift === 'super' ? SUP : null
        if (!table) return r.text
        const chars = [...r.text]
        return chars.every((c) => table[c]) ? chars.map((c) => table[c]).join('') : `${r.shift === 'sub' ? '_' : '^'}${r.text}`
      })
      .join('')
  }
</script>

<script lang="ts">
  // One item in the circuit's outline: a part's row, or a group's block with
  // its items indented inside. Rows open to show their settings and the
  // buttons for adding parts next to them, moving them and removing them.
  import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import CurrentArrow from './CurrentArrow.svelte'
  import { addPart, canMove, cantAdd, cantRemove, edit, itemAt, moveItem, nextCurrentLabel, removeItem, setKind, type Path } from './edit'
  import Gap from './Gap.svelte'
  import Self from './OutlineItem.svelte'
  import { DEFAULT_VOLTMETER, PART_KINDS, type Circuit, type Item } from './tree'

  interface Props {
    circuit: Circuit
    item: Item
    path: Path
    within: 'loop' | 'series' | 'parallel'
    onedit: (next: Circuit, open?: Path) => void
    openKey: string | null
  }
  let { circuit, item, path, within, onedit, openKey = $bindable() }: Props = $props()

  const key = $derived(path.join('.'))
  const snap = () => $state.snapshot(circuit) as Circuit
  const seriesBlocked = $derived(cantAdd(circuit, path, 'series'))
  const parallelBlocked = $derived(cantAdd(circuit, path, 'parallel'))
  const removeBlocked = $derived(cantRemove(circuit, path))

  function toggle(event: Event) {
    const open = (event.currentTarget as HTMLDetailsElement).open
    if (open) openKey = key
    else if (openKey === key) openKey = null
  }
  const add = (how: 'series' | 'parallel') => {
    const done = addPart(snap(), path, how)
    onedit(done.circuit, done.path)
  }
  const move = (by: -1 | 1) => {
    const done = moveItem(snap(), path, by)
    onedit(done.circuit, done.path)
  }
  const setVoltmeter = (on: boolean) =>
    onedit(
      edit(snap(), (c) => (itemAt(c, path).voltmeter = on ? { ...DEFAULT_VOLTMETER } : null)),
      path,
    )

  const groupSummary = $derived(
    item.type === 'part' ? '' : item.type === 'parallel' ? `In parallel · ${item.items.length} branches` : `In series · ${item.items.length} parts`,
  )
  const partSummary = $derived(item.type === 'part' ? [plainLabel(item.name), plainLabel(item.value)].filter(Boolean).join(' · ') : '')</script>

{#snippet extras()}
  {#if within === 'parallel'}
    <CurrentArrow holder={item} what="this branch" newLabel={() => nextCurrentLabel(circuit)} />
  {/if}
  {@render voltmeter()}
{/snippet}

{#snippet voltmeter()}
  <label class="check">
    <input type="checkbox" checked={!!item.voltmeter} onchange={(e) => setVoltmeter(e.currentTarget.checked)} />
    Voltmeter across {item.type === 'part' ? 'it' : 'the group'}
  </label>
  {#if item.voltmeter}
    <div class="field">
      Voltmeter label
      <LabelField name="Voltmeter label" bind:label={() => item.voltmeter!, (v) => (item.voltmeter = v)} />
    </div>
  {/if}
{/snippet}

{#snippet actions()}
  <div class="actions">
    <button type="button" class="act" disabled={!!seriesBlocked} title={seriesBlocked ?? 'Add a part after this, in series'} onclick={() => add('series')}>
      <Plus size={14} aria-hidden="true" /> In series
    </button>
    <button type="button" class="act" disabled={!!parallelBlocked} title={parallelBlocked ?? 'Add a part beside this, in parallel'} onclick={() => add('parallel')}>
      <Plus size={14} aria-hidden="true" /> In parallel
    </button>
    <button type="button" class="act icon" disabled={!canMove(circuit, path, -1)} aria-label="Move up" title="Move up" onclick={() => move(-1)}>
      <ArrowUp size={15} aria-hidden="true" />
    </button>
    <button type="button" class="act icon" disabled={!canMove(circuit, path, 1)} aria-label="Move down" title="Move down" onclick={() => move(1)}>
      <ArrowDown size={15} aria-hidden="true" />
    </button>
    <button type="button" class="act icon danger" disabled={!!removeBlocked} aria-label="Remove" title={removeBlocked ?? 'Remove'} onclick={() => onedit(removeItem(snap(), path))}>
      <Trash2 size={15} aria-hidden="true" />
    </button>
  </div>
  {#if seriesBlocked && seriesBlocked === parallelBlocked}<p class="note">{seriesBlocked}</p>{/if}
{/snippet}

<li class="item">
  {#if item.type === 'part'}
    {@const part = item}
    <details class="row" open={openKey === key} ontoggle={toggle}>
      <summary>
        <span class="kind">{KIND_NAMES[part.kind]}</span>
        <span class="labels">{partSummary}</span>
      </summary>
      <div class="body">
        <label class="field">
          Kind
          <select value={part.kind} onchange={(e) => onedit(setKind(snap(), path, e.currentTarget.value as typeof part.kind), path)}>
            {#each PART_KINDS as kind}<option value={kind}>{KIND_NAMES[kind]}</option>{/each}
          </select>
        </label>
        {#if part.kind === 'switch'}
          <div class="field">
            Switch
            <Choice name="Switch" options={[['closed', 'Closed'], ['open', 'Open']]} bind:value={() => (part.open ? 'open' : 'closed'), (v) => (part.open = v === 'open')} />
          </div>
        {:else if part.kind === 'battery'}
          <div class="field">
            Symbol
            <Choice name="Battery symbol" options={[['1', 'One cell'], ['2', 'Two cells']]} bind:value={() => String(part.cells) as '1' | '2', (v) => (part.cells = v === '2' ? 2 : 1)} />
          </div>
          <label class="check"><input type="checkbox" bind:checked={part.flip} /> Turned round (+ facing back)</label>
        {/if}
        <div class="field">Name <LabelField name="Name" bind:label={part.name} /></div>
        <div class="field">Value <LabelField name="Value" placeholder={part.kind === 'resistor' ? '4 ohm' : ''} bind:label={part.value} /></div>
        {@render extras()}
        {@render actions()}
      </div>
    </details>
  {:else}
    {@const group = item}
    <div class="group {group.type}">
      <details class="row head" open={openKey === key} ontoggle={toggle}>
        <summary><span class="kind">{groupSummary}</span></summary>
        <div class="body">
          {@render extras()}
          {@render actions()}
        </div>
      </details>
      <ol class="children">
        {#each group.items as child, i (i)}
          <Self {circuit} item={child} path={[...path, i]} within={group.type} {onedit} bind:openKey />
          {#if group.type === 'series' && i < group.items.length - 1}
            <Gap {circuit} item={child} where="between {itemName(child)} and {itemName(group.items[i + 1])}" />
          {/if}
        {/each}
      </ol>
    </div>
  {/if}
</li>

<style>
  .item { list-style: none; }
  .row { border: 1px solid var(--border); border-radius: 10px; background: #fff; }
  .row[open] { border-color: var(--blue-border); }
  summary { display: flex; align-items: baseline; gap: 0.6rem; padding: 0.5rem 0.7rem; cursor: pointer; list-style: none; border-radius: 10px; }
  summary::-webkit-details-marker { display: none; }
  summary:hover { background: var(--blue-soft); }
  summary:focus-visible { outline: 2px solid var(--blue); outline-offset: -2px; }
  .kind { font-weight: 700; font-size: 0.9rem; }
  .labels { color: var(--muted); font-size: 0.88rem; font-family: 'Times New Roman', Times, serif; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .body { padding: 0.3rem 0.7rem 0.75rem; }
  .group { border-left: 3px solid var(--blue-border); padding-left: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem; }
  .group.series { border-left-style: dashed; }
  .head { background: var(--bg); }
  .head .kind { color: var(--blue-dark); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .children { margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.4rem; }
  .act {
    display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.6rem; border-radius: 8px;
    border: 1px solid var(--blue-border); background: #fff; color: var(--blue-dark); font-weight: 700; font-size: 0.82rem;
  }
  .act.icon { padding: 0.35rem 0.45rem; }
  .act:hover:not(:disabled) { background: var(--blue-soft); }
  .act.danger { color: var(--red); border-color: var(--red-soft); }
  .act.danger:hover:not(:disabled) { background: var(--red-soft); }
  .act:disabled { color: #b5bac4; border-color: var(--border); cursor: default; }
  .note { margin: 0.4rem 0 0; }
</style>
