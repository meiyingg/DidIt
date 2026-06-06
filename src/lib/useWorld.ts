import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

export interface Peer {
  id: string
  username: string
  doneCount: number
  total: number
  isMe: boolean
}

export interface IncomingPoke {
  fromName: string
  ts: number
}

interface Meta {
  username: string
  doneCount: number
  total: number
}

/**
 * Realtime "world" presence over a Supabase channel.
 * - Tracks everyone currently online + their today progress (no DB tables needed).
 * - `poke(id)` broadcasts a nudge; the target receives it via `incoming`.
 */
export function useWorld(meta: Meta) {
  const { user } = useAuth()
  const [peers, setPeers] = useState<Peer[]>([])
  const [incoming, setIncoming] = useState<IncomingPoke | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Join the channel once per user.
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('world', {
      config: { presence: { key: user.id }, broadcast: { self: false } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<Meta & { presence_ref: string }>()
      const list: Peer[] = Object.entries(state).map(([id, metas]) => {
        const m = metas[0]
        return {
          id,
          username: m?.username ?? 'Anon',
          doneCount: m?.doneCount ?? 0,
          total: m?.total ?? 0,
          isMe: id === user.id,
        }
      })
      // me first, then by progress
      list.sort((a, b) => Number(b.isMe) - Number(a.isMe))
      setPeers(list)
    })

    channel.on('broadcast', { event: 'poke' }, ({ payload }) => {
      if (payload?.to === user.id) {
        setIncoming({ fromName: payload.fromName ?? 'Someone', ts: Date.now() })
      }
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          username: meta.username,
          doneCount: meta.doneCount,
          total: meta.total,
        })
      }
    })

    channelRef.current = channel
    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Re-broadcast my state when my progress changes.
  useEffect(() => {
    channelRef.current?.track({
      username: meta.username,
      doneCount: meta.doneCount,
      total: meta.total,
    })
  }, [meta.username, meta.doneCount, meta.total])

  function poke(to: string) {
    if (!user) return
    channelRef.current?.send({
      type: 'broadcast',
      event: 'poke',
      payload: { to, from: user.id, fromName: meta.username },
    })
  }

  return { peers, poke, incoming }
}
