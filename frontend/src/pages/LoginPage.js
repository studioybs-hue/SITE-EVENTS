import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, Heart, Calendar, Star, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Register form
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        toast.success('Connexion réussie !');
        navigate('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur de connexion');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      if (response.ok) {
        toast.success('Compte créé avec succès !');
        navigate('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de la création du compte');
      }
    } catch (error) {
      toast.error('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-background to-amber-50 px-6">
      <div className="w-full max-w-md">
        <Card className="p-8 space-y-6 border-border/60 shadow-lg bg-white/95 backdrop-blur">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Espace Client
            </h1>
            <p className="text-muted-foreground text-sm">
              Trouvez les meilleurs prestataires pour vos événements
            </p>
          </div>

          {/* Quick benefits */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="text-center">
              <Calendar className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="text-[10px] text-muted-foreground">Réservez facilement</p>
            </div>
            <div className="text-center">
              <Star className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="text-[10px] text-muted-foreground">Avis vérifiés</p>
            </div>
            <div className="text-center">
              <MessageCircle className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="text-[10px] text-muted-foreground">Chat direct</p>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="login-tab">Connexion</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="login-password-input"
                  />
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs text-accent hover:underline"
                      data-testid="forgot-password-link"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full h-12 rounded-full"
                data-testid="google-login-btn"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Continuer avec Google
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="register-name">Nom complet</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                    data-testid="register-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="register-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    minLength={6}
                    data-testid="register-password-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères</p>
                </div>
                <div>
                  <Label htmlFor="register-confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    data-testid="register-confirm-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full"
                  disabled={loading}
                  data-testid="register-submit-btn"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full h-12 rounded-full"
                data-testid="google-register-btn"
              >
                <LogIn className="h-5 w-5 mr-2" />
                S'inscrire avec Google
              </Button>
            </TabsContent>
          </Tabs>

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