import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { priceTask } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { Task } from '../lib/types'
import { money } from '../lib/format'
import { useLang } from '../lib/i18n'
import Coin from './Coin'

function fmt(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function dayLabel(date: string): string {
  const today = new Date().toLocaleDateString('en-CA')
  if (date === today) return 'Today'
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  onClose: () => void
  onDone: () => void
  onActivityChange?: (activity: string | null) => void
}

/** Focus timer: pick an existing to-do (incl. unfinished ones) or type a new task. */
export default function StudyTimerModal({ onClose, onDone, onActivityChange }: Props) {
  const { user } = useAuth()
  const { refresh } = useProfile()
  const { t } = useLang()
  const [todos, setTodos] = useState<Task[]>([])
  const [task, setTask] = useState('')
  const [selected, setSelected] = useState<Task | null>(null)
  const [sec, setSec] = useState(0)
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [earned, setEarned] = useState<number | null>(null)
  const baseSec = useRef(0) // accumulated seconds while paused
  const runningSince = useRef<number | null>(null) // epoch ms of the current run
  const startIso = useRef<string | null>(null) // first start, for the DB record
  const pendingSelectedId = useRef<string | null>(null)

  // elapsed is DERIVED from timestamps → a throttled/backgrounded tab never loses time
  function compute() {
    return baseSec.current + (runningSince.current ? Math.floor((Date.now() - runningSince.current) / 1000) : 0)
  }
  function persist() {
    localStorage.setItem(
      'didit_timer',
      JSON.stringify({
        task,
        baseSec: baseSec.current,
        runningSince: runningSince.current,
        startIso: startIso.current,
        selectedId: selected?.id ?? null,
      }),
    )
  }
  function clearPersist() {
    localStorage.removeItem('didit_timer')
  }

  // restore an in-progress session (survives leaving the page / closing the modal)
  useEffect(() => {
    const raw = localStorage.getItem('didit_timer')
    if (!raw) return
    try {
      const s = JSON.parse(raw)
      baseSec.current = Number(s.baseSec) || 0
      runningSince.current = s.runningSince ?? null
      startIso.current = s.startIso ?? null
      pendingSelectedId.current = s.selectedId ?? null
      if (s.task) setTask(s.task)
      setRunning(runningSince.current != null)
      setSec(compute())
    } catch {
      /* ignore corrupt state */
    }
  }, [])

  // load unfinished to-dos (+ restore a persisted selection)
  useEffect(() => {
    if (!user) return
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('done', false)
      .order('task_date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        const list = data ?? []
        setTodos(list)
        if (pendingSelectedId.current) {
          const found = list.find((x) => x.id === pendingSelectedId.current)
          if (found) setSelected(found)
        }
      })
  }, [user])

  // tick the DISPLAY only (value is derived from timestamps)
  useEffect(() => {
    setSec(compute())
    if (!running) return
    const id = window.setInterval(() => setSec(compute()), 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  // keep the persisted task name fresh while a session is active
  useEffect(() => {
    if (runningSince.current != null || baseSec.current > 0) persist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, selected])

  // broadcast a live "studying X" status to the room while the timer runs
  useEffect(() => {
    onActivityChange?.(running && task.trim() ? `studying ${task.trim()}` : null)
  }, [running, task, onActivityChange])

  function pick(t: Task) {
    setSelected(t)
    setTask(t.name)
  }

  function start() {
    if (!task.trim()) return
    if (!startIso.current) startIso.current = new Date().toISOString()
    runningSince.current = Date.now()
    setRunning(true)
    persist()
  }
  function pause() {
    if (runningSince.current) baseSec.current += Math.floor((Date.now() - runningSince.current) / 1000)
    runningSince.current = null
    setRunning(false)
    setSec(compute())
    persist()
  }

  async function finish() {
    if (runningSince.current) {
      baseSec.current += Math.floor((Date.now() - runningSince.current) / 1000)
      runningSince.current = null
    }
    setRunning(false)
    const total = compute()
    setSec(total)
    const minutes = Math.max(0, Math.round(total / 60))
    if (!user || !task.trim() || total < 1) {
      clearPersist()
      onClose()
      return
    }
    setSaving(true)
    try {
      // Balance and study_minutes are maintained by DB triggers — we only
      // insert the session (→ study_minutes) and the ledger row (→ balance).
      const startedIso = startIso.current ?? new Date().toISOString()
      let reward = 0
      if (selected) {
        // completing the selected to-do credits its reward via complete_task (no double pay)
        const { error } = await supabase.rpc('complete_task', { p_task_id: selected.id })
        if (error) throw error
        reward = Number(selected.reward)
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          task_id: selected.id,
          task_name: task.trim(),
          started_at: startedIso,
          ended_at: new Date().toISOString(),
          duration_minutes: minutes,
          reward,
        })
      } else {
        reward = await priceTask(`${task.trim()} (studied ${minutes} min)`)
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          task_name: task.trim(),
          started_at: startedIso,
          ended_at: new Date().toISOString(),
          duration_minutes: minutes,
          reward,
        })
        await supabase.from('wallet_logs').insert({
          user_id: user.id,
          amount: reward,
          type: 'study_reward',
          note: `${task.trim()} · ${minutes}m`,
        })
      }
      await refresh()
      setEarned(reward)
      clearPersist()
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
      <div className="px-panel w-full max-w-sm overflow-hidden">
        <div className="px-header px-h-amber">
          <img src="/assets/icon-timer.png" alt="" className="h-5 w-5 object-contain" />
          <h3 className="font-pixel flex-1 text-[15px] font-bold">{t('timer.title')}</h3>
          <button onClick={onClose} className="font-pixel text-white/90 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-5">
          {earned !== null ? (
            <div className="py-6 text-center">
              <img src="/assets/icon-party.png" alt="" className="mx-auto h-12 w-12 object-contain" />
              <p className="font-pixel mt-3 text-lg font-bold text-[color:var(--color-ink)]">{t('timer.niceWork')}</p>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t('timer.studiedEarned', { time: fmt(sec) })}</p>
              <p className="font-pixel mt-1 flex items-center justify-center gap-1.5 text-2xl font-bold text-[color:var(--color-grass-dark)]">
                <Coin className="h-6 w-6" /> {money(earned).replace('¥', '')}
              </p>
              <button onClick={onClose} className="px-btn mt-5 w-full">
                {t('common.gotit')}
              </button>
            </div>
          ) : (
            <>
              {todos.length > 0 && (
                <>
                  <label className="font-pixel mb-1.5 block text-xs font-bold uppercase text-[color:var(--color-muted)]">
                    {t('timer.pickTodo')}
                  </label>
                  <div className="mb-3 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    {todos.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => pick(t)}
                        disabled={running}
                        className={`rounded-full border-2 px-2.5 py-1 text-xs transition ${
                          selected?.id === t.id
                            ? 'border-[#3c6b28] bg-[#6aa84f] text-white'
                            : 'border-[#c9a772] bg-[#fffdf5] text-[color:var(--color-ink)] hover:border-[#6aa84f]'
                        }`}
                      >
                        {t.name}
                        <span className="ml-1 opacity-60">· {dayLabel(t.task_date)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <label className="font-pixel mb-1 block text-xs font-bold uppercase text-[color:var(--color-muted)]">
                {todos.length > 0 ? t('timer.orNew') : t('timer.whatWorking')}
              </label>
              <input
                value={task}
                onChange={(e) => {
                  setTask(e.target.value)
                  setSelected(null)
                }}
                placeholder={t('timer.placeholder')}
                disabled={running}
                className="px-input mb-4 w-full text-sm disabled:opacity-60"
              />

              <div className="font-pixel my-1 rounded-lg border-2 border-[#6b4a24] bg-[#2b2436] py-4 text-center text-4xl font-bold tracking-widest text-[#7ee0a0] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                {fmt(sec)}
              </div>

              <div className="mt-4 flex gap-2">
                {!running ? (
                  <button onClick={start} disabled={!task.trim()} className="px-btn flex-1">
                    ▶ {sec > 0 ? t('timer.resume') : t('timer.start')}
                  </button>
                ) : (
                  <button onClick={pause} className="px-btn px-btn-amber flex-1">
                    ⏸ {t('timer.pause')}
                  </button>
                )}
                <button onClick={finish} disabled={saving || sec < 1} className="px-btn flex-1">
                  {saving ? t('common.saving') : `⏹ ${t('timer.finish')}`}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-[color:var(--color-faint)]">
                {selected ? t('timer.todoReward') : t('timer.aiReward')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
