<script lang="ts">
  // The Circuit Diagram figure, as a self-contained SVG that prints crisply
  // and exports cleanly. Wires and symbols are drawn inside the mirror
  // transform; labels and letters outside it, so they stay readable.
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import { mirrorAnchor, mirrorTransform, mirrorX, palette, SERIF } from '$lib/shared/figure'
  import { buildCircuit, LABEL_SIZE, METER_R } from './layout'
  import PartSymbol from './PartSymbol.svelte'
  import type { CircuitSettings } from './settings'
  import { describeCircuit } from './tree'

  let { settings, id = 'c' }: { settings: CircuitSettings; id?: string } = $props()

  const hasTitle = $derived(settings.title.mode !== 'none' && (settings.title.mode === 'blank' || settings.title.text.trim() !== ''))
  const fig = $derived(buildCircuit(settings.circuit, { title: hasTitle, polarity: settings.polarity }))
  const p = $derived(palette(settings.color))
  /** Symbols stand out in blue on slides; wires stay black. */
  const partInk = $derived(settings.color ? '#1d4ed8' : p.ink)
  const mx = (x: number) => mirrorX(settings.mirror, fig.width, x)
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label={describeCircuit(settings.circuit)}
  id="{id}-circuit"
>
  <rect class="paper" width={fig.width} height={fig.height} fill="#fff" />
  <g transform={mirrorTransform(settings.mirror, fig.width)} fill="none" stroke-linecap="round">
    {#each fig.wires as wire}
      <polyline points={wire.map((q) => `${q.x},${q.y}`).join(' ')} stroke={p.ink} stroke-width="2.2" stroke-linejoin="round" />
    {/each}
    {#each fig.parts as part}
      <g transform="translate({part.x} {part.y}) rotate({part.angle})">
        <PartSymbol part={part.part} style={settings.symbols} ink={partInk} />
      </g>
    {/each}
    {#each fig.meters as m}<circle cx={m.x} cy={m.y} r={METER_R} fill="#fff" stroke={partInk} stroke-width="2.2" />{/each}
    {#each fig.dots as dot}<circle cx={dot.x} cy={dot.y} r="3.8" fill={p.ink} />{/each}
  </g>

  {#each fig.letters as l}
    <text x={mx(l.x)} y={l.y + l.size * 0.34} text-anchor="middle" font-family={SERIF} font-size={l.size} fill={partInk}>{l.text}</text>
  {/each}
  {#each fig.labels as l}
    <FigureLabel label={l.label} x={mx(l.x)} y={l.y} anchor={mirrorAnchor(settings.mirror, l.anchor)} size={LABEL_SIZE} color={p.ink} />
  {/each}
  {#if fig.title}
    <FigureLabel label={settings.title} x={fig.title.x} y={fig.title.y} size={24} color={p.ink} italic={false} halo={false} blank={160} />
  {/if}
</svg>
