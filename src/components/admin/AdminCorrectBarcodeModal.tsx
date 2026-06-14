import { useEffect, useState } from 'react'
import type { MasterCan } from '../../types/masterCan'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface AdminCorrectBarcodeModalProps {
  master: MasterCan | null
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (input: { barcode: string; sku: string; external_product_id: string }) => void
}

export function AdminCorrectBarcodeModal({
  master,
  saving,
  error,
  onClose,
  onSave,
}: AdminCorrectBarcodeModalProps) {
  const [barcode, setBarcode] = useState(master?.barcode ?? '')
  const [sku, setSku] = useState(master?.sku ?? '')
  const [externalProductId, setExternalProductId] = useState(master?.external_product_id ?? '')

  useEffect(() => {
    setBarcode(master?.barcode ?? '')
    setSku(master?.sku ?? '')
    setExternalProductId(master?.external_product_id ?? '')
  }, [master?.id, master?.barcode, master?.sku, master?.external_product_id])

  if (!master) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        className="max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-2rem))] w-full max-w-lg overflow-y-auto rounded-2xl border border-monster-border bg-monster-card p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <p className="text-lg font-semibold text-white">Correct Barcode / SKU</p>
        <p className="mt-1 text-sm text-monster-muted">{master.product_name}</p>
        {master.corrected_at ? (
          <p className="mt-2 text-xs text-monster-muted">
            Last corrected {new Date(master.corrected_at).toLocaleString()}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3">
          <Input label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input
            label="Product ID"
            value={externalProductId}
            onChange={(e) => setExternalProductId(e.target.value)}
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            loading={saving}
            onClick={() =>
              onSave({
                barcode: barcode.trim(),
                sku: sku.trim(),
                external_product_id: externalProductId.trim(),
              })
            }
          >
            Save correction
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
