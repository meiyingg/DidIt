import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../lib/types'
import { money } from '../lib/format'
import { Card, Label } from '../components/ui'

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
    <div className="animate-fade-up">
      <header className="mb-6">
        <Label>Leaderboard</Label>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Ranking</h1>
      </header>

      <div className="mb-4 inline-flex rounded-lg border border-zinc-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'wealth' ? (
        <Card padded={false}>
          <div className="px-4 py-12 text-center text-sm text-zinc-400">
            {tab === 'tasks' ? 'Task' : 'Study time'} ranking arrives with the next features.
          </div>
        </Card>
      ) : loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-zinc-100">
            {rows.map((p, i) => {
              const isMe = p.id === user?.id
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-zinc-50' : ''}`}
                >
                  <span className="w-6 text-center text-sm font-bold tabular-nums text-zinc-400">
                    {i < 3 ? <span className="text-base">{MEDALS[i]}</span> : i + 1}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                    {p.username}
                    {isMe && (
                      <span className="ml-1.5 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                        You
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      p.balance < 0 ? 'text-rose-600' : 'text-zinc-900'
                    }`}
                  >
                    {money(p.balance)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
