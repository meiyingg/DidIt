import { NavLink } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { NAV } from './navItems'

export default function TabBar() {
  const { t } = useLang()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-[#141e36] bg-[#1b2945] md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ to, label, img, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 transition ${
                isActive ? 'text-amber-300' : 'text-white/55'
              }`
            }
          >
            <img src={img} alt="" className="h-6 w-6 object-contain" draggable={false} />
            <span className="font-pixel text-[11px] font-semibold">{t(label)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
