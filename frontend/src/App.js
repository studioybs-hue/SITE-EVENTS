import '@/App.css';
import '@/index.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SiteModeProvider, useSiteMode } from '@/contexts/SiteModeContext';

// Pages
import ModeSelectionPage from '@/pages/ModeSelectionPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import LoginProPage from '@/pages/LoginProPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SearchPage from '@/pages/SearchPage';
import DashboardPage from '@/pages/DashboardPage';
import MarketplacePage from '@/pages/MarketplacePage';
import MarketplaceItemPage from '@/pages/MarketplaceItemPage';
import MarketplacePaymentSuccessPage from '@/pages/MarketplacePaymentSuccessPage';
import MessagesPage from '@/pages/MessagesPage';
import PackagesPage from '@/pages/PackagesPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PricingPage from '@/pages/PricingPage';
import AdminPage from '@/pages/AdminPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminResetPasswordPage from '@/pages/AdminResetPasswordPage';
import CommunityEventsPage from '@/pages/CommunityEventsPage';

// Components
import AuthCallback from '@/components/AuthCallback';

// Route guard for mode selection
const ModeGuard = ({ children }) => {
  const { mode } = useSiteMode();
  
  if (!mode) {
    return <Navigate to="/welcome" replace />;
  }
  
  return children;
};

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id - SYNCHRONOUS check during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Mode Selection */}
      <Route path="/welcome" element={<ModeSelectionPage />} />
      
      {/* Public routes that need mode */}
      <Route path="/" element={<ModeGuard><HomePage /></ModeGuard>} />
      <Route path="/home" element={<ModeGuard><HomePage /></ModeGuard>} />
      <Route path="/search" element={<ModeGuard><SearchPage /></ModeGuard>} />
      <Route path="/packages" element={<ModeGuard><PackagesPage /></ModeGuard>} />
      
      {/* Auth routes (no mode needed) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/pro" element={<LoginProPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/marketplace/:itemId" element={<MarketplaceItemPage />} />
      <Route path="/marketplace/payment/success" element={<MarketplacePaymentSuccessPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <SiteModeProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </SiteModeProvider>
    </div>
  );
}

export default App;
