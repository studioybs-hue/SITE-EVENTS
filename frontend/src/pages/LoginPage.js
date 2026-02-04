import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <Card className="p-8 space-y-6 border-border/60 shadow-lg">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-heading font-semibold text-foreground">
              Bienvenue
            </h1>
            <p className="text-muted-foreground">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
              data-testid="google-login-btn"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Connexion avec Google
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Nouveau prestataire ?{' '}
              <button
                onClick={() => navigate('/search')}
                className="text-accent hover:underline font-medium"
                data-testid="explore-link"
              >
                Découvrir la plateforme
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;