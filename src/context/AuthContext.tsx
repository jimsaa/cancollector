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
import { checkLocalImportState, logLocalImportCheck } from '../lib/localImport'

import { isConfigured } from '../lib/mode'

import { ensureProfile, fetchProfile, updateProfile as saveProfile, upsertProfile } from '../lib/profiles'

import { getAuthCallbackUrl } from '../lib/authRedirect'
import { formatSupabaseError, logAuthError } from '../lib/supabaseDebug'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

import { SignUpAuthError, type SignUpResult } from '../types/auth'
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

  signUp: (displayName: string, email: string, password: string) => Promise<SignUpResult>

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
          logLocalImportCheck(checkLocalImportState(user.id))
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
      logLocalImportCheck(checkLocalImportState(data.session.user.id))
    }

  }, [])



  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    if (!supabase) throw new SignUpAuthError('Supabase is not configured')

    setState((prev) => ({ ...prev, error: null }))

    const trimmedName = displayName.trim()
    const trimmedEmail = email.trim()
    const warnings: SignUpResult['warnings'] = []

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { display_name: trimmedName },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    })

    if (error) {
      logAuthError('SIGNUP_ERROR', error)
      const message = formatSupabaseError(error, 'Sign up failed')
      setState((prev) => ({ ...prev, error: message }))
      throw new SignUpAuthError(message)
    }

    if (!data.user) {
      logAuthError('SIGNUP_ERROR', { message: 'No user returned from signUp' })
      throw new SignUpAuthError('Sign up did not return a user')
    }

    const userId = data.user.id
    let sessionUser = data.session?.user ?? null

    if (!sessionUser) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        const needsConfirm = signInError.message.toLowerCase().includes('confirm')
        logAuthError(needsConfirm ? 'SIGNUP_ERROR' : 'SIGNUP_ERROR', signInError)
        warnings.push({
          code: needsConfirm ? 'email_confirm' : 'auto_sign_in',
          message: needsConfirm
            ? 'Account created. Please check your email to confirm, then sign in.'
            : `Account created. Sign in manually if needed (${formatSupabaseError(signInError)}).`,
        })
      } else {
        sessionUser = signInData.session?.user ?? null
      }
    }

    if (sessionUser) {
      applyStorageMode(sessionUser)
      logLocalImportCheck(checkLocalImportState(sessionUser.id))

      const { profile, failed } = await ensureProfile(userId, trimmedEmail, trimmedName)
      if (failed) {
        warnings.push({
          code: 'profile',
          message: 'Account created, but profile setup failed. You can still log in.',
        })
      } else if (profile) {
        setState((prev) => ({ ...prev, user: sessionUser, profile, loading: false, error: null }))
      } else {
        try {
          const loaded = await loadProfile(sessionUser)
          setState((prev) => ({
            ...prev,
            user: sessionUser,
            profile: loaded,
            loading: false,
            error: null,
          }))
        } catch (loadErr) {
          logAuthError('PROFILE_ERROR', loadErr)
          warnings.push({
            code: 'profile',
            message: 'Account created, but profile setup failed. You can still log in.',
          })
          setState((prev) => ({ ...prev, user: sessionUser, loading: false, error: null }))
        }
      }
    }

    const result: SignUpResult = {
      authCreated: true,
      userId,
      signedIn: Boolean(sessionUser),
      warnings,
    }
    return result
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


