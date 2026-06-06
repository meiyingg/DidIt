import { Ticket } from 'lucide-react'
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
    <div className="animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 p-6 text-white shadow-xl shadow-slate-900/20">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/60">Total balance</p>
          <p
            className={`mt-1 text-[2.6rem] font-bold leading-none tracking-tight tabular-nums ${
              negative ? 'text-red-400' : 'text-white'
            }`}
          >
            {money(balance)}
          </p>
        </div>
        <span
          className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            todayDelta >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'
          }`}
        >
          {todayDelta >= 0 ? '▲ +' : '▼ '}
          {money(Math.abs(todayDelta))} today
        </span>
      </div>

      {/* task progress */}
      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-white/60">
          <span>Today's tasks</span>
          <span className="tabular-nums">
            {doneCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-white/80">
          <Ticket size={16} className="text-amber-300" />
          <span className="font-semibold text-white">{vouchers}</span>
          {vouchers === 1 ? 'voucher' : 'vouchers'}
        </span>
        <span className="text-xs text-white/40">−¥300 / day at midnight</span>
      </div>
    </div>
  )
}
