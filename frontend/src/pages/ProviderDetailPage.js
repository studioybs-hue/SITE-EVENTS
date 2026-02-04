import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Star, Phone, BadgeCheck, MessageSquare, Calendar, Euro } from 'lucide-react';
import { toast } from 'sonner';

const ProviderDetailPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [bookingData, setBookingData] = React.useState({
    event_type: '',
    event_date: '',
    event_location: '',
    total_amount: '',
    notes: '',
  });

  React.useEffect(() => {
    checkAuth();
    fetchProvider();
    fetchReviews();
  }, [providerId]);

  const checkAuth = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      // Not authenticated
    }
  };

  const fetchProvider = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/providers/${providerId}`);
      const data = await response.json();
      setProvider(data);
    } catch (error) {
      console.error('Error fetching provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/reviews/${providerId}`);
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider_id: providerId,
          event_type: bookingData.event_type,
          event_date: bookingData.event_date,
          event_location: bookingData.event_location,
          total_amount: parseFloat(bookingData.total_amount),
          notes: bookingData.notes,
        }),
      });

      if (response.ok) {
        toast.success('Réservation créée avec succès !');
        setBookingOpen(false);
        navigate('/dashboard');
      } else {
        toast.error('Échec de la réservation');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Erreur lors de la réservation');
    }
  };

  const handleMessage = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages?user=${provider.user_id}`);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="text-center py-24">
          <p className="text-muted-foreground">Prestataire non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-heading font-medium text-foreground" data-testid="provider-name">
                    {provider.business_name}
                  </h1>
                  {provider.verified && (
                    <Badge className="bg-accent text-accent-foreground" data-testid="verified-badge">
                      <BadgeCheck className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <Badge variant="secondary" data-testid="provider-category">{provider.category}</Badge>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span data-testid="provider-location">{provider.location}</span>
                  </div>
                  {provider.rating > 0 && (
                    <div className="flex items-center" data-testid="provider-rating">
                      <Star className="h-4 w-4 fill-accent text-accent mr-1" />
                      <span className="font-medium">{provider.rating}</span>
                      <span className="ml-1">({provider.total_reviews} avis)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Portfolio Images */}
              {provider.portfolio_images && provider.portfolio_images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {provider.portfolio_images.slice(0, 4).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-64 object-cover rounded-sm"
                      data-testid={`portfolio-image-${index}`}
                    />
                  ))}
                </div>
              )}

              {/* Description */}
              <Card className="p-6">
                <h2 className="text-2xl font-heading font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="provider-description">
                  {provider.description}
                </p>
              </Card>

              {/* Services */}
              <Card className="p-6">
                <h2 className="text-2xl font-heading font-semibold mb-4">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((service, index) => (
                    <Badge key={index} variant="secondary" data-testid={`service-${index}`}>
                      {service}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Reviews */}
              <Card className="p-6">
                <h2 className="text-2xl font-heading font-semibold mb-6">Avis clients</h2>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground" data-testid="no-reviews">Aucun avis pour le moment</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.review_id} className="border-b border-border pb-4 last:border-0" data-testid="review-item">
                        <div className="flex items-center space-x-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-accent text-accent'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6 sticky top-24">
                <div className="space-y-6">
                  {/* Pricing */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tarifs</p>
                    <div className="flex items-center text-2xl font-semibold text-foreground">
                      <Euro className="h-6 w-6 mr-1 text-accent" />
                      <span data-testid="provider-pricing">{provider.pricing_range}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  {provider.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Téléphone</p>
                      <div className="flex items-center text-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <span data-testid="provider-phone">{provider.phone}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground"
                          data-testid="booking-btn"
                        >
                          <Calendar className="h-5 w-5 mr-2" />
                          Réserver
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Demande de réservation</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleBooking} className="space-y-4">
                          <div>
                            <Label>Type d'évènement</Label>
                            <Input
                              required
                              placeholder="Mariage, anniversaire..."
                              value={bookingData.event_type}
                              onChange={(e) => setBookingData({ ...bookingData, event_type: e.target.value })}
                              data-testid="event-type-input"
                            />
                          </div>
                          <div>
                            <Label>Date de l'évènement</Label>
                            <Input
                              required
                              type="date"
                              value={bookingData.event_date}
                              onChange={(e) => setBookingData({ ...bookingData, event_date: e.target.value })}
                              data-testid="event-date-input"
                            />
                          </div>
                          <div>
                            <Label>Lieu</Label>
                            <Input
                              required
                              placeholder="Adresse de l'évènement"
                              value={bookingData.event_location}
                              onChange={(e) => setBookingData({ ...bookingData, event_location: e.target.value })}
                              data-testid="event-location-input"
                            />
                          </div>
                          <div>
                            <Label>Montant total (€)</Label>
                            <Input
                              required
                              type="number"
                              placeholder="1000"
                              value={bookingData.total_amount}
                              onChange={(e) => setBookingData({ ...bookingData, total_amount: e.target.value })}
                              data-testid="event-amount-input"
                            />
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Textarea
                              placeholder="Détails supplémentaires..."
                              value={bookingData.notes}
                              onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                              data-testid="event-notes-input"
                            />
                          </div>
                          <Button type="submit" className="w-full" data-testid="submit-booking-btn">
                            Envoyer la demande
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={handleMessage}
                      variant="outline"
                      className="w-full h-12 rounded-full"
                      data-testid="message-btn"
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Envoyer un message
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailPage;