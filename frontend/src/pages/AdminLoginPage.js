import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, Smartphone, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/me`, { credentials: 'include' });
      if (res.ok) {
        navigate('/admin');
      }
    } catch (e) {
      // Not authenticated, stay on login page
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = { email, password };
      if (requires2FA && totpCode) {
        body.totp_code = totpCode;
      }

      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requires_2fa) {
          setRequires2FA(true);
          setError('');
        } else if (data.success) {
          navigate('/admin');
        }
      } else {
        setError(data.detail || 'Identifiants invalides');
        if (requires2FA) {
          setTotpCode('');
        }
      }
    } catch (e) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      if (res.ok) {
        setForgotSent(true);
        toast.success('Email de réinitialisation envoyé');
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Erreur');
      }
    } catch (e) {
      toast.error('Erreur de connexion');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Modal
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <KeyRound className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
            <CardDescription>
              {forgotSent 
                ? "Un email a été envoyé si cette adresse existe"
                : "Entrez votre email pour réinitialiser votre mot de passe"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotSent ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
                  <p className="font-medium">Email envoyé !</p>
                  <p className="text-sm mt-1">Vérifiez votre boîte de réception et vos spams.</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSent(false);
                    setForgotEmail('');
                  }}
                >
                  Retour à la connexion
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email administrateur</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>

                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Retour à la connexion
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              {requires2FA ? (
                <Smartphone className="h-10 w-10 text-yellow-500" />
              ) : (
                <Shield className="h-10 w-10 text-yellow-500" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {requires2FA ? 'Vérification 2FA' : 'Administration'}
          </CardTitle>
          <CardDescription>
            {requires2FA 
              ? 'Entrez le code de Google Authenticator'
              : 'Je Suis - Panneau d\'administration'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!requires2FA ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="admin-login-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="admin-login-password"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="totp">Code à 6 chiffres</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="totp"
                    type="text"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                    autoFocus
                    data-testid="admin-login-totp"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Ouvrez Google Authenticator et entrez le code affiché
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={loading}
              data-testid="admin-login-submit"
            >
              {loading ? 'Vérification...' : requires2FA ? 'Vérifier' : 'Se connecter'}
            </Button>

            {requires2FA && (
              <Button 
                type="button"
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setRequires2FA(false);
                  setTotpCode('');
                  setPassword('');
                }}
              >
                Retour
              </Button>
            )}
          </form>

          {!requires2FA && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-yellow-500 hover:text-yellow-400 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <div className="mt-6 text-center border-t pt-4">
            <a href="/" className="text-sm text-muted-foreground hover:underline">
              Retour au site
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
