import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Calendar, MapPin, Euro, User, Clock, 
  CheckCircle, XCircle, CreditCard, MessageCircle,
  ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const ClientBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentOption, setPaymentOption] = useState('full');
  const [processingPayment, setProcessingPayment] = useState(false);
  
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

  const openPaymentDialog = (booking) => {
    setSelectedBooking(booking);
    setPaymentOption('full');
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedBooking) return;
    
    setProcessingPayment(true);
    
    const remaining = selectedBooking.total_amount - (selectedBooking.deposit_paid || 0);
    
    // Determine payment type and amounts
    let paymentType = 'full';
    let totalInstallments = 1;
    let installmentNumber = 1;
    
    if (paymentOption === '2x') {
      paymentType = 'installment';
      totalInstallments = 2;
      // Check how many payments already made
      const paidInstallments = Math.floor((selectedBooking.deposit_paid || 0) / (selectedBooking.total_amount / 2));
      installmentNumber = paidInstallments + 1;
    } else if (paymentOption === '3x') {
      paymentType = 'installment';
      totalInstallments = 3;
      const paidInstallments = Math.floor((selectedBooking.deposit_paid || 0) / (selectedBooking.total_amount / 3));
      installmentNumber = paidInstallments + 1;
    } else if (paymentOption === 'deposit') {
      paymentType = 'deposit';
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          booking_id: selectedBooking.booking_id,
          payment_type: paymentType,
          installment_number: installmentNumber,
          total_installments: totalInstallments,
          origin_url: window.location.origin
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Erreur lors de la création du paiement');
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erreur lors de la création du paiement');
      setProcessingPayment(false);
    }
  };

  const calculatePaymentAmount = (booking, option) => {
    const remaining = booking.total_amount - (booking.deposit_paid || 0);
    
    switch (option) {
      case 'full':
        return remaining;
      case 'deposit':
        return Math.min(booking.deposit_required - (booking.deposit_paid || 0), remaining);
      case '2x':
        return remaining / 2;
      case '3x':
        return remaining / 3;
      default:
        return remaining;
    }
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
    const totalProgress = booking.total_amount > 0
      ? ((booking.deposit_paid || 0) / booking.total_amount) * 100
      : 0;
    const remaining = booking.total_amount - (booking.deposit_paid || 0);

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
          {booking.status === 'confirmed' && remaining > 0 && (
            <div className="p-4 bg-secondary/30 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={paymentConfig.class}>
                    <PaymentIcon className="h-3 w-3 mr-1" />
                    {paymentConfig.label}
                  </Badge>
                </div>
                <span className="text-sm font-medium">
                  {booking.deposit_paid || 0}€ / {booking.total_amount}€
                </span>
              </div>
              <Progress value={totalProgress} className="h-2 mb-3" />
              <p className="text-xs text-muted-foreground mb-3">
                Reste à payer : <span className="font-semibold text-foreground">{remaining.toFixed(2)}€</span>
              </p>
              <Button 
                className="w-full"
                onClick={() => openPaymentDialog(booking)}
                data-testid={`pay-btn-${booking.booking_id}`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payer maintenant
              </Button>
            </div>
          )}

          {/* Payment complete */}
          {booking.status === 'confirmed' && remaining <= 0 && (
            <div className="p-4 bg-emerald-50 rounded-lg mb-4 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Paiement complet</span>
              </div>
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

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Choisir le mode de paiement
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking summary */}
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="font-medium">{selectedBooking.provider_name}</p>
                <p className="text-sm text-muted-foreground">{selectedBooking.event_type}</p>
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span>Total</span>
                    <span className="font-semibold">{selectedBooking.total_amount}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Déjà payé</span>
                    <span>{selectedBooking.deposit_paid || 0}€</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-primary mt-1">
                    <span>Reste à payer</span>
                    <span>{(selectedBooking.total_amount - (selectedBooking.deposit_paid || 0)).toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Payment options */}
              <RadioGroup value={paymentOption} onValueChange={setPaymentOption}>
                <div className="space-y-3">
                  {/* Full payment */}
                  <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentOption === 'full' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                  }`} onClick={() => setPaymentOption('full')}>
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Payer en 1 fois</p>
                          <p className="text-xs text-muted-foreground">Paiement intégral</p>
                        </div>
                        <span className="font-semibold text-lg">
                          {calculatePaymentAmount(selectedBooking, 'full').toFixed(2)}€
                        </span>
                      </div>
                    </Label>
                  </div>

                  {/* 2x payment */}
                  <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentOption === '2x' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                  }`} onClick={() => setPaymentOption('2x')}>
                    <RadioGroupItem value="2x" id="2x" />
                    <Label htmlFor="2x" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Payer en 2 fois</p>
                          <p className="text-xs text-muted-foreground">50% maintenant, 50% plus tard</p>
                        </div>
                        <span className="font-semibold text-lg">
                          {calculatePaymentAmount(selectedBooking, '2x').toFixed(2)}€
                        </span>
                      </div>
                    </Label>
                  </div>

                  {/* 3x payment */}
                  <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentOption === '3x' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                  }`} onClick={() => setPaymentOption('3x')}>
                    <RadioGroupItem value="3x" id="3x" />
                    <Label htmlFor="3x" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Payer en 3 fois</p>
                          <p className="text-xs text-muted-foreground">~33% par versement</p>
                        </div>
                        <span className="font-semibold text-lg">
                          {calculatePaymentAmount(selectedBooking, '3x').toFixed(2)}€
                        </span>
                      </div>
                    </Label>
                  </div>

                  {/* Deposit only (if not fully paid) */}
                  {(selectedBooking.deposit_paid || 0) < selectedBooking.deposit_required && (
                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentOption === 'deposit' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                    }`} onClick={() => setPaymentOption('deposit')}>
                      <RadioGroupItem value="deposit" id="deposit" />
                      <Label htmlFor="deposit" className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Acompte uniquement</p>
                            <p className="text-xs text-muted-foreground">30% pour confirmer</p>
                          </div>
                          <span className="font-semibold text-lg">
                            {calculatePaymentAmount(selectedBooking, 'deposit').toFixed(2)}€
                          </span>
                        </div>
                      </Label>
                    </div>
                  )}
                </div>
              </RadioGroup>

              {/* Pay button */}
              <Button 
                className="w-full h-12 text-base"
                onClick={handlePayment}
                disabled={processingPayment}
                data-testid="confirm-payment-btn"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirection vers le paiement...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payer {calculatePaymentAmount(selectedBooking, paymentOption).toFixed(2)}€
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Paiement sécurisé par Stripe. Vous serez redirigé vers une page de paiement sécurisée.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientBookings;
