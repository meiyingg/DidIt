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
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
        task.done
          ? 'border-slate-800 bg-slate-800/40 opacity-60'
          : 'border-slate-700 bg-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={handle}
        disabled={task.done || busy}
        aria-label={task.done ? 'Completed' : 'Mark complete'}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.done
            ? 'border-emerald-500 bg-emerald-500 text-slate-900'
            : 'border-slate-500 hover:border-amber-400'
        }`}
      >
        {task.done && '✓'}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate ${task.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {task.name}
        </p>
        {task.type === 'required' && (
          <span className="text-xs font-medium text-amber-400">Required</span>
        )}
      </div>

      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          task.done ? 'text-slate-500' : 'text-emerald-400'
        }`}
      >
        +{money(task.reward)}
      </span>
    </li>
  )
}
