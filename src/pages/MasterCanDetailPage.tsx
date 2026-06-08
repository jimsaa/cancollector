import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Share2 } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { CommunityCountLabels } from '../components/master/CommunityCountLabels'
import { MasterCanCard } from '../components/master/MasterCanCard'
import { MasterCanStatusButtons } from '../components/master/MasterCanStatusButtons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { useMasterCans } from '../hooks/useMasterCans'
import { useUserCanStatus } from '../hooks/useUserCanStatus'
import { useUserWishlist } from '../hooks/useUserWishlist'
import { getCollectorSummary } from '../lib/collectorSummary'
import { getMasterCollectionSet } from '../lib/collectionSets'
import { findCountryVariants, getVariantCountryLabel } from '../lib/countryVariants'
import { attachMasterStatus } from '../lib/masterCanMatching'
import { fetchMasterCanById } from '../lib/masterCans'
import { toggleMasterCanStatus } from '../lib/masterCanStatusActions'
import {
  getMasterReferenceDisplayUrl,
  getMasterReferenceImageUrl,
} from '../lib/masterReferenceImage'
import { copyToClipboard, getAbsoluteUrl } from '../lib/socialShare'
import { fetchMasterCanCommunityCounts } from '../lib/userCanStatus'
import type { MasterCanCommunityCounts, MasterCanWithStatus } from '../types/masterCan'
import type { UserCanStatusType } from '../types/userCanStatus'

export function MasterCanDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { storageUserId } = useAuth()
  const { cans, add, remove, reload } = useCans(storageUserId)
  const { masterIds, reload: reloadWishlist } = useUserWishlist(storageUserId)
  const { statusMap, reload: reloadStatus } = useUserCanStatus(storageUserId)
  const { masters } = useMasterCans('all')

  const [master, setMaster] = useState<MasterCanWithStatus | null>(null)
  const [counts, setCounts] = useState<MasterCanCommunityCounts>({ got: 0, want: 0, need: 0 })
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMaster = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const row = await fetchMasterCanById(id)
      if (!row) {
        setMaster(null)
        return
      }
      const [withStatus] = attachMasterStatus([row], cans, masterIds, statusMap)
      setMaster(withStatus)
      setCounts(await fetchMasterCanCommunityCounts(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load can')
      setMaster(null)
    } finally {
      setLoading(false)
    }
  }, [id, cans, masterIds, statusMap])

  useEffect(() => {
    void loadMaster()
  }, [loadMaster])

  const variants = useMemo(() => {
    if (!master) return []
    return findCountryVariants(master, masters)
  }, [master, masters])

  const relatedSet = useMemo(() => {
    if (!master) return []
    const set = getMasterCollectionSet(master)
    return attachMasterStatus(
      masters.filter(
        (m) => m.id !== master.id && m.active !== false && getMasterCollectionSet(m) === set,
      ),
      cans,
      masterIds,
      statusMap,
    ).slice(0, 8)
  }, [master, masters, cans, masterIds, statusMap])

  const handleStatus = async (status: UserCanStatusType) => {
    if (!storageUserId || !master) return
    setStatusLoading(true)
    try {
      await toggleMasterCanStatus(master, status, master.userStatus, {
        userId: storageUserId,
        cans,
        add,
        remove,
        reloadCans: reload,
        reloadWishlist,
        reloadStatus,
      })
      await loadMaster()
    } finally {
      setStatusLoading(false)
    }
  }

  const handleShare = async () => {
    if (!master) return
    const url = getAbsoluteUrl(`/cans/${master.id}`)
    const text = `${master.product_name} on CanTrove\n${url}`
    const copied = await copyToClipboard(text)
    setShareMessage(copied ? 'Link copied!' : 'Could not copy link')
    setTimeout(() => setShareMessage(null), 2500)
  }

  const countryLabel = master ? getVariantCountryLabel(master) : null
  const collectionSet = master ? getMasterCollectionSet(master) : null

  return (
    <Layout title="Master Can">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-sm text-monster-muted hover:text-white"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {loading ? (
        <LoadingSpinner label="Loading product..." />
      ) : error ? (
        <EmptyState title="Could not load" description={error} />
      ) : !master ? (
        <EmptyState title="Can not found" description="This master catalog entry does not exist." />
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden p-0">
            <div className="flex min-h-[220px] items-center justify-center bg-monster-card p-6">
              {getMasterReferenceImageUrl(master) ? (
                <img
                  src={getMasterReferenceDisplayUrl(master)}
                  alt={master.product_name}
                  className="max-h-56 w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-4xl font-bold text-monster-muted">{master.brand[0]}</span>
              )}
            </div>
            <div className="p-4">
              <h1 className="text-xl font-bold text-white">{master.product_name}</h1>
              <p className="mt-1 text-sm text-monster-muted">
                {[master.brand, master.flavor, master.volume].filter(Boolean).join(' · ')}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-monster-muted">Set</dt>
                  <dd className="font-medium text-white">{collectionSet}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-monster-muted">Country</dt>
                  <dd className="font-medium text-white">{countryLabel ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-monster-muted">Rarity</dt>
                  <dd className="font-medium capitalize text-white">{master.rarity}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-monster-muted">Status</dt>
                  <dd className="font-medium text-white">
                    {master.discontinued ? 'Discontinued' : 'Active'}
                  </dd>
                </div>
                {master.release_date || master.release_year ? (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-monster-muted">Release</dt>
                    <dd className="font-medium text-white">
                      {master.release_date ?? String(master.release_year)}
                    </dd>
                  </div>
                ) : null}
                {master.barcode ? (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-monster-muted">Barcode</dt>
                    <dd className="font-mono text-xs text-monster-green">{master.barcode}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 rounded-xl border border-monster-border bg-monster-dark/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-monster-muted">
                  Collector summary
                </p>
                <p className="mt-1 text-sm text-white/90">{getCollectorSummary(master)}</p>
              </div>

              <div className="mt-3">
                <CommunityCountLabels counts={counts} />
              </div>

              <MasterCanStatusButtons can={master} loading={statusLoading} onStatus={handleStatus} />

              <Button
                type="button"
                variant="ghost"
                fullWidth
                className="mt-2"
                onClick={() => void handleShare()}
              >
                <Share2 size={16} />
                Share
              </Button>
              {shareMessage ? (
                <p className="mt-1 text-center text-xs text-monster-green">{shareMessage}</p>
              ) : null}
            </div>
          </Card>

          {variants.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-white">Country Variants</h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/cans/${master.id}`}
                  className="rounded-full bg-monster-green/20 px-3 py-1 text-xs font-semibold text-monster-green"
                >
                  {countryLabel ?? 'This variant'}
                </Link>
                {variants.map((variant) => (
                  <Link
                    key={variant.id}
                    to={`/cans/${variant.id}`}
                    className="rounded-full border border-monster-border px-3 py-1 text-xs text-monster-muted transition-colors hover:border-monster-green/50 hover:text-white"
                  >
                    {getVariantCountryLabel(variant) ?? variant.product_name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {relatedSet.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-white">More from {collectionSet}</h2>
              <div className="flex flex-col gap-3">
                {relatedSet.map((can) => (
                  <Link key={can.id} to={`/cans/${can.id}`}>
                    <MasterCanCard can={can} showOwnedBadge />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </Layout>
  )
}
