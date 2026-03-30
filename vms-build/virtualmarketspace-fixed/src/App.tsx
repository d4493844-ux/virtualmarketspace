import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import SettingsPage from './pages/SettingsPage';
import SmartCityPage from './pages/SmartCityPage';
import CataloguePage from './pages/CataloguePage';
import AddProductPage from './pages/AddProductPage';
import PublicStorePage from './pages/PublicStorePage';
import CreatePostPage from './pages/CreatePostPage';
import MessagesPage from './pages/MessagesPage';
import VideoDetailPage from './pages/VideoDetailPage';

// Settings Pages
import VerificationPage from './pages/VerificationPage';
import AddressBookPage from './pages/AddressBookPage';
import BillingPage from './pages/BillingPage';
import EditProfilePage from './pages/EditProfilePage';
import ContactInfoPage from './pages/ContactInfoPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import LanguageRegionPage from './pages/LanguageRegionPage';
import PasswordSecurityPage from './pages/PasswordSecurityPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import HelpSupportPage from './pages/HelpSupportPage';
import LegalPoliciesPage from './pages/LegalPoliciesPage';
import DeleteAccountPage from './pages/DeleteAccountPage';

// Ads & Admin Pages
import AdsDashboardPage from './pages/AdsDashboardPage';
import CreateAdPage from './pages/CreateAdPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/product/:id" element={<PrivateRoute><ProductDetailPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/video/:videoId" element={<PrivateRoute><VideoDetailPage /></PrivateRoute>} />
            
            {/* Settings Sub-Routes */}
            <Route path="/settings/profile" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
            <Route path="/settings/address" element={<PrivateRoute><AddressBookPage /></PrivateRoute>} />
            <Route path="/settings/contact" element={<PrivateRoute><ContactInfoPage /></PrivateRoute>} />
            <Route path="/settings/verification" element={<PrivateRoute><VerificationPage /></PrivateRoute>} />
            <Route path="/settings/billing" element={<PrivateRoute><BillingPage /></PrivateRoute>} />
            <Route path="/settings/notifications" element={<PrivateRoute><NotificationSettingsPage /></PrivateRoute>} />
            <Route path="/settings/language" element={<PrivateRoute><LanguageRegionPage /></PrivateRoute>} />
            <Route path="/settings/password" element={<PrivateRoute><PasswordSecurityPage /></PrivateRoute>} />
            <Route path="/settings/privacy" element={<PrivateRoute><PrivacySettingsPage /></PrivateRoute>} />
            <Route path="/settings/help" element={<PrivateRoute><HelpSupportPage /></PrivateRoute>} />
            <Route path="/settings/legal" element={<PrivateRoute><LegalPoliciesPage /></PrivateRoute>} />
            <Route path="/settings/delete-account" element={<PrivateRoute><DeleteAccountPage /></PrivateRoute>} />
            
            {/* Other Pages */}
            <Route path="/smart-city" element={<PrivateRoute><SmartCityPage /></PrivateRoute>} />
            <Route path="/catalogue" element={<PrivateRoute><CataloguePage /></PrivateRoute>} />
            <Route path="/catalogue/add" element={<PrivateRoute><AddProductPage /></PrivateRoute>} />
            <Route path="/store/:sellerId" element={<PrivateRoute><PublicStorePage /></PrivateRoute>} />
            <Route path="/create" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
            <Route path="/messages/:userId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
            
            {/* Ads Routes */}
            <Route path="/ads/dashboard" element={<PrivateRoute><AdsDashboardPage /></PrivateRoute>} />
            <Route path="/ads/create" element={<PrivateRoute><CreateAdPage /></PrivateRoute>} />
            
            {/* Admin Route - FIXED! */}
            <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;