import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'
import { Layout } from '../components/layout/Layout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { signIn, error, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Sign In" hideNav>
      <div className="mx-auto flex max-w-sm flex-col gap-6 pt-8">
        <div className="text-center">
          <Logo size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-monster-muted">Sign in to sync your collection online</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              autoComplete="current-password"
            />

            {(localError || error) && (
              <p className="text-sm text-red-400">{localError || error}</p>
            )}

            <Button type="submit" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-monster-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-monster-green hover:underline">
            Create free account
          </Link>
        </p>

        <Link to="/" className="text-center text-sm text-monster-muted hover:text-white">
          Continue as guest
        </Link>
      </div>
    </Layout>
  )
}
