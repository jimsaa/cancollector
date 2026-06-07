import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { deleteTradeExtraImage, uploadTradeExtraImage } from '../../lib/tradeImages'

interface TradeExtraImagesProps {
  userId: string
  listingId: string
  images: string[]
  maxImages: number
  onChange: (urls: string[]) => void
  disabled?: boolean
}

export function TradeExtraImages({
  userId,
  listingId,
  images,
  maxImages,
  onChange,
  disabled,
}: TradeExtraImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (file: File) => {
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} extra images allowed.`)
      return
    }

    setUploading(true)
    setError(null)
    try {
      const url = await uploadTradeExtraImage(userId, listingId, images.length + 1, file)
      onChange([...images, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async (index: number) => {
    const url = images[index]
    await deleteTradeExtraImage(url).catch(() => undefined)
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-monster-muted">
        Extra images ({images.length}/{maxImages})
      </p>
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative aspect-square overflow-hidden rounded-lg bg-monster-dark">
              <img src={url} alt="" className="h-full w-full object-contain p-1" />
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => handleRemove(i)}
                className="absolute right-1 top-1 rounded bg-black/70 p-1 text-red-300 hover:bg-black"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading || images.length >= maxImages}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleAdd(file)
        }}
      />
      <Button
        type="button"
        variant="secondary"
        fullWidth
        loading={uploading}
        disabled={disabled || images.length >= maxImages}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={18} />
        Add extra image
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
