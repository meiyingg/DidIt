import { Ticket, Wallet, Sparkles } from 'lucide-react'
import { useProfile } from '../contexts/ProfileContext'
import { money } from '../lib/format'
import { Card, Label, StatCard } from '../components/ui'

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
    <div className="animate-fade-up">
      <header className="mb-6">
        <Label>Rewards</Label>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Shop</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <StatCard icon={Wallet} label="Balance" value={money(profile?.balance ?? 0)} />
        <StatCard icon={Ticket} label="Vouchers" value={String(profile?.vouchers ?? 0)} />
      </div>

      <div className="mb-3 mt-6 flex items-center gap-1.5 text-xs font-medium text-violet-700">
        <Sparkles size={13} /> Preview — redeeming goes live soon
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SAMPLE_ITEMS.map((item) => (
          <Card key={item.name} className="flex flex-col">
            <div className="text-3xl">{item.emoji}</div>
            <p className="mt-3 text-sm font-semibold text-zinc-900">{item.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {item.kind === 'voucher' ? `${item.cost} voucher` : money(item.cost)}
            </p>
            <button
              disabled
              className="mt-4 rounded-lg bg-zinc-100 py-2 text-xs font-semibold text-zinc-400"
            >
              Redeem soon
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
