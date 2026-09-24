<script lang="ts">
  // The Coil and Magnet Generator's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators'
  import Generator from '$lib/generators/coil-and-magnet/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/coil-and-magnet')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
