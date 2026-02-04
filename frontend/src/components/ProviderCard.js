import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, BadgeCheck, Lock, X, Clock, ChevronDown, ChevronUp, Package, Check, Send, Calendar, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ProviderCard = ({ provider }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [services, setServices] = useState([]);
  const [showAllServices, setShowAllServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    event_date: '',
    event_location: '',
    event_type: '',
    message: ''
  });
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) setUser(await res.json());
      } catch (e) {}
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (expanded && provider.provider_id) {
      fetchServices();
      // Reset selections when modal opens
      setSelectedServices([]);
      setSelectedOptions({});
    }
  }, [expanded, provider.provider_id]);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/services/provider/${provider.provider_id}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (e) {
      console.error('Error fetching services:', e);
    }
  };

  const toggleServiceSelection = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        // Remove service and its options
        const newOptions = { ...selectedOptions };
        delete newOptions[serviceId];
        setSelectedOptions(newOptions);
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const toggleOptionSelection = (serviceId, optionName) => {
    setSelectedOptions(prev => {
      const serviceOptions = prev[serviceId] || [];
      if (serviceOptions.includes(optionName)) {
        return {
          ...prev,
          [serviceId]: serviceOptions.filter(name => name !== optionName)
        };
      } else {
        return {
          ...prev,
          [serviceId]: [...serviceOptions, optionName]
        };
      }
    });
  };

  const handleOpenQuoteDialog = () => {
    if (selectedServices.length === 0) {
      toast.error('Veuillez sélectionner au moins une prestation');
      return;
    }
    setQuoteDialogOpen(true);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Build the quote request payload
    const selectedServicesData = selectedServices.map(serviceId => {
      const service = services.find(s => s.service_id === serviceId);
      return {
        service_id: serviceId,
        title: service.title,
        options: selectedOptions[serviceId] || []
      };
    });

    const payload = {
      provider_id: provider.provider_id,
      services: selectedServicesData,
      event_date: quoteForm.event_date,
      event_location: quoteForm.event_location,
      event_type: quoteForm.event_type,
      message: quoteForm.message
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Demande de devis envoyée !');
        setQuoteDialogOpen(false);
        setExpanded(false);
        setSelectedServices([]);
        setSelectedOptions({});
        setQuoteForm({ event_date: '', event_location: '', event_type: '', message: '' });
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  const isAuth = !!user;
  const displayedServices = showAllServices ? services : services.slice(0, 3);

  if (expanded) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4" onClick={() => setExpanded(false)}>
        <div className="max-w-4xl mx-auto bg-white rounded-sm p-8 my-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-heading font-semibold">{provider.business_name}</h2>
                {provider.verified && (
                  <Badge className="bg-accent text-accent-foreground">
                    <BadgeCheck className="h-3 w-3 mr-1" />Vérifié
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Badge variant="secondary">{provider.category}</Badge>
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{provider.location}</span>
                {provider.rating > 0 && (
                  <span className="flex items-center">
                    <Star className="h-4 w-4 fill-accent text-accent mr-1" />
                    {provider.rating} ({provider.total_reviews})
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-6 w-6" />
            </button>
          </div>

          {!isAuth && (
            <div className="mb-6 p-6 bg-secondary/20 rounded-sm border-2 border-accent/20 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Pour demander un devis</h3>
              <p className="text-muted-foreground mb-4">Créez un compte gratuit ou connectez-vous</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary text-primary-foreground rounded-full">
                  Créer un compte
                </button>
                <button onClick={() => navigate('/login')} className="px-6 py-2 border-2 border-primary text-primary rounded-full">
                  Se connecter
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {provider.portfolio_images && provider.portfolio_images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {provider.portfolio_images.slice(0, 4).map((img, idx) => (
                  <img key={idx} src={img} alt="" className="w-full h-48 object-cover rounded-sm" />
                ))}
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
            </div>

            {/* Prestations avec sélection */}
            {services.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Sélectionnez vos prestations
                  </h3>
                  {isAuth && selectedServices.length > 0 && (
                    <Badge className="bg-accent text-accent-foreground">
                      {selectedServices.length} sélectionnée{selectedServices.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  {displayedServices.map((service) => {
                    const isSelected = selectedServices.includes(service.service_id);
                    return (
                      <div 
                        key={service.service_id} 
                        className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-accent bg-accent/5' 
                            : 'border-border hover:border-accent/50'
                        } ${!isAuth ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={() => isAuth && toggleServiceSelection(service.service_id)}
                        data-testid="provider-service-item"
                      >
                        <div className="flex items-start gap-3">
                          {isAuth && (
                            <div className="pt-1">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleServiceSelection(service.service_id)}
                                className="pointer-events-none"
                                data-testid={`service-checkbox-${service.service_id}`}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{service.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                            {service.duration && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Clock className="h-3 w-3" />
                                {service.duration === 'journee' ? 'Journée complète' : 
                                 service.duration === 'demi-journee' ? 'Demi-journée' :
                                 service.duration}
                              </span>
                            )}
                            
                            {/* Options */}
                            {service.options && service.options.length > 0 && isSelected && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-2">Options disponibles :</p>
                                <div className="flex flex-wrap gap-2">
                                  {service.options.map((opt, i) => {
                                    const optionSelected = (selectedOptions[service.service_id] || []).includes(opt.name);
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleOptionSelection(service.service_id, opt.name);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                                          optionSelected 
                                            ? 'bg-accent text-accent-foreground border-accent' 
                                            : 'bg-secondary/50 border-border hover:border-accent'
                                        }`}
                                        data-testid={`option-${service.service_id}-${i}`}
                                      >
                                        {optionSelected && <Check className="h-3 w-3 inline mr-1" />}
                                        {opt.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Show options preview when not selected */}
                            {service.options && service.options.length > 0 && !isSelected && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {service.options.map((opt, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {opt.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {services.length > 3 && (
                  <button 
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="mt-3 text-sm text-accent hover:text-accent/80 flex items-center gap-1 mx-auto"
                  >
                    {showAllServices ? (
                      <>Voir moins <ChevronUp className="h-4 w-4" /></>
                    ) : (
                      <>Voir les {services.length - 3} autres prestations <ChevronDown className="h-4 w-4" /></>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-3">Services proposés</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((s, i) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t">
              {isAuth ? (
                <div className="flex gap-3">
                  <Button 
                    onClick={handleOpenQuoteDialog} 
                    className="flex-1 py-6 text-lg rounded-full"
                    disabled={selectedServices.length === 0}
                    data-testid="request-quote-btn"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Demander un devis
                    {selectedServices.length > 0 && ` (${selectedServices.length})`}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/messages?provider=${provider.provider_id}`)} 
                    className="py-6 px-6 rounded-full"
                    data-testid="contact-provider-btn"
                  >
                    Contacter
                  </Button>
                </div>
              ) : (
                <button onClick={() => navigate('/login')} className="w-full py-4 bg-primary text-primary-foreground rounded-full text-lg">
                  🔒 Se connecter pour demander un devis
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quote Request Dialog */}
        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Demande de devis
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {/* Summary of selected services */}
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Prestations sélectionnées :</p>
                <ul className="space-y-1">
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.service_id === serviceId);
                    const options = selectedOptions[serviceId] || [];
                    return (
                      <li key={serviceId} className="text-sm">
                        <span className="font-medium">• {service?.title}</span>
                        {options.length > 0 && (
                          <span className="text-muted-foreground"> + {options.join(', ')}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <Label htmlFor="event_type">Type d'événement *</Label>
                <Input
                  id="event_type"
                  required
                  placeholder="Ex: Mariage, Anniversaire, Séminaire..."
                  value={quoteForm.event_type}
                  onChange={(e) => setQuoteForm({ ...quoteForm, event_type: e.target.value })}
                  data-testid="quote-event-type"
                />
              </div>

              <div>
                <Label htmlFor="event_date">Date souhaitée *</Label>
                <Input
                  id="event_date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={quoteForm.event_date}
                  onChange={(e) => setQuoteForm({ ...quoteForm, event_date: e.target.value })}
                  data-testid="quote-event-date"
                />
              </div>

              <div>
                <Label htmlFor="event_location">Lieu *</Label>
                <Input
                  id="event_location"
                  required
                  placeholder="Ville ou adresse"
                  value={quoteForm.event_location}
                  onChange={(e) => setQuoteForm({ ...quoteForm, event_location: e.target.value })}
                  data-testid="quote-event-location"
                />
              </div>

              <div>
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea
                  id="message"
                  rows={3}
                  placeholder="Précisions sur votre projet, vos attentes..."
                  value={quoteForm.message}
                  onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                  data-testid="quote-message"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting} data-testid="submit-quote-btn">
                  {submitting ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Envoi...
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la demande
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }} data-testid={`provider-card-${provider.provider_id}`}>
      <Card className="provider-card overflow-hidden border-border/50 hover:shadow-lg group">
        <div className="relative h-48 overflow-hidden bg-muted">
          {provider.portfolio_images && provider.portfolio_images.length > 0 ? (
            <img
              src={provider.portfolio_images[0]}
              alt={provider.business_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Aucune image</span>
            </div>
          )}
          {provider.verified && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-accent text-accent-foreground">
                <BadgeCheck className="h-3 w-3 mr-1" />Vérifié
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">{provider.category}</Badge>
            {provider.rating > 0 && (
              <span className="flex items-center text-sm">
                <Star className="h-3 w-3 fill-accent text-accent mr-1" />
                {provider.rating}
              </span>
            )}
          </div>
          <h3 className="font-heading font-semibold text-lg mb-1">{provider.business_name}</h3>
          <p className="text-sm text-muted-foreground flex items-center">
            <MapPin className="h-3 w-3 mr-1" />{provider.location}
          </p>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{provider.description}</p>
        </div>
      </Card>
    </div>
  );
};

export default ProviderCard;
