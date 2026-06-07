import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { logAuthError } from '../lib/supabaseDebug'
import { supabase } from '../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) {
      navigate('/login', { replace: true })
      return
    }

    let active = true
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const finish = () => {
      if (active) navigate('/', { replace: true })
    }

    const fail = (message: string) => {
      if (!active) return
      logAuthError('SIGNUP_ERROR', message)
      setError(message)
    }

    const completeAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { error: exchangeError } = await client.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            fail(exchangeError.message)
            return
          }
        }

        const { data: { session }, error: sessionError } = await client.auth.getSession()
        if (sessionError) {
          fail(sessionError.message)
          return
        }

        if (session?.user) {
          finish()
          return
        }

        const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
          if (nextSession?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            subscription.unsubscribe()
            if (timeoutId) clearTimeout(timeoutId)
            finish()
          }
        })

        timeoutId = setTimeout(() => {
          subscription.unsubscribe()
          if (active) {
            fail('Email verification could not be completed. Try signing in.')
          }
        }, 8000)
      } catch (err) {
        fail(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    void completeAuth()

    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-monster-black px-4">
        <Card className="max-w-sm p-6 text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p className="text-sm font-semibold text-white">Verification issue</p>
          <p className="mt-2 text-sm text-red-400">{error}</p>
          <Link to="/login" className="mt-4 block">
            <Button fullWidth>Go to sign in</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return <LoadingSpinner fullPage label="Completing sign in..." />
}
