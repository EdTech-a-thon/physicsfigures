<script lang="ts">
  // The Free Body Diagram Generator's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators'
  import Generator from '$lib/generators/free-body-diagram/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/free-body-diagram')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
