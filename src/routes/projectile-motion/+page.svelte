<script lang="ts">
  // The Projectile Motion Generator's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators'
  import Generator from '$lib/generators/projectile-motion/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/projectile-motion')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
