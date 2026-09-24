<script lang="ts">
  // The Pulley figure, as a self-contained SVG that prints crisply and exports
  // cleanly. Shapes are drawn inside the mirror transform; labels outside it,
  // so they stay readable.
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import ObjectShape from '$lib/shared/ObjectShape.svelte'
  import { mirrorTransform, mirrorX, palette } from '$lib/shared/figure'
  import { buildPulley, type Wheel } from './pulley'
  import type { PulleySettings } from './settings'

  let { settings, id = 'p' }: { settings: PulleySettings; id?: string } = $props()

  const fig = $derived(buildPulley(settings))
  const p = $derived(palette(settings.color))
  const mx = (x: number) => mirrorX(settings.mirror, fig.width, x)
  const SIZE = 22
  const HATCH = 10

  function arcPath(wheel: Wheel, from: number, to: number) {
    const at = (deg: number) => {
      const a = (deg * Math.PI) / 180
      return `${Math.round((wheel.cx + wheel.r * Math.cos(a)) * 100) / 100},${Math.round((wheel.cy + wheel.r * Math.sin(a)) * 100) / 100}`
    }
    return `M${at(from)} A${wheel.r},${wheel.r} 0 ${to - from > 180 ? 1 : 0} 1 ${at(to)}`
  }
  const labelOf = (which: 'a' | 'b') => (which === 'a' ? settings.aLabel : settings.bLabel)
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label="An Atwood machine: two objects hanging from a string over a pulley"
  id="{id}-pulley"
>
  <rect class="paper" width={fig.width} height={fig.height} fill="#fff" />
  <g transform={mirrorTransform(settings.mirror, fig.width)} fill="none" stroke-linecap="round">
    {#if fig.ceiling}
      {@const c = fig.ceiling}
      <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={p.ink} stroke-width="2.5" />
      {#each Array.from({ length: Math.floor((c.x2 - c.x1) / 13) }, (_, i) => c.x1 + 4 + i * 13) as x}
        <line x1={x} y1={c.y1} x2={x + HATCH * 0.8} y2={c.y1 - HATCH} stroke={p.ink} stroke-width="1.3" />
      {/each}
    {/if}
    {#each fig.rods as r}<line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={p.ink} stroke-width="3" />{/each}

    {#each fig.strings as string}
      <polyline points={string.map((q) => `${q.x},${q.y}`).join(' ')} stroke={p.ink} stroke-width="2.2" stroke-linejoin="round" />
    {/each}

    {#each fig.wheels as w}
      <circle cx={w.cx} cy={w.cy} r={w.r} fill={p.surface} stroke={p.ink} stroke-width="2.5" />
      <circle cx={w.cx} cy={w.cy} r={w.r * 0.3} stroke={p.ink} stroke-width="1.5" />
      <circle cx={w.cx} cy={w.cy} r="3" fill={p.ink} />
    {/each}
    {#each fig.arcs as a}<path d={arcPath(a.wheel, a.from, a.to)} stroke={p.ink} stroke-width="2.2" />{/each}

    {#each fig.objects as o}
      <g transform="translate({o.at.x} {o.at.y}) rotate({o.tilt})">
        <ObjectShape kind={o.kind} size={o.size} fill={p.object} stroke={p.ink} />
      </g>
    {/each}
  </g>

  {#each fig.objects as o}
    <FigureLabel label={labelOf(o.which)} x={mx(o.middle.x)} y={o.middle.y + SIZE * 0.35} size={SIZE} color={p.ink} halo={false} blank={30} />
  {/each}
</svg>
