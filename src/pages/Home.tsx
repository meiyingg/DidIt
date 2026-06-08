import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { computeStreak } from '../lib/streak'
import WorldScene from '../components/WorldScene'

const todayStr = () => new Date().toLocaleDateString('en-CA')

export default function Home() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      await supabase.rpc('ensure_today_tasks')
      const [todayRes, doneRes] = await Promise.all([
        supabase.from('tasks').select('done').eq('user_id', user.id).eq('task_date', todayStr()),
        supabase.from('tasks').select('task_date').eq('user_id', user.id).eq('done', true),
      ])
      const rows = todayRes.data ?? []
      setTotal(rows.length)
      setDone(rows.filter((r) => r.done).length)
      setStreak(computeStreak((doneRes.data ?? []).map((r) => r.task_date as string)).current)
    })()
  }, [user])

  return (
    <div className="flex flex-1 flex-col">
      <WorldScene
        name={profile?.username ?? 'friend'}
        balance={profile?.balance ?? 0}
        doneCount={done}
        total={total}
        streak={streak}
      />
    </div>
  )
}
