import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'
import { Layout } from '../components/layout/Layout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { signUp, error, user, isConfigured, isCloudSynced } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (user && isCloudSynced) {
      navigate('/', { replace: true })
    }
  }, [user, isCloudSynced, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await signUp(displayName, email, password)
      // Auth state listener logs user in; useEffect redirects to dashboard / import gate
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
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
            <p className="mt-2 text-xs text-monster-muted">
              See <code>supabase/SUPABASE_AUTH_CHECKLIST.md</code> for setup steps.
            </p>
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
          <h1 className="text-2xl font-bold text-white">Create free account</h1>
          <p className="mt-1 text-sm text-monster-muted">
            Save your collection online — registration is free
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

            {(localError || error) && (
              <p className="text-sm text-red-400">{localError || error}</p>
            )}

            <Button type="submit" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-monster-muted">
          Premium features are optional and come later. Your account is free.
        </p>

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
