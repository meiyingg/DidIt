import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../lib/types'
import { money } from '../lib/format'
import { charImg } from '../lib/characters'
import Container from '../components/Container'
import { Label, Panel } from '../components/ui'
import Icon from '../components/Icon'
import Coin from '../components/Coin'

type Metric = 'study' | 'wealth'

const medalSrc = (rank: number) => `/assets/medal-${rank + 1}.png`
const PEDESTAL = ['linear-gradient(#f7d069,#e0a23c)', 'linear-gradient(#e7edf4,#aab4c4)', 'linear-gradient(#e6b07a,#c98a4f)']
const BAR = [
  'linear-gradient(#f7d069,#e0a23c)',
  'linear-gradient(#e7edf4,#aab4c4)',
  'linear-gradient(#e6b07a,#c98a4f)',
  'linear-gradient(#7cc24a,#5a9e30)',
]
const PODIUM_H = [96, 64, 44]

const studyMin = (p: Profile) => Number(p.study_minutes ?? 0)
const fmtStudy = (v: number) => `${Math.floor(v / 60)}h ${v % 60}m`
const avatar = (p: Profile) => charImg(p.avatar_url)

export default function Ranking() {
  const { user } = useAuth()
  const [all, setAll] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<Metric>('study')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .limit(50)
      .then(({ data }) => {
        setAll(data ?? [])
        setLoading(false)
      })
  }, [])

  const valueOf = (p: Profile) => (metric === 'study' ? studyMin(p) : Number(p.balance))
  const fmt = (v: number) => (metric === 'study' ? fmtStudy(v) : money(v))

  const rows = useMemo(() => [...all].sort((a, b) => valueOf(b) - valueOf(a)), [all, metric])

  const vals = rows.map(valueOf)
  const max = Math.max(...vals, 1)
  const min = Math.min(...vals, 0)
  const span = Math.max(1, max - min)

  const top3 = rows.slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as Profile[]

  return (
    <Container className="animate-fade-up">
      <header className="mb-4">
        <Label>Leaderboard</Label>
        <h1 className="font-pixel mt-1 flex items-center gap-2 text-2xl font-bold text-[color:var(--color-ink)]">
          {metric === 'study' ? <Icon src="icon-study" className="h-7 w-7" /> : <Coin className="h-7 w-7" />}
          {metric === 'study' ? 'Study Champions' : 'Hall of Wealth'}
        </h1>
      </header>

      {/* tabs */}
      <div className="mb-4 inline-flex rounded-xl border-2 border-[#6b4a24] bg-[#fff5dd] p-1">
        {(['study', 'wealth'] as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`font-pixel flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition ${
              metric === m ? 'bg-[#6aa84f] text-white shadow-[0_2px_0_#3c6b28]' : 'text-[color:var(--color-muted)]'
            }`}
          >
            {m === 'study' ? <Icon src="icon-timer" className="h-4 w-4" /> : <Coin className="h-4 w-4" />}
            {m === 'study' ? 'Study time' : 'Wealth'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-panel h-48 animate-pulse" />
      ) : (
        <>
          {/* podium */}
          {top3.length > 0 && (
            <div className="px-panel mb-4 overflow-hidden bg-gradient-to-b from-[#fff3d0] to-[#fff8e8] p-4">
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                {podiumOrder.map((p) => {
                  const rank = rows.indexOf(p)
                  const isMe = p.id === user?.id
                  const v = valueOf(p)
                  return (
                    <div key={p.id} className="flex w-20 flex-col items-center sm:w-24">
                      <img src={medalSrc(rank)} alt="" className="h-9 w-9 object-contain" draggable={false} />
                      <div
                        className={`mt-1 overflow-hidden rounded-2xl border-2 bg-[#f3e6c8] ${isMe ? 'border-violet-500' : 'border-[#6b4a24]'}`}
                        style={{ width: rank === 0 ? 64 : 52, height: rank === 0 ? 64 : 52 }}
                      >
                        <img src={avatar(p)} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')} />
                      </div>
                      <p className="font-pixel mt-1 max-w-full truncate text-xs font-bold text-[color:var(--color-ink)]">{p.username}</p>
                      <p className={`font-pixel text-xs font-bold ${metric === 'wealth' && p.balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-grass-dark)]'}`}>
                        {fmt(v)}
                      </p>
                      <div
                        className="mt-1.5 flex w-full items-start justify-center rounded-t-lg border-2 border-b-0 border-[#6b4a24] pt-1 font-pixel text-lg font-bold text-white/90"
                        style={{ height: PODIUM_H[rank], background: PEDESTAL[rank] }}
                      >
                        {rank + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* bar chart */}
          <Panel title={metric === 'study' ? 'Study time ranking' : 'Wealth ranking'} icon={<Icon src="icon-chart" />} color="amber">
            <ul className="space-y-2.5">
              {rows.map((p, i) => {
                const isMe = p.id === user?.id
                const v = valueOf(p)
                const pct = ((v - min) / span) * 100
                return (
                  <li key={p.id} className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 ${isMe ? 'bg-[#f3e7c6]' : ''}`}>
                    <span className="flex w-6 justify-center text-center text-sm">
                      {i < 3 ? (
                        <img src={medalSrc(i)} alt="" className="h-5 w-5 object-contain" draggable={false} />
                      ) : (
                        <span className="font-pixel text-[color:var(--color-faint)]">{i + 1}</span>
                      )}
                    </span>
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border-2 border-[#6b4a24] bg-[#f3e6c8]">
                      <img src={avatar(p)} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-pixel truncate text-sm font-semibold text-[color:var(--color-ink)]">
                          {p.username}
                          {isMe && <span className="ml-1 rounded bg-violet-200 px-1 text-[10px] text-violet-800">You</span>}
                        </span>
                        <span className={`font-pixel shrink-0 text-sm font-bold ${metric === 'wealth' && p.balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}`}>
                          {fmt(v)}
                        </span>
                      </div>
                      <div className="px-bar !h-3">
                        <span style={{ width: `${Math.max(3, pct)}%`, background: BAR[Math.min(i, 3)] }} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </>
      )}
    </Container>
  )
}
