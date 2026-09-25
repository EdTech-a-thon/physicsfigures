<script lang="ts">
  // The Pulley Generator's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators'
  import Generator from '$lib/generators/pulley/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/pulley')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
