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

import { setGuestStorageActive } from '../lib/guestStorage'

import { getLocalUserId } from '../lib/localCans'

import { isConfigured } from '../lib/mode'

import { fetchProfile, updateProfile as saveProfile, upsertProfile } from '../lib/profiles'

import { isSupabaseConfigured, supabase } from '../lib/supabase'

import type { Profile, ProfileUpdate } from '../types/profile'

import { isProfileAdmin } from '../lib/adminAuth'
import { getPremiumFeatures, isPremiumActive, type PremiumFeatures } from '../lib/premium'



interface AuthState {

  user: User | null

  profile: Profile | null

  loading: boolean

  error: string | null

}



interface AuthContextValue extends AuthState {

  guestUserId: string

  storageUserId: string

  isGuest: boolean

  isCloudSynced: boolean

  isConfigured: boolean

  /** @deprecated Use isGuest */

  isLocalMode: boolean

  /** @deprecated Use isConfigured */

  isCloudMode: boolean

  isPremium: boolean

  isAdmin: boolean

  premiumFeatures: PremiumFeatures

  displayLabel: string | null

  signIn: (email: string, password: string) => Promise<void>

  signUp: (displayName: string, email: string, password: string) => Promise<void>

  signOut: () => Promise<void>

  refreshProfile: () => Promise<void>

  updateProfile: (updates: ProfileUpdate) => Promise<void>

}



const AuthContext = createContext<AuthContextValue | null>(null)



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



function applyStorageMode(user: User | null) {

  const cloudSynced = Boolean(user && isSupabaseConfigured)

  setGuestStorageActive(!cloudSynced)

}



export function AuthProvider({ children }: { children: ReactNode }) {

  const guestUserId = useMemo(() => getLocalUserId(), [])



  const [state, setState] = useState<AuthState>({

    user: null,

    profile: null,

    loading: isConfigured,

    error: null,

  })



  const isCloudSynced = Boolean(state.user && isConfigured)

  const isGuest = !isCloudSynced

  const storageUserId = isCloudSynced && state.user ? state.user.id : guestUserId



  const refreshProfile = useCallback(async () => {

    if (!state.user || !isCloudSynced || !supabase) return

    try {

      const profile = await loadProfile(state.user)

      setState((prev) => ({ ...prev, profile, error: null }))

    } catch (err) {

      setState((prev) => ({

        ...prev,

        error: err instanceof Error ? err.message : 'Failed to load profile',

      }))

    }

  }, [state.user, isCloudSynced])



  useEffect(() => {

    if (!isConfigured) {

      setGuestStorageActive(true)

      setState({ user: null, profile: null, loading: false, error: null })

      return

    }



    if (!supabase) {

      setGuestStorageActive(true)

      setState({ user: null, profile: null, loading: false, error: null })

      return

    }



    let active = true



    const applySession = async (user: User | null) => {

      if (!active) return

      applyStorageMode(user)



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

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (error) {

      setState((prev) => ({ ...prev, error: error.message }))

      throw error

    }

    if (data.session?.user) {
      applyStorageMode(data.session.user)
    }

  }, [])



  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')

    setState((prev) => ({ ...prev, error: null }))

    const trimmedName = displayName.trim()
    const trimmedEmail = email.trim()

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
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
      await upsertProfile(data.user.id, trimmedEmail, trimmedName)
    }

    // Auto sign-in when email confirmation is disabled (dev) or session returned
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })
      if (signInError && !signInError.message.toLowerCase().includes('confirm')) {
        setState((prev) => ({ ...prev, error: signInError.message }))
        throw signInError
      }
    }
  }, [])



  const signOut = useCallback(async () => {

    if (!supabase) return

    await supabase.auth.signOut()

    applyStorageMode(null)

    setState({ user: null, profile: null, loading: false, error: null })

  }, [])



  const updateProfileFn = useCallback(

    async (updates: ProfileUpdate) => {

      if (!state.user || !isCloudSynced) return

      const profile = await saveProfile(state.user.id, updates)

      setState((prev) => ({ ...prev, profile, error: null }))

    },

    [state.user, isCloudSynced],

  )



  const displayLabel = useMemo(() => {

    if (isCloudSynced) {

      if (state.profile?.display_name) return state.profile.display_name

      if (state.user?.email) return state.user.email

    }

    return 'Guest collector'

  }, [isCloudSynced, state.profile, state.user])



  const isPremium = useMemo(() => isPremiumActive(state.profile), [state.profile])

  const isAdmin = useMemo(() => isProfileAdmin(state.profile), [state.profile])

  const premiumFeatures = useMemo(

    () => getPremiumFeatures(state.profile, { isCloudMode: isConfigured }),

    [state.profile],

  )



  const value = useMemo<AuthContextValue>(

    () => ({

      ...state,

      guestUserId,

      storageUserId,

      isGuest,

      isCloudSynced,

      isConfigured,

      isLocalMode: isGuest,

      isCloudMode: isConfigured,

      isPremium,

      isAdmin,

      premiumFeatures,

      displayLabel,

      signIn,

      signUp,

      signOut,

      refreshProfile,

      updateProfile: updateProfileFn,

    }),

    [

      state,

      guestUserId,

      storageUserId,

      isGuest,

      isCloudSynced,

      displayLabel,

      isPremium,

      isAdmin,

      premiumFeatures,

      signIn,

      signUp,

      signOut,

      refreshProfile,

      updateProfileFn,

    ],

  )



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

}



export function useAuth(): AuthContextValue {

  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used within AuthProvider')

  return ctx

}


