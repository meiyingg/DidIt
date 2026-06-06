/** Format a number as virtual RMB, e.g. -300 -> "-¥300.00". */
export function money(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}¥${Math.abs(amount).toFixed(2)}`
}

/** Short, human-friendly timestamp like "Jun 6, 14:32". */
export function shortTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
