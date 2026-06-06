import { useState, type FormEvent } from 'react'

interface Props {
  onAdd: (name: string) => Promise<void>
}

export default function AddTaskForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      await onAdd(trimmed)
      setName('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        placeholder="Add a task — AI sets the reward…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={busy}
        className="min-w-0 flex-1 rounded-lg border border-[color:var(--color-line)] bg-white px-3.5 py-2.5 text-sm text-[color:var(--color-ink)] placeholder-[color:var(--color-faint)] outline-none transition focus:border-[color:var(--color-grass)] focus:ring-2 focus:ring-[color:var(--color-grass)]/20 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="font-pixel shrink-0 rounded-lg bg-[color:var(--color-grass)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_0_#3c7a1f] transition hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
      >
        {busy ? 'Pricing…' : 'Add'}
      </button>
    </form>
  )
}
