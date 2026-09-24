<script lang="ts">
  // The Pulley Generator: the objects on the left, the figure on the right.
  // Settings live in the page address.
  import { Box, Cog, Triangle } from '@lucide/svelte'
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
  const SETUPS = { atwood: 'Atwood machine', table: 'table and hanging mass', ramp: 'ramp and hanging mass' }
  // What each object is called in each setup.
  const NAMES = {
    atwood: { a: 'Left object', b: 'Right object' },
    table: { a: 'On the table', b: 'Hanging' },
    ramp: { a: 'On the ramp', b: 'Hanging' },
  }
  const names = $derived(NAMES[s.setup])
  const objectsSummary = $derived(
    `${shown(s.aLabel)} and ${shown(s.bLabel)}${s.setup === 'atwood' && s.lower !== 'neither' ? ` · ${s.lower === 'a' ? 'left' : 'right'} lower` : ''}`,
  )
  const surfaceSummary = $derived(s.setup === 'ramp' ? `${s.angle}° · ${shown(s.angleLabel)} · ${s.surface}` : s.surface)
</script>

<GeneratorLayout title="Pulley Generator" {gen} filename="pulley">
  {#snippet controls()}
    <Section title="Setup" icon={Cog} summary={SETUPS[s.setup]}>
      <div class="field">
        <Choice name="Setup" options={[['atwood', 'Atwood'], ['table', 'Table'], ['ramp', 'Ramp']]} bind:value={gen.settings.setup} />
      </div>
    </Section>

    <Section title="Objects" icon={Box} summary={objectsSummary}>
      {#each ['a', 'b'] as const as which}
        <p class="subhead">{names[which]}</p>
        {#if which === 'a' && s.setup !== 'atwood'}
          <div class="field">
            <Choice name="{names.a} object" options={[['block', 'Block'], ['cart', 'Cart']]} bind:value={gen.settings.aKind} />
          </div>
        {/if}
        <div class="field">Label <LabelField name="{names[which]} label" bind:label={gen.settings[`${which}Label`]} /></div>
        <label class="field">
          Size
          <span class="slider">
            <input type="range" min="0.5" max="2" step="0.05" bind:value={gen.settings[`${which}Size`]} />
            <output>{Math.round(s[`${which}Size`] * 100)}%</output>
          </span>
        </label>
      {/each}
      {#if s.setup === 'atwood'}
        <div class="field">
          Hangs lower
          <Choice name="Hangs lower" options={[['neither', 'Neither'], ['a', 'Left'], ['b', 'Right']]} bind:value={gen.settings.lower} />
        </div>
      {/if}
    </Section>

    {#if s.setup !== 'atwood'}
      <Section title={s.setup === 'ramp' ? 'Ramp' : 'Table'} icon={Triangle} summary={surfaceSummary}>
        {#if s.setup === 'ramp'}
          <label class="field">
            Angle
            <span class="slider">
              <input type="range" min="10" max="60" bind:value={gen.settings.angle} />
              <output>{s.angle}°</output>
            </span>
          </label>
          <div class="field">Angle label <LabelField name="Angle label" bind:label={gen.settings.angleLabel} /></div>
        {/if}
        <div class="field">
          Surface
          <Choice name="Surface" options={[['smooth', 'Smooth'], ['rough', 'Rough']]} bind:value={gen.settings.surface} />
        </div>
      </Section>
    {/if}
  {/snippet}

  {#snippet figure(id)}
    <Pulley settings={s} {id} />
  {/snippet}
</GeneratorLayout>
