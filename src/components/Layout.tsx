import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'

export default function Layout() {
  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-6">
      <Outlet />
      <TabBar />
    </div>
  )
}
