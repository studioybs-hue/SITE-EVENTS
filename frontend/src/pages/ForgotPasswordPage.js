import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Lien de réinitialisation généré !');
        
        // In development, show the reset link
        if (data.reset_link) {
          setResetLink(data.reset_link);
        }
      } else {
        toast.error('Erreur lors de la demande');
      }
    } catch (error) {
      toast.error('Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <Card className="p-8 space-y-6 border-border/60 shadow-lg">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </button>
            <h1 className="text-3xl font-heading font-semibold text-foreground">
              Mot de passe oublié
            </h1>
            <p className="text-muted-foreground">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {!resetLink ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="forgot-email-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-full"
                disabled={loading}
                data-testid="forgot-submit-btn"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/30 rounded-sm border border-accent/20">
                <p className="text-sm text-muted-foreground mb-2">
                  Lien de réinitialisation (mode développement) :
                </p>
                <button
                  onClick={() => navigate(resetLink)}
                  className="text-accent hover:underline font-medium text-sm break-all"
                  data-testid="reset-link"
                >
                  Cliquez ici pour réinitialiser votre mot de passe
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                En production, un email serait envoyé avec ce lien
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
