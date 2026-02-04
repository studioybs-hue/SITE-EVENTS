import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  FileText, Calendar, MapPin, Euro, Send, 
  CheckCircle, XCircle, Clock, User, MessageCircle,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const ClientQuotes = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { quote, action: 'accept' | 'decline' }
  const [providerNames, setProviderNames] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/sent`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
        // Fetch provider names
        const providerIds = [...new Set(data.map(q => q.provider_id))];
        fetchProviderNames(providerIds);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderNames = async (providerIds) => {
    const names = {};
    for (const providerId of providerIds) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/providers/${providerId}`);
        if (response.ok) {
          const provider = await response.json();
          names[providerId] = {
            name: provider.business_name,
            category: provider.category,
            location: provider.location
          };
        }
      } catch (error) {
        names[providerId] = { name: 'Prestataire', category: '', location: '' };
      }
    }
    setProviderNames(names);
  };

  const handleAcceptQuote = async (quote) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/${quote.quote_id}/accept`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Devis accepté ! Le prestataire sera notifié.');
        setConfirmDialog(null);
        fetchQuotes();
      } else {
        toast.error('Erreur lors de l\'acceptation');
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineQuote = async (quote) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/${quote.quote_id}/decline`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Devis refusé');
        setConfirmDialog(null);
        fetchQuotes();
      } else {
        toast.error('Erreur lors du refus');
      }
    } catch (error) {
      console.error('Error declining quote:', error);
      toast.error('Erreur lors du refus');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        class: 'bg-amber-100 text-amber-700', 
        icon: Clock, 
        label: 'En attente de réponse',
        description: 'Le prestataire n\'a pas encore répondu'
      },
      responded: { 
        class: 'bg-blue-100 text-blue-700', 
        icon: Euro, 
        label: 'Devis reçu',
        description: 'Le prestataire vous a envoyé un devis'
      },
      accepted: { 
        class: 'bg-emerald-100 text-emerald-700', 
        icon: CheckCircle, 
        label: 'Accepté',
        description: 'Vous avez accepté ce devis'
      },
      declined: { 
        class: 'bg-gray-100 text-gray-500', 
        icon: XCircle, 
        label: 'Refusé',
        description: 'Ce devis a été refusé'
      },
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Separate quotes by status
  const respondedQuotes = quotes.filter(q => q.status === 'responded');
  const pendingQuotes = quotes.filter(q => q.status === 'pending');
  const otherQuotes = quotes.filter(q => ['accepted', 'declined'].includes(q.status));

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  const renderQuoteCard = (quote, showActions = false) => {
    const provider = providerNames[quote.provider_id] || {};
    const statusConfig = getStatusConfig(quote.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedQuote === quote.quote_id;

    return (
      <div
        key={quote.quote_id}
        className={`border-2 rounded-lg overflow-hidden transition-all ${
          quote.status === 'responded' 
            ? 'border-blue-300 bg-blue-50/30' 
            : 'border-border'
        }`}
        data-testid="client-quote-item"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Provider info */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  quote.status === 'responded' ? 'bg-blue-100' : 'bg-secondary'
                }`}>
                  <User className={`h-6 w-6 ${
                    quote.status === 'responded' ? 'text-blue-600' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-lg">{provider.name || 'Prestataire'}</p>
                  <p className="text-sm text-muted-foreground">
                    {provider.category} • {provider.location}
                  </p>
                </div>
              </div>

              {/* Event info */}
              <div className="flex flex-wrap gap-4 mb-3 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {quote.event_type} - {formatDate(quote.event_date)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {quote.event_location}
                </span>
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-2 mb-3">
                {quote.services.map((service, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {service.title}
                    {service.options?.length > 0 && ` + ${service.options.length} option(s)`}
                  </Badge>
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge className={statusConfig.class}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Demandé le {formatDate(quote.created_at)}
                </span>
              </div>
            </div>

            {/* Price (if responded) */}
            {quote.status === 'responded' && quote.response_amount && (
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{quote.response_amount}€</p>
                <p className="text-xs text-muted-foreground">Devis proposé</p>
              </div>
            )}

            {quote.status === 'accepted' && quote.response_amount && (
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">{quote.response_amount}€</p>
                <p className="text-xs text-muted-foreground">Accepté</p>
              </div>
            )}
          </div>

          {/* Provider response message */}
          {quote.status === 'responded' && quote.response_message && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Message du prestataire :
              </p>
              <p className="text-sm">{quote.response_message}</p>
            </div>
          )}

          {/* Expand/collapse details */}
          <button
            onClick={() => setExpandedQuote(isExpanded ? null : quote.quote_id)}
            className="text-sm text-accent hover:underline mt-3 flex items-center gap-1"
          >
            {isExpanded ? (
              <>Masquer les détails <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Voir les détails <ChevronDown className="h-4 w-4" /></>
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Prestations demandées : </span>
                <ul className="mt-1 ml-4">
                  {quote.services.map((service, idx) => (
                    <li key={idx}>
                      • {service.title}
                      {service.options?.length > 0 && (
                        <span className="text-muted-foreground"> + {service.options.join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {quote.message && (
                <div>
                  <span className="text-muted-foreground">Votre message : </span>
                  <p className="italic">"{quote.message}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions for responded quotes */}
        {showActions && quote.status === 'responded' && (
          <div className="px-5 py-4 bg-blue-50 border-t border-blue-200 flex gap-3">
            <Button 
              onClick={() => setConfirmDialog({ quote, action: 'accept' })}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              data-testid={`accept-quote-${quote.quote_id}`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepter ce devis
            </Button>
            <Button 
              variant="outline"
              onClick={() => setConfirmDialog({ quote, action: 'decline' })}
              data-testid={`decline-quote-${quote.quote_id}`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Refuser
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/messages?provider=${quote.provider_id}`)}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Responded Quotes - Priority */}
      {respondedQuotes.length > 0 && (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Euro className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold">Devis reçus</h2>
              <p className="text-sm text-muted-foreground">
                {respondedQuotes.length} devis en attente de votre réponse
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {respondedQuotes.map((quote) => renderQuoteCard(quote, true))}
          </div>
        </Card>
      )}

      {/* Pending Quotes */}
      {pendingQuotes.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold">En attente de réponse</h2>
              <p className="text-sm text-muted-foreground">
                {pendingQuotes.length} demande{pendingQuotes.length > 1 ? 's' : ''} envoyée{pendingQuotes.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pendingQuotes.map((quote) => renderQuoteCard(quote, false))}
          </div>
        </Card>
      )}

      {/* History */}
      {otherQuotes.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Historique</h3>
          <div className="space-y-3">
            {otherQuotes.map((quote) => renderQuoteCard(quote, false))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {quotes.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune demande de devis</h3>
          <p className="text-muted-foreground mb-6">
            Parcourez nos prestataires et demandez des devis pour votre événement
          </p>
          <Button onClick={() => navigate('/search')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Trouver un prestataire
          </Button>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === 'accept' 
                ? '✅ Accepter ce devis ?' 
                : '❌ Refuser ce devis ?'}
            </DialogTitle>
          </DialogHeader>

          {confirmDialog && (
            <div className="py-4">
              {confirmDialog.action === 'accept' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-muted-foreground mb-1">Montant du devis</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {confirmDialog.quote.response_amount}€
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    En acceptant ce devis, le prestataire sera notifié et pourra vous contacter 
                    pour finaliser les détails de votre événement.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Êtes-vous sûr de vouloir refuser ce devis ? Cette action est définitive.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Annuler
            </Button>
            {confirmDialog?.action === 'accept' ? (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleAcceptQuote(confirmDialog.quote)}
                disabled={submitting}
                data-testid="confirm-accept-quote"
              >
                {submitting ? 'Traitement...' : 'Confirmer l\'acceptation'}
              </Button>
            ) : (
              <Button 
                variant="destructive"
                onClick={() => handleDeclineQuote(confirmDialog.quote)}
                disabled={submitting}
                data-testid="confirm-decline-quote"
              >
                {submitting ? 'Traitement...' : 'Confirmer le refus'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientQuotes;
