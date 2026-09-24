<script lang="ts">
  // The Pulley Generator: the objects on the left, the figure on the right.
  // Settings live in the page address.
  import { Box } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import GeneratorLayout from '$lib/shared/GeneratorLayout.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import Pulley from './Pulley.svelte'
  import { pulleySettings } from './settings'

  const gen = createGenerator(pulleySettings, 'pulley')
  const s = $derived(gen.clean)

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const objectsSummary = $derived(`${shown(s.aLabel)} and ${shown(s.bLabel)}${s.lower === 'neither' ? '' : ` · ${s.lower === 'a' ? 'left' : 'right'} lower`}`)
</script>

<GeneratorLayout title="Pulley Generator" {gen} filename="pulley">
  {#snippet controls()}
    <Section title="Objects" icon={Box} summary={objectsSummary}>
      {#each [['a', 'Left object'], ['b', 'Right object']] as const as [which, name]}
        <p class="subhead">{name}</p>
        <div class="field">Label <LabelField name="{name} label" bind:label={gen.settings[`${which}Label`]} /></div>
        <label class="field">
          Size
          <span class="slider">
            <input type="range" min="0.5" max="2" step="0.05" bind:value={gen.settings[`${which}Size`]} />
            <output>{Math.round(s[`${which}Size`] * 100)}%</output>
          </span>
        </label>
      {/each}
      <div class="field">
        Hangs lower
        <Choice name="Hangs lower" options={[['neither', 'Neither'], ['a', 'Left'], ['b', 'Right']]} bind:value={gen.settings.lower} />
      </div>
    </Section>
  {/snippet}

  {#snippet figure(id)}
    <Pulley settings={s} {id} />
  {/snippet}
</GeneratorLayout>
