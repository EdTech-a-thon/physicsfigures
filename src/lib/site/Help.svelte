<script>
  // A question mark in the corner that opens a short dialog, like the other
  // teacher.dev tools. It looks just like Request a generator.
  import { CircleQuestionMark } from '@lucide/svelte'
  import EmailDialog from './EmailDialog.svelte'

  let open = $state(false)
</script>

<button
  type="button"
  class="help-button no-print"
  aria-label="Help"
  aria-haspopup="dialog"
  onclick={() => (open = true)}
>
  <CircleQuestionMark aria-hidden="true" />
</button>

{#if open}
  <EmailDialog title="Need a hand?" subject="Physics Figures" onclose={() => (open = false)}>
    <p>If you’re running into trouble or have suggestions, email us and we’ll help.</p>
    <p>Want a figure we don’t make yet? Email us to request a generator, and we’ll build it.</p>
  </EmailDialog>
{/if}

<style>
  .help-button {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 50;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    color: var(--muted);
    background: transparent;
  }
  .help-button :global(svg) { width: 22px; height: 22px; }
  .help-button:hover, .help-button:focus-visible { color: var(--blue-dark); background: var(--blue-soft); }
</style>
