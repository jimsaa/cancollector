import { useEffect, type ReactNode } from 'react'

import { Link } from 'react-router-dom'

import { Logo } from '../brand/Logo'

import { BottomNav } from './BottomNav'

import { GuestModeBanner } from './GuestModeBanner'

import { APP_NAME, APP_TAGLINE } from '../../constants/branding'

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

  const pageTitle = title ?? 'Dashboard'



  useEffect(() => {

    document.title = pageTitle === APP_NAME ? APP_NAME : `${pageTitle} · ${APP_NAME}`

  }, [pageTitle])



  return (

    <div className="min-h-dvh bg-monster-black">

      <header className="sticky top-0 z-40 border-b border-monster-border bg-monster-black/95 backdrop-blur-md">

        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">

          <Link to="/" className="flex min-w-0 items-center gap-2">

            <Logo size="sm" />

            <div className="min-w-0">

              <p className="truncate text-xs font-bold text-monster-green">{APP_NAME}</p>

              <p className="truncate text-[10px] text-monster-muted">{APP_TAGLINE}</p>

              <p className="truncate text-sm font-semibold leading-tight text-white">{pageTitle}</p>

            </div>

          </Link>

          <div className="flex shrink-0 items-center gap-2">

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


