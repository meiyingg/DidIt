import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { charImg, DEFAULT_CHARACTER } from '../lib/characters'
import { computeStreak } from '../lib/streak'
import { TIPS } from '../lib/tips'
import { money } from '../lib/format'
import { NAV } from './navItems'

function dailyTip(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const doy = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return TIPS[doy % TIPS.length]
}

export default function Sidebar() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const negative = (profile?.balance ?? 0) < 0
  const [streak, setStreak] = useState({ current: 0, best: 0 })

  useEffect(() => {
    if (!user) return
    supabase
      .from('tasks')
      .select('task_date')
      .eq('user_id', user.id)
      .eq('done', true)
      .then(({ data }) => setStreak(computeStreak((data ?? []).map((r) => r.task_date as string))))
  }, [user])

  return (
    <aside
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-3 border-r-4 border-[#2a1a0c] bg-[#4a3320] px-3 py-4 md:flex"
      style={{ backgroundImage: "url('/assets/bg-tile-wood.png')", backgroundSize: '300px' }}
    >
      {/* brand */}
      <div className="flex items-center gap-2 px-1">
        <img src="/assets/logo.png" alt="" className="h-9 w-9 object-contain drop-shadow" draggable={false} />
        <div className="leading-tight text-white drop-shadow">
          <p className="font-pixel text-lg font-bold">DidIt</p>
          <p className="font-pixel text-[10px] text-amber-300/180">做了么</p>
        </div>
      </div>

      {/* player card */}
      <NavLink
        to="/me"
        className="rounded-2xl border-[3px] border-[#6b4a24] bg-[#fff5dd] p-2.5 shadow-[0_3px_0_#3a2614] transition hover:brightness-[0.98]"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative h-14 w-14 shrink-0">
            <img
              src={charImg(profile?.avatar_url || DEFAULT_CHARACTER)}
              alt=""
              className="absolute inset-[5px] h-[calc(100%-10px)] w-[calc(100%-10px)] rounded object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')}
              draggable={false}
            />
            <img src="/assets/avatar-frame.png" alt="" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-pixel truncate text-sm font-bold text-[color:var(--color-ink)]">{profile?.username ?? 'You'}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-[#fff1c9] px-1.5 py-0.5">
                <img src="/assets/coin.png" alt="" className="h-3.5 w-3.5 object-contain" />
                <span className={`font-pixel text-xs font-bold ${negative ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}`}>
                  {money(profile?.balance ?? 0).replace('¥', '')}
                </span>
              </span>
              <span className="flex items-center gap-0.5 rounded-full bg-[#ffe2cf] px-1.5 py-0.5">
                <img src="/assets/flame.png" alt="" className="h-4 w-4 object-contain" />
                <span className="font-pixel text-xs font-bold text-[#c2410c]">{streak.current}</span>
              </span>
            </div>
          </div>
        </div>
      </NavLink>

      {/* menu */}
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {NAV.map(({ to, label, img, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl border-[3px] px-2.5 py-2 transition active:translate-y-0.5 ${
                isActive
                  ? 'border-[#3c6b28] bg-[#6aa84f] text-white shadow-[0_3px_0_#3c6b28]'
                  : 'border-[#6b4a24] bg-[#fdeecb] text-[color:var(--color-ink)] shadow-[0_3px_0_#3a2614] hover:brightness-[0.97]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 ${
                    isActive ? 'border-white/40 bg-white/20' : 'border-[#c9a87c] bg-white/60'
                  }`}
                >
                  <img src={img} alt="" className="h-9 w-9 object-contain" draggable={false} />
                </span>
                <span className="font-pixel text-base font-bold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* daily tip scroll */}
      <div className="rounded-xl border-[3px] border-[#6b4a24] bg-[#fff5dd] px-3 py-2 shadow-[0_3px_0_#3a2614]">
        <p className="font-pixel text-[10px] font-bold uppercase tracking-wide text-[#a9770f]">Daily tip</p>
        <p className="mt-1 line-clamp-3 text-xs leading-snug text-[color:var(--color-ink)]">{dailyTip()}</p>
      </div>
    </aside>
  )
}
