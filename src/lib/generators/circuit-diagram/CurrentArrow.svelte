<script lang="ts">
  // A branch's current arrow (or the main loop's): on or off, which way it
  // points, and its label. Forward is the way the outline reads, which is
  // clockwise round the figure (anticlockwise when it's mirrored).
  import Choice from '$lib/shared/Choice.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Arrow } from './tree'

  interface Props {
    /** What holds the arrow: a branch, or the loop. */
    holder: { current: Arrow | null }
    what: string
    /** The label a new arrow starts with. */
    newLabel: () => string
  }
  let { holder, what, newLabel }: Props = $props()
</script>

<label class="check">
  <input
    type="checkbox"
    checked={!!holder.current}
    onchange={(e) => (holder.current = e.currentTarget.checked ? { dir: 'forward', label: { mode: 'text', text: newLabel() } } : null)}
  />
  Current arrow on {what}
</label>
{#if holder.current}
  <div class="field">
    Direction
    <Choice
      name="Current direction"
      options={[['forward', 'Forward'], ['backward', 'Backward']]}
      bind:value={() => holder.current!.dir, (v) => (holder.current!.dir = v)}
    />
    <span class="note">Forward runs the way the outline reads: clockwise in the figure.</span>
  </div>
  <div class="field">Current label <LabelField name="Current label" bind:label={() => holder.current!.label, (v) => (holder.current!.label = v)} /></div>
{/if}

<style>
  .note { font-weight: 400; margin: 0; }
</style>
