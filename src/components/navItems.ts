import { House, ChartLine, Store, Trophy, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
  end: boolean
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/stats', label: 'Stats', Icon: ChartLine, end: false },
  { to: '/shop', label: 'Shop', Icon: Store, end: false },
  { to: '/ranking', label: 'Ranking', Icon: Trophy, end: false },
]
