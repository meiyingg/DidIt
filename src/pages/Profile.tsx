import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { CHARACTERS, DEFAULT_CHARACTER, charImg } from '../lib/characters'
import { money } from '../lib/format'
import { useLang } from '../lib/i18n'
import Container from '../components/Container'
import { StatCard } from '../components/ui'
import Icon from '../components/Icon'
import Coin from '../components/Coin'
import WalletLedger from '../components/WalletLedger'
import EditProfileModal from '../components/EditProfileModal'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState({ tasksDone: 0, studyMin: 0, sessions: 0 })

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [tRes, sRes] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('done', true),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id),
      ])
      const sessions = sRes.data ?? []
      setStats({
        tasksDone: tRes.count ?? 0,
        studyMin: sessions.reduce((s, r) => s + (Number(r.duration_minutes) || 0), 0),
        sessions: sessions.length,
      })
    })()
  }, [user])

  const current = profile?.avatar_url || DEFAULT_CHARACTER
  const charName = CHARACTERS.find((c) => c.key === current)?.name ?? '—'

  return (
    <Container className="animate-fade-up space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-pixel text-2xl font-bold text-[color:var(--color-ink)]">{t('profile.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="px-btn flex items-center gap-1.5 text-sm">
            <Icon src="icon-edit" className="h-4 w-4" /> {t('profile.editProfile')}
          </button>
          <button onClick={signOut} className="px-btn px-btn-amber text-sm">
            {t('common.signout')}
          </button>
        </div>
      </header>

      {/* hero */}
      <div className="px-panel flex items-start gap-4 p-5">
        <div className="relative h-24 w-24 shrink-0">
          <img
            src={charImg(current)}
            alt=""
            className="absolute inset-[8px] h-[calc(100%-16px)] w-[calc(100%-16px)] rounded object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/char.png')}
          />
          <img src="/assets/avatar-frame.png" alt="" className="absolute inset-0 h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-pixel truncate text-xl font-bold text-[color:var(--color-ink)]">{profile?.username ?? 'You'}</p>
          <p className="font-pixel mt-0.5 text-xs text-[color:var(--color-muted)]">{t('profile.playingAs', { name: charName })}</p>
          <p className="font-pixel mt-1.5 flex items-center gap-1.5 text-lg font-bold">
            <Coin className="h-5 w-5" />
            <span className={(profile?.balance ?? 0) < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-grass-dark)]'}>
              {money(profile?.balance ?? 0).replace('¥', '')}
            </span>
          </p>
          {/* bio — always shown (placeholder when empty) */}
          <div className="mt-2 rounded-lg border-2 border-[#eaddbc] bg-[#fffdf5] px-3 py-2">
            <p className="font-pixel mb-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--color-faint)]">{t('profile.about')}</p>
            {profile?.bio ? (
              <p className="text-sm italic text-[color:var(--color-ink)]">“{profile.bio}”</p>
            ) : (
              <p className="text-sm text-[color:var(--color-faint)]">{t('profile.noBio')}</p>
            )}
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard emoji={<Icon src="icon-tasks" className="h-6 w-6" />} label={t('profile.tasksDone')} tile="#dff3d2" value={stats.tasksDone} />
        <StatCard emoji={<Icon src="icon-timer" className="h-6 w-6" />} label={t('profile.studyTime')} tile="#d9ecff" value={`${Math.floor(stats.studyMin / 60)}h ${stats.studyMin % 60}m`} />
        <StatCard emoji={<Icon src="icon-study" className="h-6 w-6" />} label={t('profile.sessions')} tile="#fff1c9" value={stats.sessions} />
      </div>

      {/* money detail */}
      <div className="pt-1">
        <h2 className="font-pixel mb-3 flex items-center gap-2 text-base font-bold text-[color:var(--color-ink)]">
          <Coin className="h-5 w-5" /> {t('wallet.title')}
        </h2>
        <WalletLedger showBalance={false} limit={100} />
      </div>

      <p className="text-center text-xs text-[color:var(--color-faint)]">{t('profile.charLocked')}</p>

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
    </Container>
  )
}
