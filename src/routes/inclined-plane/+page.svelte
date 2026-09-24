<script lang="ts">
  // The Inclined Plane Generator's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators'
  import Generator from '$lib/generators/inclined-plane/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/inclined-plane')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
