export interface NavItem {
  to: string
  label: string
  emoji: string
  img: string
  end: boolean
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Home', emoji: '🏡', img: '/assets/nav-home.png', end: true },
  { to: '/calendar', label: 'Calendar', emoji: '📅', img: '/assets/nav-calendar.png', end: false },
  { to: '/shop', label: 'Shop', emoji: '🛒', img: '/assets/nav-shop.png', end: false },
  { to: '/ranking', label: 'Ranking', emoji: '🏆', img: '/assets/nav-ranking.png', end: false },
  { to: '/me', label: 'Profile', emoji: '👤', img: '/assets/nav-profile.png', end: false },
]
