import { useState } from 'react'
import { Check } from 'lucide-react'
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
    <li className="group flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={handle}
        disabled={task.done || busy}
        aria-label={task.done ? 'Completed' : 'Mark complete'}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          task.done
            ? 'border-[color:var(--color-grass)] bg-[color:var(--color-grass)] text-white'
            : 'border-[color:var(--color-line-strong)] text-transparent hover:border-[color:var(--color-grass)] hover:text-[color:var(--color-line-strong)]'
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.done ? 'text-[color:var(--color-faint)] line-through' : 'text-[color:var(--color-ink)]'}`}>
          {task.name}
        </p>
      </div>

      {task.type === 'required' && (
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Required
        </span>
      )}

      <span
        className={`font-pixel w-16 shrink-0 text-right text-sm font-bold tabular-nums ${
          task.done ? 'text-[color:var(--color-faint)]' : 'text-[color:var(--color-grass-dark)]'
        }`}
      >
        +{money(task.reward)}
      </span>
    </li>
  )
}
