import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { priceTask } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { FixedTask, Task } from '../lib/types'
import Container from '../components/Container'
import { Label, StatCard } from '../components/ui'
import Icon from '../components/Icon'
import TaskItem from '../components/TaskItem'
import AddTaskForm from '../components/AddTaskForm'
import FixedTasksManager from '../components/FixedTasksManager'
import DiaryEditor from '../components/DiaryEditor'
import { useLang } from '../lib/i18n'

const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_ZH = ['日', '一', '二', '三', '四', '五', '六']
const pad = (n: number) => String(n).padStart(2, '0')
const dateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

export default function Calendar() {
  const { user } = useAuth()
  const { refresh: refreshProfile } = useProfile()
  const { t, lang, locale } = useLang()
  const WD = lang === 'zh' ? WD_ZH : WD_EN
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayN = now.getDate()

  const [tasks, setTasks] = useState<Task[]>([])
  const [fixedTasks, setFixedTasks] = useState<FixedTask[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showFixed, setShowFixed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    // materialise today's required tasks from the template before reading the month
    await supabase.rpc('ensure_today_tasks')
    const from = dateStr(year, month, 1)
    const to = dateStr(year, month, new Date(year, month + 1, 0).getDate())
    const [tRes, fRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).gte('task_date', from).lte('task_date', to),
      supabase.from('fixed_tasks').select('*').eq('user_id', user.id).order('sort_order'),
    ])
    setTasks(tRes.data ?? [])
    setFixedTasks(fRes.data ?? [])
  }, [user, year, month])

  useEffect(() => {
    load()
  }, [load])

  const byDate = useMemo(() => {
    const m = new Map<string, { done: number; total: number; tasks: Task[] }>()
    for (const t of tasks) {
      const e = m.get(t.task_date) ?? { done: 0, total: 0, tasks: [] }
      e.total++
      if (t.done) e.done++
      e.tasks.push(t)
      m.set(t.task_date, e)
    }
    return m
  }, [tasks])

  const monthDone = tasks.filter((t) => t.done).length

  async function completeTask(id: string) {
    const { error: e } = await supabase.rpc('complete_task', { p_task_id: id })
    if (e) return setError(e.message)
    await Promise.all([load(), refreshProfile()])
  }
  async function addForDate(name: string, date: string) {
    if (!user) return
    // Insert immediately with a placeholder reward so the task shows up at once;
    // the AI prices it in the background and patches the reward in afterwards.
    const { data, error: e } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, name, type: 'custom', task_date: date, reward: 0 })
      .select('id')
      .single()
    if (e) return setError(e.message)
    await load()
    if (data) {
      priceTask(name)
        .then(async (reward) => {
          await supabase.from('tasks').update({ reward }).eq('id', data.id)
          await load()
        })
        .catch(() => {})
    }
  }
  async function addFixed(name: string) {
    if (!user) return
    const trimmed = name.trim()
    // guard against duplicate dailies (which would materialise as two identical tasks)
    if (fixedTasks.some((f) => f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError(t('fixed.dup'))
      return
    }
    const { data, error: e } = await supabase
      .from('fixed_tasks')
      .insert({ user_id: user.id, name: trimmed, reward: 0, sort_order: fixedTasks.length })
      .select('id')
      .single()
    if (e) return setError(e.message)
    await load()
    if (data) {
      // price in the background, then patch the template + today's materialised copy
      priceTask(trimmed)
        .then(async (reward) => {
          await supabase.from('fixed_tasks').update({ reward }).eq('id', data.id)
          await supabase.from('tasks').update({ reward }).eq('source_fixed_id', data.id).eq('done', false)
          await load()
        })
        .catch(() => {})
    }
  }
  async function removeFixed(id: string) {
    if (!user) return
    const { error: e } = await supabase.from('fixed_tasks').delete().eq('id', id)
    if (e) return setError(e.message)
    // also drop today's not-yet-done materialised copy so it leaves the calendar
    await supabase.from('tasks').delete().eq('user_id', user.id).eq('source_fixed_id', id).eq('done', false)
    await load()
  }

  // build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysIn = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysIn; d++) cells.push(d)

  const selDay = selected ? byDate.get(selected) : undefined

  return (
    <Container className="animate-fade-up">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <Label>{t('cal.dataPanel')}</Label>
          <h1 className="font-pixel mt-1 text-2xl font-bold text-[color:var(--color-ink)]">
            {now.toLocaleString(locale, { month: 'long' })} {year}
          </h1>
        </div>
        <button onClick={() => setShowFixed(true)} className="px-btn px-btn-amber flex items-center gap-1.5 text-sm">
          <Icon src="icon-gear" className="h-4 w-4" /> {t('cal.dailyRequired')}
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border-2 border-[color:var(--color-berry)] bg-red-50 p-3 text-sm text-[color:var(--color-berry)]">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard emoji={<Icon src="icon-tasks" className="h-6 w-6" />} label={t('cal.doneMonth')} tile="#dff3d2" value={monthDone} />
        <StatCard emoji={<Icon src="icon-list" className="h-6 w-6" />} label={t('cal.totalTasks')} tile="#fff1c9" value={tasks.length} />
        <StatCard emoji={<Icon src="icon-pending" className="h-6 w-6" />} label={t('cal.pending')} tile="#fde2cf" value={tasks.length - monthDone} />
      </div>

      {/* month grid */}
      <div className="px-panel p-3">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {WD.map((d) => (
            <div key={d} className="font-pixel text-center text-xs font-bold text-[color:var(--color-muted)]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />
            const ds = dateStr(year, month, d)
            const info = byDate.get(ds)
            const isToday = d === todayN
            const allDone = info && info.done === info.total && info.total > 0
            const partial = info && info.done < info.total
            // compact dots for the mobile view (names don't fit in a 7-col phone grid)
            const dots = info
              ? info.tasks.map((task) => ({
                  key: task.id,
                  cls: task.done ? 'bg-[#4f8f2a]' : task.type === 'required' ? 'bg-[#e0a23c]' : 'bg-[#c9a772]',
                }))
              : d >= todayN
                ? fixedTasks.map((ft) => ({ key: ft.id, cls: 'bg-[#e0a23c]/50' }))
                : []
            return (
              <div
                key={i}
                onClick={() => setSelected(ds)}
                className={`flex h-16 cursor-pointer flex-col overflow-hidden rounded-lg border-2 p-1.5 transition hover:brightness-[0.97] sm:h-36 ${
                  allDone
                    ? 'border-[#6aa84f] bg-[#e3f3d6]'
                    : partial
                      ? 'border-[#e0a23c] bg-[#fdf0d6]'
                      : 'border-[#e3d2a8] bg-[#fffdf5]'
                } ${isToday ? 'ring-2 ring-[#4a90d9] ring-offset-1' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-pixel text-sm font-bold ${isToday ? 'text-[#4a90d9]' : 'text-[color:var(--color-ink)]'}`}
                  >
                    {d}
                  </span>
                  {info && (
                    <span className="font-pixel hidden text-[10px] text-[color:var(--color-muted)] sm:inline">
                      {info.done}/{info.total}
                    </span>
                  )}
                </div>

                {/* mobile: compact dots (task names don't fit in a narrow 7-col grid) */}
                {dots.length > 0 && (
                  <div className="mt-1 flex flex-wrap content-start gap-1 sm:hidden">
                    {dots.slice(0, 9).map((dot) => (
                      <span key={dot.key} className={`h-1.5 w-1.5 rounded-full ${dot.cls}`} />
                    ))}
                  </div>
                )}

                {/* desktop: full task names */}
                {info ? (
                  <div className="mt-1 hidden flex-1 space-y-0.5 overflow-y-auto pr-0.5 sm:block">
                    {info.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-1 leading-tight">
                        <span
                          className={`mt-px text-[9px] ${
                            task.done ? 'text-[#4f8f2a]' : task.type === 'required' ? 'text-[#e0a23c]' : 'text-[color:var(--color-faint)]'
                          }`}
                        >
                          {task.done ? '✓' : task.type === 'required' ? '◆' : '•'}
                        </span>
                        <span
                          className={`truncate text-[10px] ${
                            task.done ? 'text-[color:var(--color-faint)] line-through' : 'text-[color:var(--color-ink)]'
                          }`}
                        >
                          {task.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // upcoming days: preview the recurring required tasks (not yet materialised)
                  d >= todayN &&
                  fixedTasks.length > 0 && (
                    <div className="mt-1 hidden flex-1 space-y-0.5 overflow-y-auto pr-0.5 opacity-70 sm:block">
                      {fixedTasks.map((ft) => (
                        <div key={ft.id} className="flex items-start gap-1 leading-tight">
                          <span className="mt-px text-[9px] text-[#e0a23c]">◇</span>
                          <span className="truncate text-[10px] italic text-[color:var(--color-muted)]">{ft.name}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* day detail modal */}
      {selected && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="px-panel w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-header px-h-green">
              <Icon src="nav-calendar" className="h-5 w-5" />
              <h3 className="font-pixel flex-1 text-[15px] font-bold">
                {new Date(selected + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button onClick={() => setSelected(null)} className="font-pixel text-white/90 hover:text-white">
                ✕
              </button>
            </div>
            <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4">
              {selDay && selDay.tasks.length > 0 ? (
                <ul className="divide-y divide-[#eaddbc]">
                  {selDay.tasks.map((t) => (
                    <TaskItem key={t.id} task={t} onComplete={completeTask} />
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-[#d8b985] px-4 py-5 text-center">
                  <img src="/assets/empty-tasks.png" alt="" className="mx-auto h-20 w-20 object-contain opacity-90" />
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t('cal.noTodos')}</p>
                </div>
              )}
              <div className="border-t-2 border-[#eaddbc] pt-3">
                <AddTaskForm onAdd={(name) => addForDate(name, selected)} />
              </div>
              <DiaryEditor date={selected} />
            </div>
          </div>
        </div>,
        document.body,
      )}

      {showFixed && (
        <FixedTasksManager
          fixedTasks={fixedTasks}
          onAdd={addFixed}
          onRemove={removeFixed}
          onClose={() => setShowFixed(false)}
        />
      )}
    </Container>
  )
}
