<script lang="ts">
  // The circuit as an indented outline: the loop's items in order, groups as
  // indented blocks, each part a row that opens to show its settings. One row
  // is open at a time, and a new part opens itself.
  import { Repeat } from '@lucide/svelte'
  import CurrentArrow from './CurrentArrow.svelte'
  import type { Path } from './edit'
  import Gap from './Gap.svelte'
  import OutlineItem, { itemName } from './OutlineItem.svelte'
  import type { Circuit } from './tree'

  interface Props {
    /** The live circuit, for binding its labels and options. */
    circuit: Circuit
    /** Put in a changed circuit, opening the row at `open`. */
    onedit: (next: Circuit, open?: Path) => void
  }
  let { circuit, onedit }: Props = $props()

  let openKey: string | null = $state(null)
  function change(next: Circuit, open?: Path) {
    onedit(next, open)
    if (open) openKey = open.join('.')
  }
</script>

<ol class="outline" aria-label="The circuit, in order round the loop">
  {#each circuit.items as item, i (i)}
    <OutlineItem {circuit} {item} path={[i]} within="loop" onedit={change} bind:openKey />
    <Gap {circuit} {item} where={i < circuit.items.length - 1 ? `between ${itemName(item)} and ${itemName(circuit.items[i + 1])}` : `after ${itemName(item)}, back to the start`} />
  {/each}
</ol>
<p class="back"><Repeat size={14} aria-hidden="true" /> and back round to the start</p>
<div class="loop-current">
  <CurrentArrow holder={circuit} what="the main loop" newLabel={() => 'I'} />
</div>

<style>
  .outline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
  .back { display: flex; align-items: center; gap: 0.35rem; margin: 0.5rem 0 0; font-size: 0.82rem; color: var(--muted); }
  .loop-current { margin-top: 0.9rem; padding-top: 0.8rem; border-top: 1px solid var(--border); }
</style>
