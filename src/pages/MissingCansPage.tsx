import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { BrandFilter } from '../components/master/BrandFilter'
import { CollectionProgressCard } from '../components/master/CollectionProgressCard'
import { MasterCanCard } from '../components/master/MasterCanCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { useMasterCans } from '../hooks/useMasterCans'
import { useUserCanStatus } from '../hooks/useUserCanStatus'
import { useUserWishlist } from '../hooks/useUserWishlist'
import { getMasterCollectionSet } from '../lib/collectionSets'
import { getVariantCountryLabel } from '../lib/countryVariants'
import { computeCollectionProgress } from '../lib/collectionProgress'
import { attachMasterStatus } from '../lib/masterCanMatching'
import { toggleMasterCanStatus } from '../lib/masterCanStatusActions'
import { fetchCommunityCountsForMasters } from '../lib/userCanStatus'
import { COLLECTION_SETS } from '../types/collectionSet'
import type { Rarity } from '../types/can'
import type { MasterBrandFilter, MasterCanCommunityCounts, MasterCanWithStatus } from '../types/masterCan'
import type { UserCanStatusType } from '../types/userCanStatus'

type DiscontinuedFilter = 'all' | 'active' | 'discontinued'

export function MissingCansPage() {
  const [searchParams] = useSearchParams()
  const { storageUserId } = useAuth()
  const { cans, add, remove, reload } = useCans(storageUserId)
  const { masterIds, reload: reloadWishlist } = useUserWishlist(storageUserId)
  const { statusMap, reload: reloadStatus } = useUserCanStatus(storageUserId)
  const [brand, setBrand] = useState<MasterBrandFilter>('all')
  const [search, setSearch] = useState('')
  const [rarity, setRarity] = useState<Rarity | 'all'>('all')
  const [country, setCountry] = useState('all')
  const [collectionSet, setCollectionSet] = useState('all')
  const [discontinued, setDiscontinued] = useState<DiscontinuedFilter>('all')
  const [wantedOnly, setWantedOnly] = useState(false)
  const [neededOnly, setNeededOnly] = useState(false)
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null)
  const [communityCounts, setCommunityCounts] = useState<Record<string, MasterCanCommunityCounts>>({})
  const { masters, loading, error } = useMasterCans(brand)

  useEffect(() => {
    const setParam = searchParams.get('set')
    if (setParam && COLLECTION_SETS.includes(setParam as (typeof COLLECTION_SETS)[number])) {
      setCollectionSet(setParam)
    }
  }, [searchParams])

  const progress = useMemo(
    () => computeCollectionProgress(masters, cans, brand),
    [masters, cans, brand],
  )

  const countryOptions = useMemo(() => {
    const values = new Set<string>()
    for (const m of masters) {
      const label = getVariantCountryLabel(m)
      if (label) values.add(label)
    }
    return [...values].sort()
  }, [masters])

  const missing = useMemo(() => {
    const withStatus = attachMasterStatus(
      masters.filter((m) => m.active),
      cans,
      masterIds,
      statusMap,
    )
    let items = withStatus.filter((m) => !m.owned)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(
        (m) =>
          m.product_name.toLowerCase().includes(q) ||
          m.brand.toLowerCase().includes(q) ||
          (m.flavor?.toLowerCase().includes(q) ?? false) ||
          (m.variant_name?.toLowerCase().includes(q) ?? false) ||
          (getVariantCountryLabel(m)?.toLowerCase().includes(q) ?? false) ||
          (m.barcode?.includes(q) ?? false),
      )
    }

    if (rarity !== 'all') {
      items = items.filter((m) => m.rarity === rarity)
    }

    if (country !== 'all') {
      items = items.filter((m) => getVariantCountryLabel(m) === country)
    }

    if (collectionSet !== 'all') {
      items = items.filter((m) => getMasterCollectionSet(m) === collectionSet)
    }

    if (discontinued === 'active') {
      items = items.filter((m) => !m.discontinued)
    } else if (discontinued === 'discontinued') {
      items = items.filter((m) => m.discontinued)
    }

    if (wantedOnly) {
      items = items.filter((m) => m.wanted)
    }

    if (neededOnly) {
      items = items.filter((m) => m.needed)
    }

    return items.sort((a, b) => a.product_name.localeCompare(b.product_name))
  }, [
    masters,
    cans,
    masterIds,
    statusMap,
    search,
    rarity,
    country,
    collectionSet,
    discontinued,
    wantedOnly,
    neededOnly,
  ])

  useEffect(() => {
    if (missing.length === 0) {
      setCommunityCounts({})
      return
    }
    let active = true
    void fetchCommunityCountsForMasters(missing.map((m) => m.id)).then((counts) => {
      if (active) setCommunityCounts(counts)
    })
    return () => {
      active = false
    }
  }, [missing])

  const handleStatus = async (master: MasterCanWithStatus, status: UserCanStatusType) => {
    if (!storageUserId) return
    setStatusLoadingId(master.id)
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
    } finally {
      setStatusLoadingId(null)
    }
  }

  return (
    <Layout title="Missing Cans">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Master database cans you don&apos;t own yet. Mark cans as{' '}
          <strong className="text-white">Want</strong> or <strong className="text-white">Need</strong>,
          or tap <strong className="text-white">Got it</strong> when you add one to your collection.
        </p>

        <CollectionProgressCard progress={progress} showLink={false} />

        <div className="flex gap-3">
          <Link to="/sets" className="text-xs text-monster-green hover:underline">
            View collection sets →
          </Link>
          <Link to="/wishlist" className="text-xs text-monster-green hover:underline">
            View wishlist →
          </Link>
        </div>

        <BrandFilter value={brand} onChange={setBrand} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Rarity" value={rarity} onChange={(e) => setRarity(e.target.value as Rarity | 'all')}>
            <option value="all">All rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="unknown">Unknown</option>
          </Select>
          <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="all">All countries</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label="Collection set"
          value={collectionSet}
          onChange={(e) => setCollectionSet(e.target.value)}
        >
          <option value="all">All sets</option>
          {COLLECTION_SETS.map((set) => (
            <option key={set} value={set}>
              {set}
            </option>
          ))}
        </Select>

        <Select
          label="Discontinued"
          value={discontinued}
          onChange={(e) => setDiscontinued(e.target.value as DiscontinuedFilter)}
        >
          <option value="all">All cans</option>
          <option value="active">In production</option>
          <option value="discontinued">Discontinued only</option>
        </Select>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-monster-muted">
            <input
              type="checkbox"
              checked={wantedOnly}
              onChange={(e) => setWantedOnly(e.target.checked)}
              className="accent-monster-green"
            />
            Wanted only
          </label>
          <label className="flex items-center gap-2 text-sm text-monster-muted">
            <input
              type="checkbox"
              checked={neededOnly}
              onChange={(e) => setNeededOnly(e.target.checked)}
              className="accent-monster-green"
            />
            Needed only
          </label>
        </div>

        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, brand, flavor, barcode..."
        />

        <p className="text-xs text-monster-muted">{missing.length} missing</p>

        {loading ? (
          <LoadingSpinner label="Loading master database..." />
        ) : error ? (
          <EmptyState title="Could not load database" description={error} />
        ) : missing.length === 0 ? (
          <EmptyState
            icon={<Search size={40} />}
            title="Nothing missing"
            description={
              search
                ? 'No missing cans match your filters.'
                : 'You own every can in the master database for this filter. Nice!'
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {missing.map((can) => (
              <MasterCanCard
                key={can.id}
                can={can}
                showOwnedBadge={false}
                showStatusButtons
                linkToDetail
                statusLoading={statusLoadingId === can.id}
                communityCounts={communityCounts[can.id]}
                onStatus={handleStatus}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
