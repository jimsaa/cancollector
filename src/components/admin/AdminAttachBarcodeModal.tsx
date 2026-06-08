import { useState } from 'react'
import type { MasterBarcodeSource } from '../../types/masterCan'
import type { MasterCan } from '../../types/masterCan'
import { AdminApproveModal } from './AdminApproveModal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface AdminAttachBarcodeModalProps {
  open: boolean
  master: MasterCan | null
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (barcode: string, source: MasterBarcodeSource) => void
}

export function AdminAttachBarcodeModal({
  open,
  master,
  saving,
  error,
  onClose,
  onSave,
}: AdminAttachBarcodeModalProps) {
  const [barcode, setBarcode] = useState('')
  const [source, setSource] = useState<MasterBarcodeSource>('admin_manual')

  const handleClose = () => {
    setBarcode('')
    setSource('admin_manual')
    onClose()
  }

  return (
    <AdminApproveModal
      open={open}
      title="Attach barcode"
      approveLabel="Save barcode"
      approving={saving}
      onClose={handleClose}
      onApprove={() => onSave(barcode.trim(), source)}
    >
      {master ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-monster-muted">
            Link a scanned or manual barcode to{' '}
            <span className="font-semibold text-white">{master.product_name}</span>.
          </p>
          <Input
            label="Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="EAN / UPC"
            className="w-full"
          />
          <Select
            label="Barcode source"
            value={source}
            onChange={(e) => setSource(e.target.value as MasterBarcodeSource)}
            className="w-full"
          >
            <option value="admin_manual">Admin manual</option>
            <option value="user_scan">User scan</option>
          </Select>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      ) : null}
    </AdminApproveModal>
  )
}
