import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cloud, Crown, HardDrive, ShieldAlert } from 'lucide-react'
import { BackupControls } from '../components/cans/BackupControls'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useGuestMessaging } from '../hooks/useGuestMessaging'
import { useCans } from '../hooks/useCans'
import { getBackupPreview, getLastBackupDate } from '../lib/backup'
import { hasCloudAccount } from '../lib/premium'

export function BackupPage() {
  const { storageUserId, isGuest, isCloudSynced, isPremium, premiumFeatures } = useAuth()
  const { triggerRegisterCTA } = useGuestMessaging()
  const { cans, loading, importCollection } = useCans(storageUserId)
  const [lastBackup, setLastBackup] = useState(() => getLastBackupDate(storageUserId))

  const hasAccount = hasCloudAccount(isCloudSynced)
  const preview = useMemo(() => getBackupPreview(cans), [cans])

  const refreshLastBackup = () => {
    setLastBackup(getLastBackupDate(storageUserId))
  }

  return (
    <Layout title="Backup">
      <div className="flex flex-col gap-4">
        {isGuest ? (
          <Card className="border-yellow-600/30 bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="mt-0.5 shrink-0 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-100">
                  Your collection is currently saved only on this device.
                </p>
                <p className="mt-1 text-xs text-yellow-200/80">
                  Create a free account to sync online, or use Premium backup export when available.
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {!hasAccount ? (
          <Card>
            <p className="text-sm text-white">
              Create an account to unlock Premium backup features later.
            </p>
          </Card>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading collection..." />
        ) : (
          <>
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <HardDrive size={18} className="text-monster-green" />
                <p className="text-sm font-semibold text-white">What will be exported</p>
              </div>
              <ul className="flex flex-col gap-2 text-sm text-monster-muted">
                <li className="flex justify-between">
                  <span>Collection cans</span>
                  <span className="font-medium text-white">{preview.collectionCount}</span>
                </li>
                <li className="flex justify-between">
                  <span>Wishlist items</span>
                  <span className="font-medium text-white">{preview.wishlistCount}</span>
                </li>
                <li className="flex justify-between">
                  <span>Total quantity</span>
                  <span className="font-medium text-white">{preview.totalQuantity}</span>
                </li>
                <li className="flex justify-between">
                  <span>Brands</span>
                  <span className="max-w-[60%] text-right font-medium text-white">
                    {preview.brands.length > 0 ? preview.brands.join(', ') : '—'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Format</span>
                  <span className="font-medium text-white">JSON (v1)</span>
                </li>
              </ul>
            </Card>

            {isPremium && lastBackup ? (
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-monster-muted">
                  Last backup
                </p>
                <p className="mt-1 text-sm text-white">
                  {new Date(lastBackup).toLocaleString()}
                </p>
              </Card>
            ) : null}

            {storageUserId ? (
              <BackupControls
                cans={cans}
                userId={storageUserId}
                onImport={importCollection}
                canExportBackup={premiumFeatures.canExportBackup}
                canImportBackup={premiumFeatures.canImportBackup}
                onExportComplete={refreshLastBackup}
                onLockedAction={() => triggerRegisterCTA('backup')}
              />
            ) : null}

            {!isPremium ? (
              <Card className="border-monster-green/30 bg-monster-green/5">
                <div className="flex items-start gap-3">
                  <Crown size={20} className="mt-0.5 shrink-0 text-yellow-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Upgrade to Premium to export and protect your collection.
                    </p>
                    <p className="mt-1 text-xs text-monster-muted">
                      Free accounts can preview backup contents. Premium unlocks JSON export,
                      import, and restore.
                    </p>
                    {hasAccount ? (
                      <Link to="/premium" className="mt-3 inline-block">
                        <Button>View Premium</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            ) : null}

            {premiumFeatures.canUseCloudBackup ? (
              <Card>
                <div className="flex items-start gap-3">
                  <Cloud size={20} className="mt-0.5 shrink-0 text-monster-green" />
                  <div>
                    <p className="text-sm font-semibold text-white">Cloud backup</p>
                    <p className="mt-1 text-xs text-monster-muted">
                      Automatic cloud snapshots are coming soon. Use JSON export to protect your
                      collection today.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </Layout>
  )
}
