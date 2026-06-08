import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'

interface AdminApproveModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  onApprove: () => void
  approving?: boolean
  approveLabel?: string
}

export function AdminApproveModal({
  open,
  title,
  children,
  onClose,
  onApprove,
  approving = false,
  approveLabel = 'Approve to master_cans',
}: AdminApproveModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-approve-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75"
        aria-label="Close modal"
        onClick={onClose}
      />

      <div className="relative flex w-full max-w-md max-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-monster-green/40 bg-monster-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-monster-border px-4 py-3">
          <h2 id="admin-approve-modal-title" className="text-sm font-semibold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-monster-muted hover:bg-monster-dark hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="flex w-full flex-col gap-3">{children}</div>
        </div>

        <div className="shrink-0 border-t border-monster-border bg-monster-card px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" fullWidth onClick={onClose} disabled={approving}>
              Cancel
            </Button>
            <Button fullWidth loading={approving} onClick={onApprove}>
              {approveLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
