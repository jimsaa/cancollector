import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'
import { APP_NAME } from '../constants/branding'
import { Layout } from '../components/layout/Layout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import {
  formatSupabaseError,
  getSupabaseEnvStatus,
  logAuthError,
  logSupabaseError,
  testSupabaseConnection,
} from '../lib/supabaseDebug'
import { SignUpAuthError } from '../types/auth'

export function RegisterPage() {
  const { signUp, error, user, isConfigured, isCloudSynced } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [connectionTesting, setConnectionTesting] = useState(false)
  const [connectionResult, setConnectionResult] = useState<string | null>(null)

  const envStatus = useMemo(() => getSupabaseEnvStatus(), [])

  useEffect(() => {
    console.info('[Register] Supabase env', envStatus)
  }, [envStatus])

  useEffect(() => {
    if (user && isCloudSynced) {
      try {
        navigate('/', { replace: true })
      } catch (err) {
        logAuthError('REDIRECT_ERROR', err)
        setWarning('Account ready, but redirect failed. Tap Dashboard in the menu.')
      }
    }
  }, [user, isCloudSynced, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError(null)
    setWarning(null)
    setConnectionResult(null)

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const result = await signUp(displayName, email, password)

      if (result.warnings.length > 0) {
        setWarning(result.warnings.map((w) => w.message).join(' '))
      }

      if (result.signedIn) {
        try {
          navigate('/', { replace: true })
        } catch (err) {
          logAuthError('REDIRECT_ERROR', err)
          setWarning((prev) =>
            prev
              ? `${prev} Redirect failed — use the menu to open Dashboard.`
              : 'Account created. Redirect failed — use the menu to open Dashboard.',
          )
        }
      }
    } catch (err) {
      if (err instanceof SignUpAuthError) {
        logAuthError('SIGNUP_ERROR', err)
        setSignupError(err.message)
      } else {
        logAuthError('SIGNUP_ERROR', err)
        setSignupError(formatSupabaseError(err, 'Sign up failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setConnectionTesting(true)
    setConnectionResult(null)
    setSignupError(null)
    try {
      const result = await testSupabaseConnection()
      setConnectionResult(result.message)
      if (!result.success) {
        console.error('[Register] Connection test failed', result)
      } else {
        console.info('[Register] Connection test passed', result)
      }
    } catch (err) {
      logSupabaseError('register.testConnection', err)
      setConnectionResult(formatSupabaseError(err, 'Connection test failed'))
    } finally {
      setConnectionTesting(false)
    }
  }

  if (!isConfigured) {
    return (
      <Layout title="Register" hideNav>
        <div className="mx-auto flex max-w-sm flex-col gap-6 pt-8">
          <Card className="p-4">
            <p className="text-sm font-semibold text-white">Cloud accounts not configured</p>
            <p className="mt-2 text-sm text-monster-muted">
              Add <code className="text-monster-green">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-monster-green">VITE_SUPABASE_ANON_KEY</code> to your{' '}
              <code className="text-monster-green">.env</code> file, then restart the dev server.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-monster-muted">
              <li>VITE_SUPABASE_URL: {envStatus.urlLoaded ? 'loaded' : 'missing'}</li>
              <li>VITE_SUPABASE_ANON_KEY: {envStatus.keyLoaded ? 'loaded' : 'missing'}</li>
              <li>Client initialized: {envStatus.clientInitialized ? 'yes' : 'no'}</li>
            </ul>
            <Link to="/" className="mt-4 block text-center text-sm text-monster-green hover:underline">
              Continue as guest
            </Link>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Register" hideNav>
      <div className="mx-auto flex max-w-sm flex-col gap-6 pt-8">
        <div className="text-center">
          <Logo size="xl" className="mx-auto mb-4" />
          <p className="text-sm font-bold text-monster-green">{APP_NAME}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Create free account</h1>
          <p className="mt-1 text-sm text-monster-muted">
            Save your collection online with a free account
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Display Name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="Your collector name"
            />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            {signupError || error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-300"
              >
                <p className="font-semibold">Sign up error</p>
                <p className="mt-1">{signupError || error}</p>
              </div>
            ) : null}

            {warning ? (
              <div
                role="status"
                className="rounded-lg border border-yellow-500/40 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-200"
              >
                {warning}
              </div>
            ) : null}

            <Button type="submit" fullWidth loading={loading}>
              Create Account
            </Button>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              loading={connectionTesting}
              onClick={handleTestConnection}
            >
              Test Supabase Connection
            </Button>

            {connectionResult ? (
              <p
                className={`text-xs ${connectionResult.startsWith('Connected') ? 'text-monster-green' : 'text-red-400'}`}
              >
                {connectionResult}
              </p>
            ) : null}
          </form>
        </Card>

        <Card className="p-3">
          <p className="text-xs font-semibold text-white">Supabase config</p>
          <ul className="mt-2 space-y-1 text-xs text-monster-muted">
            <li>VITE_SUPABASE_URL: {envStatus.urlLoaded ? envStatus.urlPreview : 'missing'}</li>
            <li>
              VITE_SUPABASE_ANON_KEY:{' '}
              {envStatus.keyLoaded ? envStatus.keyPreview : 'missing'}
            </li>
            <li>Client initialized: {envStatus.clientInitialized ? 'yes' : 'no'}</li>
          </ul>
        </Card>

        <p className="text-center text-sm text-monster-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-monster-green hover:underline">
            Sign in
          </Link>
        </p>

        <Link to="/" className="text-center text-sm text-monster-muted hover:text-white">
          Continue as guest
        </Link>
      </div>
    </Layout>
  )
}
