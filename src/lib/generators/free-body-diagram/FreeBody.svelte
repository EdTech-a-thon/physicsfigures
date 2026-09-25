<script lang="ts">
  // The Free Body Diagram figure, as a self-contained SVG that prints crisply
  // and exports cleanly. Mirror is applied to the angles (see fbd.ts), so
  // nothing here is flipped and every label reads normally.
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import ObjectShape from '$lib/shared/ObjectShape.svelte'
  import VectorArrow from '$lib/shared/VectorArrow.svelte'
  import { palette } from '$lib/shared/figure'
  import { buildFbd, DOT_R, LABEL_SIZE } from './fbd'
  import type { FbdSettings } from './settings'

  let { settings, id = 'b' }: { settings: FbdSettings; id?: string } = $props()

  const fig = $derived(buildFbd(settings))
  const p = $derived(palette(settings.color))
  const baseline = LABEL_SIZE * 0.35

  const description = $derived(
    `A free body diagram of a ${settings.body} with ${settings.forces.length} force${settings.forces.length === 1 ? '' : 's'} on it`,
  )
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label={description}
  id="{id}-free-body-diagram"
>
  <rect class="paper" width={fig.width} height={fig.height} fill="#fff" />

  {#if fig.body.kind !== 'dot'}
    <g transform="translate({fig.body.at.x} {fig.body.at.y})">
      <ObjectShape kind={fig.body.kind} size={fig.body.size} fill={p.object} stroke={p.ink} />
    </g>
  {/if}

  <!-- Forces start inside the body, so they need no white outline to stand clear of it. -->
  {#each fig.forces as f}<VectorArrow v={f.v} color={p.vector} halo={false} />{/each}

  <!-- The dot, or on an object the point every force starts from. -->
  <circle cx={fig.body.middle.x} cy={fig.body.middle.y} r={fig.body.kind === 'dot' ? DOT_R : 3.5} fill={p.ink} />

  {#each fig.forces as f}
    <FigureLabel label={f.label} x={f.labelAt.x} y={f.labelAt.y + baseline} size={LABEL_SIZE} color={p.vector} />
  {/each}
</svg>
