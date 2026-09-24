<script lang="ts">
  // A label drawn on a figure's SVG: its text with subscripts and superscripts,
  // a blank line for students to write on, or nothing. (x, y) is the middle of
  // the text's baseline for anchor "middle", its left end for "start" and its
  // right end for "end". Everything is inline so the SVG exports cleanly.
  //
  // With `italic` on, single letters are set in italics the way physics sets
  // quantities (m, v, F, θ), while longer words like units (kg) stay upright.
  import { labelRuns, type Label } from './label'

  interface Props {
    label: Label
    x: number
    y: number
    anchor?: 'start' | 'middle' | 'end'
    size?: number
    color?: string
    /** How long a blank line is. */
    blank?: number
    italic?: boolean
    /** A white outline, so the label reads over lines behind it. */
    halo?: boolean
  }
  let { label, x, y, anchor = 'middle', size = 18, color = '#111827', blank = size * 2.4, italic = true, halo = true }: Props = $props()

  /** A run split into pieces, with single letters marked for italics. */
  const pieces = (text: string) =>
    (text.match(/\p{L}+|[^\p{L}]+/gu) ?? []).map((t) => ({ t, italic: italic && /^\p{L}$/u.test(t) }))

  const SERIF = "'Times New Roman', Times, serif"
  const SMALL = 0.7
  // How far a subscript drops and a superscript rises, at the small size.
  const DROP = { sub: 0.3, super: -0.45 } as const

  const runs = $derived(labelRuns(label.text))
  // Each run moves off the baseline and back again, so the dy values chain.
  const spans = $derived.by(() => {
    let offset = 0
    return runs.map((run) => {
      const target = run.shift ? DROP[run.shift] * size : 0
      const dy = target - offset
      offset = target
      return { ...run, dy }
    })
  })
  const blankStart = $derived(anchor === 'start' ? x : anchor === 'end' ? x - blank : x - blank / 2)
</script>

{#if label.mode === 'text' && label.text.trim()}
  <text
    {x}
    {y}
    text-anchor={anchor}
    font-family={SERIF}
    font-size={size}
    fill={color}
    stroke={halo ? '#fff' : undefined}
    stroke-width={halo ? 4 : undefined}
    stroke-linejoin="round"
    paint-order="stroke"
  >
    {#each spans as s}<tspan dy={s.dy || undefined} font-size={s.shift ? size * SMALL : undefined}
        >{#each pieces(s.text) as piece}<tspan font-style={piece.italic ? 'italic' : undefined}>{piece.t}</tspan>{/each}</tspan
      >{/each}
  </text>
{:else if label.mode === 'blank'}
  <line x1={blankStart} y1={y} x2={blankStart + blank} y2={y} stroke={color} stroke-width="1.5" />
{/if}
