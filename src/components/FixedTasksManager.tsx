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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-fade-up rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Daily required tasks</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          These appear automatically every day. Finish all of them to earn a guilt-free voucher.
        </p>

        <ul className="mb-4 space-y-2">
          {fixedTasks.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-400">
              No required tasks yet — add your first below.
            </li>
          )}
          {fixedTasks.map((ft) => (
            <li
              key={ft.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5"
            >
              <span className="min-w-0 truncate text-sm text-slate-800">{ft.name}</span>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-emerald-600">+{money(ft.reward)}</span>
                <button
                  onClick={() => onRemove(ft.id)}
                  className="text-slate-400 transition hover:text-red-500"
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
      </div>
    </div>
  )
}
