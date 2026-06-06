import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTopBar from './MobileTopBar'
import TabBar from './TabBar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[color:var(--color-canvas)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:px-10 md:pb-14 md:pt-9">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  )
}
