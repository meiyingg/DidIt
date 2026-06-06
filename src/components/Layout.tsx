import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTopBar from './MobileTopBar'
import TabBar from './TabBar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  )
}
