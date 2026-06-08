import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

export interface Peer {
  id: string
  username: string
  doneCount: number
  total: number
  balance: number
  character: string
  activity: string
  bio: string
  studyMinutes: number
  streak: number
  x: number
  y: number
  isMe: boolean
}

export interface IncomingPoke {
  fromName: string
  ts: number
}

export interface FloatingEmote {
  id: number
  peerId: string
  emoji: string
}

export interface ChatBubble {
  id: number
  text: string
}

interface Meta {
  username: string
  doneCount: number
  total: number
  balance: number
  character: string
  activity?: string
  bio?: string
  studyMinutes?: number
  streak?: number
}

/**
 * Realtime "world": presence (who's online, position, character, activity) +
 * broadcast interactions (poke, chat bubble, floating emote).
 */
export function useWorld(meta: Meta) {
  const { user } = useAuth()
  const [peers, setPeers] = useState<Peer[]>([])
  const [incoming, setIncoming] = useState<IncomingPoke | null>(null)
  const [messages, setMessages] = useState<Record<string, ChatBubble[]>>({})
  const [emotes, setEmotes] = useState<FloatingEmote[]>([])
  const [pos, setPos] = useState(() => ({ x: 35 + Math.random() * 30, y: 64 + Math.random() * 20 }))
  const channelRef = useRef<RealtimeChannel | null>(null)
  const emoteId = useRef(0)
  const msgId = useRef(0)

  // bubbles stack per peer (newest last); each removes itself after a few seconds
  function showMessage(peerId: string, text: string) {
    const id = ++msgId.current
    setMessages((m) => ({ ...m, [peerId]: [...(m[peerId] ?? []), { id, text }].slice(-5) }))
    setTimeout(() => {
      setMessages((m) => {
        const list = m[peerId]
        if (!list) return m
        const next = list.filter((b) => b.id !== id)
        if (next.length === 0) {
          const copy = { ...m }
          delete copy[peerId]
          return copy
        }
        return { ...m, [peerId]: next }
      })
    }, 7000)
  }

  function spawnEmote(peerId: string, emoji: string) {
    const id = ++emoteId.current
    setEmotes((e) => [...e, { id, peerId, emoji }])
    setTimeout(() => setEmotes((e) => e.filter((x) => x.id !== id)), 1500)
  }

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('world', {
      config: { presence: { key: user.id }, broadcast: { self: false } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<Meta & { x: number; y: number; presence_ref: string }>()
      const list: Peer[] = Object.entries(state).map(([id, metas]) => {
        const m = metas[0]
        return {
          id,
          username: m?.username ?? 'Anon',
          doneCount: m?.doneCount ?? 0,
          total: m?.total ?? 0,
          balance: typeof m?.balance === 'number' ? m.balance : 0,
          character: m?.character ?? 'hoodie',
          activity: m?.activity ?? '',
          bio: m?.bio ?? '',
          studyMinutes: typeof m?.studyMinutes === 'number' ? m.studyMinutes : 0,
          streak: typeof m?.streak === 'number' ? m.streak : 0,
          x: typeof m?.x === 'number' ? m.x : 50,
          y: typeof m?.y === 'number' ? m.y : 75,
          isMe: id === user.id,
        }
      })
      setPeers(list)
    })

    channel.on('broadcast', { event: 'poke' }, ({ payload }) => {
      if (payload?.to === user.id) setIncoming({ fromName: payload.fromName ?? 'Someone', ts: Date.now() })
    })
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload?.from && payload?.text) showMessage(payload.from, String(payload.text))
    })
    channel.on('broadcast', { event: 'emote' }, ({ payload }) => {
      if (payload?.from && payload?.emoji) spawnEmote(payload.from, String(payload.emoji))
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ ...meta, x: pos.x, y: pos.y })
    })

    channelRef.current = channel
    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // re-broadcast my state when it changes
  useEffect(() => {
    channelRef.current?.track({ ...meta, x: pos.x, y: pos.y })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.username, meta.doneCount, meta.total, meta.balance, meta.character, meta.activity, meta.bio, meta.studyMinutes, meta.streak, pos.x, pos.y])

  function poke(to: string) {
    if (!user) return
    channelRef.current?.send({ type: 'broadcast', event: 'poke', payload: { to, from: user.id, fromName: meta.username } })
  }
  function say(text: string) {
    if (!user || !text.trim()) return
    const t = text.trim().slice(0, 120)
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: { from: user.id, fromName: meta.username, text: t } })
    showMessage(user.id, t)
  }
  function emote(emoji: string) {
    if (!user) return
    channelRef.current?.send({ type: 'broadcast', event: 'emote', payload: { from: user.id, emoji } })
    spawnEmote(user.id, emoji)
  }
  function moveTo(x: number, y: number) {
    setPos({ x: Math.max(5, Math.min(95, x)), y: Math.max(32, Math.min(92, y)) })
  }

  // my own card reflects my latest state immediately (no presence round-trip lag)
  const renderedPeers = peers.map((p) =>
    p.isMe
      ? {
          ...p,
          x: pos.x,
          y: pos.y,
          username: meta.username,
          balance: meta.balance,
          doneCount: meta.doneCount,
          total: meta.total,
          character: meta.character,
          activity: meta.activity ?? '',
          bio: meta.bio ?? '',
          studyMinutes: meta.studyMinutes ?? 0,
          streak: meta.streak ?? 0,
        }
      : p,
  )

  return { peers: renderedPeers, poke, say, emote, moveTo, incoming, messages, emotes }
}
