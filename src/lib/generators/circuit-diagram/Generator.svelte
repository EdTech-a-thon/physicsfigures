<script lang="ts">
  // The Circuit Diagram Generator: the circuit and its style on the left, the
  // figure on the right. Settings live in the page address.
  import { Heading, Palette } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import GeneratorLayout from '$lib/shared/GeneratorLayout.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import Section from '$lib/shared/Section.svelte'
  import CircuitDiagram from './CircuitDiagram.svelte'
  import { circuitSettings } from './settings'

  const gen = createGenerator(circuitSettings, 'circuit-diagram')
  const s = $derived(gen.clean)

  const styleSummary = $derived(s.symbols === 'us' ? 'US symbols' : 'IEC symbols')
  const titleSummary = $derived(s.title.mode === 'text' ? `“${s.title.text}”` : s.title.mode === 'blank' ? 'blank' : 'none')
</script>

<GeneratorLayout title="Circuit Diagram Generator" {gen} filename="circuit-diagram">
  {#snippet controls()}
    <Section title="Symbols" icon={Palette} summary={styleSummary}>
      <div class="field">
        Symbol style
        <Choice name="Symbol style" options={[['us', 'US (zigzag resistor)'], ['iec', 'IEC (box resistor)']]} bind:value={gen.settings.symbols} />
      </div>
    </Section>

    <Section title="Chart title" icon={Heading} summary={titleSummary}>
      <div class="field"><LabelField name="Chart title" placeholder="Title" bind:label={gen.settings.title} /></div>
    </Section>
  {/snippet}

  {#snippet figure(id)}
    <CircuitDiagram settings={s} {id} />
  {/snippet}
</GeneratorLayout>
