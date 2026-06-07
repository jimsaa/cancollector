import { NavLink } from 'react-router-dom'
import { Home, Grid3x3, PlusCircle, ArrowLeftRight, LogOut } from 'lucide-react'

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/collection', icon: Grid3x3, label: 'Collection' },
  { to: '/add', icon: PlusCircle, label: 'Add', accent: true },
  { to: '/trade', icon: ArrowLeftRight, label: 'Trade' },
]

interface BottomNavProps {
  onSignOut?: () => void
}

export function BottomNav({ onSignOut }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-monster-border bg-monster-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {links.map(({ to, icon: Icon, label, accent }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                accent
                  ? '-mt-4 rounded-full bg-monster-green p-3 text-black shadow-[0_0_24px_rgba(141,198,63,0.4)]'
                  : isActive
                    ? 'text-monster-green'
                    : 'text-monster-muted hover:text-white'
              }`
            }
          >
            <Icon size={accent ? 28 : 22} strokeWidth={accent ? 2.5 : 2} />
            {!accent ? <span>{label}</span> : null}
          </NavLink>
        ))}
        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium text-monster-muted hover:text-white"
            aria-label="Sign out"
          >
            <LogOut size={22} />
            <span>Out</span>
          </button>
        ) : null}
      </div>
    </nav>
  )
}
