import { Link } from 'react-router-dom'
import { useGuestMessaging } from '../../context/GuestMessagingContext'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function GuestModeBanner() {
  const { openLearnMore } = useGuestMessaging()
  const { isConfigured } = useAuth()

  return (
    <div className="border-b border-yellow-600/30 bg-yellow-900/20 px-4 py-3">
      <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-yellow-100/95">
          <span className="font-semibold text-yellow-50">Guest Mode:</span> Your collection is saved
          only on this device. Create a free account to protect it.
        </p>
        <div className="flex shrink-0 gap-2">
          {isConfigured ? (
            <Link to="/register">
              <Button className="px-3 py-1.5 text-xs">Create Free Account</Button>
            </Link>
          ) : (
            <Button className="px-3 py-1.5 text-xs" onClick={openLearnMore}>
              Create Free Account
            </Button>
          )}
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={openLearnMore}>
            Learn More
          </Button>
        </div>
      </div>
    </div>
  )
}
