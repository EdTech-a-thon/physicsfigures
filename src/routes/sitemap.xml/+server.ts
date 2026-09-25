import { GENERATORS } from '$lib/generators'
import { SITE_URL } from '$lib/site/config'

export const prerender = true

export function GET() {
  const paths = ['/', ...GENERATORS.map((g) => g.path), '/about', '/privacy']
  const urls = paths.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
