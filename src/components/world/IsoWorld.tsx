import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text } from 'pixi.js'
import type { Peer } from '../../lib/useWorld'

const TILE_W = 64
const TILE_H = 32
const DEPTH = 7
const COLS = 10
const ROWS = 6

const BODY_COLORS = [0x8b5cf6, 0x3b82f6, 0x10b981, 0xec4899, 0xf59e0b, 0x06b6d4, 0xef4444, 0x14b8a6]

// ── hand-drawn pixel villager (straw-hat chibi). 12×12 grid. ──
const PX = 3
const CHAR_SHEET = [
  '....oooo....',
  '...ohhhho...',
  '..oooooooo..',
  '...okkkko...',
  '...oekkeo...',
  '...okkkko...',
  '....okko....',
  '..osssssso..',
  '..osssssso..',
  '.kosssssok.',
  '...oppppo...',
  '...obbbbo...',
]
function charColor(ch: string, shirt: number): number | null {
  switch (ch) {
    case 'o':
      return 0x3a2a1a // outline
    case 'h':
      return 0xd9b35c // straw hat
    case 'k':
      return 0xf2c79a // skin
    case 'e':
      return 0x2a1f16 // eyes
    case 's':
      return shirt // shirt (per user)
    case 'p':
      return 0x46618f // pants
    case 'b':
      return 0x6b4a2a // boots
    default:
      return null
  }
}
function buildPixelChar(shirt: number): Graphics {
  const g = new Graphics()
  const W = CHAR_SHEET[0].length
  const H = CHAR_SHEET.length
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const col = charColor(CHAR_SHEET[y][x], shirt)
      if (col == null) continue
      g.rect((x - W / 2) * PX, (y - H) * PX, PX, PX).fill(col)
    }
  }
  return g
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function tileToScreen(col: number, row: number) {
  return { x: ((col - row) * TILE_W) / 2, y: ((col + row) * TILE_H) / 2 }
}

function statusEmoji(p: Peer): string {
  if (p.total > 0 && p.doneCount >= p.total) return '✅'
  if (p.doneCount > 0) return '🔥'
  return '💤'
}

// fixed slots inside each zone
function zoneSlots(cols: number[]): [number, number][] {
  const out: [number, number][] = []
  for (const r of [1, 3, 5]) for (const c of cols) out.push([c, r])
  return out
}
const FOCUS_SLOTS = zoneSlots([1, 3])
const LOUNGE_SLOTS = zoneSlots([6, 8])

interface Props {
  peers: Peer[]
  onPoke: (p: Peer) => void
}

export default function IsoWorld({ peers, onPoke }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onPokeRef = useRef(onPoke)
  onPokeRef.current = onPoke

  const peersRef = useRef(peers)
  peersRef.current = peers
  const rebuildRef = useRef<((p: Peer[]) => void) | null>(null)

  // mount Pixi once
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let app: Application | null = null
    let cancelled = false
    const bobbers: { c: Container; baseY: number; phase: number }[] = []

    ;(async () => {
      const a = new Application()
      await a.init({
        background: 0x0f1020,
        antialias: true,
        resizeTo: host,
        autoDensity: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
      })
      if (cancelled) {
        a.destroy(true)
        return
      }
      app = a
      host.appendChild(a.canvas)

      const root = new Container()
      a.stage.addChild(root)

      // ----- floor -----
      const floor = new Container()
      root.addChild(floor)
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const { x, y } = tileToScreen(col, row)
          const isFocus = col < COLS / 2
          const top = isFocus ? 0x3b2f6b : 0x2f5e6b
          const sideL = isFocus ? 0x2a2150 : 0x224653
          const sideR = isFocus ? 0x231b45 : 0x1b3a45
          const g = new Graphics()
          // left + right depth faces
          g.poly([x - TILE_W / 2, y, x, y + TILE_H / 2, x, y + TILE_H / 2 + DEPTH, x - TILE_W / 2, y + DEPTH]).fill(sideL)
          g.poly([x + TILE_W / 2, y, x, y + TILE_H / 2, x, y + TILE_H / 2 + DEPTH, x + TILE_W / 2, y + DEPTH]).fill(sideR)
          // top diamond
          g.poly([x, y - TILE_H / 2, x + TILE_W / 2, y, x, y + TILE_H / 2, x - TILE_W / 2, y])
            .fill(top)
            .stroke({ width: 1, color: 0xffffff, alpha: 0.06 })
          floor.addChild(g)
        }
      }

      // zone labels
      const mkLabel = (txt: string, col: number, color: number) => {
        const { x, y } = tileToScreen(col, 0)
        const t = new Text({
          text: txt,
          style: { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: '700', fill: color, letterSpacing: 2 },
        })
        t.anchor.set(0.5)
        t.position.set(x, y - TILE_H)
        t.alpha = 0.7
        floor.addChild(t)
      }
      mkLabel('FOCUS', 2, 0xc4b5fd)
      mkLabel('LOUNGE', 7, 0x99f6e4)

      // ----- avatars layer -----
      const avatarLayer = new Container()
      root.addChild(avatarLayer)

      // center the world & scale to fit
      const minX = -(ROWS - 1) * (TILE_W / 2)
      const maxX = (COLS - 1) * (TILE_W / 2)
      const maxY = (COLS - 1 + ROWS - 1) * (TILE_H / 2)
      const worldW = maxX - minX + TILE_W
      const worldH = maxY + TILE_H + 70 // headroom for bubbles
      root.pivot.set((minX + maxX) / 2, maxY / 2 - 8)

      const layout = () => {
        const sw = a.screen.width
        const sh = a.screen.height
        const scale = Math.min(1.3, (sw - 32) / worldW, (sh - 24) / worldH)
        root.scale.set(scale)
        root.position.set(sw / 2, sh / 2)
      }
      layout()
      a.renderer.on('resize', layout)

      const buildAvatar = (peer: Peer): Container => {
        const c = new Container()
        const color = BODY_COLORS[hash(peer.id) % BODY_COLORS.length]

        const shadow = new Graphics().ellipse(0, 0, 15, 6).fill({ color: 0x000000, alpha: 0.22 })
        const sprite = buildPixelChar(color)
        c.addChild(shadow, sprite)

        // bubble: "🔥 Amy 3/5"
        const label = `${statusEmoji(peer)} ${peer.username} ${peer.total > 0 ? `${peer.doneCount}/${peer.total}` : ''}`.trim()
        const txt = new Text({
          text: label,
          style: { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: '600', fill: 0x1f2937 },
        })
        txt.anchor.set(0.5)
        const bw = txt.width + 16
        const bh = 20
        const by = -60
        const bubble = new Graphics()
          .roundRect(-bw / 2, by - bh / 2, bw, bh, 8)
          .fill(0xffffff)
          .stroke({ width: 1.5, color: peer.isMe ? 0x8b5cf6 : 0xe5e7eb })
        bubble.poly([-5, by + bh / 2 - 1, 5, by + bh / 2 - 1, 0, by + bh / 2 + 5]).fill(0xffffff)
        txt.position.set(0, by)
        c.addChild(bubble, txt)

        if (peer.isMe) {
          const ring = new Graphics().ellipse(0, 0, 20, 9).stroke({ width: 2, color: 0x8b5cf6, alpha: 0.9 })
          c.addChildAt(ring, 1)
        }

        c.eventMode = 'static'
        c.cursor = peer.isMe ? 'default' : 'pointer'
        if (!peer.isMe) c.on('pointertap', () => onPokeRef.current(peer))
        return c
      }

      const rebuild = (list: Peer[]) => {
        for (const child of avatarLayer.removeChildren()) child.destroy({ children: true })
        bobbers.length = 0

        const focus = list.filter((p) => !(p.total > 0 && p.doneCount >= p.total))
        const lounge = list.filter((p) => p.total > 0 && p.doneCount >= p.total)

        const place = (group: Peer[], slots: [number, number][]) => {
          group.forEach((peer, i) => {
            const [col, row] = slots[i % slots.length]
            const { x, y } = tileToScreen(col, row)
            const c = buildAvatar(peer)
            c.position.set(x, y)
            c.zIndex = y
            avatarLayer.addChild(c)
            bobbers.push({ c, baseY: y, phase: hash(peer.id) % 100 })
          })
        }
        place(focus, FOCUS_SLOTS)
        place(lounge, LOUNGE_SLOTS)
        avatarLayer.sortableChildren = true
      }

      rebuildRef.current = rebuild
      rebuild(peersRef.current)

      a.ticker.add(() => {
        const t = performance.now() / 1000
        for (const b of bobbers) b.c.y = b.baseY + Math.sin(t * 1.6 + b.phase) * 3
      })
    })()

    return () => {
      cancelled = true
      rebuildRef.current = null
      if (app) app.destroy(true, { children: true })
    }
  }, [])

  // rebuild avatars when peers change
  useEffect(() => {
    rebuildRef.current?.(peers)
  }, [peers])

  return <div ref={hostRef} className="h-full w-full" />
}
