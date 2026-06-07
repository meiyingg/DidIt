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
        placeholder="Add a quest — AI sets the reward…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={busy}
        className="px-input min-w-0 flex-1 text-sm disabled:opacity-60"
      />
      <button type="submit" disabled={busy || !name.trim()} className="px-btn shrink-0 text-sm">
        {busy ? '…' : '+ Add'}
      </button>
    </form>
  )
}
