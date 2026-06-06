import { useEffect, useState } from 'react'
import { Hand } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { useWorld, type Peer } from '../lib/useWorld'
import { Label } from '../components/ui'
import IsoWorld from '../components/world/IsoWorld'

const todayStr = () => new Date().toLocaleDateString('en-CA')

export default function World() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  // my today progress -> broadcast as presence
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

  const { peers, poke, incoming } = useWorld({
    username: profile?.username ?? 'You',
    doneCount: done,
    total,
  })

  // someone poked me
  useEffect(() => {
    if (!incoming) return
    setToast(`👉 ${incoming.fromName} poked you: 做了么?`)
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [incoming])

  function handlePoke(p: Peer) {
    poke(p.id)
    setToast(`👋 You poked ${p.username}`)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <Label>Live</Label>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">The Grind World</h1>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {peers.length} online
        </span>
      </header>

      {/* the world */}
      <div className="relative h-[440px] overflow-hidden rounded-2xl border border-zinc-200 bg-[#0f1020] shadow-sm">
        <IsoWorld peers={peers} onPoke={handlePoke} />

        {/* toast */}
        {toast && (
          <div className="animate-fade-up absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-zinc-900 shadow-lg backdrop-blur">
            {toast}
          </div>
        )}
      </div>

      {/* legend + hint */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Hand size={14} className="text-violet-600" /> Tap someone to poke "做了么?"
        </span>
        <span className="text-zinc-300">·</span>
        <span>🔥 grinding</span>
        <span>✅ all done</span>
        <span>💤 idle</span>
      </div>
    </div>
  )
}
