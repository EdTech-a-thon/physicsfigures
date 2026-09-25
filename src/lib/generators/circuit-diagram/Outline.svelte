<script lang="ts">
  // The circuit as an indented outline: the loop's items in order, groups as
  // indented blocks, each part a row that opens to show its settings. One row
  // is open at a time, and a new part opens itself.
  import { Repeat } from '@lucide/svelte'
  import type { Path } from './edit'
  import OutlineItem from './OutlineItem.svelte'
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
  {/each}
</ol>
<p class="back"><Repeat size={14} aria-hidden="true" /> and back round to the start</p>

<style>
  .outline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
  .back { display: flex; align-items: center; gap: 0.35rem; margin: 0.5rem 0 0; font-size: 0.82rem; color: var(--muted); }
</style>
