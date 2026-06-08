import { useEffect, useState } from 'react'
import type { MasterCan } from '../../types/masterCan'
import { COLLECTION_SETS } from '../../types/collectionSet'
import {
  formatMasterCanError,
  updateMasterCanCollectorFields,
  type MasterCanCollectorFieldsUpdate,
} from '../../lib/masterCanSupabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface AdminMasterCollectorEditModalProps {
  open: boolean
  master: MasterCan | null
  onClose: () => void
  onSaved: () => void
}

export function AdminMasterCollectorEditModal({
  open,
  master,
  onClose,
  onSaved,
}: AdminMasterCollectorEditModalProps) {
  const [form, setForm] = useState<MasterCanCollectorFieldsUpdate>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!master) return
    setForm({
      collection_set: master.collection_set,
      base_product_key: master.base_product_key,
      variant_country: master.variant_country,
      variant_region: master.variant_region,
      language_code: master.language_code,
      release_date: master.release_date,
      discontinued_date: master.discontinued_date,
      catalog_date: master.catalog_date,
      collector_summary: master.collector_summary,
    })
    setError(null)
  }, [master])

  if (!open || !master) return null

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateMasterCanCollectorFields(master.id, form)
      onSaved()
      onClose()
    } catch (err) {
      setError(formatMasterCanError(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-monster-border bg-monster-black p-4">
        <h2 className="text-lg font-bold text-white">Edit collector fields</h2>
        <p className="mt-1 text-sm text-monster-muted">{master.product_name}</p>

        <div className="mt-4 flex flex-col gap-3">
          <Select
            label="Collection set"
            value={form.collection_set ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, collection_set: e.target.value || null }))}
          >
            <option value="">Auto-detect</option>
            {COLLECTION_SETS.map((set) => (
              <option key={set} value={set}>
                {set}
              </option>
            ))}
          </Select>
          <Input
            label="Base product key"
            value={form.base_product_key ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, base_product_key: e.target.value || null }))}
            placeholder="ultra-paradise"
          />
          <Input
            label="Variant country"
            value={form.variant_country ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, variant_country: e.target.value || null }))}
            placeholder="US, Sweden, Germany..."
          />
          <Input
            label="Variant region"
            value={form.variant_region ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, variant_region: e.target.value || null }))}
          />
          <Input
            label="Language code"
            value={form.language_code ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, language_code: e.target.value || null }))}
            placeholder="en, sv, de..."
          />
          <Input
            label="Release date"
            type="date"
            value={form.release_date ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value || null }))}
          />
          <Input
            label="Discontinued date"
            type="date"
            value={form.discontinued_date ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, discontinued_date: e.target.value || null }))}
          />
          <Input
            label="Catalog date"
            type="date"
            value={form.catalog_date ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, catalog_date: e.target.value || null }))}
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-monster-muted">Collector summary</span>
            <textarea
              className="min-h-[100px] rounded-xl border border-monster-border bg-monster-card px-3 py-2 text-sm text-white"
              value={form.collector_summary ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, collector_summary: e.target.value || null }))
              }
              placeholder="Curated description for collectors..."
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={() => void handleSave()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
