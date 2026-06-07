import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import WorldScene from '../components/WorldScene'

const todayStr = () => new Date().toLocaleDateString('en-CA')

export default function Home() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      await supabase.rpc('ensure_today_tasks')
      const { data } = await supabase
        .from('tasks')
        .select('done')
        .eq('user_id', user.id)
        .eq('task_date', todayStr())
      const rows = data ?? []
      setTotal(rows.length)
      setDone(rows.filter((r) => r.done).length)
    })()
  }, [user])

  return (
    <div className="flex flex-1 flex-col">
      <WorldScene
        name={profile?.username ?? 'friend'}
        balance={profile?.balance ?? 0}
        doneCount={done}
        total={total}
      />
    </div>
  )
}
