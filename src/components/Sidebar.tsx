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
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-4 border-r-4 border-[#2a1a0c] bg-[#4a3320] px-3 py-4 md:flex shadow-[4px_0_10px_rgba(0,0,0,0.3)]"
      style={{ backgroundImage: "url('/assets/bg-tile-wood.png')", backgroundSize: '240px' }}
    >
      {/* brand */}
      <div className="px-1 pb-1">
        <div className="flex items-center gap-3 group">
          <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl transition-opacity group-hover:opacity-100" />
            <img src="/assets/logo.png" alt="" className="relative h-16 w-16 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]" draggable={false} />
          </div>
          <div className="leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <p className="font-pixel text-2xl font-bold tracking-wide text-amber-50">DidIt</p>
            <p className="font-pixel text-xs tracking-wider text-amber-300">做了么</p>
          </div>
        </div>
      </div>

      {/* player card */}
      <NavLink
        to="/me"
        className="rounded-2xl border-[3px] border-[#6b4a24] bg-[#fff5dd] p-2.5 shadow-[0_4px_0_#3a2614] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_5px_0_#3a2614] hover:brightness-[0.99] active:translate-y-0.5 active:shadow-[0_1px_0_#3a2614]"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative h-14 w-14 shrink-0 shadow-inner">
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
            <p className="font-pixel truncate text-sm font-bold text-[color:var(--color-ink)] hover:text-amber-800 transition-colors">{profile?.username ?? 'You'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-[#fff1c9] px-1.5 py-0.5 shadow-sm border border-[#f3dca3] shrink-0">
                <img src="/assets/coin.png" alt="" className="h-3.5 w-3.5 object-contain" />
                <span className={`font-pixel text-[10px] font-bold ${negative ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}`}>
                  {money(profile?.balance ?? 0).replace('¥', '')}
                </span>
              </span>
              <span className="flex items-center gap-0.5 rounded-full bg-[#ffe2cf] px-1.5 py-0.5 shadow-sm border border-[#f8c6a6] shrink-0">
                <img src="/assets/flame.png" alt="" className="h-3.5 w-3.5 object-contain" />
                <span className="font-pixel text-[10px] font-bold text-[#c2410c]">{streak.current}</span>
              </span>
            </div>
          </div>
        </div>
      </NavLink>

      {/* menu */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
        {NAV.map(({ to, label, img, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3.5 rounded-xl border-[3px] px-2.5 py-1.5 transition-all duration-200 select-none shadow-[0_4px_0_#3a2614] active:translate-y-0 active:scale-[0.99] active:shadow-[0_1px_0_#3a2614] ${
                isActive
                  ? 'border-[#3c6b28] bg-[#6aa84f] text-white -translate-y-0.5 scale-[1.01] z-10'
                  : 'border-[#6b4a24] bg-[#fdeecb] text-[color:var(--color-ink)] hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-[0.98]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 shadow-sm transition-colors ${
                    isActive ? 'border-white/40 bg-white/20' : 'border-[#c9a87c] bg-white/60 group-hover:bg-white/80'
                  }`}
                >
                  <img src={img} alt="" className="h-10 w-10 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110" draggable={false} />
                </span>
                <span className="font-pixel text-sm font-bold tracking-wide">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* daily tip card */}
      <div className="mt-auto flex justify-center pb-1">
        <div 
          className="relative w-[150px] h-[186px] select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:-rotate-1"
          style={{ 
            backgroundImage: "url('/assets/pixel_art_card_4.png')", 
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Top-Right Tag */}
          <div className="absolute top-[9px] right-[9px] z-10">
            <span className="font-pixel text-[7px] font-bold uppercase tracking-widest text-[#7c4d12] bg-[#fff5dd]/90 px-1 py-0.5 rounded border border-[#b28247]/30 shadow-sm">
              Tip
            </span>
          </div>

          {/* Text Content - positioned to sit cleanly in the sky area */}
          <div className="absolute inset-0 flex flex-col justify-between px-3 pt-[32px] pb-[64px]">
            <div className="flex-1 flex items-center justify-center">
              <p 
                className="font-pixel text-center text-[11px] font-bold leading-snug text-[#2c1802] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] overflow-y-auto max-h-[85px] scrollbar-none"
                style={{ wordBreak: 'break-word' }}
              >
                "{dailyTip()}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
