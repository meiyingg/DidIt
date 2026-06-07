import { useEffect, useState }from 'react'

/** A little live clock plaque for the world. */
export default function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="rounded-2xl border-[3px] border-[#6b4a24] bg-[#fff5dd]/95 px-6 py-2 text-center shadow-[0_4px_0_#3a2614]">
      <p className="font-pixel text-5xl font-bold leading-none tracking-widest text-[color:var(--color-ink)]">{time}</p>
      <p className="font-pixel mt-1 text-xs font-bold text-[color:var(--color-muted)]">{date}</p>
    </div>
  )
}
