import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'
import { Layout } from '../components/layout/Layout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { signUp, error } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)
    try {
      await signUp(displayName, email, password)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Register" hideNav>
      <div className="mx-auto flex max-w-sm flex-col gap-6 pt-8">
        <div className="text-center">
          <Logo size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-monster-muted">Save your collection online</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Name"
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

            {(localError || error) && (
              <p className="text-sm text-red-400">{localError || error}</p>
            )}

            <Button type="submit" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-monster-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-monster-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </Layout>
  )
}
