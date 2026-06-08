import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { useLang } from '../lib/i18n'
import Icon from './Icon'

/** Cozy modal for editing your display name + bio. Surfaces save errors instead of failing silently. */
export default function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { profile, refresh } = useProfile()
  const { t } = useLang()
  const [name, setName] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = name.trim() !== (profile?.username ?? '') || bio !== (profile?.bio ?? '')

  async function save() {
    if (!user || !name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const { error: e } = await supabase.from('profiles').update({ username: name.trim(), bio }).eq('id', user.id)
      if (e) {
        setError(e.message)
        return
      }
      await refresh()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className="px-panel w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-header px-h-blue">
          <Icon src="icon-edit" className="h-5 w-5" />
          <h3 className="font-pixel flex-1 text-[15px] font-bold">{t('profile.editProfile')}</h3>
          <button onClick={onClose} className="font-pixel text-white/90 hover:text-white">
            ✕
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5">
          <label className="font-pixel mb-1 block text-xs font-bold uppercase text-[color:var(--color-muted)]">{t('common.displayName')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder={t('profile.namePlaceholder')}
            className="px-input mb-3 w-full text-sm"
          />

          <label className="font-pixel mb-1 block text-xs font-bold uppercase text-[color:var(--color-muted)]">{t('profile.bio')}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={200}
            placeholder={t('profile.bioPlaceholder')}
            className="w-full rounded-lg border-2 border-[#c9a772] bg-[#fffdf5] px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none focus:border-[#4a90d9]"
          />
          <p className="mb-3 mt-1 text-right text-[11px] text-[color:var(--color-faint)]">{bio.length}/200</p>

          {error && (
            <div className="mb-3 rounded-lg border-2 border-[color:var(--color-berry)] bg-red-50 px-3 py-2 text-xs text-[color:var(--color-berry)]">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-btn px-btn-amber flex-1 text-sm">
              {t('common.cancel')}
            </button>
            <button onClick={save} disabled={saving || !name.trim() || !dirty} className="px-btn flex-1 text-sm">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
