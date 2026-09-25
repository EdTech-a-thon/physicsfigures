<script lang="ts">
  // The gap after an item in a series run, where a lettered point (A, B…) can
  // go: a small "+ Point" button, or the point's label and a button to take it off.
  import { MapPin, X } from '@lucide/svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import { nextLetter } from './edit'
  import type { Circuit, Item } from './tree'

  interface Props {
    circuit: Circuit
    /** The item the gap comes after (it holds the point). */
    item: Item
    /** Describes where the gap is, for screen readers: "after R₁". */
    where: string
  }
  let { circuit, item, where }: Props = $props()
</script>

<li class="gap">
  {#if item.point}
    <div class="point">
      <div class="head">
        <span class="title"><MapPin size={14} aria-hidden="true" /> Point {where}</span>
        <button type="button" class="off" aria-label="Remove the point {where}" title="Remove the point" onclick={() => (item.point = null)}>
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <LabelField name="Point label" bind:label={() => item.point!, (v) => (item.point = v)} />
    </div>
  {:else}
    <button type="button" class="add" aria-label="Add a point {where}" onclick={() => (item.point = { mode: 'text', text: nextLetter(circuit) })}>
      + Point
    </button>
  {/if}
</li>

<style>
  .gap { list-style: none; display: flex; flex-direction: column; }
  .add {
    align-self: flex-start; margin-left: 0.7rem; padding: 0.05rem 0.45rem; border: 1px dashed transparent; border-radius: 6px;
    background: none; color: var(--muted); font-size: 0.75rem; font-weight: 700; opacity: 0.75;
  }
  .add:hover, .add:focus-visible { opacity: 1; border-color: var(--blue-border); color: var(--blue-dark); background: var(--blue-soft); }
  .point { border: 1px dashed var(--blue-border); border-radius: 10px; padding: 0.45rem 0.6rem 0.6rem; background: #fff; display: flex; flex-direction: column; gap: 0.4rem; }
  .head { display: flex; align-items: center; justify-content: space-between; }
  .title { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 700; font-size: 0.82rem; }
  .off { display: grid; place-items: center; padding: 0.2rem; border: none; border-radius: 6px; background: none; color: var(--muted); }
  .off:hover { background: var(--red-soft); color: var(--red); }
</style>
