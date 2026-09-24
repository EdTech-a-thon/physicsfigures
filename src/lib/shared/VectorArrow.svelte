<script lang="ts">
  // A Vector's arrow on a figure's SVG. Its label is drawn separately (with
  // FigureLabel at labelPoint) so it stays readable when the figure is mirrored.
  // A thin white outline keeps it clear of field lines or anything behind it.
  import { arrow, VECTOR_HEAD, VECTOR_WIDTH, type Segment } from './vector'

  let { v, color, width = VECTOR_WIDTH, head = VECTOR_HEAD }: { v: Segment; color: string; width?: number; head?: number } = $props()

  const a = $derived(arrow(v, head))
  const points = $derived(a.head.map((p) => `${p.x},${p.y}`).join(' '))
</script>

<line x1={a.shaft.x1} y1={a.shaft.y1} x2={a.shaft.x2} y2={a.shaft.y2} stroke="#fff" stroke-width={width + 5} stroke-linecap="round" />
<polygon {points} fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" />

<line x1={a.shaft.x1} y1={a.shaft.y1} x2={a.shaft.x2} y2={a.shaft.y2} stroke={color} stroke-width={width} />
<polygon {points} fill={color} />
