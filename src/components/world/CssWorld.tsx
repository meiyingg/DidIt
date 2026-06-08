import { useEffect, useRef, type MouseEvent } from 'react'
import type { ChatBubble, FloatingEmote, Peer } from '../../lib/useWorld'
import { CHARACTERS, charImg } from '../../lib/characters'
import { useLang } from '../../lib/i18n'

const CHAR_H = 104

// day/night scene picked by local time
const HOUR = new Date().getHours()
const IS_NIGHT = HOUR >= 18 || HOUR < 6
const VIDEO_SRC = IS_NIGHT ? '/assets/world-bg-night.mp4' : '/assets/world-bg.mp4'

function statusChip(p: Peer): { icon: string; label: string } {
  if (p.activity) return { icon: 'icon-book', label: p.activity.replace(/^📖\s*/, '') }
  if (p.total > 0 && p.doneCount >= p.total) return { icon: 'icon-tasks', label: 'all done' }
  if (p.doneCount > 0) return { icon: 'flame', label: `${p.doneCount}/${p.total}` }
  return { icon: 'icon-idle', label: 'idle' }
}

interface Props {
  peers: Peer[]
  messages: Record<string, ChatBubble[]>
  emotes: FloatingEmote[]
  muted: boolean
  onPoke: (p: Peer) => void
  onSelfClick?: () => void
  onGroundMove?: (x: number, y: number) => void
}

export default function CssWorld({ peers, messages, emotes, muted, onPoke, onSelfClick, onGroundMove }: Props) {
  const { t } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)

  // unmuting must follow a user gesture (the sound toggle) — then ensure it plays
  useEffect(() => {
    const v = videoRef.current
    if (v && !muted) v.play().catch(() => {})
  }, [muted])

  function handleGround(e: MouseEvent<HTMLDivElement>) {
    if (!onGroundMove) return
    const r = e.currentTarget.getBoundingClientRect()
    onGroundMove(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100)
  }

  return (
    <div
      onClick={handleGround}
      className="relative h-full w-full cursor-pointer overflow-hidden bg-[#7fae54]"
      style={{ backgroundImage: "url('/assets/world-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <video
        ref={videoRef}
        key={VIDEO_SRC}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted={muted}
        playsInline
        poster="/assets/world-bg.png"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {peers.map((peer) => {
        const st = statusChip(peer)
        const myMessages = messages[peer.id] ?? []
        const myEmotes = emotes.filter((e) => e.peerId === peer.id)
        const charLabel = CHARACTERS.find((c) => c.key === peer.character)?.name ?? peer.character
        const studyH = Math.floor(peer.studyMinutes / 60)
        const studyM = peer.studyMinutes % 60
        // nameplate colour reflects status: studying / all-done / in-progress / idle
        const headerBg = peer.activity
          ? '#4a90d9'
          : peer.total > 0 && peer.doneCount >= peer.total
            ? '#6aa84f'
            : peer.doneCount > 0
              ? '#e0a23c'
              : '#8a7a58'
        return (
          <button
            key={peer.id}
            onClick={(e) => {
              e.stopPropagation()
              peer.isMe ? onSelfClick?.() : onPoke(peer)
            }}
            className="group absolute z-10 -translate-x-1/2 -translate-y-full transition-[left,top] duration-700 ease-linear focus:outline-none"
            style={{ left: `${peer.x}%`, top: `${peer.y}%`, cursor: 'pointer' }}
            title={peer.isMe ? t('world.startTimer') : t('world.pokeName', { name: peer.username })}
          >
            {/* floating emotes */}
            {myEmotes.map((em) => (
              <img
                key={em.id}
                src={`/assets/${em.emoji}.png`}
                alt=""
                className="animate-emote pointer-events-none absolute -top-2 left-1/2 h-9 w-9 -translate-x-1/2 object-contain"
              />
            ))}

            {/* chat bubbles — stack upward, newest nearest the head */}
            {myMessages.length > 0 && (
              <div className="mb-1 flex flex-col items-center gap-1">
                {myMessages.map((b) => (
                  <div
                    key={b.id}
                    className="animate-fade-up max-w-[180px] break-words rounded-2xl rounded-bl-sm border-2 border-[#6b4a24] bg-white px-2.5 py-1 text-center text-xs font-medium text-[color:var(--color-ink)] shadow-lg"
                  >
                    {b.text}
                  </div>
                ))}
              </div>
            )}

            {/* status nameplate (always shown) */}
            <div className="mx-auto mb-1 w-fit min-w-[120px] max-w-[16rem] overflow-hidden rounded-xl border-2 border-[#6b4a24] bg-[#fff5dd] text-center shadow-[0_3px_0_#6b4a24]">
                {/* nameplate header — colour reflects status */}
                <div className="flex items-center justify-center gap-1.5 px-2.5 py-1" style={{ background: headerBg }}>
                  <img src={`/assets/${st.icon}.png`} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />
                  <span className="font-pixel max-w-[140px] truncate text-xs font-bold text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">
                    {peer.username}
                  </span>
                </div>

                <div className="px-2.5 py-1.5">
                  {/* key stats: coins · today's tasks · streak */}
                  <div className="flex items-center justify-center gap-2.5 text-[10px]">
                    <span className="flex items-center gap-0.5" title="balance">
                      <img src="/assets/coin.png" alt="" className="h-3 w-3 object-contain" />
                      <span className={`font-pixel font-bold ${peer.balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}`}>
                        {Math.round(peer.balance)}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5" title="today's tasks">
                      <img src="/assets/icon-tasks.png" alt="" className="h-3 w-3 object-contain" />
                      <span className="font-pixel font-bold text-[color:var(--color-grass-dark)]">
                        {peer.doneCount}/{peer.total}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5" title="streak">
                      <img src="/assets/flame.png" alt="" className="h-3 w-3 object-contain" />
                      <span className="font-pixel font-bold text-[#c2410c]">{peer.streak}</span>
                    </span>
                  </div>

                  {/* revealed on hover: class · bio · study time · current activity */}
                  <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-h-44 group-hover:opacity-100">
                    <div className="mt-1.5 space-y-1 border-t-2 border-[#eaddbc] pt-1.5">
                      <p className="font-pixel text-[9px] font-bold uppercase tracking-wide text-[color:var(--color-faint)]">{charLabel}</p>
                      {peer.bio && (
                        <p className="line-clamp-3 text-[10px] italic leading-snug text-[color:var(--color-muted)]">“{peer.bio}”</p>
                      )}
                      <div className="flex items-center justify-center gap-1 text-[10px]">
                        <img src="/assets/icon-timer.png" alt="" className="h-3 w-3 object-contain" />
                        <span className="font-pixel font-bold text-[#4a90d9]">
                          {studyH}h {studyM}m
                        </span>
                        <span className="text-[color:var(--color-faint)]">{t('profile.studyTime')}</span>
                      </div>
                      {peer.activity && (
                        <div className="mx-auto flex w-fit items-center gap-1 rounded-md bg-[#eaf6e0] px-1.5 py-0.5">
                          <img src="/assets/icon-book.png" alt="" className="h-3 w-3 object-contain" />
                          <span className="max-w-[150px] truncate text-[9px] font-medium text-[color:var(--color-grass-dark)]">{peer.activity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            {/* character */}
            <div className="relative mx-auto" style={{ height: CHAR_H }}>
              <div className="absolute bottom-0 left-1/2 h-2.5 w-14 -translate-x-1/2 rounded-[100%] bg-black/30 blur-[2px]" />
              {peer.isMe && (
                <div className="absolute bottom-0 left-1/2 h-3.5 w-16 -translate-x-1/2 rounded-[100%] border-2 border-violet-400/90" />
              )}
              <img
                src={charImg(peer.character)}
                alt={peer.username}
                draggable={false}
                className="animate-bob relative h-full w-auto transition-transform group-hover:scale-105"
                style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.35))' }}
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')}
              />
              {!peer.isMe && (
                <img
                  src="/assets/icon-poke.png"
                  alt=""
                  className="pointer-events-none absolute -right-1 top-2 h-7 w-7 origin-bottom-left rotate-12 object-contain opacity-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100 group-active:scale-90"
                />
              )}
            </div>
          </button>
        )
      })}

    </div>
  )
}
