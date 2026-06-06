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
        className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="shrink-0 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? 'Pricing…' : 'Add'}
      </button>
    </form>
  )
}
