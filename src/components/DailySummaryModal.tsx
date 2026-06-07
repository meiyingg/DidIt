import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Panel } from '../components/ui'

const FALLBACK_SUMMARY =
  "A fresh day begins. Yesterday is behind you — take one small step, keep your streak alive, and be kind to yourself. You've got this!"

/** Local 'YYYY-MM-DD' for the day before today. */
function yesterdayLocal(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA') // en-CA renders as YYYY-MM-DD
}

interface Props {
  onClose: () => void
}

/**
 * A cozy "good morning recap" modal. On mount it gathers yesterday's journal +
 * task stats and asks the `daily-summary` Edge Function for a warm recap. The
 * parent decides when to mount it; this component has no trigger logic.
 */
export default function DailySummaryModal({ onClose }: Props) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const yesterday = yesterdayLocal()
      try {
        if (!user) {
          if (!cancelled) {
            setSummary(FALLBACK_SUMMARY)
            setLoading(false)
          }
          return
        }

        // Yesterday's journal entry (may not exist).
        const { data: diaryRow } = await supabase
          .from('diary_entries')
          .select('content')
          .eq('user_id', user.id)
          .eq('entry_date', yesterday)
          .maybeSingle()
        const diaryContent = diaryRow?.content ?? ''

        // Yesterday's tasks → completion stats.
        const { data: taskRows } = await supabase
          .from('tasks')
          .select('done')
          .eq('user_id', user.id)
          .eq('task_date', yesterday)
        const rows = taskRows ?? []
        const tasksTotal = rows.length
        const tasksDone = rows.filter((r) => r.done).length

        const { data } = await supabase.functions.invoke('daily-summary', {
          body: { diary: diaryContent, tasksDone, tasksTotal, date: yesterday },
        })

        if (!cancelled) {
          setSummary((data as { summary?: string })?.summary ?? FALLBACK_SUMMARY)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setSummary(FALLBACK_SUMMARY)
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
      <Panel
        title="Good morning recap"
        icon={<img src="/assets/icon-sun.png" alt="" className="h-5 w-5 object-contain" />}
        color="blue"
        className="w-full max-w-sm"
        action={
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-pixel text-white/90 hover:text-white"
          >
            ✕
          </button>
        }
      >
        <div className="p-1">
          <img
            src="/assets/morning.png"
            alt=""
            className="mb-3 h-28 w-full rounded-lg object-cover"
            draggable={false}
          />
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-[color:var(--color-muted)]">
              <img src="/assets/loading.png" alt="" className="h-6 w-6 animate-spin object-contain" />
              <p className="font-pixel text-sm">Thinking about yesterday…</p>
            </div>
          ) : (
            <p className="whitespace-pre-line py-2 text-sm leading-relaxed text-[color:var(--color-ink)]">
              {summary ?? FALLBACK_SUMMARY}
            </p>
          )}

          <button onClick={onClose} disabled={loading} className="px-btn mt-4 flex w-full items-center justify-center gap-1.5 disabled:opacity-60">
            Start the day <img src="/assets/icon-sun.png" alt="" className="h-4 w-4 object-contain" />
          </button>
        </div>
      </Panel>
    </div>
  )
}
