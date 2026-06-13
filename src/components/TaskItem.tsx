import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Task } from '../lib/types'
import { money } from '../lib/format'
import { useLang } from '../lib/i18n'
import Coin from './Coin'

interface Props {
  task: Task
  onComplete: (id: string) => Promise<void>
}

export default function TaskItem({ task, onComplete }: Props) {
  const { t } = useLang()
  const [busy, setBusy] = useState(false)
  // a just-added task is inserted with reward 0 and priced by the AI in the
  // background; until the price lands, show "pricing…" and block completion.
  const pricing = !task.done && Number(task.reward) === 0

  async function handle() {
    if (task.done || busy || pricing) return
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
        disabled={task.done || busy || pricing}
        aria-label={task.done ? 'Completed' : 'Mark complete'}
        className={`px-check ${task.done ? 'is-done' : ''} ${pricing ? 'opacity-50' : ''}`}
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
          ★ {t('task.required')}
        </span>
      )}

      {pricing ? (
        <span className="font-pixel shrink-0 animate-pulse rounded-full bg-[#fff1c9] px-2 py-0.5 text-[10px] font-bold text-[#9a6a0c]">
          {t('common.pricing')}
        </span>
      ) : (
        <span className={`px-coin shrink-0 ${task.done ? 'opacity-50' : ''}`}>
          <Coin /> {money(task.reward).replace('¥', '')}
        </span>
      )}
    </li>
  )
}
