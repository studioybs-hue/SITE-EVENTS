import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, MapPin, Euro, User, Clock, 
  CheckCircle, XCircle, CreditCard, MessageCircle,
  ChevronDown, ChevronUp, FileText, AlertCircle
} from 'lucide-react';

const ClientBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState(null);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings?role=client`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        class: 'bg-amber-100 text-amber-700', 
        icon: Clock, 
        label: 'En attente',
        color: 'amber'
      },
      confirmed: { 
        class: 'bg-emerald-100 text-emerald-700', 
        icon: CheckCircle, 
        label: 'Confirmée',
        color: 'emerald'
      },
      cancelled: { 
        class: 'bg-gray-100 text-gray-500', 
        icon: XCircle, 
        label: 'Annulée',
        color: 'gray'
      },
      completed: { 
        class: 'bg-blue-100 text-blue-700', 
        icon: CheckCircle, 
        label: 'Terminée',
        color: 'blue'
      },
    };
    return configs[status] || configs.pending;
  };

  const getPaymentStatusConfig = (status, depositPaid, depositRequired) => {
    if (depositPaid >= depositRequired && depositRequired > 0) {
      return { class: 'bg-emerald-100 text-emerald-700', label: 'Acompte payé', icon: CheckCircle };
    }
    if (depositPaid > 0) {
      return { class: 'bg-amber-100 text-amber-700', label: 'Paiement partiel', icon: AlertCircle };
    }
    return { class: 'bg-rose-100 text-rose-700', label: 'Acompte à payer', icon: CreditCard };
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysUntilEvent = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Separate bookings
  const upcomingBookings = bookings.filter(b => 
    ['confirmed', 'pending'].includes(b.status) && getDaysUntilEvent(b.event_date) >= 0
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || getDaysUntilEvent(b.event_date) < 0
  );
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  const renderBookingCard = (booking) => {
    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(
      booking.payment_status, 
      booking.deposit_paid, 
      booking.deposit_required
    );
    const PaymentIcon = paymentConfig.icon;
    const daysUntil = getDaysUntilEvent(booking.event_date);
    const isExpanded = expandedBooking === booking.booking_id;
    const depositProgress = booking.deposit_required > 0 
      ? (booking.deposit_paid / booking.deposit_required) * 100 
      : 0;

    return (
      <div
        key={booking.booking_id}
        className={`border-2 rounded-lg overflow-hidden transition-all ${
          booking.status === 'confirmed' && daysUntil >= 0
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-border'
        }`}
        data-testid="booking-card"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${statusConfig.color}-100`}>
                <User className={`h-6 w-6 text-${statusConfig.color}-600`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{booking.provider_name}</h3>
                <p className="text-sm text-muted-foreground">{booking.event_type}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={statusConfig.class}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {daysUntil >= 0 && daysUntil <= 30 && booking.status === 'confirmed' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {daysUntil === 0 ? "Aujourd'hui !" : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>

          {/* Event details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDate(booking.event_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lieu</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {booking.event_location}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Montant total</p>
              <p className="font-semibold text-lg text-primary flex items-center gap-1">
                <Euro className="h-4 w-4" />
                {booking.total_amount}€
              </p>
            </div>
          </div>

          {/* Payment status for confirmed bookings */}
          {booking.status === 'confirmed' && booking.deposit_required > 0 && (
            <div className="p-4 bg-secondary/30 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={paymentConfig.class}>
                    <PaymentIcon className="h-3 w-3 mr-1" />
                    {paymentConfig.label}
                  </Badge>
                </div>
                <span className="text-sm">
                  {booking.deposit_paid}€ / {booking.deposit_required}€
                </span>
              </div>
              <Progress value={depositProgress} className="h-2" />
              {booking.deposit_paid < booking.deposit_required && (
                <Button 
                  className="w-full mt-3"
                  onClick={() => {/* Navigate to payment */}}
                  data-testid={`pay-deposit-${booking.booking_id}`}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer l'acompte ({booking.deposit_required - booking.deposit_paid}€)
                </Button>
              )}
            </div>
          )}

          {/* Services */}
          {booking.services && booking.services.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {booking.services.map((service, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {service.title}
                </Badge>
              ))}
            </div>
          )}

          {/* Expand/collapse */}
          <button
            onClick={() => setExpandedBooking(isExpanded ? null : booking.booking_id)}
            className="text-sm text-accent hover:underline flex items-center gap-1"
          >
            {isExpanded ? (
              <>Masquer les détails <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Voir les détails <ChevronDown className="h-4 w-4" /></>
            )}
          </button>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Référence : </span>
                <span className="font-mono">{booking.booking_id}</span>
              </div>
              {booking.services && booking.services.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Prestations : </span>
                  <ul className="mt-1 ml-4">
                    {booking.services.map((service, idx) => (
                      <li key={idx}>
                        • {service.title}
                        {service.options?.length > 0 && (
                          <span className="text-muted-foreground"> + {service.options.join(', ')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {booking.notes && (
                <div>
                  <span className="text-muted-foreground">Notes : </span>
                  {booking.notes}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Réservé le : </span>
                {new Date(booking.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {booking.status === 'confirmed' && (
          <div className="px-5 py-3 bg-secondary/20 border-t border-border flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/messages?provider=${booking.provider_id}`)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Contacter
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold">Réservations à venir</h2>
              <p className="text-sm text-muted-foreground">
                {upcomingBookings.length} réservation{upcomingBookings.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {upcomingBookings.map(renderBookingCard)}
          </div>
        </Card>
      )}

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Réservations passées
          </h3>
          <div className="space-y-3">
            {pastBookings.map(renderBookingCard)}
          </div>
        </Card>
      )}

      {/* Cancelled */}
      {cancelledBookings.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-muted-foreground">Annulées</h3>
          <div className="space-y-3">
            {cancelledBookings.map(renderBookingCard)}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {bookings.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune réservation</h3>
          <p className="text-muted-foreground mb-6">
            Demandez un devis à un prestataire pour créer votre première réservation
          </p>
          <Button onClick={() => navigate('/search')}>
            Trouver un prestataire
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ClientBookings;
