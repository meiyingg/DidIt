import { useState, type FormEvent } from 'react'

interface Props {
  onAdd: (name: string, reward: number) => Promise<void>
}

const DEFAULT_REWARD = 50

export default function AddTaskForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [reward, setReward] = useState<string>(String(DEFAULT_REWARD))
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      await onAdd(trimmed, Number(reward) || 0)
      setName('')
      setReward(String(DEFAULT_REWARD))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        placeholder="Add a task for today…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500"
      />
      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 px-2 focus-within:border-amber-500">
        <span className="text-sm text-slate-500">¥</span>
        <input
          type="number"
          min={0}
          step={10}
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          aria-label="Reward amount"
          className="w-16 bg-transparent px-1 py-2.5 text-sm text-white outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-400 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  )
}
