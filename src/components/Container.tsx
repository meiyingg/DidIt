import type { ReactNode } from 'react'

/** Centered, padded content column (used for everything except full-bleed scenes). */
export default function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-4 pb-24 pt-5 md:px-8 md:pb-10 ${className}`}>
      {children}
    </div>
  )
}
