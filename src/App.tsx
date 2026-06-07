import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { GuestMessagingProvider } from './hooks/useGuestMessaging'
import { InstallPrompt } from './components/pwa/InstallPrompt'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { DashboardPage } from './pages/DashboardPage'
import { AddCanPage } from './pages/AddCanPage'
import { CollectionPage } from './pages/CollectionPage'
import { CanDetailPage } from './pages/CanDetailPage'
import { TradePage } from './pages/TradePage'
import { WishlistPage } from './pages/WishlistPage'
import { MissingCansPage } from './pages/MissingCansPage'
import { TradeSharePage } from './pages/TradeSharePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { PremiumPage } from './pages/PremiumPage'
import { ImportLocalPage } from './pages/ImportLocalPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { BackupPage } from './pages/BackupPage'
import { TradeListingDetailPage } from './pages/TradeListingDetailPage'
import { AdminMasterCansPage } from './pages/AdminMasterCansPage'
import { shouldPromptLocalImport } from './lib/localImport'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, isConfigured } = useAuth()

  if (isConfigured && loading) return <LoadingSpinner fullPage label="Checking session..." />
  return <>{children}</>
}

function ImportGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isCloudSynced } = useAuth()
  const location = useLocation()

  if (!isCloudSynced || loading || !user) return <>{children}</>

  const onImportPage = location.pathname === '/import-local'
  if (onImportPage) return <>{children}</>

  if (shouldPromptLocalImport(user.id)) {
    return <Navigate to="/import-local" replace />
  }

  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth()

  if (!isConfigured) return <Navigate to="/" replace />
  if (loading) return <LoadingSpinner fullPage />
  if (user) return <Navigate to="/" replace />

  return <>{children}</>
}

function AppRoutes() {
  return (
    <>
      <InstallPrompt />
      <Routes>
        <Route path="/trade/share" element={<TradeSharePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route
          path="/import-local"
          element={
            <ProtectedRoute>
              <ImportLocalPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<ProtectedRoute><ImportGate><DashboardPage /></ImportGate></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><ImportGate><AddCanPage /></ImportGate></ProtectedRoute>} />
        <Route path="/collection" element={<ProtectedRoute><ImportGate><CollectionPage /></ImportGate></ProtectedRoute>} />
        <Route path="/missing" element={<ProtectedRoute><ImportGate><MissingCansPage /></ImportGate></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><ImportGate><WishlistPage /></ImportGate></ProtectedRoute>} />
        <Route path="/can/:id" element={<ProtectedRoute><ImportGate><CanDetailPage /></ImportGate></ProtectedRoute>} />
        <Route path="/trade" element={<ProtectedRoute><ImportGate><TradePage /></ImportGate></ProtectedRoute>} />
        <Route path="/trade/listing/:id" element={<ProtectedRoute><TradeListingDetailPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><ImportGate><StatisticsPage /></ImportGate></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/backup" element={<ProtectedRoute><BackupPage /></ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
        <Route path="/admin/master-cans" element={<AdminMasterCansPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <GuestMessagingProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </GuestMessagingProvider>
    </AuthProvider>
  )
}
