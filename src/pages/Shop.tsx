import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { money } from '../lib/format'
import { useLang } from '../lib/i18n'
import Container from '../components/Container'

const ITEMS = [
  { img: '/assets/shop-game.png', nameKey: 'shop.game', descKey: 'shop.game.desc', cost: 200 },
  { img: '/assets/shop-meal.png', nameKey: 'shop.meal', descKey: 'shop.meal.desc', cost: 200 },
  { img: '/assets/shop-sleep.png', nameKey: 'shop.sleep', descKey: 'shop.sleep.desc', cost: 200 },
]

export default function Shop() {
  const { user } = useAuth()
  const { profile, refresh } = useProfile()
  const { t } = useLang()
  const balance = profile?.balance ?? 0
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function buy(name: string, cost: number) {
    if (!user || balance < cost) return
    setBusy(name)
    try {
      await supabase.from('wallet_logs').insert({ user_id: user.id, amount: -cost, type: 'purchase', note: name })
      await refresh()
      setToast(t('shop.enjoy', { name }))
      setTimeout(() => setToast(null), 2500)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Container className="animate-fade-up">
      <h1 className="sr-only">{t('shop.title')}</h1>

      {/* storefront hero: hanging sign + shopkeeper greeting */}
      <div className="mb-5 flex flex-col items-center">
        <img
          src="/assets/shop-sign.png"
          alt={t('shop.title')}
          className="max-h-28 w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]"
          draggable={false}
        />
        <div className="relative mt-4 max-w-xs rounded-2xl border-2 border-[#6b4a24] bg-white px-4 py-2 text-center shadow-[0_3px_0_rgba(107,74,36,0.35)]">
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-[#6b4a24] bg-white" />
          <span className="font-pixel text-xs font-bold text-[color:var(--color-ink)]">{t('shop.greeting')}</span>
        </div>
      </div>

      {/* coin purse */}
      <div className="mb-7 flex justify-center">
        <div className="inline-flex items-center gap-2.5 rounded-2xl border-[3px] border-[#6b4a24] bg-[#fff5dd] px-4 py-2 shadow-[0_4px_0_#3a2614]">
          <img src="/assets/coin.png" alt="" className="h-9 w-9 object-contain" draggable={false} />
          <div className="text-left">
            <p className="font-pixel text-[10px] font-bold uppercase tracking-wide text-[color:var(--color-muted)]">{t('common.balance')}</p>
            <p className={`font-pixel text-2xl font-bold leading-none ${balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-grass-dark)]'}`}>
              {money(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* shelves */}
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {ITEMS.map((item, i) => {
          const afford = balance >= item.cost
          const name = t(item.nameKey)
          return (
            <div
              key={item.nameKey}
              className="px-panel group flex flex-col items-center gap-3 p-5 text-center transition-transform duration-200 hover:-translate-y-1"
            >
              {/* spotlight tile with floating art */}
              <div
                className="flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-[#e7c067] shadow-[inset_0_2px_8px_rgba(0,0,0,0.12)]"
                style={{ background: 'radial-gradient(circle at 50% 35%, #fffaf0, #ffe6ad)' }}
              >
                <img
                  src={item.img}
                  alt={name}
                  draggable={false}
                  style={{ animationDelay: `${i * 0.4}s` }}
                  className={`animate-float h-20 w-20 object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)] ${afford ? '' : 'opacity-60 grayscale-[0.4]'}`}
                />
              </div>

              {/* name + flavor */}
              <div>
                <p className="font-pixel text-base font-bold text-[color:var(--color-ink)]">{name}</p>
                <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">{t(item.descKey)}</p>
              </div>

              {/* wooden price tag */}
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#e7c067] bg-[#fff1c9] px-3 py-1 shadow-[0_2px_0_#cda23f]">
                <img src="/assets/coin.png" alt="" className="h-4 w-4 object-contain" draggable={false} />
                <span className="font-pixel text-base font-bold text-[#9a6a0c]">{item.cost}</span>
              </span>

              {/* buy / locked */}
              <button
                onClick={() => buy(name, item.cost)}
                disabled={!afford || busy === name}
                className="px-btn mt-1 w-full text-sm"
              >
                {busy === name ? '…' : afford ? t('shop.buy') : t('shop.needMore', { amount: Math.ceil(item.cost - balance) })}
              </button>
            </div>
          )
        })}
      </div>

      {toast && (
        <div className="animate-fade-up font-pixel fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-[#6b4a24] bg-[#fff5dd] px-5 py-2.5 text-sm font-bold text-[color:var(--color-ink)] shadow-xl md:bottom-8">
          <img src="/assets/icon-party.png" alt="" className="h-5 w-5 object-contain" />
          {toast}
        </div>
      )}
    </Container>
  )
}
