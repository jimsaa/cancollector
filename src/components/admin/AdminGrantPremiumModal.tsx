import { useEffect, useState } from 'react'
import type { AdminUserRow } from '../../types/premium'
import { PREMIUM_SOURCE_PRESETS, type PremiumSource } from '../../types/premium'
import { DEFAULT_PREMIUM_SOURCE } from '../../lib/adminUsers'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface AdminGrantPremiumModalProps {
  open: boolean
  user: AdminUserRow | null
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (input: {
    lifetime: boolean
    expiresAt: string | null
    premiumSource: PremiumSource
    notes: string | null
  }) => void
}

export function AdminGrantPremiumModal({
  open,
  user,
  saving,
  error,
  onClose,
  onSave,
}: AdminGrantPremiumModalProps) {
  const [lifetime, setLifetime] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [premiumSource, setPremiumSource] = useState<PremiumSource>(DEFAULT_PREMIUM_SOURCE)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user) return
    setLifetime(true)
    setExpiresAt('')
    setPremiumSource(DEFAULT_PREMIUM_SOURCE)
    setNotes(user.premium_notes ?? '')
  }, [user])

  if (!open || !user) return null

  const handleSubmit = () => {
    onSave({
      lifetime,
      expiresAt: lifetime ? null : expiresAt || null,
      premiumSource,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-monster-border bg-monster-black p-4">
        <h2 className="text-lg font-bold text-white">Grant Premium</h2>
        <p className="mt-1 text-sm text-monster-muted">
          {user.username ? `@${user.username}` : user.display_name ?? user.email ?? user.id}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="radio"
                checked={lifetime}
                onChange={() => setLifetime(true)}
                className="accent-monster-green"
              />
              Lifetime Premium
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="radio"
                checked={!lifetime}
                onChange={() => setLifetime(false)}
                className="accent-monster-green"
              />
              Premium until date
            </label>
          </div>

          {!lifetime ? (
            <Input
              label="Expires on"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          ) : null}

          <Select
            label="Premium tier / badge"
            value={premiumSource}
            onChange={(e) => setPremiumSource(e.target.value as PremiumSource)}
          >
            {PREMIUM_SOURCE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </Select>

          <Input
            label="Admin note (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Early supporter, helped test scanner..."
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            fullWidth
            loading={saving}
            disabled={!lifetime && !expiresAt}
            onClick={handleSubmit}
          >
            Grant Premium
          </Button>
        </div>
      </div>
    </div>
  )
}
