import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import SettingsPage from './pages/SettingsPage';
import SmartCityPage from './pages/SmartCityPage';
import AdminPage from './pages/AdminPage';
import CataloguePage from './pages/CataloguePage';
import AddProductPage from './pages/AddProductPage';
import PublicStorePage from './pages/PublicStorePage';
import CreatePostPage from './pages/CreatePostPage';
import MessagesPage from './pages/MessagesPage';
import VerificationPage from './pages/VerificationPage';
import AddressBookPage from './pages/AddressBookPage';
import BillingPage from './pages/BillingPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: 'var(--border-color)',
            borderTopColor: 'var(--text-primary)',
          }}
        />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" />;
}

// Placeholder component for settings pages that don't exist yet
function ComingSoonPage({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      </div>
      <div className="flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: '60vh' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Coming Soon</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This feature is under development</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/explore"
              element={
                <PrivateRoute>
                  <ExplorePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <NotificationsPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile/:userId"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/product/:id"
              element={
                <PrivateRoute>
                  <ProductDetailPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              }
            />

            {/* Settings Sub-Routes - ACTUAL PAGES */}
            <Route
              path="/settings/verification"
              element={
                <PrivateRoute>
                  <VerificationPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/address"
              element={
                <PrivateRoute>
                  <AddressBookPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/billing"
              element={
                <PrivateRoute>
                  <BillingPage />
                </PrivateRoute>
              }
            />

            {/* Settings Sub-Routes - COMING SOON PLACEHOLDERS */}
            <Route
              path="/settings/profile"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Edit Profile" />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/contact"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Contact Information" />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/notifications"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Notifications" />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/language"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Language & Region" />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/password"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Password & Security" />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/privacy"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Privacy Settings" />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/help"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Help & Support" />
                </PrivateRoute>
              }
            />

            <Route
              path="/settings/legal"
              element={
                <PrivateRoute>
                  <ComingSoonPage title="Legal & Policies" />
                </PrivateRoute>
              }
            />

            <Route
              path="/smart-city"
              element={
                <PrivateRoute>
                  <SmartCityPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/catalogue"
              element={
                <PrivateRoute>
                  <CataloguePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/catalogue/add"
              element={
                <PrivateRoute>
                  <AddProductPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/store/:sellerId"
              element={
                <PrivateRoute>
                  <PublicStorePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/create"
              element={
                <PrivateRoute>
                  <CreatePostPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/messages/:userId"
              element={
                <PrivateRoute>
                  <MessagesPage />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
