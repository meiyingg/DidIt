import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../lib/i18n'

/** Shown when the user opens a password-recovery email link (recovery session). */
export default function ResetPassword() {
  const { updatePassword, signOut } = useAuth()
  const { t } = useLang()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      await updatePassword(password)
      // recovery flips to false in the context → App renders the main app (signed in)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-canvas)] px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-6 text-center">
          <img src="/assets/logo.png" alt="" className="mx-auto mb-2 h-14 w-14 object-contain" />
          <h1 className="font-pixel text-2xl font-bold text-[color:var(--color-ink)]">{t('auth.newPasswordTitle')}</h1>
        </div>

        <div className="px-panel p-6">
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder={t('auth.newPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-input w-full text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder={t('auth.confirmPassword')}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="px-input w-full text-sm"
            />

            {error && <p className="text-sm text-[color:var(--color-berry)]">{error}</p>}

            <button type="submit" disabled={busy} className="px-btn w-full">
              {busy ? t('auth.pleaseWait') : t('auth.updatePassword')}
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="font-pixel block w-full text-center text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
            >
              {t('auth.backToSignin')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
