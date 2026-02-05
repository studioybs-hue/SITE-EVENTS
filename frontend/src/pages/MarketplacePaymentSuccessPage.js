import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShoppingBag, Home } from 'lucide-react';

const MarketplacePaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const [user, setUser] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const inquiryId = searchParams.get('inquiry_id');

  useEffect(() => {
    checkAuth();
    if (inquiryId) {
      pollPaymentStatus();
    } else {
      setStatus('failed');
    }
  }, [inquiryId]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        setUser(await response.json());
      }
    } catch (error) {}
  };

  const pollPaymentStatus = async () => {
    if (pollCount >= 10) {
      setStatus('failed');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/payment/status/${inquiryId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentData(data);

        if (data.paid) {
          setStatus('success');
          return;
        }
      }

      setPollCount(prev => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    } catch (error) {
      console.error('Error:', error);
      setPollCount(prev => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 mx-auto text-accent animate-spin mb-6" />
            <h2 className="text-2xl font-heading font-semibold mb-2">
              Vérification du paiement...
            </h2>
            <p className="text-muted-foreground">
              Veuillez patienter pendant que nous confirmons votre paiement.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-heading font-semibold mb-3 text-emerald-700">
              Achat confirmé !
            </h2>
            <p className="text-muted-foreground mb-2">
              Votre paiement de <span className="font-semibold text-foreground">{paymentData?.amount}€</span> a été confirmé.
            </p>
            {paymentData?.item_title && (
              <p className="text-sm text-muted-foreground mb-6">
                Article : {paymentData.item_title}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-8">
              Le vendeur a été notifié. Il vous contactera pour organiser la remise de l'article.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/dashboard')} className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Mes achats
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/marketplace')} className="gap-2">
                <Home className="h-4 w-4" />
                Marketplace
              </Button>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-12 w-12 text-rose-600" />
            </div>
            <h2 className="text-3xl font-heading font-semibold mb-3 text-rose-700">
              Paiement non abouti
            </h2>
            <p className="text-muted-foreground mb-8">
              Le paiement n'a pas pu être traité. Vous pouvez réessayer.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/dashboard')} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            {renderContent()}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePaymentSuccessPage;
