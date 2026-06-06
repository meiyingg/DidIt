import { useState, type FormEvent } from 'react'
import type { FixedTask } from '../lib/types'
import { money } from '../lib/format'

interface Props {
  fixedTasks: FixedTask[]
  onAdd: (name: string, reward: number) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClose: () => void
}

export default function FixedTasksManager({ fixedTasks, onAdd, onRemove, onClose }: Props) {
  const [name, setName] = useState('')
  const [reward, setReward] = useState('50')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      await onAdd(trimmed, Number(reward) || 0)
      setName('')
      setReward('50')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-slate-900 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Daily required tasks</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          These appear automatically every day. Finish all of them to earn a guilt-free voucher.
        </p>

        <ul className="mb-4 space-y-2">
          {fixedTasks.length === 0 && (
            <li className="text-sm text-slate-500">No required tasks yet — add your first below.</li>
          )}
          {fixedTasks.map((ft) => (
            <li
              key={ft.id}
              className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5"
            >
              <span className="min-w-0 truncate text-sm text-slate-100">{ft.name}</span>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium text-emerald-400">+{money(ft.reward)}</span>
                <button
                  onClick={() => onRemove(ft.id)}
                  className="text-slate-500 hover:text-red-400"
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
            placeholder="e.g. Exercise 30 min"
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
              className="w-14 bg-transparent px-1 py-2.5 text-sm text-white outline-none"
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
      </div>
    </div>
  )
}
