import { money } from '../lib/format'

interface Props {
  balance: number
  vouchers: number
}

export default function BalanceCard({ balance, vouchers }: Props) {
  const negative = balance < 0
  return (
    <div
      className={`rounded-2xl p-5 shadow-lg ${
        negative
          ? 'bg-gradient-to-br from-red-900/60 to-slate-800 shadow-red-900/20'
          : 'bg-gradient-to-br from-emerald-900/50 to-slate-800 shadow-emerald-900/20'
      }`}
    >
      <p className="text-sm text-slate-400">Total wealth</p>
      <p
        className={`mt-1 text-4xl font-bold tabular-nums ${
          negative ? 'text-red-400' : 'text-emerald-300'
        }`}
      >
        {money(balance)}
      </p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          🎟️ <span className="font-semibold text-slate-200">{vouchers}</span> guilt-free
          {vouchers === 1 ? ' voucher' : ' vouchers'}
        </span>
        <span className="text-slate-500">−¥300 / day at midnight</span>
      </div>
    </div>
  )
}
