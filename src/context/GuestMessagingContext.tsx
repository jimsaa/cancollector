import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { GuestModeModal } from '../components/guest/GuestModeModal'
import { RegisterCTA } from '../components/guest/RegisterCTA'
import {
  markMilestoneShown,
  shouldTriggerMilestone,
  type GuestMilestone,
} from '../lib/guestMessaging'
import { useAuth } from './AuthContext'

interface GuestMessagingContextValue {
  isGuest: boolean
  isCloudSynced: boolean
  triggerRegisterCTA: (milestone: GuestMilestone) => void
  openLearnMore: () => void
}

const GuestMessagingContext = createContext<GuestMessagingContextValue | null>(null)

export function GuestMessagingProvider({ children }: { children: ReactNode }) {
  const { isGuest, isCloudSynced, isConfigured } = useAuth()
  const [showCTA, setShowCTA] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const triggerRegisterCTA = useCallback(
    (milestone: GuestMilestone) => {
      if (!isGuest) return
      if (!shouldTriggerMilestone(milestone)) return
      markMilestoneShown(milestone)
      setShowCTA(true)
    },
    [isGuest],
  )

  const openLearnMore = useCallback(() => setShowModal(true), [])

  const dismissCTA = useCallback(() => setShowCTA(false), [])

  const value = useMemo(
    () => ({
      isGuest,
      isCloudSynced,
      triggerRegisterCTA,
      openLearnMore,
    }),
    [isGuest, isCloudSynced, triggerRegisterCTA, openLearnMore],
  )

  return (
    <GuestMessagingContext.Provider value={value}>
      {children}
      {isGuest && showCTA ? (
        <div className="fixed bottom-20 left-0 right-0 z-40 mx-auto max-w-lg px-4">
          <RegisterCTA
            onDismiss={dismissCTA}
            onLearnMore={openLearnMore}
            canRegister={isConfigured}
          />
        </div>
      ) : null}
      <GuestModeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        canRegister={isConfigured}
      />
    </GuestMessagingContext.Provider>
  )
}

export function useGuestMessaging(): GuestMessagingContextValue {
  const ctx = useContext(GuestMessagingContext)
  if (!ctx) throw new Error('useGuestMessaging must be used within GuestMessagingProvider')
  return ctx
}
