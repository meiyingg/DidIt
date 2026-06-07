import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTopBar from './MobileTopBar'
import TabBar from './TabBar'
import DailySummaryModal from './DailySummaryModal'

export default function Layout() {
  // TESTING: show the AI recap on every entry. (Switch back to once-per-day later.)
  const [showSummary, setShowSummary] = useState(true)

  return (
    <div className="flex min-h-screen bg-[color:var(--color-canvas)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="relative flex flex-1 flex-col">
          <Outlet />
        </main>
        <TabBar />
      </div>
      {showSummary && <DailySummaryModal onClose={() => setShowSummary(false)} />}
    </div>
  )
}
