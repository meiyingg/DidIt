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
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? 'Pricing…' : 'Add'}
      </button>
    </form>
  )
}
