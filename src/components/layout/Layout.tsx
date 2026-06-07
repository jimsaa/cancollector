import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { useAuth } from '../../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
  title?: string
  hideNav?: boolean
}

export function Layout({ children, title, hideNav }: LayoutProps) {
  const { signOut, isLocalMode } = useAuth()

  return (
    <div className="min-h-dvh bg-monster-black">
      <header className="sticky top-0 z-40 border-b border-monster-border bg-monster-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-monster-green font-black text-black">
              M
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-monster-green">Monster</p>
              <p className="text-sm font-semibold leading-none text-white">{title ?? 'Can Collector'}</p>
            </div>
          </div>
          {isLocalMode ? (
            <span className="rounded-full border border-yellow-600/50 bg-yellow-900/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              LOCAL MODE
            </span>
          ) : null}
        </div>
      </header>

      <main className={`mx-auto max-w-lg px-4 ${hideNav ? 'pb-8' : 'pb-24'} pt-4`}>{children}</main>

      {!hideNav ? <BottomNav onSignOut={isLocalMode ? undefined : signOut} /> : null}
    </div>
  )
}
