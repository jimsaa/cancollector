import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../brand/Logo'
import { BottomNav } from './BottomNav'
import { GuestModeBanner } from './GuestModeBanner'
import { useGuestMessaging } from '../../hooks/useGuestMessaging'
import { useAuth } from '../../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
  title?: string
  hideNav?: boolean
}

export function Layout({ children, title, hideNav }: LayoutProps) {
  const { displayLabel } = useAuth()
  const { isGuest, isCloudSynced } = useGuestMessaging()

  return (
    <div className="min-h-dvh bg-monster-black">
      <header className="sticky top-0 z-40 border-b border-monster-border bg-monster-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-monster-green">Monster</p>
              <p className="text-sm font-semibold leading-none text-white">{title ?? 'Can Collector'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCloudSynced && displayLabel ? (
              <Link
                to="/profile"
                className="max-w-[120px] truncate text-xs font-medium text-monster-muted hover:text-white"
                title={displayLabel}
              >
                {displayLabel}
              </Link>
            ) : null}
            {isGuest ? (
              <span className="rounded-full border border-yellow-600/50 bg-yellow-900/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                GUEST MODE
              </span>
            ) : isCloudSynced ? (
              <span className="rounded-full border border-monster-green/40 bg-monster-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-monster-green">
                CLOUD SYNCED
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {isGuest ? <GuestModeBanner /> : null}

      <main className={`mx-auto max-w-lg px-4 ${hideNav ? 'pb-8' : 'pb-24'} pt-4`}>{children}</main>

      {!hideNav ? <BottomNav /> : null}
    </div>
  )
}
