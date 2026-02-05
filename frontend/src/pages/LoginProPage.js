import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogIn, Building, Camera, Music, Utensils, Sparkles, ArrowLeft, Globe, X } from 'lucide-react';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'KM', name: 'Comores' },
  { code: 'ES', name: 'Espagne' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'MA', name: 'Maroc' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'US', name: 'États-Unis' },
  { code: 'CA', name: 'Canada' },
];

const LoginProPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Register form
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: '',
    countries: ['FR']
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const toggleCountry = (code) => {
    setRegisterData(prev => {
      const countries = prev.countries.includes(code)
        ? prev.countries.filter(c => c !== code)
        : [...prev.countries, code];
      return { ...prev, countries: countries.length > 0 ? countries : ['FR'] };
    });
  };

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const user = await response.json();
          // If already a provider, go to dashboard
          if (user.user_type === 'provider') {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [navigate, BACKEND_URL]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const user = await response.json();
        
        // Check if user is a provider
        if (user.user_type === 'provider') {
          toast.success('Connexion réussie !');
          navigate('/dashboard');
        } else {
          // User is a client - prompt to become provider or redirect
          toast.info('Ce compte est un compte client. Redirection vers l\'espace client...');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
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
      // Register as client first
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          countries: registerData.countries,
        }),
      });

      if (response.ok) {
        // Upgrade to provider
        const upgradeResponse = await fetch(`${BACKEND_URL}/api/auth/profile?user_type=provider`, {
          method: 'PATCH',
          credentials: 'include',
        });
        
        if (upgradeResponse.ok) {
          toast.success('Compte prestataire créé ! Complétez votre profil professionnel.');
          navigate('/dashboard');
        } else {
          toast.error('Erreur lors de la mise à jour du compte');
        }
      } else {
        const error = await response.json();
        if (error.detail === 'Email already registered') {
          toast.error('Cet email est déjà utilisé. Essayez de vous connecter.');
        } else {
          toast.error(error.detail || 'Erreur lors de la création du compte');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Store intent to become provider
    sessionStorage.setItem('become_provider', 'true');
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const categories = [
    { icon: Camera, label: 'Photographe' },
    { icon: Music, label: 'DJ' },
    { icon: Utensils, label: 'Traiteur' },
    { icon: Sparkles, label: 'Décorateur' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <div>
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-12">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-heading font-bold mb-4">
            Espace Prestataire
          </h1>
          <p className="text-xl text-white/70 mb-8">
            Développez votre activité événementielle avec Lumière Events
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-white/90">Rejoignez nos prestataires</h3>
          <div className="grid grid-cols-2 gap-4">
            {categories.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Building className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold">+500 prestataires</p>
              <p className="text-sm text-white/60">nous font confiance</p>
            </div>
          </div>
          <ul className="space-y-2 text-white/70 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Calendrier de disponibilités intelligent
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Gestion des devis et réservations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Paiements sécurisés via Stripe
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Marketplace B2B pour votre matériel
            </li>
          </ul>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile back link */}
          <Link to="/" className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>

          <Card className="p-8 space-y-6 border-border/60 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Building className="h-7 w-7 text-accent" />
              </div>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Espace Pro
              </h1>
              <p className="text-muted-foreground text-sm">
                Connectez-vous à votre compte prestataire
              </p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="pro-login-tab">Connexion</TabsTrigger>
                <TabsTrigger value="register" data-testid="pro-register-tab">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="pro-login-email">Email professionnel</Label>
                    <Input
                      id="pro-login-email"
                      type="email"
                      placeholder="contact@votreentreprise.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      data-testid="pro-login-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pro-login-password">Mot de passe</Label>
                    <Input
                      id="pro-login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      data-testid="pro-login-password-input"
                    />
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-xs text-accent hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800"
                    disabled={loading}
                    data-testid="pro-login-submit-btn"
                  >
                    {loading ? 'Connexion...' : 'Accéder à mon espace'}
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
                  data-testid="pro-google-login-btn"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Continuer avec Google
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="pro-register-name">Nom / Entreprise</Label>
                    <Input
                      id="pro-register-name"
                      type="text"
                      placeholder="Studio Photo Martin"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      data-testid="pro-register-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pro-register-email">Email professionnel</Label>
                    <Input
                      id="pro-register-email"
                      type="email"
                      placeholder="contact@votreentreprise.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      data-testid="pro-register-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pro-register-password">Mot de passe</Label>
                    <Input
                      id="pro-register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      minLength={6}
                      data-testid="pro-register-password-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères</p>
                  </div>
                  <div>
                    <Label htmlFor="pro-register-confirm">Confirmer le mot de passe</Label>
                    <Input
                      id="pro-register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      data-testid="pro-register-confirm-input"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4" />
                      Pays d'intervention (plusieurs possibles)
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {registerData.countries.map((code) => {
                        const country = COUNTRIES.find(c => c.code === code);
                        return (
                          <Badge 
                            key={code} 
                            className="bg-accent text-white flex items-center gap-1 cursor-pointer"
                            onClick={() => toggleCountry(code)}
                          >
                            {country?.name}
                            <X className="h-3 w-3" />
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 border rounded-lg">
                      {COUNTRIES.filter(c => !registerData.countries.includes(c.code)).map((country) => (
                        <Badge 
                          key={country.code}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent/10"
                          onClick={() => toggleCountry(country.code)}
                        >
                          + {country.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800"
                    disabled={loading}
                    data-testid="pro-register-submit-btn"
                  >
                    {loading ? 'Création...' : 'Créer mon compte pro'}
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
                  data-testid="pro-google-register-btn"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  S'inscrire avec Google
                </Button>
              </TabsContent>
            </Tabs>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Vous êtes un client ?{' '}
                <Link
                  to="/login"
                  className="text-accent hover:underline font-medium"
                  data-testid="client-login-link"
                >
                  Espace Client
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginProPage;
