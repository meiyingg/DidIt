import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { money } from '../lib/format'
import { useLang } from '../lib/i18n'
import { Label, StatCard } from '../components/ui'
import Container from '../components/Container'
import Coin from '../components/Coin'

const ITEMS = [
  { img: '/assets/shop-game.png', nameKey: 'shop.game', cost: 200 },
  { img: '/assets/shop-meal.png', nameKey: 'shop.meal', cost: 200 },
  { img: '/assets/shop-sleep.png', nameKey: 'shop.sleep', cost: 200 },
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
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <Label>{t('shop.rewards')}</Label>
          <h1 className="font-pixel mt-1 text-2xl font-bold text-[color:var(--color-ink)]">{t('shop.title')}</h1>
        </div>
        <div className="sm:w-44">
          <StatCard
            emoji={<Coin className="h-6 w-6" />}
            label={t('common.balance')}
            tile="#fff1c9"
            value={money(balance)}
            valueClass={balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}
          />
        </div>
      </header>

      <img src="/assets/shop-sign.png" alt="Shop" className="mx-auto mb-4 max-h-28 w-auto object-contain" draggable={false} />

      <p className="mb-3 text-center text-sm text-[color:var(--color-muted)]">{t('shop.spend')}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ITEMS.map((item) => {
          const afford = balance >= item.cost
          const name = t(item.nameKey)
          return (
            <div key={item.nameKey} className="px-panel flex flex-col items-center p-4 text-center">
              <img src={item.img} alt={name} className="h-20 w-20 object-contain" draggable={false} />
              <p className="font-pixel mt-2 text-sm font-bold text-[color:var(--color-ink)]">{name}</p>
              <span className="px-coin mt-1">
                <Coin /> {item.cost}
              </span>
              <button
                onClick={() => buy(name, item.cost)}
                disabled={!afford || busy === name}
                className="px-btn mt-3 w-full text-xs"
              >
                {busy === name ? '…' : afford ? t('shop.buy') : t('shop.tooPricey')}
              </button>
            </div>
          )
        })}
      </div>

      {toast && (
        <div className="animate-fade-up font-pixel fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border-2 border-[#6b4a24] bg-[#fff5dd] px-5 py-2.5 text-sm font-bold text-[color:var(--color-ink)] shadow-xl md:bottom-8">
          {toast}
        </div>
      )}
    </Container>
  )
}
