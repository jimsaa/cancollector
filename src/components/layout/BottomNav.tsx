import { NavLink } from 'react-router-dom'
import { Home, Grid3x3, PlusCircle, ArrowLeftRight, User, Heart, ListMinus } from 'lucide-react'

const links = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/collection', icon: Grid3x3, label: 'Collection' },
  { to: '/add', icon: PlusCircle, label: 'Add Can', accent: true },
  { to: '/missing', icon: ListMinus, label: 'Missing' },
  { to: '/wishlist', icon: Heart, label: 'Want' },
  { to: '/trade', icon: ArrowLeftRight, label: 'Trade' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-monster-border bg-monster-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-end justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-2">
        {links.map(({ to, icon: Icon, label, accent }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[9px] font-medium transition-colors ${
                accent
                  ? '-mt-4 rounded-full bg-monster-green p-3 text-black shadow-[0_0_24px_rgba(141,198,63,0.4)]'
                  : isActive
                    ? 'text-monster-green'
                    : 'text-monster-muted hover:text-white'
              }`
            }
          >
            <Icon size={accent ? 26 : 18} strokeWidth={accent ? 2.5 : 2} />
            {!accent ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
