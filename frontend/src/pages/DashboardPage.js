import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import RecentMessages from '@/components/RecentMessages';
import ServiceManager from '@/components/ServiceManager';
import QuoteManager from '@/components/QuoteManager';
import ClientQuotes from '@/components/ClientQuotes';
import ClientBookings from '@/components/ClientBookings';
import { StatusBadge, ActionCard, NotificationDot } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Euro, MapPin, User, Building, MessageCircle, 
  Star, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  Settings, Edit, Reply, CalendarCheck, Lock, Search, Package
} from 'lucide-react';
import { toast } from 'sonner';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [profileData, setProfileData] = useState({
    business_name: '',
    category: '',
    description: '',
    location: '',
    services: '',
    pricing_range: '',
    phone: '',
  });

  const categories = [
    'DJ', 'Photographe', 'Vidéaste', 'Traiteur', 'Décorateur',
    'Wedding Planner', 'Fleuriste', 'Animateur', 'Loueur de matériel'
  ];

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user
      const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const userData = await userRes.json();
      setUser(userData);

      // Fetch bookings based on user type
      const bookingsRes = await fetch(
        `${BACKEND_URL}/api/bookings?role=${userData.user_type === 'provider' ? 'provider' : 'client'}`,
        { credentials: 'include' }
      );
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      // If provider, fetch profile
      if (userData.user_type === 'provider') {
        try {
          const profileRes = await fetch(`${BACKEND_URL}/api/providers/user/${userData.user_id}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setProviderProfile(profileData);
          }
        } catch (error) {
          // No provider profile yet
        }
      }
      
      // Fetch unread messages count
      try {
        const messagesRes = await fetch(`${BACKEND_URL}/api/messages/recent`, {
          credentials: 'include',
        });
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setUnreadMessages(messagesData.unread_count || 0);
        }
      } catch (error) {
        // Ignore error
      }
      
      // Fetch pending quotes count for provider
      if (userData.user_type === 'provider') {
        try {
          const quotesRes = await fetch(`${BACKEND_URL}/api/quotes/received`, {
            credentials: 'include',
          });
          if (quotesRes.ok) {
            const quotesData = await quotesRes.json();
            setPendingQuotes(quotesData.filter(q => q.status === 'pending').length);
          }
        } catch (error) {
          // Ignore error
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profileData,
          services: profileData.services.split(',').map(s => s.trim()),
          portfolio_images: [],
          portfolio_videos: [],
        }),
      });

      if (response.ok) {
        toast.success('Profil prestataire créé avec succès !');
        setCreateProfileOpen(false);
        fetchData();
      } else {
        toast.error('Échec de la création du profil');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Erreur lors de la création du profil');
    }
  };

  const handleBecomeProvider = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/profile?user_type=provider`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setCreateProfileOpen(true);
    } catch (error) {
      console.error('Error updating user type:', error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Réservation ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'}`);
        fetchData();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      confirmed: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Confirmé' },
      pending: { class: 'bg-amber-100 text-amber-700', icon: Clock, label: 'En attente' },
      cancelled: { class: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Annulé' },
      completed: { class: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Terminé' },
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

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  // Stats calculations
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

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

  const isProvider = user?.user_type === 'provider' && providerProfile;

  return (
    <ProtectedRoute>
      {(userData) => (
        <Fragment>
        <div className="min-h-screen bg-background pb-20 md:pb-0">
          <Navbar user={userData || user} onLogout={handleLogout} />

          <div className="px-6 md:px-12 lg:px-24 py-12">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-foreground mb-2" data-testid="dashboard-title">
                    {isProvider ? 'Espace Prestataire' : 'Mon Espace'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">
                      Bienvenue, {userData?.name || user?.name}
                    </span>
                    {isProvider && (
                      <Badge variant="secondary">{providerProfile.category}</Badge>
                    )}
                    {/* Status badges */}
                    {unreadMessages > 0 && (
                      <StatusBadge 
                        type="new_message" 
                        count={unreadMessages} 
                        size="small"
                        onClick={() => navigate('/messages')}
                      />
                    )}
                    {pendingQuotes > 0 && isProvider && (
                      <StatusBadge 
                        type="action_required" 
                        count={pendingQuotes}
                        size="small"
                      />
                    )}
                  </div>
                </div>
                <div className="hidden md:flex gap-2">
                  {!isProvider && userData?.user_type === 'client' && (
                    <Button
                      onClick={handleBecomeProvider}
                      className="rounded-full"
                      data-testid="become-provider-btn"
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Devenir prestataire
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/messages')}
                    className="rounded-full relative"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                    {unreadMessages > 0 && (
                      <NotificationDot count={unreadMessages} />
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats Cards - Mobile optimized */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                <Card className="p-4 md:p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(isProvider ? 'quotes' : 'quotes')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-1">En attente</p>
                      <p className="text-xl md:text-2xl font-semibold text-amber-600" data-testid="pending-count">
                        {pendingBookings}
                      </p>
                    </div>
                    <div className="relative">
                      <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-amber-500/30" />
                      {pendingBookings > 0 && <NotificationDot />}
                    </div>
                  </div>
                  {pendingBookings > 0 && (
                    <p className="text-[10px] text-amber-600 mt-2 font-medium">Action requise →</p>
                  )}
                </Card>
                <Card className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Confirmées</p>
                      <p className="text-xl md:text-2xl font-semibold text-emerald-600" data-testid="confirmed-count">
                        {confirmedBookings}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-emerald-500/30" />
                  </div>
                </Card>
                {isProvider && (
                  <>
                    <Card className="p-4 md:p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Note</p>
                          <p className="text-xl md:text-2xl font-semibold" data-testid="rating">
                            {providerProfile.rating.toFixed(1)} <span className="text-accent">★</span>
                          </p>
                        </div>
                        <Star className="h-6 w-6 md:h-8 md:w-8 text-accent/30" />
                      </div>
                    </Card>
                    <Card className="p-4 md:p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Revenus</p>
                          <p className="text-xl md:text-2xl font-semibold text-primary" data-testid="revenue">
                            {totalRevenue}€
                          </p>
                        </div>
                        <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary/30" />
                      </div>
                    </Card>
                  </>
                )}
                {!isProvider && (
                  <Card className="p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-xl md:text-2xl font-semibold" data-testid="total-bookings">
                          {bookings.length}
                        </p>
                      </div>
                      <Calendar className="h-6 w-6 md:h-8 md:w-8 text-accent/30" />
                    </div>
                  </Card>
                )}
              </div>

              {/* Quick Actions - Mobile only */}
              <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2 -mx-2 px-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="whitespace-nowrap rounded-full"
                  onClick={() => navigate('/messages')}
                >
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  Chat
                  {unreadMessages > 0 && (
                    <Badge className="ml-1.5 bg-red-500 text-white h-5 px-1.5">{unreadMessages}</Badge>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="whitespace-nowrap rounded-full"
                  onClick={() => navigate('/search')}
                >
                  <Search className="h-4 w-4 mr-1.5" />
                  Prestataires
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="whitespace-nowrap rounded-full"
                  onClick={() => navigate('/packages')}
                >
                  <Package className="h-4 w-4 mr-1.5" />
                  Packs
                </Button>
              </div>
              </div>

              {/* Main Content - Provider View */}
              {isProvider ? (
                <Tabs defaultValue="calendar" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="calendar" data-testid="tab-calendar">Planning</TabsTrigger>
                    <TabsTrigger value="quotes" data-testid="tab-quotes">Devis</TabsTrigger>
                    <TabsTrigger value="services" data-testid="tab-services">Prestations</TabsTrigger>
                    <TabsTrigger value="bookings" data-testid="tab-provider-bookings">Réservations</TabsTrigger>
                  </TabsList>

                  {/* Calendar Tab */}
                  <TabsContent value="calendar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Calendar */}
                      <div className="lg:col-span-2">
                        <AvailabilityCalendar 
                          providerId={providerProfile.provider_id} 
                          bookings={bookings}
                        />
                      </div>

                      {/* Right: Bookings & Profile */}
                      <div className="space-y-6">
                        {/* Pending Bookings */}
                        <Card className="p-5">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Demandes en attente
                          </h3>
                          {bookings.filter(b => b.status === 'pending').length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune demande</p>
                          ) : (
                            <div className="space-y-3">
                              {bookings.filter(b => b.status === 'pending').slice(0, 3).map((booking) => (
                                <div key={booking.booking_id} className="p-3 bg-secondary/30 rounded-lg">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium text-sm">{booking.event_type}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(booking.event_date).toLocaleDateString('fr-FR')}
                                      </p>
                                    </div>
                                    <p className="text-sm font-semibold">{booking.total_amount}€</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      className="flex-1 h-8"
                                      onClick={() => handleUpdateBookingStatus(booking.booking_id, 'confirmed')}
                                      data-testid={`confirm-booking-${booking.booking_id}`}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Accepter
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 h-8"
                                      onClick={() => handleUpdateBookingStatus(booking.booking_id, 'cancelled')}
                                      data-testid={`reject-booking-${booking.booking_id}`}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Refuser
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>

                        {/* Recent Messages */}
                        <RecentMessages />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Quotes Tab */}
                  <TabsContent value="quotes">
                    <QuoteManager />
                  </TabsContent>

                  {/* Services Tab */}
                  <TabsContent value="services">
                    <ServiceManager providerId={providerProfile.provider_id} />
                  </TabsContent>

                  {/* Provider Bookings Tab */}
                  <TabsContent value="bookings">
                    <Card className="p-6">
                      <h2 className="text-2xl font-heading font-semibold mb-6">Toutes mes réservations</h2>
                      {bookings.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground">Aucune réservation pour le moment</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.map((booking) => (
                            <div
                              key={booking.booking_id}
                              className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg">{booking.event_type}</h3>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                                    <span className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {new Date(booking.event_date).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {booking.event_location}
                                    </span>
                                    <span className="flex items-center font-semibold text-primary">
                                      <Euro className="h-4 w-4 mr-1" />
                                      {booking.total_amount}€
                                    </span>
                                  </div>
                                </div>
                                {booking.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm"
                                      onClick={() => handleUpdateBookingStatus(booking.booking_id, 'confirmed')}
                                    >
                                      Accepter
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleUpdateBookingStatus(booking.booking_id, 'cancelled')}
                                    >
                                      Refuser
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                /* Client View */
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="overview" data-testid="tab-overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="quotes" data-testid="tab-client-quotes">Mes devis</TabsTrigger>
                    <TabsTrigger value="bookings" data-testid="tab-bookings">Mes réservations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recent Bookings */}
                      <Card className="p-6">
                        <h2 className="text-xl font-heading font-semibold mb-4">Réservations récentes</h2>
                        {bookings.length === 0 ? (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground mb-4">Aucune réservation</p>
                            <Button onClick={() => navigate('/search')} variant="outline">
                              Trouver un prestataire
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bookings.slice(0, 4).map((booking) => (
                              <div
                                key={booking.booking_id}
                                className="p-3 border border-border rounded-lg hover:shadow-sm transition-shadow"
                                data-testid="booking-item"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{booking.event_type}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(booking.event_date).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                  {getStatusBadge(booking.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>

                      {/* Quick Actions */}
                      <Card className="p-6">
                        <h2 className="text-xl font-heading font-semibold mb-4">Actions rapides</h2>
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            variant="outline" 
                            className="h-auto py-4 flex-col"
                            onClick={() => navigate('/search')}
                          >
                            <User className="h-6 w-6 mb-2" />
                            <span>Prestataires</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-auto py-4 flex-col"
                            onClick={() => navigate('/packages')}
                          >
                            <Star className="h-6 w-6 mb-2" />
                            <span>Packs</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-auto py-4 flex-col"
                            onClick={() => navigate('/messages')}
                          >
                            <MessageCircle className="h-6 w-6 mb-2" />
                            <span>Messages</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-auto py-4 flex-col"
                            onClick={() => navigate('/marketplace')}
                          >
                            <Building className="h-6 w-6 mb-2" />
                            <span>Marketplace</span>
                          </Button>
                        </div>
                      </Card>

                      {/* Recent Messages for Client */}
                      <div className="md:col-span-2">
                        <RecentMessages />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Client Quotes Tab */}
                  <TabsContent value="quotes">
                    <ClientQuotes />
                  </TabsContent>

                  <TabsContent value="bookings">
                    <ClientBookings />
                  </TabsContent>
                </Tabs>
              )}

              {/* Create Provider Profile Dialog */}
              <Dialog open={createProfileOpen} onOpenChange={setCreateProfileOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer mon profil prestataire</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateProfile} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                      <Label>Nom commercial *</Label>
                      <Input
                        required
                        value={profileData.business_name}
                        onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                        data-testid="business-name-input"
                      />
                    </div>
                    <div>
                      <Label>Catégorie *</Label>
                      <Select
                        value={profileData.category}
                        onValueChange={(value) => setProfileData({ ...profileData, category: value })}
                      >
                        <SelectTrigger data-testid="category-select">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        required
                        value={profileData.description}
                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                        rows={4}
                        data-testid="description-input"
                      />
                    </div>
                    <div>
                      <Label>Localisation *</Label>
                      <Input
                        required
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        data-testid="location-input"
                      />
                    </div>
                    <div>
                      <Label>Services (séparés par des virgules) *</Label>
                      <Input
                        required
                        placeholder="Photographie de mariage, Portraits, Évènements"
                        value={profileData.services}
                        onChange={(e) => setProfileData({ ...profileData, services: e.target.value })}
                        data-testid="services-input"
                      />
                    </div>
                    <div>
                      <Label>Tarifs *</Label>
                      <Input
                        required
                        placeholder="€500-€2000"
                        value={profileData.pricing_range}
                        onChange={(e) => setProfileData({ ...profileData, pricing_range: e.target.value })}
                        data-testid="pricing-input"
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        data-testid="phone-input"
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="submit-profile-btn">
                      Créer mon profil
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <MobileNav 
          user={userData || user} 
          unreadMessages={unreadMessages}
          pendingActions={pendingBookings + pendingQuotes}
        />
        </Fragment>
      )}
    </ProtectedRoute>
  );
};

export default DashboardPage;
