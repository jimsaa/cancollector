import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const source = path.join(root, 'src', 'assets', 'logo.png')
const outDir = path.join(root, 'public')

const icons = [
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
]

for (const { file, size } of icons) {
  const target = path.join(outDir, file)
  await sharp(source)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(target)
  console.log(`Wrote ${file} (${size}x${size})`)
}
