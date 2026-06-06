import { useState, type FormEvent } from 'react'
import type { FixedTask } from '../lib/types'
import { money } from '../lib/format'

interface Props {
  fixedTasks: FixedTask[]
  onAdd: (name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClose: () => void
}

export default function FixedTasksManager({ fixedTasks, onAdd, onRemove, onClose }: Props) {
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-fade-up rounded-t-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-zinc-900">Daily required tasks</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          These appear automatically every day. Finish all of them to earn a guilt-free voucher.
        </p>

        <ul className="mb-4 space-y-2">
          {fixedTasks.length === 0 && (
            <li className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center text-sm text-zinc-400">
              No required tasks yet — add your first below.
            </li>
          )}
          {fixedTasks.map((ft) => (
            <li
              key={ft.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5"
            >
              <span className="min-w-0 truncate text-sm text-zinc-800">{ft.name}</span>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-emerald-600">+{money(ft.reward)}</span>
                <button
                  onClick={() => onRemove(ft.id)}
                  className="text-zinc-400 transition hover:text-rose-500"
                  aria-label="Remove"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Exercise 30 min — AI prices it"
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
      </div>
    </div>
  )
}
