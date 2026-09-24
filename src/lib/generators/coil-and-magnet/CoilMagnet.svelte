<script lang="ts">
  // The Coil and Magnet figure, as a self-contained SVG that prints crisply and
  // exports cleanly (fonts and colors are inline, no page CSS). Shapes are drawn
  // inside the mirror transform; labels outside it, so they stay readable.
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import VectorArrow from '$lib/shared/VectorArrow.svelte'
  import { SANS, mirrorTransform, mirrorX, palette } from '$lib/shared/figure'
  import { linePath } from '$lib/shared/field'
  import { labelPoint } from '$lib/shared/vector'
  import { buildCoilFigure } from './coil'
  import type { CoilSettings } from './settings'

  let { settings, id = 'c' }: { settings: CoilSettings; id?: string } = $props()

  const fig = $derived(buildCoilFigure(settings))
  const p = $derived(palette(settings.color))
  const mx = (x: number) => mirrorX(settings.mirror, fig.width, x)

  const halves = $derived.by(() => {
    const m = fig.magnet
    if (!m) return []
    const far = m.near === 'N' ? 'S' : 'N'
    return [
      { pole: far, x: m.x },
      { pole: m.near, x: m.x + m.length / 2 },
    ].map((h) => ({
      ...h,
      fill: h.pole === 'N' ? p.north : p.south,
      text: h.pole === 'N' ? p.onNorth : p.onSouth,
      label: h.pole === 'N' ? settings.north : settings.south,
    }))
  })

  // The meter: the needle pivots low in the dial and swings across a scale.
  type Meter = NonNullable<typeof fig.meter>
  const pivotY = (m: Meter) => m.cy + m.r * 0.42
  const needleLength = (m: Meter) => m.r * 1.02
  const NEEDLE_TICK = 38
  function scale(m: Meter) {
    const r = needleLength(m) + 1
    const at = (deg: number) => {
      const a = ((deg - 90) * Math.PI) / 180
      return `${m.cx + Math.cos(a) * r},${pivotY(m) + Math.sin(a) * r}`
    }
    return `M${at(-50)} A${r},${r} 0 0 1 ${at(50)}`
  }

  const POLE_SIZE = 24
  const VECTOR_LABEL_SIZE = 22
  // Above the arrow whichever way it points (side 1 is above a rightward vector).
  const motionLabel = $derived(fig.motion ? labelPoint(fig.motion, { at: 'middle', side: fig.motion.x2 > fig.motion.x1 ? 1 : -1, gap: 16 }) : null)

  const description = $derived(
    [
      `A coil of ${settings.turns} turn${settings.turns === 1 ? '' : 's'}`,
      fig.magnet ? `with a bar magnet ${settings.distance === 'inside' ? 'inside it' : settings.distance === 'mouth' ? 'at its end' : 'beside it'}` : '',
      fig.motion ? `moving ${settings.motion === 'toward' ? 'toward' : 'away from'} the coil` : '',
    ]
      .filter(Boolean)
      .join(' '),
  )
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label={description}
  id="{id}-coil-and-magnet"
>
  <defs>
    <clipPath id="{id}-clip"><rect width={fig.width} height={fig.height} /></clipPath>
  </defs>
  <rect width={fig.width} height={fig.height} fill="#fff" />
  <g transform={mirrorTransform(settings.mirror, fig.width)} fill="none" stroke-linecap="round">
    {#each fig.coil.back as d}<path {d} stroke={p.hidden} stroke-width="2.5" />{/each}

    {#if fig.fieldLines.length}
      <g clip-path="url(#{id}-clip)">
        {#each fig.fieldLines as line}<path d={linePath(line.points)} stroke={p.field} stroke-width="1.6" />{/each}
        {#each fig.fieldLines as line}
          {#if line.arrow}
            <polygon points="6,0 -5,-5 -5,5" fill={p.field} transform="translate({line.arrow.x} {line.arrow.y}) rotate({line.arrow.angle})" />
          {/if}
        {/each}
      </g>
    {/if}

    {#if fig.magnet}
      {@const m = fig.magnet}
      {#each halves as h}
        <rect x={h.x} y={m.y} width={m.length / 2} height={m.height} fill={h.fill} />
      {/each}
      <rect x={m.x} y={m.y} width={m.length} height={m.height} stroke={p.ink} stroke-width="2.5" />
      <line x1={m.x + m.length / 2} y1={m.y} x2={m.x + m.length / 2} y2={m.y + m.height} stroke={p.ink} stroke-width="1.5" />
    {/if}

    {#each fig.coil.front as d}<path {d} stroke={p.wire} stroke-width="3.5" />{/each}
    {#each fig.coil.leads as l}
      <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={p.wire} stroke-width="3.5" />
      {#if !fig.meter}<circle cx={l.x2} cy={l.y2 + 5} r="5" fill="#fff" stroke={p.ink} stroke-width="2" />{/if}
    {/each}
    {#each fig.currentArrows as a}
      <polygon
        points="8,0 -6,-6.5 -6,6.5"
        fill={p.ink}
        stroke="#fff"
        stroke-width="1.5"
        stroke-linejoin="round"
        transform="translate({a.x} {a.y}) rotate({a.angle})"
      />
    {/each}

    {#if fig.meter}
      {@const m = fig.meter}
      {#each m.wires as w}
        <polyline points={w.map((q) => `${q.x},${q.y}`).join(' ')} stroke={p.ink} stroke-width="2.5" stroke-linejoin="round" />
      {/each}
      <circle cx={m.cx} cy={m.cy} r={m.r} fill="#fff" stroke={p.ink} stroke-width="2.5" />
      <!-- The scale the needle swings across. -->
      <path d={scale(m)} stroke={p.ink} stroke-width="1.5" />
      {#each [-NEEDLE_TICK, 0, NEEDLE_TICK] as t}
        {@const a = ((t - 90) * Math.PI) / 180}
        <line
          x1={m.cx + Math.cos(a) * (needleLength(m) + 1)}
          y1={pivotY(m) + Math.sin(a) * (needleLength(m) + 1)}
          x2={m.cx + Math.cos(a) * (needleLength(m) + 6)}
          y2={pivotY(m) + Math.sin(a) * (needleLength(m) + 6)}
          stroke={p.ink}
          stroke-width="1.5"
        />
      {/each}
    {/if}

    {#if fig.motion}<VectorArrow v={fig.motion} color={p.vector} />{/if}
  </g>

  {#if fig.meter}
    <!-- The needle reads the way the teacher set it, so it is drawn unmirrored. -->
    {@const m = fig.meter}
    {@const cx = mx(m.cx)}
    {#if m.needle !== null}
      {@const a = ((m.needle - 90) * Math.PI) / 180}
      <line
        x1={cx}
        y1={pivotY(m)}
        x2={cx + Math.cos(a) * needleLength(m)}
        y2={pivotY(m) + Math.sin(a) * needleLength(m)}
        stroke={p.ink}
        stroke-width="2.5"
        stroke-linecap="round"
      />
    {/if}
    <circle {cx} cy={pivotY(m)} r="3" fill={p.ink} />
    <text x={cx} y={m.cy + m.r * 0.78} text-anchor="middle" font-family={SANS} font-size="11" font-weight="bold" fill={p.ink}>G</text>
  {/if}

  {#if fig.magnet}
    {#each halves as h}
      <FigureLabel
        label={h.label}
        x={mx(h.x + fig.magnet.length / 4)}
        y={fig.cy + POLE_SIZE * 0.35}
        size={POLE_SIZE}
        color={h.text}
        blank={36}
        italic={false}
        halo={false}
      />
    {/each}
  {/if}
  {#if fig.motion && motionLabel}
    <FigureLabel label={settings.motionLabel} x={mx(motionLabel.x)} y={motionLabel.y + VECTOR_LABEL_SIZE * 0.35} size={VECTOR_LABEL_SIZE} color={p.vector} />
  {/if}
</svg>
