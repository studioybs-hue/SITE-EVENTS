import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  FileText, Calendar, MapPin, User, Euro, Send, 
  CheckCircle, XCircle, Clock, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

const QuoteManager = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [responseForm, setResponseForm] = useState({
    response_amount: '',
    response_message: ''
  });
  const [clientNames, setClientNames] = useState({});
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/received`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
        // Fetch client names
        const clientIds = [...new Set(data.map(q => q.client_id))];
        fetchClientNames(clientIds);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientNames = async (clientIds) => {
    const names = {};
    for (const clientId of clientIds) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/users/${clientId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const user = await response.json();
          names[clientId] = user.name;
        }
      } catch (error) {
        names[clientId] = 'Client';
      }
    }
    setClientNames(names);
  };

  const handleOpenResponse = (quote) => {
    setSelectedQuote(quote);
    setResponseForm({
      response_amount: quote.response_amount?.toString() || '',
      response_message: quote.response_message || ''
    });
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async (e, status = 'responded') => {
    e.preventDefault();
    if (!selectedQuote) return;
    
    setSubmitting(true);
    try {
      const payload = {
        status: status,
        response_amount: parseFloat(responseForm.response_amount) || null,
        response_message: responseForm.response_message || null
      };

      const response = await fetch(`${BACKEND_URL}/api/quotes/${selectedQuote.quote_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(status === 'declined' ? 'Devis refusé' : 'Devis envoyé au client !');
        setResponseDialogOpen(false);
        fetchQuotes();
      } else {
        toast.error('Erreur lors de la réponse');
      }
    } catch (error) {
      console.error('Error responding to quote:', error);
      toast.error('Erreur lors de la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (quote) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande ?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/${quote.quote_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'declined' }),
      });

      if (response.ok) {
        toast.success('Demande refusée');
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error declining quote:', error);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { class: 'bg-amber-100 text-amber-700', icon: Clock, label: 'En attente' },
      responded: { class: 'bg-blue-100 text-blue-700', icon: Send, label: 'Répondu' },
      accepted: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Accepté' },
      declined: { class: 'bg-gray-100 text-gray-500', icon: XCircle, label: 'Refusé' },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.class}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const pendingQuotes = quotes.filter(q => q.status === 'pending');
  const respondedQuotes = quotes.filter(q => q.status !== 'pending');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Quotes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-heading font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Demandes de devis
            </h2>
            <p className="text-sm text-muted-foreground">
              {pendingQuotes.length} demande{pendingQuotes.length > 1 ? 's' : ''} en attente
            </p>
          </div>
        </div>

        {pendingQuotes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingQuotes.map((quote) => (
              <div
                key={quote.quote_id}
                className="border-2 border-amber-200 bg-amber-50/50 rounded-lg p-5"
                data-testid="quote-item"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{clientNames[quote.client_id] || 'Client'}</p>
                        <p className="text-sm text-muted-foreground">
                          Reçu le {formatDate(quote.created_at)}
                        </p>
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Événement</p>
                        <p className="font-medium">{quote.event_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(quote.event_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lieu</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {quote.event_location}
                        </p>
                      </div>
                    </div>

                    {/* Services requested */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Prestations demandées :</p>
                      <div className="space-y-2">
                        {quote.services.map((service, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium">{service.title}</span>
                            {service.options && service.options.length > 0 && (
                              <span className="text-sm text-muted-foreground">
                                + {service.options.join(', ')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {quote.message && (
                      <div className="p-3 bg-white rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Message du client :</p>
                        <p className="text-sm italic">"{quote.message}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-amber-200">
                  <Button 
                    onClick={() => handleOpenResponse(quote)}
                    className="flex-1"
                    data-testid={`respond-quote-${quote.quote_id}`}
                  >
                    <Euro className="h-4 w-4 mr-2" />
                    Envoyer un devis
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleDecline(quote)}
                    data-testid={`decline-quote-${quote.quote_id}`}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Responded/History */}
      {respondedQuotes.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Historique des devis</h3>
          <div className="space-y-3">
            {respondedQuotes.map((quote) => (
              <div
                key={quote.quote_id}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{clientNames[quote.client_id] || 'Client'}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.event_type} - {formatDate(quote.event_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {quote.response_amount && (
                      <span className="font-semibold text-lg text-primary">
                        {quote.response_amount}€
                      </span>
                    )}
                    {getStatusBadge(quote.status)}
                  </div>
                </div>
                
                {/* Expandable details */}
                <button
                  onClick={() => setExpandedQuote(expandedQuote === quote.quote_id ? null : quote.quote_id)}
                  className="text-sm text-accent hover:underline mt-2 flex items-center gap-1"
                >
                  {expandedQuote === quote.quote_id ? (
                    <>Masquer les détails <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Voir les détails <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
                
                {expandedQuote === quote.quote_id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Lieu : </span>
                      {quote.event_location}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prestations : </span>
                      {quote.services.map(s => s.title).join(', ')}
                    </div>
                    {quote.response_message && (
                      <div>
                        <span className="text-muted-foreground">Votre réponse : </span>
                        {quote.response_message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Répondre à la demande de devis
            </DialogTitle>
          </DialogHeader>

          {selectedQuote && (
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              {/* Quote summary */}
              <div className="bg-secondary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{clientNames[selectedQuote.client_id] || 'Client'}</span>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>📅 {selectedQuote.event_type} - {formatDate(selectedQuote.event_date)}</p>
                  <p>📍 {selectedQuote.event_location}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Prestations :</p>
                  <ul className="text-sm">
                    {selectedQuote.services.map((service, idx) => (
                      <li key={idx}>
                        • {service.title}
                        {service.options?.length > 0 && (
                          <span className="text-muted-foreground"> + {service.options.join(', ')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <Label htmlFor="response_amount" className="text-base">
                  Votre prix (€) *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Indiquez le montant total pour cette prestation
                </p>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="response_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="Ex: 2500"
                    className="pl-10 text-lg h-12"
                    value={responseForm.response_amount}
                    onChange={(e) => setResponseForm({ ...responseForm, response_amount: e.target.value })}
                    data-testid="quote-response-amount"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="response_message">Message (optionnel)</Label>
                <Textarea
                  id="response_message"
                  rows={3}
                  placeholder="Détails sur le devis, conditions, disponibilités..."
                  value={responseForm.response_message}
                  onChange={(e) => setResponseForm({ ...responseForm, response_message: e.target.value })}
                  data-testid="quote-response-message"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setResponseDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting} data-testid="submit-quote-response">
                  {submitting ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Envoi...
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le devis
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteManager;
