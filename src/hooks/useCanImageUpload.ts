import { useCallback, useState } from 'react'
import { useGuestStorage } from '../lib/guestStorage'
import { prepareCanImage, uploadCanImage } from '../lib/storage'

export function useCanImageUpload(userId: string | undefined, canId?: string) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)

  const clearUploadState = useCallback(() => {
    setUploadError(null)
    setSizeWarning(null)
    setPendingBlob(null)
  }, [])

  const processFile = useCallback(
    async (file: File): Promise<string> => {
      if (!userId) throw new Error('Not signed in')

      setUploading(true)
      setUploadError(null)
      setSizeWarning(null)

      try {
        const prepared = await prepareCanImage(file)
        if (prepared.warning) setSizeWarning(prepared.warning)

        if (useGuestStorage()) {
          return prepared.dataUrl
        }

        if (canId) {
          const url = await uploadCanImage(userId, canId, prepared.blob)
          setPendingBlob(null)
          return url
        }

        setPendingBlob(prepared.blob)
        return prepared.dataUrl
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Image upload failed'
        setUploadError(message)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [userId, canId],
  )

  const uploadPendingForCan = useCallback(
    async (targetCanId: string, previewDataUrl?: string): Promise<string> => {
      if (!userId) throw new Error('Not signed in')
      if (useGuestStorage()) return previewDataUrl ?? ''

      if (pendingBlob) {
        setUploading(true)
        setUploadError(null)
        try {
          const url = await uploadCanImage(userId, targetCanId, pendingBlob)
          setPendingBlob(null)
          return url
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Image upload failed'
          setUploadError(message)
          throw err
        } finally {
          setUploading(false)
        }
      }

      if (previewDataUrl?.startsWith('data:')) {
        const res = await fetch(previewDataUrl)
        const blob = await res.blob()
        return uploadCanImage(userId, targetCanId, blob)
      }

      return previewDataUrl ?? ''
    },
    [userId, pendingBlob],
  )

  return {
    uploading,
    uploadError,
    sizeWarning,
    pendingBlob,
    processFile,
    uploadPendingForCan,
    clearUploadState,
    setUploadError,
  }
}
