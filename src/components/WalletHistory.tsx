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

export default function WalletHistory({ logs }: { logs: WalletLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
        No activity yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {logs.map((log) => {
          const positive = log.amount >= 0
          return (
            <li key={log.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-base">{ICONS[log.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-800">{log.note || LABELS[log.type]}</p>
                <p className="text-xs text-slate-400">
                  {LABELS[log.type]} · {shortTime(log.created_at)}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  positive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {positive ? '+' : ''}
                {money(log.amount)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
