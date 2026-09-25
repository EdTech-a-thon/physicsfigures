<script lang="ts">
  // A Vector's arrow on a figure's SVG. Its label is drawn separately (with
  // FigureLabel at labelPoint) so it stays readable when the figure is mirrored.
  // A thin white outline keeps it clear of field lines or anything behind it.
  //
  // Forces are solid. Motion (velocity, acceleration) has a dashed shaft at
  // full weight, so it's never read as a force, even photocopied. A force's
  // components are thinner and dashed, drawn in the palette's lighter color.
  import { arrow, VECTOR_HEAD, VECTOR_WIDTH, type Segment, type VectorStyle } from './vector'

  let { v, color, style = 'force' }: { v: Segment; color: string; style?: VectorStyle } = $props()

  const width = $derived(style === 'component' ? 2 : VECTOR_WIDTH)
  const head = $derived(style === 'component' ? 10 : VECTOR_HEAD)
  const dash = $derived(style === 'motion' ? '8 5' : style === 'component' ? '5 4' : undefined)
  const a = $derived(arrow(v, head))
  const points = $derived(a.head.map((p) => `${p.x},${p.y}`).join(' '))
</script>

<line x1={a.shaft.x1} y1={a.shaft.y1} x2={a.shaft.x2} y2={a.shaft.y2} stroke="#fff" stroke-width={width + 5} stroke-linecap="round" />
<polygon {points} fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" />

<!-- A dashed shaft is drawn from the head back, so a dash always meets the head. -->
<line
  x1={a.shaft.x2}
  y1={a.shaft.y2}
  x2={a.shaft.x1}
  y2={a.shaft.y1}
  stroke={color}
  stroke-width={width}
  stroke-dasharray={dash}
  stroke-linecap={dash ? 'butt' : undefined}
/>
<polygon {points} fill={color} />
