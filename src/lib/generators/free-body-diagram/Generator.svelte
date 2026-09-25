<script lang="ts">
  // The Free Body Diagram Generator: the body and its forces on the left, the
  // figure on the right. Settings live in the page address.
  import { Box, MoveUpRight, Plus, Trash2 } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import GeneratorLayout from '$lib/shared/GeneratorLayout.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import FreeBody from './FreeBody.svelte'
  import { fbdSettings, MAX_FORCES, STARTERS, starterForce } from './settings'

  const gen = createGenerator(fbdSettings, 'free-body-diagram')
  const s = $derived(gen.clean)

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const bodySummary = $derived(s.body === 'dot' ? 'dot' : `${s.body} · ${Math.round(s.bodySize * 100)}% size`)
  const forcesSummary = $derived(s.forces.map((f) => shown(f.label)).join(', ') || 'none')

  /** The quick picks for a force's direction. */
  const DIRECTIONS = [
    [90, 'Up'],
    [270, 'Down'],
    [180, 'Left'],
    [0, 'Right'],
  ] as const
  const full = $derived(s.forces.length >= MAX_FORCES)
  const add = (starter: (typeof STARTERS)[number]) => {
    if (!full) gen.settings.forces.push(starterForce(starter))
  }
  const remove = (i: number) => gen.settings.forces.splice(i, 1)
</script>

<GeneratorLayout title="Free Body Diagram Generator" {gen} filename="free-body-diagram">
  {#snippet controls()}
    <Section title="Body" icon={Box} summary={bodySummary}>
      <div class="field">
        <Choice name="Body" options={[['dot', 'Dot'], ['block', 'Block'], ['ball', 'Ball'], ['cart', 'Cart']]} bind:value={gen.settings.body} />
      </div>
      {#if s.body !== 'dot'}
        <label class="field">
          Size
          <span class="slider">
            <input type="range" min="0.5" max="2" step="0.05" bind:value={gen.settings.bodySize} />
            <output>{Math.round(s.bodySize * 100)}%</output>
          </span>
        </label>
      {/if}
    </Section>

    <Section title="Forces" icon={MoveUpRight} summary={forcesSummary}>
      {#each gen.settings.forces as force, i (force)}
        <div class="force">
          <div class="force-head">
            <span>Force {i + 1}</span>
            <button type="button" class="icon-btn" aria-label="Remove force {i + 1}" data-tip="Remove" onclick={() => remove(i)}>
              <Trash2 size={17} />
            </button>
          </div>
          <div class="field">
            Direction
            <span class="slider">
              <input type="range" min="0" max="359" bind:value={force.angle} aria-label="Force {i + 1} direction" />
              <span class="degrees">
                <input type="number" min="0" max="359" bind:value={force.angle} aria-label="Force {i + 1} angle in degrees" />°
              </span>
            </span>
            <div class="segmented" role="group" aria-label="Force {i + 1} quick directions">
              {#each DIRECTIONS as [angle, name]}
                <button type="button" class:on={s.forces[i]?.angle === angle} aria-pressed={s.forces[i]?.angle === angle} onclick={() => (force.angle = angle)}>
                  {name}
                </button>
              {/each}
            </div>
          </div>
          <label class="field">
            Length
            <span class="slider">
              <input type="range" min="0.25" max="2" step="0.05" bind:value={force.length} />
              <output>{s.forces[i]?.length.toFixed(2)}×</output>
            </span>
          </label>
          <div class="field">Label <LabelField name="Force {i + 1} label" bind:label={force.label} /></div>
        </div>
      {/each}

      <div class="field add">
        {full ? `A figure holds up to ${MAX_FORCES} forces.` : 'Add a force'}
        <div class="starters">
          {#each STARTERS as starter}
            <button type="button" class="btn-ghost" disabled={full} onclick={() => add(starter)}><Plus size={15} aria-hidden="true" /> {starter.name}</button>
          {/each}
        </div>
      </div>
    </Section>
  {/snippet}

  {#snippet figure(id)}
    <FreeBody settings={s} {id} />
  {/snippet}
</GeneratorLayout>

<style>
  .force { border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
  .force-head { display: flex; align-items: center; justify-content: space-between; font-weight: 800; margin-bottom: 0.25rem; }
  .degrees { display: inline-flex; align-items: center; gap: 0.2rem; color: var(--muted); }
  .degrees input { width: 4.2rem; }
  .starters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .starters button { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.65rem; font-size: 0.85rem; border-radius: 9px; }
</style>
