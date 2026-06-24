import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/api/auth';
import { LoginPage } from '@/pages/auth/LoginPage';
import { UpkeepShell } from '@/pages/upkeep/UpkeepShell';
import { UpkeepDashboardPage } from '@/pages/upkeep/UpkeepDashboardPage';
import { AssetsPage } from '@/pages/upkeep/AssetsPage';
import { AssetDetailPage } from '@/pages/upkeep/AssetDetailPage';
import { MaintenancePage } from '@/pages/upkeep/MaintenancePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a39c92', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }
  if (!session) {
    const returnTo = location.pathname !== '/' ? `?returnTo=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${returnTo}`} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <UpkeepShell>
                <Routes>
                  <Route path="/" element={<UpkeepDashboardPage />} />
                  <Route path="/assets" element={<AssetsPage />} />
                  <Route path="/assets/:id" element={<AssetDetailPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </UpkeepShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
