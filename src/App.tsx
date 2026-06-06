import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import World from './pages/World'
import Stats from './pages/Stats'
import Shop from './pages/Shop'
import Ranking from './pages/Ranking'

function FullScreenMessage({ text }: { text: string }) {
  return <div className="flex min-h-screen items-center justify-center text-slate-400">{text}</div>
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) return <FullScreenMessage text="Loading…" />

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <ProfileProvider>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/world" element={<World />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/ranking" element={<Ranking />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProfileProvider>
  )
}
