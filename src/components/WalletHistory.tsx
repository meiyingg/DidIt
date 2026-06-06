import type { WalletLog } from '../lib/types'
import { money, shortTime } from '../lib/format'

const LABELS: Record<WalletLog['type'], string> = {
  task_reward: 'Task reward',
  study_reward: 'Study reward',
  daily_deduction: 'Daily cost',
}

export default function WalletHistory({ logs }: { logs: WalletLog[] }) {
  if (logs.length === 0) {
    return <p className="px-1 py-4 text-sm text-slate-500">No activity yet.</p>
  }

  return (
    <ul className="divide-y divide-slate-800">
      {logs.map((log) => {
        const positive = log.amount >= 0
        return (
          <li key={log.id} className="flex items-center justify-between py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-200">{log.note || LABELS[log.type]}</p>
              <p className="text-xs text-slate-500">
                {LABELS[log.type]} · {shortTime(log.created_at)}
              </p>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                positive ? 'text-emerald-400' : 'text-red-400'
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
