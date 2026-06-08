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
import { useLang } from '../lib/i18n'

type Metric = 'study' | 'wealth'

const medalSrc = (rank: number) => `/assets/medal-${rank + 1}.png`
const PEDESTAL = ['linear-gradient(#f7d069,#e0a23c)', 'linear-gradient(#e7edf4,#aab4c4)', 'linear-gradient(#e6b07a,#c98a4f)']
const BAR = [
  'linear-gradient(#f7d069,#e0a23c)',
  'linear-gradient(#e7edf4,#aab4c4)',
  'linear-gradient(#e6b07a,#c98a4f)',
  'linear-gradient(#7cc24a,#5a9e30)',
]
const PODIUM_MIN_H = 44
const PODIUM_MAX_H = 108

const studyMin = (p: Profile) => Number(p.study_minutes ?? 0)
const fmtStudy = (v: number) => `${Math.floor(v / 60)}h ${v % 60}m`
const avatar = (p: Profile) => charImg(p.avatar_url)

export default function Ranking() {
  const { user } = useAuth()
  const { t } = useLang()
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => [...all].sort((a, b) => valueOf(b) - valueOf(a)), [all, metric])

  const vals = rows.map(valueOf)
  // Proportional: bar width = value / max, so 10h is truly 10× the bar of 1h.
  // For wealth (can go negative): negative values get a tiny minimum bar.
  const maxVal = Math.max(...vals, 1)
  const allNonNeg = vals.every((v) => v >= 0)

  const top3 = rows.slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as Profile[]

  return (
    <Container className="animate-fade-up">
      {/* header + tabs inline */}
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label>{t('rank.leaderboard')}</Label>
          <h1 className="font-pixel mt-1 flex items-center gap-2 text-2xl font-bold text-[color:var(--color-ink)]">
            {metric === 'study' ? <Icon src="icon-study" className="h-7 w-7" /> : <Coin className="h-7 w-7" />}
            {metric === 'study' ? t('rank.studyChampions') : t('rank.hallWealth')}
          </h1>
        </div>
        <div className="inline-flex rounded-xl border-2 border-[#6b4a24] bg-[#fff5dd] p-1">
          {(['study', 'wealth'] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`font-pixel flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition ${
                metric === m ? 'bg-[#6aa84f] text-white shadow-[0_2px_0_#3c6b28]' : 'text-[color:var(--color-muted)]'
              }`}
            >
              {m === 'study' ? <Icon src="icon-timer" className="h-4 w-4" /> : <Coin className="h-4 w-4" />}
              {m === 'study' ? t('rank.studyTime') : t('rank.wealth')}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="px-panel h-48 animate-pulse" />
      ) : (
        <>
          {/* podium */}
          {top3.length > 0 && (
            <div className="px-panel relative mb-4 overflow-hidden">
              {/* scenic background */}
              <img
                src="/assets/background.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/5" />
              <div className="relative flex items-end justify-center gap-4 px-4 pb-0 pt-10 sm:gap-8 sm:pt-14">
                {podiumOrder.map((p) => {
                  const rank = rows.indexOf(p)
                  const isMe = p.id === user?.id
                  const v = valueOf(p)
                  const isFirst = rank === 0
                  // Podium height proportional to value: all equal when tied, scales up to PODIUM_MAX_H
                  const podiumH = maxVal > 0
                    ? PODIUM_MIN_H + ((v / maxVal) * (PODIUM_MAX_H - PODIUM_MIN_H))
                    : PODIUM_MIN_H  // all zero → all same height
                  return (
                    <div key={p.id} className="flex w-24 flex-col items-center sm:w-28">
                      <img src={medalSrc(rank)} alt="" className={`object-contain drop-shadow-lg ${isFirst ? 'h-11 w-11' : 'h-8 w-8'}`} draggable={false} />
                      <div
                        className={`mt-1 overflow-hidden rounded-2xl border-[3px] bg-[#f3e6c8] shadow-lg ${isMe ? 'border-violet-400 ring-2 ring-violet-400/40' : 'border-white/80'}`}
                        style={{ width: isFirst ? 72 : 56, height: isFirst ? 72 : 56 }}
                      >
                        <img src={avatar(p)} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')} />
                      </div>
                      <p className="font-pixel mt-1.5 max-w-full truncate text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{p.username}</p>
                      <p className={`font-pixel text-xs font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${metric === 'wealth' && p.balance < 0 ? 'text-[#ff9b9b]' : 'text-[#b5f5b5]'}`}>
                        {fmt(v)}
                      </p>
                      <div
                        className="mt-2 flex w-full items-start justify-center rounded-t-xl border-[3px] border-b-0 border-white/25 pt-1.5 font-pixel text-xl font-bold text-white/90"
                        style={{ height: podiumH, background: PEDESTAL[rank], boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }}
                      >
                        {rank + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ranking list */}
          <Panel title={metric === 'study' ? t('rank.studyRanking') : t('rank.wealthRanking')} icon={<Icon src="icon-chart" />} color="amber">
            <ul className="space-y-1.5">
              {rows.map((p, i) => {
                const isMe = p.id === user?.id
                const v = valueOf(p)
                // Proportional bar: value / max. 10h person gets a bar 10× longer than 1h person.
                const pct = v > 0 ? (v / maxVal) * 100 : allNonNeg ? 0 : 3
                return (
                  <li key={p.id} className={`flex items-center gap-2.5 rounded-xl px-2 py-2 transition ${isMe ? 'bg-[#f3e7c6] ring-1 ring-[#d8c49a]' : 'hover:bg-[#faf3e0]'}`}>
                    <span className="flex w-6 justify-center text-center">
                      {i < 3 ? (
                        <img src={medalSrc(i)} alt="" className="h-6 w-6 object-contain" draggable={false} />
                      ) : (
                        <span className="font-pixel text-sm font-bold text-[color:var(--color-faint)]">{i + 1}</span>
                      )}
                    </span>
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-[#6b4a24] bg-[#f3e6c8]">
                      <img src={avatar(p)} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-pixel truncate text-sm font-bold text-[color:var(--color-ink)]">
                          {p.username}
                          {isMe && <span className="ml-1.5 rounded-md bg-violet-200 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">{t('rank.you')}</span>}
                        </span>
                        <span className={`font-pixel shrink-0 text-sm font-bold ${metric === 'wealth' && p.balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}`}>
                          {fmt(v)}
                        </span>
                      </div>
                      <div className="px-bar">
                        <span style={{ width: `${Math.max(1, pct)}%`, background: v < 0 ? 'linear-gradient(#e88,#d55)' : BAR[Math.min(i, 3)] }} />
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
