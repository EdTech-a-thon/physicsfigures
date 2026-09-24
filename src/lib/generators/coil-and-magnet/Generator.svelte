<script lang="ts">
  // The Coil and Magnet Generator: the coil, the magnet and its motion on the
  // left, the figure on the right. Settings live in the page address.
  import { Cable, Magnet, MoveRight } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import GeneratorLayout from '$lib/shared/GeneratorLayout.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import CoilMagnet from './CoilMagnet.svelte'
  import { coilSettings } from './settings'

  const gen = createGenerator(coilSettings, 'coil-and-magnet')
  const s = $derived(gen.clean)

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const DISTANCES = { outside: 'beside the coil', mouth: 'at the coil’s end', inside: 'inside the coil' }

  const coilSummary = $derived(`${s.turns} turn${s.turns === 1 ? '' : 's'}`)
  const magnetSummary = $derived(s.source === 'none' ? 'no magnet' : `${s.facing} pole facing the coil · ${DISTANCES[s.distance]}`)
  const motionSummary = $derived(
    s.source === 'none' ? 'no magnet' : s.motion === 'none' ? 'not moving' : `${s.motion} the coil · ${shown(s.motionLabel)}`,
  )
</script>

<GeneratorLayout title="Coil and Magnet Generator" {gen} filename="coil-and-magnet">
  {#snippet controls()}
    <Section title="Coil" icon={Cable} summary={coilSummary}>
      <label class="field">
        Turns
        <span class="slider">
          <input type="range" min="1" max="20" bind:value={gen.settings.turns} />
          <output>{s.turns}</output>
        </span>
      </label>
    </Section>

    <Section title="Magnet" icon={Magnet} summary={magnetSummary}>
      <div class="field">
        Beside the coil
        <Choice name="Beside the coil" options={[['magnet', 'Bar magnet'], ['none', 'Nothing']]} bind:value={gen.settings.source} />
      </div>
      {#if s.source === 'magnet'}
        <div class="field">
          Pole facing the coil
          <Choice name="Pole facing the coil" options={[['N', 'North'], ['S', 'South']]} bind:value={gen.settings.facing} />
        </div>
        <label class="field">
          Where it is
          <select bind:value={gen.settings.distance}>
            <option value="outside">Beside the coil</option>
            <option value="mouth">At the coil’s end</option>
            <option value="inside">Inside the coil</option>
          </select>
        </label>
        <p class="subhead">Pole labels</p>
        <div class="field">North <LabelField name="North pole label" bind:label={gen.settings.north} /></div>
        <div class="field">South <LabelField name="South pole label" bind:label={gen.settings.south} /></div>
      {/if}
    </Section>

    {#if s.source === 'magnet'}
      <Section title="Motion" icon={MoveRight} summary={motionSummary}>
        <div class="field">
          The magnet moves
          <Choice name="Magnet motion" options={[['toward', 'Toward'], ['away', 'Away'], ['none', 'Not moving']]} bind:value={gen.settings.motion} />
        </div>
        {#if s.motion !== 'none'}
          <div class="field">Label <LabelField name="Motion label" bind:label={gen.settings.motionLabel} /></div>
        {/if}
      </Section>
    {/if}
  {/snippet}

  {#snippet figure(id)}
    <CoilMagnet settings={s} {id} />
  {/snippet}
</GeneratorLayout>
