import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/** Base surface. Every panel in the app uses this for a consistent look. */
export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04)] ${
        padded ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/** Tiny uppercase label used above values and as section eyebrows. */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wider text-zinc-400 ${className}`}>
      {children}
    </span>
  )
}

/** Section header: title on the left, optional action on the right. */
export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {action}
    </div>
  )
}

/** A compact KPI tile: icon, label, big value, optional sub-line. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  valueClass = 'text-zinc-900',
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: ReactNode
  valueClass?: string
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Icon size={16} className="text-zinc-300" />
      </div>
      <p className={`mt-2.5 text-2xl font-bold tabular-nums tracking-tight ${valueClass}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-zinc-400">{sub}</div>}
    </Card>
  )
}
