import { NavLink } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { NAV } from './navItems'

export default function TabBar() {
  const { t } = useLang()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-[#2a1a0c] bg-[#4a3320] shadow-[0_-4px_12px_rgba(0,0,0,0.35)] md:hidden"
      style={{ backgroundImage: "url('/assets/bg-tile-wood.png')", backgroundSize: '240px' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around gap-1 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
        {NAV.map(({ to, label, img, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 py-1.5 transition-all duration-150 ${
                isActive
                  ? '-translate-y-0.5 border-[#3c6b28] bg-[#6aa84f] text-white shadow-[0_3px_0_#2c4f1d]'
                  : 'border-transparent text-amber-100/70 active:scale-95'
              }`
            }
          >
            <img
              src={img}
              alt=""
              className="h-6 w-6 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] transition-transform group-active:scale-90"
              draggable={false}
            />
            <span className="font-pixel text-[10px] font-bold tracking-wide">{t(label)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
