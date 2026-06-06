import { NavLink } from 'react-router-dom'
import { LogOut, Ticket } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { NAV } from './navItems'

export default function Sidebar() {
  const { signOut } = useAuth()
  const { profile } = useProfile()

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[color:var(--color-navy)] px-3 py-5 text-white md:flex">
      {/* brand */}
      <div className="mb-7 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-gold)] text-lg font-bold text-[#3a2a08] shadow-[0_2px_0_#a9770f]">
          ¥
        </div>
        <span className="font-pixel text-lg font-bold tracking-tight">DidIt</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-[color:var(--color-grass)] text-white shadow-[0_2px_0_#3c7a1f]'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={2.1} className={isActive ? 'text-white' : 'text-white/55'} />
                <span className="font-pixel">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* vouchers chip */}
      <div className="mb-3 mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-sm text-white/70">
          <Ticket size={15} className="text-amber-300" /> Vouchers
        </span>
        <span className="font-pixel text-base font-bold text-amber-300">{profile?.vouchers ?? 0}</span>
      </div>

      {/* profile */}
      <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-grass)] text-xs font-bold text-white">
          {(profile?.username ?? 'Y').charAt(0).toUpperCase()}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
          {profile?.username ?? 'You'}
        </p>
        <button
          onClick={signOut}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
