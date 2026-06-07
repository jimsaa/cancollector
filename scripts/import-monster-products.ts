/**
 * Fetches Monster Energy US product listings and writes pending import JSON.
 * Does NOT download images — stores external image URLs only.
 *
 * Usage: npm run import:monster-products
 */
import { execFile } from 'node:child_process'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import type {
  OfficialProductImportFile,
  OfficialProductImportRecord,
} from '../src/types/officialProductImport.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOURCE_URL = 'https://www.monsterenergy.com/en-us/energy-drinks/'
const BASE_ORIGIN = 'https://www.monsterenergy.com'
const BRAND = 'Monster Energy'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const execFileAsync = promisify(execFile)

function decodeHtml(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizePageUrl(href: string): string {
  const absolute = href.startsWith('http') ? href : `${BASE_ORIGIN}${href}`
  const url = new URL(absolute)
  url.hash = ''
  if (url.pathname.endsWith('/')) {
    return url.toString()
  }
  url.pathname = `${url.pathname}/`
  return url.toString()
}

function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function inferCategoryFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const drinksIndex = segments.indexOf('energy-drinks')
  const lineSlug = drinksIndex >= 0 ? segments[drinksIndex + 1] : null
  if (!lineSlug) return 'Energy Drinks'
  return slugToLabel(lineSlug)
}

function buildProductName(category: string, flavor: string): string {
  const flavorLower = flavor.toLowerCase()
  const categoryLower = category.toLowerCase()
  if (flavorLower.includes(categoryLower)) return flavor
  if (category === 'Monster Energy') return `Monster Energy ${flavor}`.trim()
  return `${category} ${flavor}`.trim()
}

function extractProducts(html: string): OfficialProductImportRecord[] {
  const byUrl = new Map<string, OfficialProductImportRecord>()
  const cardPattern =
    /data-product-id="(\d+)"\s+href="([^"]+)"[\s\S]*?class="category-name">([^<]*)<\/p>\s*<h3 class="product-name"[^>]*>([^<]*)<\/h3>[\s\S]*?src="(https:\/\/web-assests\.monsterenergy\.com\/[^"]+\.png)"/gi

  let match: RegExpExecArray | null
  while ((match = cardPattern.exec(html)) !== null) {
    const [, productId, href, rawCategory, rawFlavor, imageUrl] = match
    const flavor = decodeHtml(rawFlavor)
    if (!flavor) continue

    const productPageUrl = normalizePageUrl(href)
    if (byUrl.has(productPageUrl)) continue

    const categoryName = decodeHtml(rawCategory) || inferCategoryFromPath(new URL(productPageUrl).pathname)
    const productName = buildProductName(categoryName, flavor)

    byUrl.set(productPageUrl, {
      brand: BRAND,
      product_name: productName,
      category: categoryName,
      flavor,
      product_page_url: productPageUrl,
      image_url: imageUrl,
      source: 'official_site',
      status: 'pending',
      external_product_id: productId ?? null,
    })
  }

  return [...byUrl.values()].sort((a, b) => a.product_name.localeCompare(b.product_name))
}

async function fetchPageHtml(): Promise<string> {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.monsterenergy.com/',
      },
      redirect: 'follow',
    })

    if (response.ok) {
      return await response.text()
    }

    console.warn(`[import-monster-products] fetch() returned ${response.status}, trying curl fallback`)
  } catch (err) {
    console.warn('[import-monster-products] fetch() failed, trying curl fallback:', err)
  }

  const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
  const { stdout } = await execFileAsync(curlBin, [
    '-sL',
    '-A',
    USER_AGENT,
    '-H',
    'Accept-Language: en-US,en;q=0.9',
    '--max-time',
    '45',
    SOURCE_URL,
  ])

  if (!stdout || typeof stdout !== 'string') {
    throw new Error('curl fallback returned empty HTML')
  }

  return stdout
}

async function main(): Promise<void> {
  console.info(`[import-monster-products] Fetching ${SOURCE_URL}`)

  const html = await fetchPageHtml()
  const products = extractProducts(html)

  if (products.length === 0) {
    throw new Error('No products parsed — page structure may have changed')
  }

  const payload: OfficialProductImportFile = {
    scraped_at: new Date().toISOString(),
    source_page_url: SOURCE_URL,
    product_count: products.length,
    products,
  }

  const dataDir = path.join(ROOT, 'data', 'imports')
  const publicDir = path.join(ROOT, 'public', 'data', 'imports')
  const outputPath = path.join(dataDir, 'monster-products.json')
  const publicPath = path.join(publicDir, 'monster-products.json')

  await mkdir(dataDir, { recursive: true })
  await mkdir(publicDir, { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  await copyFile(outputPath, publicPath)

  console.info(`[import-monster-products] Wrote ${products.length} products`)
  console.info(`[import-monster-products] ${outputPath}`)
  console.info(`[import-monster-products] ${publicPath}`)
}

main().catch((err) => {
  console.error('[import-monster-products] Failed:', err)
  process.exit(1)
})
