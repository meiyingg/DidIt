import { LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function MobileTopBar() {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur-lg md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
          ¥
        </div>
        <span className="font-bold tracking-tight text-slate-900">DidIt</span>
      </div>
      <button
        onClick={signOut}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Sign out"
      >
        <LogOut size={17} />
      </button>
    </header>
  )
}
