import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTopBar from './MobileTopBar'
import TabBar from './TabBar'
import DailySummaryModal from './DailySummaryModal'

export default function Layout() {
  // TESTING: show the AI recap on every entry. (Switch back to once-per-day later.)
  const [showSummary, setShowSummary] = useState(true)
  // The Home/World page is a full-screen scene with its own top overlays, so the
  // mobile top bar would just duplicate them (and the language toggle). Hide it there.
  const isHome = useLocation().pathname === '/'

  return (
    <div className="flex min-h-screen bg-[color:var(--color-canvas)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {!isHome && <MobileTopBar />}
        <main className="relative flex flex-1 flex-col">
          <Outlet />
        </main>
        <TabBar />
      </div>
      {showSummary && <DailySummaryModal onClose={() => setShowSummary(false)} />}
    </div>
  )
}
