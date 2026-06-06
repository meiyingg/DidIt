import { useEffect, useMemo, useState } from 'react'
import { Wallet, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { WalletLog } from '../lib/types'
import { money } from '../lib/format'
import PageHeader from '../components/PageHeader'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Stats() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [logs, setLogs] = useState<WalletLog[]>([])
  const [studyMinutes, setStudyMinutes] = useState(0)
  const [tasksDone, setTasksDone] = useState(0)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const since = new Date(Date.now() - 7 * 864e5).toISOString()
      const [logsRes, studyRes, tasksRes] = await Promise.all([
        supabase
          .from('wallet_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', since)
          .order('created_at', { ascending: true }),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('done', true),
      ])
      setLogs(logsRes.data ?? [])
      setStudyMinutes(
        (studyRes.data ?? []).reduce((s, r) => s + (Number(r.duration_minutes) || 0), 0),
      )
      setTasksDone(tasksRes.count ?? 0)
    })()
  }, [user])

  const { weeklyEarned, bars } = useMemo(() => {
    // Build last-7-day earned buckets (Mon..Sun of the trailing week).
    const buckets = new Array(7).fill(0)
    let weeklyEarned = 0
    for (const l of logs) {
      const amt = Number(l.amount)
      if (amt <= 0) continue
      weeklyEarned += amt
      const d = new Date(l.created_at)
      const idx = (d.getDay() + 6) % 7 // Mon=0
      buckets[idx] += amt
    }
    const max = Math.max(1, ...buckets)
    const bars = buckets.map((v) => Math.round((v / max) * 100))
    return { weeklyEarned, bars }
  }, [logs])

  const stats = [
    { Icon: Wallet, label: 'Balance', value: money(profile?.balance ?? 0), tint: 'text-slate-900' },
    { Icon: TrendingUp, label: 'Earned (7d)', value: money(weeklyEarned), tint: 'text-emerald-600' },
    { Icon: Clock, label: 'Study time', value: `${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`, tint: 'text-indigo-600' },
    { Icon: CheckCircle2, label: 'Tasks done', value: String(tasksDone), tint: 'text-slate-900' },
  ]

  return (
    <>
      <PageHeader title="Stats" subtitle="Your discipline, in numbers." />

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ Icon, label, value, tint }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Icon size={18} className="text-slate-400" />
            <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
            <p className={`mt-0.5 text-xl font-bold tabular-nums ${tint}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Earnings this week</h2>
          <span className="text-sm font-semibold text-emerald-600">{money(weeklyEarned)}</span>
        </div>
        <div className="flex h-32 items-end justify-between gap-2">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-slate-900 to-indigo-500 transition-all duration-500"
                  style={{ height: `${Math.max(4, h)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">{DAY_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
        📚 Study time fills up once the study timer ships (next feature).
      </p>
    </>
  )
}
