import { useMemo } from 'react'
import type { WalletLog } from '../lib/types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Last-7-weekday earnings (positive wallet entries) as a small bar chart. */
export default function WeekChart({ logs }: { logs: WalletLog[] }) {
  const bars = useMemo(() => {
    const buckets = new Array(7).fill(0)
    for (const l of logs) {
      const amt = Number(l.amount)
      if (amt <= 0) continue
      const idx = (new Date(l.created_at).getDay() + 6) % 7
      buckets[idx] += amt
    }
    const max = Math.max(1, ...buckets)
    return buckets.map((v) => Math.round((v / max) * 100))
  }, [logs])

  return (
    <div>
      <div className="flex h-28 items-end justify-between gap-1.5">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-md bg-violet-600/90 transition-all duration-500"
                style={{ height: `${Math.max(4, h)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
