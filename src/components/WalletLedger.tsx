import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { WalletLog } from '../lib/types'
import { money, shortTime } from '../lib/format'
import { Panel, StatCard } from './ui'
import Coin from './Coin'
import Icon from './Icon'
import { useLang } from '../lib/i18n'

const ICONS: Record<WalletLog['type'], string> = {
  task_reward: 'icon-tasks',
  study_reward: 'icon-study',
  daily_deduction: 'icon-moon',
  purchase: 'nav-shop',
  adjustment: 'icon-gear',
}

interface DayGroup {
  date: string
  net: number
  items: WalletLog[]
}

/** Earned/spent summary + day-grouped transaction list. Reused by the Wallet page and the Profile page. */
export default function WalletLedger({ limit = 200, showBalance = true }: { limit?: number; showBalance?: boolean }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { t, locale } = useLang()
  const [logs, setLogs] = useState<WalletLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('wallet_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setLogs(data ?? [])
        setLoading(false)
      })
  }, [user, limit])

  const { earned, spent, groups } = useMemo(() => {
    let earned = 0
    let spent = 0
    const groups: DayGroup[] = []
    for (const l of logs) {
      const amt = Number(l.amount)
      if (amt >= 0) earned += amt
      else spent += amt
      const date = l.created_at.slice(0, 10)
      let g = groups[groups.length - 1]
      if (!g || g.date !== date) {
        g = { date, net: 0, items: [] }
        groups.push(g)
      }
      g.items.push(l)
      g.net += amt
    }
    return { earned, spent, groups }
  }, [logs])

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${showBalance ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {showBalance && (
          <StatCard
            emoji={<Coin className="h-6 w-6" />}
            label={t('common.balance')}
            tile="#fff1c9"
            value={money(profile?.balance ?? 0)}
            valueClass={(profile?.balance ?? 0) < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}
          />
        )}
        <StatCard emoji={<Icon src="icon-earned" className="h-6 w-6" />} label={t('wallet.earned')} tile="#dff3d2" value={money(earned)} valueClass="text-[color:var(--color-grass-dark)]" />
        <StatCard emoji={<Icon src="icon-spent" className="h-6 w-6" />} label={t('wallet.spent')} tile="#fde2cf" value={money(spent)} valueClass="text-[color:var(--color-berry)]" />
      </div>

      <Panel title={t('wallet.transactions')} icon={<Icon src="icon-book" />} color="amber" bodyClass="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[#f1e3c2]" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center">
            <img src="/assets/empty-wallet.png" alt="" className="mx-auto h-24 w-24 object-contain opacity-90" />
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">{t('wallet.empty')}</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.date}>
              <div className="flex items-center justify-between bg-[#f6ead0] px-4 py-1.5">
                <span className="font-pixel text-xs font-bold text-[color:var(--color-muted)]">
                  {new Date(g.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className={`font-pixel text-xs font-bold ${g.net >= 0 ? 'text-[color:var(--color-grass-dark)]' : 'text-[color:var(--color-berry)]'}`}>
                  {g.net >= 0 ? '+' : ''}
                  {money(g.net)}
                </span>
              </div>
              <ul className="divide-y divide-[#eaddbc]">
                {g.items.map((l) => {
                  const positive = Number(l.amount) >= 0
                  return (
                    <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Icon src={ICONS[l.type]} className="h-5 w-5" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-[color:var(--color-ink)]">{l.note || t(`wallet.type.${l.type}`)}</p>
                        <p className="text-[11px] text-[color:var(--color-faint)]">
                          {t(`wallet.type.${l.type}`)} · {shortTime(l.created_at)}
                        </p>
                      </div>
                      <span className={`px-coin shrink-0 ${positive ? '' : '!border-[#e7a3a3] !bg-[#ffe2e2] !text-[color:var(--color-berry)]'}`}>
                        <Coin /> {positive ? '+' : ''}
                        {money(Number(l.amount)).replace('¥', '')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </Panel>
    </div>
  )
}
