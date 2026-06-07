import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { CanFormFields, emptyFormData, formDataToInsert } from '../components/cans/CanForm'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import type { WishlistStatus } from '../types/can'

export function WishlistPage() {
  const { user } = useAuth()
  const { cans, loading, error, add, update } = useCans(user?.id)
  const [filter, setFilter] = useState<'all' | WishlistStatus>('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyFormData(true))
  const [saving, setSaving] = useState(false)

  const wishlist = useMemo(() => {
    let items = cans.filter((c) => c.is_wishlist)
    if (filter !== 'all') items = items.filter((c) => c.wishlist_status === filter)
    return items.sort((a, b) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime())
  }, [cans, filter])

  const handleAdd = async () => {
    setSaving(true)
    try {
      await add(formDataToInsert(form))
      setForm(emptyFormData(true))
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (id: string, status: WishlistStatus) => {
    await update(id, { wishlist_status: status })
  }

  return (
    <Layout title="Wishlist">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">Cans you want to find or are missing from your collection.</p>

        <div className="flex gap-2">
          {(['all', 'wanted', 'missing'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium capitalize ${
                filter === key
                  ? 'border-monster-green bg-monster-green/20 text-monster-green'
                  : 'border-monster-border text-monster-muted'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {!adding ? (
          <Button fullWidth variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={18} />
            Add to Wishlist
          </Button>
        ) : (
          <Card className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-white">New wishlist item</p>
            <CanFormFields data={form} onChange={setForm} showWishlistFields />
            <div className="grid grid-cols-2 gap-2">
              <Button loading={saving} onClick={handleAdd}>Save</Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {loading ? (
          <LoadingSpinner label="Loading wishlist..." />
        ) : error ? (
          <EmptyState title="Error" description={error} />
        ) : wishlist.length === 0 ? (
          <EmptyState
            icon={<Heart size={40} />}
            title="Wishlist is empty"
            description="Add cans you're looking for or missing from your collection."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {wishlist.map((can) => (
              <Card key={can.id} className="p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{can.name ?? 'Unknown'}</p>
                    <p className="text-xs text-monster-muted">
                      {[can.flavor, can.country, can.country_variant].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Link to={`/can/${can.id}`} className="text-xs text-monster-green hover:underline">
                    Edit
                  </Link>
                </div>
                <div className="flex gap-2">
                  {(['wanted', 'missing'] as WishlistStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatus(can.id, status)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize ${
                        can.wishlist_status === status
                          ? 'border-monster-green bg-monster-green/20 text-monster-green'
                          : 'border-monster-border text-monster-muted'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
