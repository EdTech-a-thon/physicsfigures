<script lang="ts">
  // A label typed in Caret's math field (docs/adr/0003-caret-for-labels.md):
  // "theta" → θ, "deg" → °, "_" for a subscript and "^" for a superscript.
  // `value` is the label's text as it is written in the page address ("m_1").
  //
  // Caret's field drops typed spaces, so before it reads the keyboard or a
  // paste, spaces are swapped for FIELD_SPACE, a blank character it keeps.
  import { MathField } from '@caret-js/svelte'
  import type { Doc } from '@caret-js/core'
  import { FIELD_SPACE, commands, labelFromText, labelToText, schema, typingRules } from './label'

  interface Props {
    value: string
    id?: string
    placeholder?: string
    'aria-label'?: string
  }
  let { value = $bindable(''), ...rest }: Props = $props()

  const swapSpaces = (text: string) => text.replace(/ /g, FIELD_SPACE)
  // The field keeps one of these in its hidden textarea and ignores it when reading.
  const ZERO_WIDTH = String.fromCodePoint(0x200b)

  // Capture runs before the field's own listeners on its hidden textarea.
  function oninputcapture(event: Event) {
    const area = event.target as HTMLTextAreaElement
    if (area.value.includes(' ')) area.value = swapSpaces(area.value)
  }
  function onpastecapture(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (!text.includes(' ')) return
    event.preventDefault()
    event.stopPropagation()
    const area = event.target as HTMLTextAreaElement
    area.value = ZERO_WIDTH + swapSpaces(text)
    area.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const classify = (doc: Doc<any>) =>
    new Map((doc.root.tokens as any[]).filter((t) => t.props?.char === FIELD_SPACE).map((t) => [t.id, 'label-space']))
</script>

<div class="label-input" {oninputcapture} {onpastecapture}>
  <MathField {schema} bind:value fromText={labelFromText} toText={labelToText} {typingRules} {commands} {classify} {...rest} />
</div>

<style>
  .label-input :global(.caret-field) {
    --caret-border: var(--border);
    --caret-focus: var(--blue);
    --caret-color: var(--ink);
    --caret-font-size: 1.1rem;
    --caret-placeholder-font: system-ui, sans-serif;
  }
  .label-input :global(.label-space) { display: inline-block; width: 0.3em; color: transparent; }
  /* Caret raises every sub/superscript box, so a lone subscript sits up where a
     superscript would. Here the box is a column (superscript over subscript)
     whose baseline is its first line, set as far off the baseline as
     FigureLabel sets them: a subscript down 0.3, a superscript up 0.45.
     Lengths are in the box's own 0.6em font size. */
  .label-input :global(.caret-field .subsup) { display: inline-flex; flex-direction: column; line-height: 1.25; vertical-align: 0.75em; }
  .label-input :global(.caret-field .subsup > .subscript) { float: none; }
  .label-input :global(.caret-field .subsup:not(:has(> .superscript))) { vertical-align: -0.5em; }
</style>
