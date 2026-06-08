export interface NavItem {
  to: string
  label: string
  emoji: string
  img: string
  end: boolean
}

// `label` is an i18n key (see lib/i18n) — render with t(label)
export const NAV: NavItem[] = [
  { to: '/', label: 'nav.home', emoji: '🏡', img: '/assets/nav-home.png', end: true },
  { to: '/calendar', label: 'nav.calendar', emoji: '📅', img: '/assets/nav-calendar.png', end: false },
  { to: '/shop', label: 'nav.shop', emoji: '🛒', img: '/assets/nav-shop.png', end: false },
  { to: '/ranking', label: 'nav.ranking', emoji: '🏆', img: '/assets/nav-ranking.png', end: false },
  { to: '/me', label: 'nav.profile', emoji: '👤', img: '/assets/nav-profile.png', end: false },
]
