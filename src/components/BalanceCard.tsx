import { money } from '../lib/format'

interface Props {
  balance: number
  vouchers: number
  todayDelta: number
  doneCount: number
  totalCount: number
}

export default function BalanceCard({ balance, vouchers, todayDelta, doneCount, totalCount }: Props) {
  const negative = balance < 0
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Total balance</p>
          <p
            className={`mt-1 text-4xl font-bold tracking-tight tabular-nums ${
              negative ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {money(balance)}
          </p>
        </div>
        <span
          className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            todayDelta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {todayDelta >= 0 ? '▲ +' : '▼ '}
          {money(Math.abs(todayDelta))} today
        </span>
      </div>

      {/* task progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Today's tasks</span>
          <span className="tabular-nums">
            {doneCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="text-base">🎟️</span>
          <span className="font-semibold text-slate-900">{vouchers}</span>
          {vouchers === 1 ? 'voucher' : 'vouchers'}
        </span>
        <span className="text-xs text-slate-400">−¥300 / day at midnight</span>
      </div>
    </div>
  )
}
