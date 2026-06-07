import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useUserWishlist } from '../hooks/useUserWishlist'
import { computeCollectionProgress } from '../lib/collectionProgress'
import {
  attachMasterStatus,
  findWishlistEntryForMaster,
  masterCanToWishlistInsert,
} from '../lib/masterCanMatching'
import { addUserWishlist, removeUserWishlist } from '../lib/userWishlist'
import type { Rarity } from '../types/can'
import type { MasterBrandFilter, MasterCanWithStatus } from '../types/masterCan'

type DiscontinuedFilter = 'all' | 'active' | 'discontinued'

export function MissingCansPage() {
  const { storageUserId } = useAuth()
  const { cans, add, remove, reload } = useCans(storageUserId)
  const { masterIds, reload: reloadWishlist } = useUserWishlist(storageUserId)
  const [brand, setBrand] = useState<MasterBrandFilter>('all')
  const [search, setSearch] = useState('')
  const [rarity, setRarity] = useState<Rarity | 'all'>('all')
  const [country, setCountry] = useState('all')
  const [discontinued, setDiscontinued] = useState<DiscontinuedFilter>('all')
  const [wantLoadingId, setWantLoadingId] = useState<string | null>(null)
  const { masters, loading, error } = useMasterCans(brand)

  const progress = useMemo(
    () => computeCollectionProgress(masters, cans, brand),
    [masters, cans, brand],
  )

  const countryOptions = useMemo(() => {
    const values = new Set(
      masters.map((m) => m.country).filter((c): c is string => Boolean(c)),
    )
    return [...values].sort()
  }, [masters])

  const missing = useMemo(() => {
    const withStatus = attachMasterStatus(
      masters.filter((m) => m.active),
      cans,
      masterIds,
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
          (m.country?.toLowerCase().includes(q) ?? false) ||
          (m.barcode?.includes(q) ?? false),
      )
    }

    if (rarity !== 'all') {
      items = items.filter((m) => m.rarity === rarity)
    }

    if (country !== 'all') {
      items = items.filter((m) => m.country === country)
    }

    if (discontinued === 'active') {
      items = items.filter((m) => !m.discontinued)
    } else if (discontinued === 'discontinued') {
      items = items.filter((m) => m.discontinued)
    }

    return items.sort((a, b) => a.product_name.localeCompare(b.product_name))
  }, [masters, cans, masterIds, search, rarity, country, discontinued])

  const handleToggleWant = async (master: MasterCanWithStatus) => {
    if (!storageUserId) return
    setWantLoadingId(master.id)
    try {
      const existing = findWishlistEntryForMaster(master, cans)
      if (existing || master.wanted) {
        if (existing) await remove(existing.id)
        await removeUserWishlist(storageUserId, master.id)
      } else {
        await addUserWishlist(storageUserId, master.id)
        await add(masterCanToWishlistInsert(master))
      }
      await Promise.all([reload(), reloadWishlist()])
    } finally {
      setWantLoadingId(null)
    }
  }

  return (
    <Layout title="Missing Cans">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Master database cans you don&apos;t own yet. Tap <strong>Want</strong> to add to your
          wishlist.
        </p>

        <CollectionProgressCard progress={progress} showLink={false} />

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
          label="Discontinued"
          value={discontinued}
          onChange={(e) => setDiscontinued(e.target.value as DiscontinuedFilter)}
        >
          <option value="all">All cans</option>
          <option value="active">In production</option>
          <option value="discontinued">Discontinued only</option>
        </Select>

        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, brand, flavor, barcode..."
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-monster-muted">{missing.length} missing</p>
          <Link to="/wishlist" className="text-xs text-monster-green hover:underline">
            View wishlist
          </Link>
        </div>

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
                wantLoading={wantLoadingId === can.id}
                onToggleWant={handleToggleWant}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
