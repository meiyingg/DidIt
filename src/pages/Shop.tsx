import { Ticket, Sparkles } from 'lucide-react'
import { useProfile } from '../contexts/ProfileContext'
import { money } from '../lib/format'
import PageHeader from '../components/PageHeader'

// Placeholder catalog — wired to the backend in a later round.
const SAMPLE_ITEMS = [
  { emoji: '🧋', name: 'Boba tea', cost: 30, kind: 'money' as const },
  { emoji: '🎮', name: '1h gaming', cost: 1, kind: 'voucher' as const },
  { emoji: '🍿', name: 'Movie night', cost: 1, kind: 'voucher' as const },
  { emoji: '🛍️', name: 'Small treat', cost: 80, kind: 'money' as const },
  { emoji: '😴', name: 'Sleep in', cost: 1, kind: 'voucher' as const },
  { emoji: '🍔', name: 'Cheat meal', cost: 120, kind: 'money' as const },
]

export default function Shop() {
  const { profile } = useProfile()

  return (
    <>
      <PageHeader title="Shop" subtitle="Spend what you earned — guilt-free." />

      {/* wallet strip */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Balance</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">
            {money(profile?.balance ?? 0)}
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Ticket size={13} className="text-amber-500" /> Vouchers
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">
            {profile?.vouchers ?? 0}
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600">
        <Sparkles size={13} /> Preview — redeeming goes live soon
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SAMPLE_ITEMS.map((item) => (
          <div
            key={item.name}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-3xl">{item.emoji}</div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{item.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {item.kind === 'voucher' ? `${item.cost} voucher` : money(item.cost)}
            </p>
            <button
              disabled
              className="mt-3 rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-400"
            >
              Redeem soon
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
