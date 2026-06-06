import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { NAV } from './navItems'

export default function Sidebar() {
  const { signOut } = useAuth()
  const { profile } = useProfile()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white px-3.5 py-5 md:flex">
      {/* brand */}
      <div className="mb-7 flex items-center gap-2.5 px-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-base font-bold text-white">
          ¥
        </div>
        <span className="text-[15px] font-bold tracking-tight text-zinc-900">DidIt</span>
      </div>

      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        Menu
      </p>
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={isActive ? 'text-violet-700' : 'text-zinc-400 group-hover:text-zinc-600'}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* profile + sign out */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
          {(profile?.username ?? 'Y').charAt(0).toUpperCase()}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
          {profile?.username ?? 'You'}
        </p>
        <button
          onClick={signOut}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white hover:text-zinc-700"
          aria-label="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
