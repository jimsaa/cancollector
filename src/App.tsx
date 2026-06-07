import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { InstallPrompt } from './components/pwa/InstallPrompt'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { AddCanPage } from './pages/AddCanPage'
import { CollectionPage } from './pages/CollectionPage'
import { CanDetailPage } from './pages/CanDetailPage'
import { TradePage } from './pages/TradePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isLocalMode } = useAuth()

  if (isLocalMode) return <>{children}</>
  if (loading) return <LoadingSpinner fullPage label="Checking session..." />
  if (!user) return <Navigate to="/auth" replace />

  return <>{children}</>
}

function AuthRoute() {
  const { user, loading, isLocalMode } = useAuth()

  if (isLocalMode) return <Navigate to="/" replace />
  if (loading) return <LoadingSpinner fullPage />
  if (user) return <Navigate to="/" replace />

  return <AuthPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <InstallPrompt />
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddCanPage /></ProtectedRoute>} />
        <Route path="/collection" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
        <Route path="/can/:id" element={<ProtectedRoute><CanDetailPage /></ProtectedRoute>} />
        <Route path="/trade" element={<ProtectedRoute><TradePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
