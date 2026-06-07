export interface OpenGraphMeta {
  title: string
  description: string
  image?: string
  url?: string
}

function upsertMetaTag(attribute: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applyOpenGraphMeta(meta: OpenGraphMeta): () => void {
  const previousTitle = document.title
  document.title = meta.title

  upsertMetaTag('property', 'og:title', meta.title)
  upsertMetaTag('property', 'og:description', meta.description)
  upsertMetaTag('name', 'description', meta.description)
  upsertMetaTag('name', 'twitter:card', 'summary_large_image')
  upsertMetaTag('name', 'twitter:title', meta.title)
  upsertMetaTag('name', 'twitter:description', meta.description)

  if (meta.image) {
    upsertMetaTag('property', 'og:image', meta.image)
    upsertMetaTag('name', 'twitter:image', meta.image)
  }
  if (meta.url) {
    upsertMetaTag('property', 'og:url', meta.url)
  }

  return () => {
    document.title = previousTitle
  }
}
