import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  /** True while the user arrived via a password-recovery email link. */
  recovery: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, character: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Where the reset-email link should land. On the web this is the site itself;
// for the packaged apps set VITE_PUBLIC_SITE_URL to the deployed web URL so the
// email link opens a real page (tauri://localhost can't receive it).
const SITE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : '')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  // Accepts a username OR an email. A username is resolved to its account email
  // via the `login_email` RPC (SECURITY DEFINER), then signed in normally.
  async function signIn(identifier: string, password: string) {
    let email = identifier.trim()
    if (!email.includes('@')) {
      const { data, error } = await supabase.rpc('login_email', { p_username: email })
      if (error) throw error
      if (!data) throw new Error('auth.noUser')
      email = data as string
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, username: string, character: string) {
    // usernames are the login alias, so they must be unique
    const { data: taken } = await supabase.rpc('login_email', { p_username: username })
    if (taken) throw new Error('auth.usernameTaken')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, character } },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setRecovery(false)
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL })
    if (error) throw error
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setRecovery(false)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        recovery,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
