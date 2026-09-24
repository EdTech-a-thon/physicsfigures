<script lang="ts">
  // The Inclined Plane Generator: the object, the ramp and its marks on the
  // left, the figure on the right. Settings live in the page address.
  import { Box, Ruler, Triangle } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import GeneratorLayout from '$lib/shared/GeneratorLayout.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import Incline from './Incline.svelte'
  import { inclineSettings } from './settings'

  const gen = createGenerator(inclineSettings, 'inclined-plane')
  const s = $derived(gen.clean)

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const objectSummary = $derived(`${s.object} · ${shown(s.objectLabel)} · ${Math.round(s.objectSize * 100)}% size`)
  const rampSummary = $derived(`${s.angle}° · ${shown(s.angleLabel)} · ${s.surface}`)
  const marksSummary = $derived(
    [s.lengthMark ? `length ${shown(s.lengthLabel)}` : '', s.heightMark ? `height ${shown(s.heightLabel)}` : ''].filter(Boolean).join(' · ') ||
      'none',
  )
</script>

<GeneratorLayout title="Inclined Plane Generator" {gen} filename="inclined-plane">
  {#snippet controls()}
    <Section title="Object" icon={Box} summary={objectSummary}>
      <div class="field">
        <Choice name="Object" options={[['block', 'Block'], ['ball', 'Ball'], ['cart', 'Cart']]} bind:value={gen.settings.object} />
      </div>
      <div class="field">Label <LabelField name="Object label" bind:label={gen.settings.objectLabel} /></div>
      <label class="field">
        Size
        <span class="slider">
          <input type="range" min="0.5" max="2" step="0.05" bind:value={gen.settings.objectSize} />
          <output>{Math.round(s.objectSize * 100)}%</output>
        </span>
      </label>
      <label class="field">
        Where on the ramp
        <span class="slider">
          <input type="range" min="0.2" max="0.85" step="0.01" bind:value={gen.settings.position} />
          <output>{s.position < 0.4 ? 'low' : s.position > 0.65 ? 'high' : 'middle'}</output>
        </span>
      </label>
    </Section>

    <Section title="Ramp" icon={Triangle} summary={rampSummary}>
      <label class="field">
        Angle
        <span class="slider">
          <input type="range" min="5" max="60" bind:value={gen.settings.angle} />
          <output>{s.angle}°</output>
        </span>
      </label>
      <div class="field">Angle label <LabelField name="Angle label" bind:label={gen.settings.angleLabel} /></div>
      <div class="field">
        Surface
        <Choice name="Surface" options={[['smooth', 'Smooth'], ['rough', 'Rough']]} bind:value={gen.settings.surface} />
      </div>
    </Section>

    <Section title="Marks" icon={Ruler} summary={marksSummary}>
      <label class="check"><input type="checkbox" bind:checked={gen.settings.lengthMark} /> Length of the ramp</label>
      {#if s.lengthMark}<div class="field"><LabelField name="Length label" bind:label={gen.settings.lengthLabel} /></div>{/if}
      <label class="check"><input type="checkbox" bind:checked={gen.settings.heightMark} /> Height of the ramp</label>
      {#if s.heightMark}<div class="field"><LabelField name="Height label" bind:label={gen.settings.heightLabel} /></div>{/if}
    </Section>
  {/snippet}

  {#snippet figure(id)}
    <Incline settings={s} {id} />
  {/snippet}
</GeneratorLayout>
