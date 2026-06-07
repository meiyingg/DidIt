import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { CHARACTERS, DEFAULT_CHARACTER, charImg } from '../lib/characters'
import { money } from '../lib/format'
import Container from '../components/Container'
import { Panel, StatCard } from '../components/ui'
import Icon from '../components/Icon'
import Coin from '../components/Coin'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { profile, refresh } = useProfile()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState({ tasksDone: 0, studyMin: 0, sessions: 0 })

  useEffect(() => {
    if (profile) {
      setName(profile.username)
      setBio(profile.bio ?? '')
    }
  }, [profile])

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
  const dirty = name.trim() !== (profile?.username ?? '') || bio !== (profile?.bio ?? '')

  async function save() {
    if (!user || !name.trim()) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({ username: name.trim(), bio }).eq('id', user.id)
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="animate-fade-up space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-pixel text-2xl font-bold text-[color:var(--color-ink)]">My Profile</h1>
        <button onClick={signOut} className="px-btn px-btn-amber text-sm">
          Sign out
        </button>
      </header>

      {/* hero */}
      <div className="px-panel flex items-center gap-4 p-5">
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
          <p className="font-pixel mt-0.5 text-xs text-[color:var(--color-muted)]">Playing as {charName}</p>
          <p className="font-pixel mt-1.5 flex items-center gap-1.5 text-lg font-bold">
            <Coin className="h-5 w-5" />
            <span className={(profile?.balance ?? 0) < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-grass-dark)]'}>
              {money(profile?.balance ?? 0).replace('¥', '')}
            </span>
          </p>
          {profile?.bio && <p className="mt-1.5 line-clamp-2 text-sm italic text-[color:var(--color-muted)]">“{profile.bio}”</p>}
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard emoji={<Icon src="icon-tasks" className="h-6 w-6" />} label="Tasks done" tile="#dff3d2" value={stats.tasksDone} />
        <StatCard emoji={<Icon src="icon-timer" className="h-6 w-6" />} label="Study time" tile="#d9ecff" value={`${Math.floor(stats.studyMin / 60)}h ${stats.studyMin % 60}m`} />
        <StatCard emoji={<Icon src="icon-study" className="h-6 w-6" />} label="Sessions" tile="#fff1c9" value={stats.sessions} />
      </div>

      {/* edit */}
      <Panel title="Edit profile" icon={<Icon src="icon-edit" />} color="blue">
        <label className="font-pixel mb-1 block text-xs font-bold uppercase text-[color:var(--color-muted)]">Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="px-input mb-3 w-full text-sm" placeholder="Your name" />

        <label className="font-pixel mb-1 block text-xs font-bold uppercase text-[color:var(--color-muted)]">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="A line about you…"
          className="mb-3 w-full rounded-lg border-2 border-[#c9a772] bg-[#fffdf5] px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none focus:border-[#4a90d9]"
        />

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving || !name.trim() || !dirty} className="px-btn text-sm">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="font-pixel text-sm text-[color:var(--color-grass-dark)]">Saved ✓</span>}
        </div>
      </Panel>

      <p className="text-center text-xs text-[color:var(--color-faint)]">
        Your character is chosen at signup and can’t be changed.
      </p>
    </Container>
  )
}
