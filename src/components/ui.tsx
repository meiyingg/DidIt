import type { ReactNode } from 'react'

type HeaderColor = 'green' | 'blue' | 'amber' | 'purple' | 'teal' | 'berry'

/** Plain wood-framed parchment panel. */
export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return <div className={`px-panel ${padded ? 'p-4' : ''} ${className}`}>{children}</div>
}

/** Panel with a colored pixel title bar (the game-UI look). */
export function Panel({
  title,
  icon,
  color = 'green',
  action,
  children,
  className = '',
  bodyClass = 'p-4',
}: {
  title: string
  icon?: ReactNode
  color?: HeaderColor
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClass?: string
}) {
  return (
    <div className={`px-panel overflow-hidden ${className}`}>
      <div className={`px-header px-h-${color}`}>
        {icon && <span className="text-lg leading-none">{icon}</span>}
        <h3 className="font-pixel flex-1 text-[15px] font-bold">{title}</h3>
        {action}
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  )
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-pixel text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)] ${className}`}>
      {children}
    </span>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-pixel text-base font-semibold text-[color:var(--color-ink)]">{title}</h2>
      {action}
    </div>
  )
}

/** KPI tile: emoji chip + label + big pixel value. */
export function StatCard({
  emoji,
  label,
  value,
  tile = '#fff1c9',
  valueClass = 'text-[color:var(--color-ink)]',
}: {
  emoji: ReactNode
  label: string
  value: ReactNode
  tile?: string
  valueClass?: string
}) {
  return (
    <div className="px-panel flex items-center gap-3 p-3">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-black/10 text-2xl"
        style={{ background: tile }}
      >
        {emoji}
      </div>
      <div className="min-w-0">
        <Label>{label}</Label>
        <p className={`font-pixel text-xl font-bold leading-tight ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}
