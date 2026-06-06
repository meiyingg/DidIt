import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'signin' | 'signup'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, username.trim() || email.split('@')[0])
        setNotice('Account created. If email confirmation is on, check your inbox — otherwise just sign in.')
        setMode('signin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15'

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-xl font-bold text-white">
            ¥
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">DidIt</h1>
          <p className="mt-1 text-sm text-zinc-500">Earn your way out of the red.</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(9,9,11,0.04)]">
          <div className="mb-5 flex rounded-lg bg-zinc-100 p-1">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(null)
                  setNotice(null)
                }}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  mode === m ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            {mode === 'signup' && (
              <input type="text" placeholder="Display name" value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
            )}
            <input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />

            {error && <p className="text-sm text-rose-600">{error}</p>}
            {notice && <p className="text-sm text-emerald-600">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-zinc-950 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
