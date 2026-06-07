import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Task } from '../lib/types'
import { money } from '../lib/format'
import Coin from './Coin'

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
    <li className="flex items-center gap-3 py-2">
      <button
        type="button"
        onClick={handle}
        disabled={task.done || busy}
        aria-label={task.done ? 'Completed' : 'Mark complete'}
        className={`px-check ${task.done ? 'is-done' : ''}`}
      >
        <Check size={14} strokeWidth={4} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.done ? 'text-[color:var(--color-faint)] line-through' : 'text-[color:var(--color-ink)]'}`}>
          {task.name}
        </p>
      </div>

      {task.type === 'required' && (
        <span className="font-pixel shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
          ★ Req
        </span>
      )}

      <span className={`px-coin shrink-0 ${task.done ? 'opacity-50' : ''}`}>
        <Coin /> {money(task.reward).replace('¥', '')}
      </span>
    </li>
  )
}
