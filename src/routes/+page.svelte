<script lang="ts">
  // The directory: a search box that filters the cards as you type, then
  // every generator as a small card with a live preview of its figure, and a
  // last card for requesting one we don't have.
  import { Plus, Search } from '@lucide/svelte'
  import { searchGenerators } from '$lib/generators'
  import Seo from '$lib/site/Seo.svelte'
  import { openRequest } from '$lib/site/request.svelte'

  let query = $state('')
  const results = $derived(searchGenerators(query))
</script>

<Seo
  description="Free generators for clean, printable physics figures. Make one to fit your lesson, then copy it straight into a test, worksheet or slide."
  path="/"
/>

<div class="page">
  <header class="hero">
    <h1>Physics figures for your tests and worksheets</h1>
    <p>Make one to fit your lesson, then copy it straight into your document. Free, with no sign-up.</p>
  </header>

  <div class="search">
    <Search size={18} aria-hidden="true" class="glass" />
    <input type="search" bind:value={query} placeholder="Search figures, like “free body diagram”" aria-label="Search figures" autocomplete="off" />
  </div>

  {#if query.trim() && !results.length}
    <p class="empty">No generator for “{query.trim()}” yet.</p>
  {/if}

  <ul class="cards">
    {#each results as g (g.id)}
      <li>
        <a class="card figure" href={g.path}>
          <div class="preview" aria-hidden="true"><g.Preview /></div>
          <div class="text">
            <h2>{g.name}</h2>
            <p>{g.blurb}</p>
          </div>
        </a>
      </li>
    {/each}
    <li>
      <button type="button" class="request" onclick={() => openRequest(query)}>
        <span class="plus"><Plus size={20} aria-hidden="true" /></span>
        <span class="request-title">Need a different figure?</span>
        <span class="request-text">Request a generator, and we’ll build it.</span>
      </button>
    </li>
  </ul>
</div>

<style>
  .page { max-width: 58rem; margin: 0 auto; padding: 2.5rem 1.25rem 1rem; }
  h1 { font-size: 1.9rem; font-weight: 800; }
  .hero p { max-width: 42rem; margin: 0.55rem 0 0; color: var(--muted); font-size: 1.02rem; }

  .search { position: relative; max-width: 26rem; margin: 1.5rem 0 1.25rem; }
  .search :global(.glass) { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  input[type='search'] {
    width: 100%;
    padding: 0.7rem 0.9rem 0.7rem 2.5rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input[type='search']:hover { border-color: var(--blue-border); }
  input[type='search']:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }

  .empty { margin: 0 0 0.9rem; color: var(--muted); }

  .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin: 0; padding: 0; list-style: none; }
  @media (max-width: 760px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 440px) { .cards { grid-template-columns: minmax(0, 1fr); } }
  .cards li { display: flex; }

  .figure { display: flex; flex-direction: column; width: 100%; overflow: hidden; color: inherit; text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
  .figure:hover { border-color: var(--blue-border); transform: translateY(-2px); box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 28px -12px rgba(37, 99, 235, 0.35); }
  .preview { display: flex; justify-content: center; align-items: center; height: 9.5rem; padding: 0.75rem; border-bottom: 1px solid var(--border); background: #fff; }
  .preview :global(svg) { width: auto; height: 100%; max-width: 100%; }
  .text { padding: 0.7rem 0.9rem 0.85rem; }
  h2 { font-size: 0.98rem; font-weight: 800; }
  .text p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.85rem; line-height: 1.35; }

  .request {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    width: 100%;
    min-height: 13rem;
    padding: 1.25rem;
    border: 2px dashed var(--blue-border);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.6);
    color: var(--ink);
    text-align: center;
  }
  .request:hover { background: var(--blue-soft); }
  .plus { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--blue-soft); color: var(--blue-dark); margin-bottom: 0.3rem; }
  .request-title { font-weight: 800; font-size: 0.98rem; }
  .request-text { color: var(--muted); font-size: 0.85rem; }
</style>
