import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { FixedTask } from '../lib/types'
import { money } from '../lib/format'
import { useLang } from '../lib/i18n'
import Icon from './Icon'

interface Props {
  fixedTasks: FixedTask[]
  onAdd: (name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClose: () => void
}

export default function FixedTasksManager({ fixedTasks, onAdd, onRemove, onClose }: Props) {
  const { t } = useLang()
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className="px-panel w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-header px-h-amber">
          <Icon src="icon-gear" className="h-5 w-5" />
          <h3 className="font-pixel flex-1 text-[15px] font-bold">{t('fixed.title')}</h3>
          <button onClick={onClose} className="font-pixel text-white/90 hover:text-white">
            ✕
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5">
          <p className="mb-4 flex items-start gap-2 rounded-lg border-2 border-[#e7d3a6] bg-[#fff8e6] px-3 py-2 text-xs text-[color:var(--color-muted)]">
            <Icon src="icon-tasks" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('fixed.desc')}</span>
          </p>

          <ul className="mb-4 space-y-2">
            {fixedTasks.length === 0 && (
              <li className="rounded-lg border-2 border-dashed border-[#d8b985] px-4 py-5 text-center text-sm text-[color:var(--color-muted)]">
                {t('fixed.empty')}
              </li>
            )}
            {fixedTasks.map((ft) => (
              <li
                key={ft.id}
                className="flex items-center justify-between gap-2 rounded-lg border-2 border-[#e3d2a8] bg-[#fffdf5] px-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm font-medium text-[color:var(--color-ink)]">{ft.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  {Number(ft.reward) === 0 ? (
                    <span className="font-pixel animate-pulse rounded-full bg-[#fff1c9] px-2 py-0.5 text-[10px] font-bold text-[#9a6a0c]">
                      {t('common.pricing')}
                    </span>
                  ) : (
                    <span className="px-coin">
                      <img src="/assets/coin.png" alt="" className="h-3.5 w-3.5 object-contain" /> +{money(ft.reward).replace('¥', '')}
                    </span>
                  )}
                  <button
                    onClick={() => onRemove(ft.id)}
                    aria-label="Remove"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#e0a3a0] bg-[#ffe9e7] text-sm text-[color:var(--color-berry)] transition hover:bg-[#ffd9d6] active:scale-95"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={submit} className="flex gap-2">
            <input
              type="text"
              placeholder={t('fixed.placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              className="px-input min-w-0 flex-1 text-sm disabled:opacity-60"
            />
            <button type="submit" disabled={busy || !name.trim()} className="px-btn shrink-0 text-sm">
              {busy ? t('common.pricing') : t('common.add')}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
