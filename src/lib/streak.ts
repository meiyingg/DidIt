// Streak math over 'YYYY-MM-DD' day strings, using LOCAL time.
//
// computeStreak returns:
//   current — length of the consecutive-day run ending TODAY or YESTERDAY.
//             If today has activity, count back from today; else if yesterday
//             has activity, count back from yesterday; otherwise 0.
//   best    — the longest consecutive-day run anywhere in the dataset.

/** Format a local Date as 'YYYY-MM-DD' (no UTC shift). */
function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse 'YYYY-MM-DD' into a local Date at midnight. */
function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d) // local-time constructor → no timezone drift
}

export function computeStreak(dates: string[]): { current: number; best: number } {
  // Empty input → no streak.
  if (!dates || dates.length === 0) return { current: 0, best: 0 }

  // Dedupe into a fast membership Set of day keys.
  const days = new Set(dates)

  // ── current: the ongoing run ending today or yesterday ──
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let current = 0
  // Pick the anchor: today if active, else yesterday if active, else none.
  let cursor: Date | null = null
  if (days.has(toKey(today))) cursor = today
  else if (days.has(toKey(yesterday))) cursor = yesterday

  if (cursor) {
    // Walk backwards one day at a time while activity continues.
    const c = new Date(cursor)
    while (days.has(toKey(c))) {
      current++
      c.setDate(c.getDate() - 1)
    }
  }

  // ── best: longest run anywhere in the dataset ──
  // A day starts a run only if the previous day is NOT present; from each such
  // start, count forward. Each day is visited O(1) amortized times overall.
  let best = 0
  for (const key of days) {
    const start = fromKey(key)
    const prev = new Date(start)
    prev.setDate(prev.getDate() - 1)
    if (days.has(toKey(prev))) continue // not a run start

    let len = 0
    const c = new Date(start)
    while (days.has(toKey(c))) {
      len++
      c.setDate(c.getDate() + 1)
    }
    if (len > best) best = len
  }

  return { current, best }
}
