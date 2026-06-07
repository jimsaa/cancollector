import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getLocalUserId } from '../lib/localCans'
import { isLocalMode } from '../lib/mode'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

function createLocalUser(): User {
  return { id: getLocalUserId() } as User
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: isLocalMode ? createLocalUser() : null,
    loading: !isLocalMode,
    error: null,
  })

  useEffect(() => {
    if (isLocalMode) {
      setState({ user: createLocalUser(), loading: false, error: null })
      return
    }

    if (!supabase) {
      setState({ user: null, loading: false, error: null })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, loading: false, error: null })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, user: session?.user ?? null, loading: false }))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    setState((prev) => ({ ...prev, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setState((prev) => ({ ...prev, error: error.message }))
      throw error
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    setState((prev) => ({ ...prev, error: null }))
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setState((prev) => ({ ...prev, error: error.message }))
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    if (isLocalMode || !supabase) return
    await supabase.auth.signOut()
  }, [])

  return {
    ...state,
    isLocalMode,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  }
}
