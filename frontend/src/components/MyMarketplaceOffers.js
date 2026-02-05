import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, MessageCircle, CreditCard, CheckCircle, 
  Clock, XCircle, Loader2, Euro, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const MyMarketplaceOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(null);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchMyOffers();
  }, []);

  const fetchMyOffers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace-inquiries/sent`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setOffers(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (offer) => {
    setProcessingPayment(offer.inquiry_id);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace-payment/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          inquiry_id: offer.inquiry_id,
          origin_url: window.location.origin
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkout_url;
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors du paiement');
        setProcessingPayment(null);
      }
    } catch (error) {
      toast.error('Erreur de connexion');
      setProcessingPayment(null);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'En attente', color: 'bg-amber-100 text-amber-700' };
      case 'accepted':
        return { icon: CheckCircle, label: 'Acceptée - À payer', color: 'bg-emerald-100 text-emerald-700' };
      case 'paid':
        return { icon: CheckCircle, label: 'Payée', color: 'bg-blue-100 text-blue-700' };
      case 'declined':
        return { icon: XCircle, label: 'Refusée', color: 'bg-red-100 text-red-700' };
      default:
        return { icon: MessageCircle, label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  // Separate offers by status
  const acceptedOffers = offers.filter(o => o.status === 'accepted');
  const pendingOffers = offers.filter(o => o.status === 'pending');
  const otherOffers = offers.filter(o => !['accepted', 'pending'].includes(o.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-accent" />
        <div>
          <h2 className="text-xl font-semibold">Mes offres Marketplace</h2>
          <p className="text-sm text-muted-foreground">{offers.length} offre{offers.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Accepted offers - need payment */}
      {acceptedOffers.length > 0 && (
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            Offres acceptées - En attente de paiement
          </h3>
          <div className="space-y-3">
            {acceptedOffers.map((offer) => (
              <div key={offer.inquiry_id} className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{offer.item_title}</p>
                    <p className="text-sm text-muted-foreground">Vendeur: {offer.seller_name}</p>
                  </div>
                  <Badge className="bg-emerald-500 text-white">Acceptée</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-accent" />
                    <span className="text-2xl font-bold">{offer.offer_amount || offer.item_price}€</span>
                  </div>
                  
                  <Button 
                    onClick={() => handlePayment(offer)}
                    disabled={processingPayment === offer.inquiry_id}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {processingPayment === offer.inquiry_id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payer maintenant
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending offers */}
      {pendingOffers.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Offres en attente de réponse
          </h3>
          <div className="space-y-3">
            {pendingOffers.map((offer) => {
              const status = getStatusConfig(offer.status);
              const StatusIcon = status.icon;
              
              return (
                <div key={offer.inquiry_id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{offer.item_title}</p>
                      <p className="text-xs text-muted-foreground">{offer.seller_name}</p>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  {offer.offer_amount && (
                    <p className="text-sm">
                      Votre offre: <span className="font-semibold">{offer.offer_amount}€</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Other offers (paid, declined) */}
      {otherOffers.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-muted-foreground">Historique</h3>
          <div className="space-y-2">
            {otherOffers.map((offer) => {
              const status = getStatusConfig(offer.status);
              const StatusIcon = status.icon;
              
              return (
                <div key={offer.inquiry_id} className="border rounded-lg p-3 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{offer.item_title}</p>
                      {offer.offer_amount && (
                        <p className="text-xs text-muted-foreground">
                          Offre: {offer.offer_amount}€
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {offers.length === 0 && (
        <Card className="p-8 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Vous n'avez pas encore fait d'offre</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/marketplace'}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir le marketplace
          </Button>
        </Card>
      )}
    </div>
  );
};

export default MyMarketplaceOffers;
