import { useState, type FormEvent, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Logo } from './brand/Logo'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { APP_NAME, APP_TAGLINE } from '../constants/branding'
import { useAuth } from '../hooks/useAuth'
import { grantBetaAccess, hasBetaAccess, isValidBetaCode } from '../lib/betaAccess'
import { isProfileAdmin } from '../lib/adminAuth'

const AUTH_CALLBACK_PATH = '/auth/callback'

interface BetaAccessGateProps {
  children: ReactNode
}

function BetaAccessScreen({
  onSubmit,
  error,
  loading,
}: {
  onSubmit: (code: string) => void
  error: string | null
  loading: boolean
}) {
  const [code, setCode] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(code)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-monster-black px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <Logo size="xl" className="mx-auto mb-4" />
          <p className="text-sm font-bold text-monster-green">{APP_NAME}</p>
          <p className="mt-0.5 text-xs tracking-wide text-monster-muted">{APP_TAGLINE}</p>
          <h1 className="mt-4 text-xl font-bold text-white">CanTrove is currently in closed beta.</h1>
          <p className="mt-2 text-sm text-monster-muted">Enter your beta access code to continue.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Beta access code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoFocus
              disabled={loading}
            />

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <Button type="submit" fullWidth loading={loading}>
              Enter Beta
            </Button>
          </form>
        </Card>

        {import.meta.env.DEV ? (
          <p className="text-center text-xs text-monster-muted">
            Dev reset:{' '}
            <code className="text-monster-green">localStorage.removeItem(&quot;cantrove_beta_access&quot;)</code>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function BetaAccessGate({ children }: BetaAccessGateProps) {
  const location = useLocation()
  const { user, profile, loading, isConfigured, isGuest } = useAuth()
  const [storageGranted, setStorageGranted] = useState(hasBetaAccess)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (location.pathname === AUTH_CALLBACK_PATH) {
    return <>{children}</>
  }

  if (storageGranted || hasBetaAccess()) {
    return <>{children}</>
  }

  if (isConfigured && loading) {
    return <LoadingSpinner fullPage label="Loading..." />
  }

  if (!isGuest && user && isProfileAdmin(profile)) {
    return <>{children}</>
  }

  const handleSubmit = (code: string) => {
    setSubmitting(true)
    setError(null)

    if (isValidBetaCode(code)) {
      grantBetaAccess()
      setStorageGranted(true)
      setSubmitting(false)
      return
    }

    setError('Invalid beta code. Please check your code and try again.')
    setSubmitting(false)
  }

  return <BetaAccessScreen onSubmit={handleSubmit} error={error} loading={submitting} />
}
