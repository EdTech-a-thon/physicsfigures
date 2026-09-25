<script lang="ts" generics="T extends { mirror: boolean; color: boolean }">
  // Every generator's page: presets and settings on the left, with the Figure
  // section (Mirror and Color) last, and the figure card on the right. What
  // prints is just the figure. `figure(id)` draws the figure; each copy on the
  // page needs its own id so the SVGs' internal references don't clash.
  import type { Snippet } from 'svelte'
  import { SlidersHorizontal } from '@lucide/svelte'
  import FigureCanvas from './FigureCanvas.svelte'
  import type { GeneratorState } from './generator.svelte'
  import Presets from './Presets.svelte'
  import Section from './Section.svelte'

  interface Props {
    title: string
    gen: GeneratorState<T>
    filename: string
    controls: Snippet
    figure: Snippet<[string]>
  }
  let { title, gen, filename, controls, figure }: Props = $props()

  const figureSummary = $derived(
    [gen.clean.mirror ? 'mirrored' : '', gen.clean.color ? 'color' : 'black and white'].filter(Boolean).join(' · '),
  )
</script>

<div class="page no-print">
  <h1 class="visually-hidden">{title}</h1>
  <div class="layout">
    <div class="controls">
      <section class="card">
        <h2 class="card-head">Presets</h2>
        <Presets store={gen.presets} same={gen.same} settings={gen.clean} onapply={(p) => (gen.settings = $state.snapshot(p) as T)} />
      </section>

      <section class="card sections">
        {@render controls()}
        <Section title="Figure" icon={SlidersHorizontal} summary={figureSummary}>
          <label class="check"><input type="checkbox" bind:checked={gen.settings.mirror} /> Mirror (flip left to right)</label>
          <label class="check"><input type="checkbox" bind:checked={gen.settings.color} /> Color (for slides)</label>
        </Section>
      </section>
    </div>

    <div class="preview">
      <FigureCanvas {filename} history={gen.history}>
        {@render figure('f')}
      </FigureCanvas>
    </div>
  </div>
</div>

<div class="print-sheet">
  {@render figure('p')}
</div>

<style>
  .page { padding: 1.25rem 1.25rem 1rem; }

  .layout { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }

  .controls { display: flex; flex-direction: column; gap: 1rem; }
  .controls > :global(*) { flex-shrink: 0; }

  @media (min-width: 861px) and (min-height: 560px) {
    .page { height: calc(100dvh - var(--topbar-h)); display: flex; flex-direction: column; }
    .layout { flex: 1; min-height: 0; grid-template-rows: minmax(0, 1fr); align-items: stretch; }
    .controls {
      min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin;
      margin: 0 -0.75rem -1rem; padding: 0 0.75rem 1.25rem;
    }
    .preview { display: flex; flex-direction: column; min-height: 0; }
  }
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 1rem 1.1rem 0; }
  .card-head + :global(.presets) { padding-top: 0.6rem; }
  .sections { overflow: hidden; }

  .print-sheet { display: none; }
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    .print-sheet { display: block; width: 7.5in; break-inside: avoid; }
    .print-sheet :global(svg) { width: 100%; height: auto; }
  }
</style>
