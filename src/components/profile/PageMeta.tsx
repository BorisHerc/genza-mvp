import { useEffect } from 'react'
import { translate } from '../../lib/i18n'

interface PageMetaProps {
  title: string
  description?: string
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogUrl?: string
  ogType?: string
  ogImage?: string
}

function getDefaultTitle() {
  return translate('meta.defaultTitle')
}

function getDefaultDescription() {
  return translate('meta.defaultDescription')
}

function upsertMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${key}"]`)

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function upsertCanonicalLink(href?: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null

  if (!href) {
    link?.remove()
    return
  }

  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }

  link.href = href
}

export function PageMeta({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogUrl,
  ogType = 'website',
  ogImage,
}: PageMetaProps) {
  useEffect(() => {
    const defaultTitle = getDefaultTitle()
    const defaultDescription = getDefaultDescription()

    document.title = title

    upsertMetaTag('name', 'description', description ?? defaultDescription)
    upsertCanonicalLink(canonicalUrl)

    upsertMetaTag('property', 'og:title', ogTitle ?? title)
    upsertMetaTag('property', 'og:description', ogDescription ?? description ?? defaultDescription)
    upsertMetaTag('property', 'og:type', ogType)
    if (ogUrl) upsertMetaTag('property', 'og:url', ogUrl)
    if (ogImage) upsertMetaTag('property', 'og:image', ogImage)
    upsertMetaTag('property', 'og:site_name', 'Genza')

    upsertMetaTag('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary')
    upsertMetaTag('name', 'twitter:title', ogTitle ?? title)
    upsertMetaTag('name', 'twitter:description', ogDescription ?? description ?? defaultDescription)
    if (ogImage) upsertMetaTag('name', 'twitter:image', ogImage)

    return () => {
      document.title = defaultTitle
      upsertMetaTag('name', 'description', defaultDescription)
      upsertCanonicalLink(undefined)
    }
  }, [title, description, canonicalUrl, ogTitle, ogDescription, ogUrl, ogType, ogImage])

  return null
}
