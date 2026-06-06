import type { WalletLog } from '../lib/types'
import { money, shortTime } from '../lib/format'

const LABELS: Record<WalletLog['type'], string> = {
  task_reward: 'Task reward',
  study_reward: 'Study reward',
  daily_deduction: 'Daily cost',
}

const ICONS: Record<WalletLog['type'], string> = {
  task_reward: '✅',
  study_reward: '📚',
  daily_deduction: '🌙',
}

/** Plain activity list — meant to live inside a Card. */
export default function WalletHistory({ logs, limit }: { logs: WalletLog[]; limit?: number }) {
  const rows = limit ? logs.slice(0, limit) : logs

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-400">No activity yet.</p>
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {rows.map((log) => {
        const positive = log.amount >= 0
        return (
          <li key={log.id} className="flex items-center gap-3 py-2.5">
            <span className="text-sm">{ICONS[log.type]}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-800">{log.note || LABELS[log.type]}</p>
              <p className="text-[11px] text-zinc-400">{shortTime(log.created_at)}</p>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                positive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {positive ? '+' : ''}
              {money(log.amount)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
