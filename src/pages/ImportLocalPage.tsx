import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudUpload, HardDrive } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { clearLocalCollection, getAllLocalCans } from '../lib/localCans'
import {
  importLocalCollectionToCloud,
  setImportStatus,
  type LocalImportResult,
} from '../lib/localImport'

export function ImportLocalPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const localCount = getAllLocalCans().length
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LocalImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showClearPrompt, setShowClearPrompt] = useState(false)

  const handleImport = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const importResult = await importLocalCollectionToCloud(user.id)
      setResult(importResult)
      setShowClearPrompt(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (user) setImportStatus(user.id, 'skipped')
    navigate('/', { replace: true })
  }

  const handleClearLocal = (clear: boolean) => {
    if (clear) clearLocalCollection()
    navigate('/', { replace: true })
  }

  if (showClearPrompt && result) {
    return (
      <Layout title="Import Complete" hideNav>
        <div className="mx-auto flex max-w-sm flex-col gap-6 pt-8">
          <Card>
            <h2 className="mb-2 text-lg font-semibold text-white">Import complete</h2>
            <p className="text-sm text-monster-muted">
              Imported {result.imported}, merged {result.merged}, skipped {result.skipped} of{' '}
              {result.total} local cans.
            </p>
          </Card>

          <Card>
            <p className="mb-4 text-sm text-white">
              Clear the local backup from this device? Your cloud collection is saved online.
            </p>
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={() => handleClearLocal(true)}>
                Yes, clear local backup
              </Button>
              <Button variant="secondary" fullWidth onClick={() => handleClearLocal(false)}>
                Keep local backup
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Import Collection" hideNav>
      <div className="mx-auto flex max-w-sm flex-col gap-6 pt-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-monster-green/20">
            <CloudUpload size={32} className="text-monster-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">Import local collection?</h1>
          <p className="mt-2 text-sm text-monster-muted">
            We found {localCount} can{localCount === 1 ? '' : 's'} saved on this device from Local
            Mode.
          </p>
        </div>

        <Card>
          <div className="mb-4 flex items-start gap-3 text-sm text-monster-muted">
            <HardDrive size={20} className="mt-0.5 shrink-0 text-monster-green" />
            <p>
              Duplicates (same barcode, country, and variant) will be merged by increasing quantity.
              Wishlist duplicates are skipped.
            </p>
          </div>

          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

          <div className="flex flex-col gap-2">
            <Button fullWidth loading={loading} onClick={handleImport}>
              Import to cloud
            </Button>
            <Button variant="secondary" fullWidth onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
