import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        toast.success('Mot de passe réinitialisé avec succès');
      } else {
        setError(data.detail || 'Erreur lors de la réinitialisation');
        toast.error(data.detail || 'Erreur');
      }
    } catch (err) {
      setError('Erreur de connexion');
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Mot de passe réinitialisé !</h2>
            <p className="text-muted-foreground mb-6">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Button onClick={() => navigate('/admin/login')} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Lien invalide</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => navigate('/admin/login')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Créez un nouveau mot de passe pour votre compte administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nouveau mot de passe</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Confirmer le mot de passe</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate('/admin/login')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
