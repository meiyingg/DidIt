import { useState } from 'react'
import type { Task } from '../lib/types'
import { money } from '../lib/format'

interface Props {
  task: Task
  onComplete: (id: string) => Promise<void>
}

export default function TaskItem({ task, onComplete }: Props) {
  const [busy, setBusy] = useState(false)

  async function handle() {
    if (task.done || busy) return
    setBusy(true)
    try {
      await onComplete(task.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li
      className={`group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition ${
        task.done ? 'border-slate-100 opacity-60' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <button
        type="button"
        onClick={handle}
        disabled={task.done || busy}
        aria-label={task.done ? 'Completed' : 'Mark complete'}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs transition ${
          task.done
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 text-transparent hover:border-slate-900'
        }`}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {task.name}
        </p>
        {task.type === 'required' && (
          <span className="text-xs font-medium text-indigo-500">Required</span>
        )}
      </div>

      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          task.done ? 'text-slate-400' : 'text-emerald-600'
        }`}
      >
        +{money(task.reward)}
      </span>
    </li>
  )
}
