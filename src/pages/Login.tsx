import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CHARACTERS } from '../lib/characters'
import { useLang } from '../lib/i18n'

type Mode = 'signin' | 'signup'

export default function Login() {
  const { signIn, signUp, sendPasswordReset } = useAuth()
  const { t, lang, setLang } = useLang()
  const [mode, setMode] = useState<Mode>('signin')
  const [forgot, setForgot] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [character, setCharacter] = useState(CHARACTERS[0].key)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function clearMsgs() {
    setError(null)
    setNotice(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    clearMsgs()
    setBusy(true)
    try {
      if (forgot) {
        await sendPasswordReset(email)
        setNotice(t('auth.resetSent'))
      } else if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, username.trim(), character)
        setNotice(t('auth.created'))
        setMode('signin')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      // our own errors are i18n keys (e.g. "auth.noUser"); Supabase errors are plain text
      setError(msg.startsWith('auth.') ? t(msg) : msg || t('auth.error'))
    } finally {
      setBusy(false)
    }
  }

  const input =
    'px-input w-full text-sm'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-canvas)] px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-6 text-center">
          <img src="/assets/logo.png" alt="" className="mx-auto mb-2 h-14 w-14 object-contain" />
          <h1 className="font-pixel text-2xl font-bold text-[color:var(--color-ink)]">DidIt · 做了么</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">{forgot ? t('auth.resetDesc') : t('auth.tagline')}</p>
          <div className="font-pixel mt-2 inline-flex items-center overflow-hidden rounded-lg border-2 border-[#6b4a24] bg-[#fff5dd] text-xs font-bold shadow-[0_2px_0_#3a2614]" title="语言 / Language">
            <button
              onClick={() => setLang('zh')}
              className={`px-3 py-1 transition-colors ${lang === 'zh' ? 'bg-[#6aa84f] text-white' : 'text-[color:var(--color-muted)]'}`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('en')}
              className={`border-l-2 border-[#6b4a24] px-3 py-1 transition-colors ${lang === 'en' ? 'bg-[#6aa84f] text-white' : 'text-[color:var(--color-muted)]'}`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="px-panel p-6">
          {!forgot && (
            <div className="mb-5 flex rounded-lg border-2 border-[#e3d2a8] bg-[#fbf2da] p-1">
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m)
                    clearMsgs()
                  }}
                  className={`font-pixel flex-1 rounded-md py-1.5 text-sm font-bold transition ${
                    mode === m ? 'bg-[#6aa84f] text-white shadow-[0_2px_0_#3c6b28]' : 'text-[color:var(--color-muted)]'
                  }`}
                >
                  {m === 'signin' ? t('auth.signin') : t('auth.signup')}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === 'signin' && !forgot ? (
              <input type="text" required autoComplete="username" placeholder={t('auth.account')} value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            ) : (
              <input type="email" required autoComplete="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            )}

            {!forgot && (
              <>
                {mode === 'signup' && (
                  <input type="text" required placeholder={t('auth.username')} value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
                )}
                <input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />

                {mode === 'signin' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setForgot(true)
                        clearMsgs()
                      }}
                      className="font-pixel text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
                    >
                      {t('auth.forgot')}
                    </button>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <p className="font-pixel mb-1.5 text-xs font-bold uppercase tracking-wide text-[color:var(--color-muted)]">
                      {t('auth.pickChar')}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {CHARACTERS.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setCharacter(c.key)}
                          className={`flex flex-col items-center rounded-xl border-2 p-1 transition ${
                            character === c.key ? 'border-[#6aa84f] bg-[#e3f3d6]' : 'border-[#e3d2a8] bg-[#fffdf5] hover:brightness-95'
                          }`}
                        >
                          <img src={c.img} alt={c.name} className="h-12 w-12 object-contain" onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')} />
                          <span className="font-pixel mt-0.5 max-w-full truncate text-[10px] font-bold text-[color:var(--color-ink)]">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {error && <p className="text-sm text-[color:var(--color-berry)]">{error}</p>}
            {notice && <p className="text-sm text-[color:var(--color-grass-dark)]">{notice}</p>}

            <button type="submit" disabled={busy} className="px-btn w-full">
              {busy ? t('auth.pleaseWait') : forgot ? t('auth.sendReset') : mode === 'signin' ? t('auth.signin') : t('auth.createAccount')}
            </button>

            {forgot && (
              <button
                type="button"
                onClick={() => {
                  setForgot(false)
                  clearMsgs()
                }}
                className="font-pixel block w-full text-center text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
              >
                {t('auth.backToSignin')}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
