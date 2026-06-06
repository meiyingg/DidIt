import { useEffect, useMemo, useState } from 'react'
import { Wallet, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { WalletLog } from '../lib/types'
import { money } from '../lib/format'
import { Card, Label, SectionTitle, StatCard } from '../components/ui'
import WeekChart from '../components/WeekChart'

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
        supabase.from('wallet_logs').select('*').eq('user_id', user.id).gte('created_at', since),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('done', true),
      ])
      setLogs(logsRes.data ?? [])
      setStudyMinutes((studyRes.data ?? []).reduce((s, r) => s + (Number(r.duration_minutes) || 0), 0))
      setTasksDone(tasksRes.count ?? 0)
    })()
  }, [user])

  const weeklyEarned = useMemo(
    () => logs.reduce((s, l) => (Number(l.amount) > 0 ? s + Number(l.amount) : s), 0),
    [logs],
  )

  return (
    <div className="animate-fade-up">
      <header className="mb-6">
        <Label>Insights</Label>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Stats</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Balance" value={money(profile?.balance ?? 0)} valueClass={(profile?.balance ?? 0) < 0 ? 'text-rose-600' : 'text-zinc-900'} sub="current wealth" />
        <StatCard icon={TrendingUp} label="Earned 7d" value={money(weeklyEarned)} valueClass="text-emerald-600" sub="last 7 days" />
        <StatCard icon={Clock} label="Study time" value={`${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`} valueClass="text-violet-700" sub="all time" />
        <StatCard icon={CheckCircle2} label="Tasks done" value={String(tasksDone)} sub="all time" />
      </div>

      <Card className="mt-4">
        <SectionTitle
          title="Earnings this week"
          action={<span className="text-sm font-semibold text-emerald-600">{money(weeklyEarned)}</span>}
        />
        <WeekChart logs={logs} />
      </Card>

      <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs text-violet-700">
        📚 Study-time stats fill up once the study timer ships (next feature).
      </p>
    </div>
  )
}
