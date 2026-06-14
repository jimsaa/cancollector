import { useState } from 'react'

const BETA_TOOLTIP =
  'CanTrove is currently in beta. The verified master database is expanding continuously through community contributions and collector feedback. Thank you for helping build the world\'s best energy drink collection database.'

export function BetaStatusBadge() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-monster-green/50 bg-monster-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-monster-green hover:bg-monster-green/25"
        aria-expanded={open}
      >
        Beta
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-monster-border bg-monster-card p-3 shadow-xl sm:left-auto sm:right-0">
          <p className="text-xs leading-relaxed text-monster-muted">{BETA_TOOLTIP}</p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-monster-green hover:underline"
            onClick={() => setOpen(false)}
          >
            Got it
          </button>
        </div>
      ) : null}
    </div>
  )
}
