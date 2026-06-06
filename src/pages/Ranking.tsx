import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../lib/types'
import { money } from '../lib/format'
import PageHeader from '../components/PageHeader'

type Tab = 'wealth' | 'tasks' | 'study'
const TABS: { key: Tab; label: string }[] = [
  { key: 'wealth', label: 'Wealth' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'study', label: 'Study' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('wealth')
  const [rows, setRows] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('balance', { ascending: false })
        .limit(50)
      setRows(data ?? [])
      setLoading(false)
    })()
  }, [])

  return (
    <>
      <PageHeader title="Ranking" subtitle="Everyone competes on one board." />

      <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'wealth' ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
          {tab === 'tasks' ? 'Task' : 'Study time'} ranking arrives with the next features.
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[60px] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((p, i) => {
            const isMe = p.id === user?.id
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
                  isMe ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                }`}
              >
                <span className="w-7 text-center text-lg font-bold tabular-nums">
                  {i < 3 ? MEDALS[i] : <span className={isMe ? 'text-white/70' : 'text-slate-400'}>{i + 1}</span>}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    isMe ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {p.username}
                  {isMe && <span className="ml-1.5 text-xs opacity-60">You</span>}
                </span>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    isMe ? 'text-white' : p.balance < 0 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {money(p.balance)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
