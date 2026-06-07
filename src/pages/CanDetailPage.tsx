import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { fetchCanById } from '../lib/cans'
import type { Can } from '../types/can'

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 border-b border-monster-border py-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-monster-muted">{label}</span>
      <span className="text-right text-sm text-white">{value}</span>
    </div>
  )
}

export function CanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { update, remove } = useCans(user?.id)
  const navigate = useNavigate()

  const [can, setCan] = useState<Can | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notes, setNotes] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchCanById(id)
      .then((data) => {
        if (!data) {
          setError('Can not found')
          return
        }
        setCan(data)
        setNotes(data.notes ?? '')
        setPurchaseDate(data.purchase_date ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  const saveField = async (updates: Parameters<typeof update>[1]) => {
    if (!can) return
    setSaving(true)
    try {
      const updated = await update(can.id, updates)
      setCan(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!can || !confirm('Delete this can from your collection?')) return
    setDeleting(true)
    try {
      await remove(can.id)
      navigate('/collection')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Can Details" hideNav>
        <LoadingSpinner fullPage label="Loading can..." />
      </Layout>
    )
  }

  if (error || !can) {
    return (
      <Layout title="Can Details" hideNav>
        <EmptyState title="Can not found" description={error ?? undefined} />
        <Link to="/collection" className="mt-4 block text-center text-sm text-monster-green">
          Back to collection
        </Link>
      </Layout>
    )
  }

  return (
    <Layout title="Can Details" hideNav>
      <Link
        to="/collection"
        className="mb-4 inline-flex items-center gap-1 text-sm text-monster-muted hover:text-white"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden p-0">
          <div className="aspect-square bg-monster-dark">
            {can.image_url ? (
              <img
                src={can.image_url}
                alt={can.name ?? 'Can'}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl font-black text-monster-green/20">M</span>
              </div>
            )}
          </div>
        </Card>

        <div>
          <h1 className="text-xl font-bold text-white">{can.name ?? 'Unknown Can'}</h1>
          {can.flavor ? <p className="text-sm text-monster-muted">{can.flavor}</p> : null}
        </div>

        <Card>
          <MetaRow label="Brand" value={can.brand} />
          <MetaRow label="Barcode" value={can.barcode} />
          <MetaRow label="Volume" value={can.volume} />
          <MetaRow label="Country" value={can.country} />
          <MetaRow label="Rarity" value={can.rarity} />
          <MetaRow label="Quantity" value={String(can.quantity)} />
          <MetaRow label="Added" value={new Date(can.added_date).toLocaleDateString()} />
        </Card>

        <Card className="flex flex-col gap-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Opened</span>
            <input
              type="checkbox"
              checked={can.opened}
              disabled={saving}
              onChange={(e) => saveField({ opened: e.target.checked })}
              className="h-5 w-5 accent-monster-green"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm">Available for trade</span>
            <input
              type="checkbox"
              checked={can.available_for_trade}
              disabled={saving}
              onChange={(e) => saveField({ available_for_trade: e.target.checked })}
              className="h-5 w-5 accent-monster-green"
            />
          </label>

          <Input
            label="Purchase Date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            onBlur={() => {
              if (purchaseDate !== (can.purchase_date ?? '')) {
                saveField({ purchase_date: purchaseDate || null })
              }
            }}
          />

          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (can.notes ?? '')) {
                saveField({ notes: notes || null })
              }
            }}
          />
        </Card>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
          <Trash2 size={18} />
          Delete Can
        </Button>
      </div>
    </Layout>
  )
}
