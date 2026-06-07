import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { getLocalUserId } from '../lib/localCans'
import { isCloudMode, isLocalMode } from '../lib/mode'
import { fetchProfile, updateProfile as saveProfile, upsertProfile } from '../lib/profiles'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile, ProfileUpdate } from '../types/profile'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  isLocalMode: boolean
  isCloudMode: boolean
  isConfigured: boolean
  displayLabel: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (displayName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: ProfileUpdate) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function createLocalUser(): User {
  return { id: getLocalUserId() } as User
}

async function loadProfile(user: User): Promise<Profile | null> {
  if (!supabase) return null

  let profile = await fetchProfile(user.id)
  if (!profile) {
    const displayName =
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split('@')[0] ??
      'Collector'
    profile = await upsertProfile(user.id, user.email ?? '', displayName)
  }
  return profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: isLocalMode ? createLocalUser() : null,
    profile: null,
    loading: !isLocalMode,
    error: null,
  })

  const refreshProfile = useCallback(async () => {
    if (!state.user || isLocalMode || !supabase) return
    try {
      const profile = await loadProfile(state.user)
      setState((prev) => ({ ...prev, profile, error: null }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load profile',
      }))
    }
  }, [state.user])

  useEffect(() => {
    if (isLocalMode) {
      setState({ user: createLocalUser(), profile: null, loading: false, error: null })
      return
    }

    if (!supabase) {
      setState({ user: null, profile: null, loading: false, error: null })
      return
    }

    let active = true

    const applySession = async (user: User | null) => {
      if (!active) return
      if (!user) {
        setState({ user: null, profile: null, loading: false, error: null })
        return
      }

      setState((prev) => ({ ...prev, user, loading: true }))
      try {
        const profile = await loadProfile(user)
        if (active) {
          setState({ user, profile, loading: false, error: null })
        }
      } catch (err) {
        if (active) {
          setState({
            user,
            profile: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load profile',
          })
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
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

  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    setState((prev) => ({ ...prev, error: null }))
    const trimmedName = displayName.trim()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: trimmedName },
      },
    })
    if (error) {
      setState((prev) => ({ ...prev, error: error.message }))
      throw error
    }
    if (data.user) {
      await upsertProfile(data.user.id, email, trimmedName)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (isLocalMode || !supabase) return
    await supabase.auth.signOut()
    setState({ user: null, profile: null, loading: false, error: null })
  }, [])

  const updateProfileFn = useCallback(
    async (updates: ProfileUpdate) => {
      if (!state.user || isLocalMode) return
      const profile = await saveProfile(state.user.id, updates)
      setState((prev) => ({ ...prev, profile, error: null }))
    },
    [state.user],
  )

  const displayLabel = useMemo(() => {
    if (isLocalMode) return 'Local collector'
    if (state.profile?.display_name) return state.profile.display_name
    if (state.user?.email) return state.user.email
    return null
  }, [isLocalMode, state.profile, state.user])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isLocalMode,
      isCloudMode,
      isConfigured: isSupabaseConfigured,
      displayLabel,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile: updateProfileFn,
    }),
    [state, displayLabel, signIn, signUp, signOut, refreshProfile, updateProfileFn],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
