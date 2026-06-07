import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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
import { formatImportResult } from '../lib/guestMessaging'
import { formatSupabaseError, logAuthError } from '../lib/supabaseDebug'

export function ImportLocalPage() {
  const { user, isCloudSynced, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const localCount = getAllLocalCans().length

  useEffect(() => {
    if (!authLoading && isCloudSynced && localCount === 0) {
      navigate('/', { replace: true })
    }
  }, [authLoading, isCloudSynced, localCount, navigate])

  if (!authLoading && !isCloudSynced) {
    return <Navigate to="/login" replace />
  }

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

      if (
        importResult.failed === 0 &&
        (importResult.imported > 0 || importResult.merged > 0)
      ) {
        setShowClearPrompt(true)
      } else if (importResult.failed > 0) {
        const detail = importResult.errors[0] ?? 'Unknown error'
        setError(
          importResult.errors.length > 1
            ? `${importResult.failed} can(s) failed. First error: ${detail}`
            : detail,
        )
      } else if (importResult.skipped > 0 && importResult.failed === 0) {
        setError('All local cans were already in your cloud collection. Nothing new to import.')
      }
    } catch (err) {
      logAuthError('IMPORT_LOCAL_CANS_ERROR', err)
      const message = formatSupabaseError(err, 'Import failed')
      console.error('[IMPORT_LOCAL_CANS_ERROR] detail:', message, err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleLater = () => {
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
            <p className="text-sm text-monster-green">
              {formatImportResult(
                result.imported,
                result.merged,
                result.skipped,
                result.failed,
              )}
            </p>
            {result.failed > 0 ? (
              <div className="mt-3 rounded-lg border border-yellow-600/30 bg-yellow-950/20 px-3 py-2">
                <p className="text-xs font-semibold text-yellow-200">Some cans could not be imported</p>
                <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-yellow-100/90">
                  {result.errors.slice(0, 5).map((entry) => (
                    <li key={entry} className="mt-1">
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-2 text-xs text-monster-muted">
              Your collection is now synced to your account.
            </p>
          </Card>

          <Card>
            <p className="mb-4 text-sm text-white">
              Remove the local copy from this device? Your account collection is saved online.
            </p>
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={() => handleClearLocal(true)}>
                Yes, clear local copy
              </Button>
              <Button variant="secondary" fullWidth onClick={() => handleClearLocal(false)}>
                Keep local copy
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
          <h1 className="text-2xl font-bold text-white">Import local collection to your account?</h1>
          <p className="mt-2 text-sm text-monster-muted">
            We found {localCount} can{localCount === 1 ? '' : 's'} saved on this device from Guest
            Mode.
          </p>
        </div>

        <Card>
          <div className="mb-4 flex items-start gap-3 text-sm text-monster-muted">
            <HardDrive size={20} className="mt-0.5 shrink-0 text-monster-green" />
            <p>
              Duplicate barcodes (same country and variant) are skipped or merged. Your online
              collection stays tidy.
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button fullWidth loading={loading} onClick={handleImport}>
              Import Now
            </Button>
            <Button variant="secondary" fullWidth onClick={handleLater}>
              Later
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
