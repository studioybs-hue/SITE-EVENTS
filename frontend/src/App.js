import '@/App.css';
import '@/index.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import LoginProPage from '@/pages/LoginProPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SearchPage from '@/pages/SearchPage';
import DashboardPage from '@/pages/DashboardPage';
import MarketplacePage from '@/pages/MarketplacePage';
import MarketplaceItemPage from '@/pages/MarketplaceItemPage';
import MessagesPage from '@/pages/MessagesPage';
import PackagesPage from '@/pages/PackagesPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';

// Components
import AuthCallback from '@/components/AuthCallback';

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id - SYNCHRONOUS check during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/marketplace/:itemId" element={<MarketplaceItemPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;