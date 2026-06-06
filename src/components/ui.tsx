import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/** Cozy wood-panel surface used by every card in the app. */
export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return <div className={`panel ${padded ? 'p-5' : ''} ${className}`}>{children}</div>
}

/** Small pixel-font label / eyebrow. */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-pixel text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)] ${className}`}>
      {children}
    </span>
  )
}

/** Section header: pixel title on the left, optional action on the right. */
export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-pixel text-base font-semibold text-[color:var(--color-ink)]">{title}</h2>
      {action}
    </div>
  )
}

/** KPI tile: colored icon chip + label + big pixel value. */
export function StatCard({
  icon: Icon,
  label,
  value,
  tile = 'bg-amber-100 text-amber-700',
  valueClass = 'text-[color:var(--color-ink)]',
  sub,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  tile?: string
  valueClass?: string
  sub?: ReactNode
}) {
  return (
    <Card className="flex items-center gap-3" padded={false}>
      <div className="flex items-center gap-3 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile}`}>
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <Label>{label}</Label>
          <p className={`font-pixel text-2xl font-bold leading-tight ${valueClass}`}>{value}</p>
          {sub && <p className="text-xs text-[color:var(--color-faint)]">{sub}</p>}
        </div>
      </div>
    </Card>
  )
}
