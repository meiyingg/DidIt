import { useEffect, useState } from 'react'
import { useLang } from '../lib/i18n'

/** A compact live clock plaque for the world scene. */
export default function Clock() {
  const { locale } = useLang()
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const date = now.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="flex items-center gap-2.5 rounded-full border-2 border-[#6b4a24] bg-[#fff5dd]/95 px-4 py-2 shadow">
      <img src="/assets/icon-timer.png" alt="" className="h-5 w-5 object-contain" />
      <div className="flex items-baseline gap-0.5">
        <span className="font-pixel text-base font-bold leading-none text-[color:var(--color-ink)]">{h}</span>
        <span className="font-pixel animate-pulse text-base font-bold leading-none text-[color:var(--color-faint)]">:</span>
        <span className="font-pixel text-base font-bold leading-none text-[color:var(--color-ink)]">{m}</span>
        <span className="font-pixel animate-pulse text-base font-bold leading-none text-[color:var(--color-faint)]">:</span>
        <span className="font-pixel text-base font-bold leading-none text-[color:var(--color-muted)]">{s}</span>
      </div>
      <span className="h-4 w-px bg-[#d8c49a]" />
      <span className="font-pixel text-[11px] font-bold leading-none text-[color:var(--color-muted)]">{date}</span>
    </div>
  )
}
