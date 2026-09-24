<script>
  // Request a generator: the same dialog as Help, with its own wording. Opened
  // from the search box or the directory through openRequest().
  import EmailDialog from './EmailDialog.svelte'
  import { request } from './request.svelte.js'

  const subject = $derived(request.topic ? `Generator request: ${request.topic}` : 'Generator request')
  const body = $derived(request.topic ? `I'd like a generator for: ${request.topic}\n\n` : '')
</script>

{#if request.open}
  <EmailDialog title="Request a generator" {subject} {body} onclose={() => (request.open = false)}>
    <p>
      {#if request.topic}We don’t have a generator for “{request.topic}” yet.{/if}
      You can email us with a suggestion, and we’ll build it.
    </p>
  </EmailDialog>
{/if}
