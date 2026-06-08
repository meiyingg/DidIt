import { LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../lib/i18n'

export default function MobileTopBar() {
  const { signOut } = useAuth()
  const { lang, setLang } = useLang()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-[#6b4a24] bg-[#fff5dd]/95 px-3 backdrop-blur-lg md:hidden">
      <div className="flex items-center gap-2">
        <img src="/assets/logo.png" alt="" className="h-8 w-8 object-contain" draggable={false} />
        <span className="font-pixel text-lg font-bold text-[color:var(--color-ink)]">DidIt</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="font-pixel flex items-center overflow-hidden rounded-lg border-2 border-[#6b4a24] bg-white text-xs font-bold" title="语言 / Language">
          <button
            onClick={() => setLang('zh')}
            className={`px-2 py-1 transition-colors ${lang === 'zh' ? 'bg-[#6aa84f] text-white' : 'text-[color:var(--color-muted)]'}`}
          >
            中文
          </button>
          <button
            onClick={() => setLang('en')}
            className={`border-l-2 border-[#6b4a24] px-2 py-1 transition-colors ${lang === 'en' ? 'bg-[#6aa84f] text-white' : 'text-[color:var(--color-muted)]'}`}
          >
            EN
          </button>
        </div>
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
