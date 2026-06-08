import { LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../lib/i18n'

export default function MobileTopBar() {
  const { signOut } = useAuth()
  const { lang, toggle } = useLang()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-[#6b4a24] bg-[#fff5dd]/95 px-3 backdrop-blur-lg md:hidden">
      <div className="flex items-center gap-2">
        <img src="/assets/logo.png" alt="" className="h-8 w-8 object-contain" draggable={false} />
        <span className="font-pixel text-lg font-bold text-[color:var(--color-ink)]">DidIt</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="font-pixel rounded-lg border-2 border-[#6b4a24] bg-white px-2 py-1 text-xs font-bold text-[color:var(--color-ink)]"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
        <button
          onClick={signOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#6b4a24] bg-white text-[color:var(--color-muted)]"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
