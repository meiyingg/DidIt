import { useEffect, useState, type FormEvent } from 'react'
import { useWorld, type Peer } from '../lib/useWorld'
import { useProfile } from '../contexts/ProfileContext'
import { DEFAULT_CHARACTER } from '../lib/characters'
import { useLang } from '../lib/i18n'
import CssWorld from './world/CssWorld'
import NumberTicker from './magicui/NumberTicker'
import StudyTimerModal from './StudyTimerModal'
import LeavesOverlay from './LeavesOverlay'
import Clock from './Clock'

interface Props {
  name: string
  balance: number
  doneCount: number
  total: number
  streak: number
}

// each value is the /assets png filename used both as the button icon and the floating emote
const EMOTES = ['emote-wave', 'icon-party', 'emote-heart', 'flame', 'emote-muscle', 'emote-sleep', 'emote-thumbsup', 'emote-laugh']

export default function WorldScene({ name, balance, doneCount, total, streak }: Props) {
  const { profile } = useProfile()
  const { t, lang, setLang } = useLang()
  const character = profile?.avatar_url || DEFAULT_CHARACTER
  const [activity, setActivity] = useState<string | null>(null)
  const { peers, poke, say, emote, moveTo, incoming, messages, emotes } = useWorld({
    username: name,
    doneCount,
    total,
    balance,
    character,
    activity: activity ?? undefined,
    bio: profile?.bio ?? '',
    studyMinutes: profile?.study_minutes ?? 0,
    streak,
  })
  const [toast, setToast] = useState<string | null>(null)
  const [timerOpen, setTimerOpen] = useState(false)
  const [chat, setChat] = useState('')
  const [soundOn, setSoundOn] = useState(false)
  const [showHint, setShowHint] = useState(() => typeof window !== 'undefined' && !localStorage.getItem('didit_world_hint'))

  function dismissHint() {
    localStorage.setItem('didit_world_hint', '1')
    setShowHint(false)
  }

  useEffect(() => {
    if (!incoming) return
    setToast(t('world.pokedYou', { name: incoming.fromName }))
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming])

  function handlePoke(p: Peer) {
    poke(p.id)
    setToast(t('world.youPoked', { name: p.username }))
    setTimeout(() => setToast(null), 2000)
  }
  function sendChat(e: FormEvent) {
    e.preventDefault()
    if (!chat.trim()) return
    say(chat)
    setChat('')
  }

  return (
    <section className="relative w-full flex-1 overflow-hidden">
      <CssWorld peers={peers} messages={messages} emotes={emotes} muted={!soundOn} onPoke={handlePoke} onSelfClick={() => setTimerOpen(true)} onGroundMove={moveTo} />

      {/* online count */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border-2 border-[#6b4a24] bg-[#fff5dd]/95 px-3 py-1 shadow">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-pixel text-sm font-bold text-[color:var(--color-ink)]">{t('world.online', { count: peers.length })}</span>
      </div>

      {/* clock — hidden on mobile (the phone status bar already shows the time) */}
      <div className="absolute left-1/2 top-3 hidden -translate-x-1/2 md:block">
        <Clock />
      </div>

      {/* sound + language toggles */}
      <button
        onClick={() => setSoundOn((s) => !s)}
        className="absolute left-3 top-12 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#6b4a24] bg-[#fff5dd]/95 shadow"
        title={soundOn ? t('world.mute') : t('world.soundOn')}
      >
        <img src={`/assets/icon-sound-${soundOn ? 'on' : 'off'}.png`} alt="" className="h-5 w-5 object-contain" />
      </button>
      <div
        className="font-pixel absolute left-[3.4rem] top-12 flex h-9 items-center overflow-hidden rounded-full border-2 border-[#6b4a24] bg-[#fff5dd]/95 text-xs font-bold shadow"
        title="语言 / Language"
      >
        <button
          onClick={() => setLang('zh')}
          className={`h-full px-2 transition-colors ${lang === 'zh' ? 'bg-[#6aa84f] text-white' : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'}`}
        >
          中文
        </button>
        <button
          onClick={() => setLang('en')}
          className={`h-full border-l-2 border-[#6b4a24] px-2 transition-colors ${lang === 'en' ? 'bg-[#6aa84f] text-white' : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'}`}
        >
          EN
        </button>
      </div>

      {/* balance plaque */}
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded-2xl border-[3px] border-[#6b4a24] bg-[#fff5dd]/95 px-2.5 py-1.5 shadow-[0_4px_0_#3a2614] md:gap-2.5 md:px-3.5 md:py-2">
        <img src="/assets/coin.png" alt="" className="h-7 w-7 object-contain md:h-10 md:w-10" draggable={false} />
        <div className="text-right">
          <p className="font-pixel text-[9px] font-bold uppercase tracking-wide text-[color:var(--color-muted)] md:text-[10px]">{t('common.balance')}</p>
          <NumberTicker
            value={balance}
            decimalPlaces={2}
            prefix="¥"
            className={`font-pixel block text-lg font-bold leading-none md:text-2xl ${balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-grass-dark)]'}`}
          />
        </div>
      </div>

      {/* emote bar — lifted above the bottom tab bar on mobile */}
      <div className="absolute bottom-[8.5rem] left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full border-2 border-[#6b4a24] bg-[#fff5dd]/95 px-2 py-1.5 shadow-lg md:bottom-16">
        {EMOTES.map((em) => (
          <button key={em} onClick={() => emote(em)} className="transition hover:scale-125" title="React">
            <img src={`/assets/${em}.png`} alt="" className="h-6 w-6 object-contain" />
          </button>
        ))}
      </div>

      {/* chat bar — sits above the tab bar on mobile, centered on desktop */}
      <form onSubmit={sendChat} className="absolute inset-x-3 bottom-20 mx-auto flex max-w-md items-center gap-2 md:bottom-3 md:left-1/2 md:right-auto md:-translate-x-1/2">
        <input
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          maxLength={120}
          placeholder={t('world.sayRoom')}
          className="min-w-0 flex-1 rounded-full border-2 border-[#6b4a24] bg-[#fff5dd]/95 px-4 py-2 text-sm text-[color:var(--color-ink)] shadow outline-none placeholder:text-[color:var(--color-faint)]"
        />
        <button type="submit" className="px-btn shrink-0 rounded-full px-4 py-2 text-sm">
          {t('common.send')}
        </button>
      </form>

      {toast && (
        <div className="animate-fade-up font-pixel absolute inset-x-0 top-16 mx-auto flex w-fit items-center gap-2 rounded-full border-2 border-[#6b4a24] bg-[#fff5dd]/95 px-4 py-2 text-sm font-bold shadow-lg">
          <img src="/assets/icon-poke.png" alt="" className="h-5 w-5 shrink-0 object-contain" />
          {toast}
        </div>
      )}

      {timerOpen && (
        <StudyTimerModal
          onClose={() => {
            setActivity(null)
            setTimerOpen(false)
          }}
          onDone={() => {}}
          onActivityChange={setActivity}
        />
      )}

      {/* first-time welcome hint */}
      {showHint && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={dismissHint}>
          <div className="px-panel max-w-xs p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-pixel text-lg font-bold text-[color:var(--color-ink)]">{t('world.welcome', { name })}</p>
            <ul className="mt-3 space-y-1.5 text-left text-sm text-[color:var(--color-muted)] [&_b]:text-[color:var(--color-ink)]">
              <li dangerouslySetInnerHTML={{ __html: '• ' + t('world.hintFocus') }} />
              <li dangerouslySetInnerHTML={{ __html: '• ' + t('world.hintPoke') }} />
              <li dangerouslySetInnerHTML={{ __html: '• ' + t('world.hintWalk') }} />
              <li dangerouslySetInnerHTML={{ __html: '• ' + t('world.hintEmote') }} />
            </ul>
            <button onClick={dismissHint} className="px-btn mt-4 w-full">
              {t('common.gotit')}
            </button>
          </div>
        </div>
      )}

      <LeavesOverlay />
    </section>
  )
}
