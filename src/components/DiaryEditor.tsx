import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../lib/i18n'
import { Panel } from './ui'

interface Props {
  /** Day to edit, formatted 'YYYY-MM-DD'. */
  date: string
}

/** Daily journal editor for a single date — loads the existing entry and upserts on save. */
export default function DiaryEditor({ date }: Props) {
  const { user } = useAuth()
  const { t } = useLang()
  const [content, setContent] = useState('')
  const [loaded, setLoaded] = useState('') // last value persisted/fetched, for the dirty check
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(false)
  const savedTimer = useRef<number | null>(null)

  const dirty = content !== loaded

  // Load the entry on mount and whenever the user or date changes.
  useEffect(() => {
    if (!user) {
      setContent('')
      setLoaded('')
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setSavedAt(false)
    supabase
      .from('diary_entries')
      .select('content')
      .eq('user_id', user.id)
      .eq('entry_date', date)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        const text = data?.content ?? ''
        setContent(text)
        setLoaded(text)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, date])

  // Clean up the transient "Saved" timer on unmount.
  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current)
    }
  }, [])

  async function save() {
    if (!user || saving || !dirty) return
    setSaving(true)
    try {
      const snapshot = content
      const { error } = await supabase.from('diary_entries').upsert(
        {
          user_id: user.id,
          entry_date: date,
          content: snapshot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,entry_date' },
      )
      if (error) throw error
      setLoaded(snapshot)
      setSavedAt(true)
      if (savedTimer.current) window.clearTimeout(savedTimer.current)
      savedTimer.current = window.setTimeout(() => setSavedAt(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title={t('diary.title')} icon={<img src="/assets/icon-journal.png" alt="" className="h-5 w-5 object-contain" />} color="purple">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          if (savedAt) setSavedAt(false)
        }}
        disabled={loading || !user}
        rows={5}
        placeholder={t('diary.placeholder')}
        className="w-full rounded-lg border-2 border-[#c9a772] bg-[#fffdf5] px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none focus:border-[#9268c9] disabled:opacity-60"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs">
          {loading ? (
            <span className="text-[color:var(--color-faint)]">{t('common.loading')}</span>
          ) : savedAt ? (
            <span className="font-pixel font-bold text-[color:var(--color-grass-dark)]">{t('profile.saved')}</span>
          ) : dirty ? (
            <span className="text-[color:var(--color-muted)]">{t('diary.unsaved')}</span>
          ) : (
            <span className="text-[color:var(--color-faint)]">{t('diary.allSaved')}</span>
          )}
        </span>

        <button
          onClick={save}
          disabled={saving || !dirty || !user || loading}
          className="px-btn shrink-0 text-sm"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </Panel>
  )
}
