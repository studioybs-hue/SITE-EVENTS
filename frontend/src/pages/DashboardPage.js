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
import MyEquipmentManager from '@/components/MyEquipmentManager';
import FavoritesManager from '@/components/FavoritesManager';
import MyMarketplaceOffers from '@/components/MyMarketplaceOffers';
import CountryMultiSelect from '@/components/CountryMultiSelect';
import CountryPresenceManager from '@/components/CountryPresenceManager';
import CapacitySettings from '@/components/CapacitySettings';
import PortfolioManager from '@/components/PortfolioManager';
import ProfileImageUploader from '@/components/ProfileImageUploader';
import ProviderPacksManager from '@/components/ProviderPacksManager';
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
  Settings, Edit, Reply, CalendarCheck, Lock, Search, Package, ShoppingBag, Heart, Video, Gift, CreditCard, Crown, ArrowRight
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
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [categories, setCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [profileData, setProfileData] = useState({
    business_name: '',
    category: '',
    description: '',
    location: '',
    countries: ['FR'],
    services: '',
    pricing_range: '',
    phone: '',
  });
  
  // My Events (provider)
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsLoading, setMyEventsLoading] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', event_date: '', event_time: '',
    location: '', address: '', image_url: '', ticket_link: '', price_info: ''
  });
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    payment_method: 'stripe', // 'stripe' or 'paypal'
    stripe_account_id: '',
    paypal_email: '',
    bank_iban: '',
    bank_bic: '',
    bank_holder_name: ''
  });
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories for both modes and combine them
      const [eventsRes, proRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/categories/events`),
        fetch(`${BACKEND_URL}/api/categories/pro`)
      ]);
      
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      const proData = proRes.ok ? await proRes.json() : [];
      
      // Combine and dedupe, keeping "Autre" at the end
      const allCategories = [...eventsData, ...proData];
      const uniqueCategories = allCategories
        .filter((cat, index, self) => 
          cat.id !== 'other' && self.findIndex(c => c.name === cat.name) === index
        )
        .map(cat => cat.name);
      
      // Add "Autre" at the end
      uniqueCategories.push('Autre');
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories(['Photographe', 'Vidéaste', 'DJ / Musique', 'Traiteur', 'Autre']);
    }
  };

  const submitCategorySuggestion = async () => {
    if (!customCategory.trim()) {
      toast.error('Veuillez entrer un nom de métier');
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/category-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          suggestion: customCategory.trim(),
          mode: 'events', // Default to events, admin will categorize
          provider_id: user?.user_id,
          provider_email: user?.email
        })
      });
      
      if (res.ok) {
        toast.success('Votre suggestion de métier a été envoyée à l\'administrateur !');
        setProfileData({ ...profileData, category: customCategory.trim() });
        setCustomCategory('');
      } else {
        toast.error('Erreur lors de l\'envoi de la suggestion');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

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
        
        // Fetch subscription info
        try {
          const subRes = await fetch(`${BACKEND_URL}/api/subscriptions/my-subscription`, {
            credentials: 'include',
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            setSubscription(subData.subscription);
            setSubscriptionPlan(subData.plan);
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
      const res = await fetch(`${BACKEND_URL}/api/auth/profile?user_type=provider`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        // Update local user state
        setUser({ ...user, user_type: 'provider' });
        setCreateProfileOpen(true);
      }
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

  // My Events Functions
  const fetchMyEvents = async () => {
    try {
      setMyEventsLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/events/my/events`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMyEvents(data);
      }
    } catch (e) {
      console.error('Error fetching my events:', e);
    } finally {
      setMyEventsLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.event_date || !newEvent.location) {
      toast.error('Remplissez les champs obligatoires (titre, date, lieu)');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        toast.success('Événement créé !');
        setShowCreateEvent(false);
        setNewEvent({ title: '', description: '', event_date: '', event_time: '', location: '', address: '', image_url: '', ticket_link: '', price_info: '' });
        fetchMyEvents();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (e) {
      toast.error('Erreur de connexion');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Événement supprimé');
        fetchMyEvents();
      }
    } catch (e) {
      toast.error('Erreur');
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
  const needsProviderProfile = user?.user_type === 'provider' && !providerProfile;

  return (
    <ProtectedRoute>
      {(userData) => (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
          <Navbar user={userData || user} onLogout={handleLogout} />

          <div className="px-6 md:px-12 lg:px-24 py-12">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-foreground" data-testid="dashboard-title">
                      {isProvider || needsProviderProfile ? 'Espace Prestataire' : 'Mon Espace'}
                    </h1>
                    <Badge 
                      className={`h-7 px-3 text-sm ${
                        isProvider || needsProviderProfile
                          ? 'bg-slate-700 text-white hover:bg-slate-700' 
                          : 'bg-accent/10 text-accent hover:bg-accent/10'
                      }`}
                      data-testid="user-type-badge"
                    >
                      {isProvider || needsProviderProfile ? (
                        <><Building className="h-3.5 w-3.5 mr-1.5" /> PRO</>
                      ) : (
                        <><Heart className="h-3.5 w-3.5 mr-1.5" /> Client</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">
                      Bienvenue, {userData?.name || user?.name}
                    </span>
                    {isProvider && providerProfile && (
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

              {/* Provider Profile Creation Form */}
              {needsProviderProfile && (
                <Card className="p-8 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                      <Building className="h-8 w-8 text-accent" />
                    </div>
                    <h2 className="text-2xl font-heading font-semibold mb-2">
                      Créez votre profil professionnel
                    </h2>
                    <p className="text-muted-foreground">
                      Complétez ces informations pour commencer à recevoir des demandes
                    </p>
                    <Button
                      variant="link"
                      className="mt-2 text-muted-foreground"
                      onClick={async () => {
                        try {
                          await fetch(`${BACKEND_URL}/api/auth/profile?user_type=client`, {
                            method: 'PATCH',
                            credentials: 'include',
                          });
                          setUser({ ...user, user_type: 'client' });
                          toast.success('Vous êtes maintenant en mode client');
                        } catch (error) {
                          toast.error('Erreur');
                        }
                      }}
                    >
                      ← Je suis un client, pas un prestataire
                    </Button>
                  </div>

                  <form onSubmit={handleCreateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="business_name">Nom de votre entreprise *</Label>
                        <Input
                          id="business_name"
                          placeholder="Ex: Studio Photo Martin"
                          value={profileData.business_name}
                          onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Catégorie *</Label>
                        <Select
                          value={profileData.category}
                          onValueChange={(value) => {
                            if (value === 'Autre') {
                              setProfileData({ ...profileData, category: '' });
                            } else {
                              setProfileData({ ...profileData, category: value });
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionnez votre métier" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Custom category field when "Autre" is selected */}
                        {(profileData.category === '' || profileData.category === 'Autre' || !categories.includes(profileData.category)) && (
                          <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Label className="text-yellow-800">Proposer un nouveau métier</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={customCategory || profileData.category}
                                onChange={(e) => {
                                  setCustomCategory(e.target.value);
                                  setProfileData({ ...profileData, category: e.target.value });
                                }}
                                placeholder="Ex: Décorateur floral, Coach vocal..."
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={submitCategorySuggestion}
                                className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                              >
                                Suggérer
                              </Button>
                            </div>
                            <p className="text-xs text-yellow-600 mt-2">
                              Votre suggestion sera envoyée à l'administrateur pour validation.
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="location">Localisation *</Label>
                        <Input
                          id="location"
                          placeholder="Ex: Paris, Île-de-France"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="description">Description de votre activité *</Label>
                        <Textarea
                          id="description"
                          placeholder="Décrivez votre expérience, votre style, vos spécialités..."
                          value={profileData.description}
                          onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                          required
                          className="mt-1 min-h-[100px]"
                        />
                      </div>

                      <div>
                        <Label htmlFor="pricing_range">Fourchette de prix</Label>
                        <Input
                          id="pricing_range"
                          placeholder="Ex: 500€ - 2000€"
                          value={profileData.pricing_range}
                          onChange={(e) => setProfileData({ ...profileData, pricing_range: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Téléphone professionnel</Label>
                        <Input
                          id="phone"
                          placeholder="Ex: 06 12 34 56 78"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="services">Vos prestations (séparées par des virgules)</Label>
                        <Input
                          id="services"
                          placeholder="Ex: Mariage, Portrait, Événement corporate"
                          value={profileData.services}
                          onChange={(e) => setProfileData({ ...profileData, services: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-base">
                      <Building className="h-5 w-5 mr-2" />
                      Créer mon profil prestataire
                    </Button>
                  </form>
                </Card>
              )}

              {/* Main Content - Provider View */}
              {isProvider && (
                <Tabs defaultValue="calendar" className="space-y-6">
                  <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="calendar" data-testid="tab-calendar">Planning</TabsTrigger>
                    <TabsTrigger value="travels" data-testid="tab-travels" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Déplacements
                    </TabsTrigger>
                    <TabsTrigger value="quotes" data-testid="tab-quotes">Devis</TabsTrigger>
                    <TabsTrigger value="services" data-testid="tab-services">Prestations</TabsTrigger>
                    <TabsTrigger value="packs" data-testid="tab-packs" className="flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      Packs
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" data-testid="tab-portfolio" className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Portfolio
                    </TabsTrigger>
                    <TabsTrigger value="equipment" data-testid="tab-equipment" className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      Matériel
                    </TabsTrigger>
                    <TabsTrigger value="my-events" data-testid="tab-my-events" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Événements
                    </TabsTrigger>
                    <TabsTrigger value="bookings" data-testid="tab-provider-bookings">Réservations</TabsTrigger>
                    <TabsTrigger value="subscription" data-testid="tab-subscription" className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Abonnement
                    </TabsTrigger>
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

                  {/* Travels Tab */}
                  <TabsContent value="travels">
                    <div className="space-y-6">
                      {/* Profile Image */}
                      <Card className="p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Photo de profil
                        </h3>
                        <ProfileImageUploader 
                          currentImage={providerProfile?.profile_image}
                          onImageUpdate={(url) => setProviderProfile(prev => ({ ...prev, profile_image: url }))}
                        />
                      </Card>
                      
                      {/* Capacity Settings */}
                      <CapacitySettings 
                        providerId={providerProfile?.provider_id} 
                        initialValue={providerProfile?.max_bookings_per_day || 1}
                      />
                      
                      {/* Country Presence */}
                      <Card className="p-6">
                        <CountryPresenceManager />
                      </Card>
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

                  {/* Portfolio Tab */}
                  <TabsContent value="portfolio">
                    <PortfolioManager />
                  </TabsContent>

                  {/* Packs Tab */}
                  <TabsContent value="packs">
                    <ProviderPacksManager providerId={providerProfile.provider_id} />
                  </TabsContent>

                  {/* Equipment Tab */}
                  <TabsContent value="equipment">
                    <MyEquipmentManager />
                  </TabsContent>

                  {/* My Events Tab */}
                  <TabsContent value="my-events" onFocus={fetchMyEvents}>
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-heading font-semibold">Mes événements</h2>
                        <Button 
                          onClick={() => setShowCreateEvent(!showCreateEvent)}
                          className="bg-gradient-to-r from-pink-500 to-orange-500 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {showCreateEvent ? 'Annuler' : 'Créer un événement'}
                        </Button>
                      </div>

                      {/* Create Event Form */}
                      {showCreateEvent && (
                        <Card className="p-6 mb-6 border-2 border-dashed border-orange-300 bg-orange-50">
                          <h3 className="text-lg font-semibold mb-4">📅 Nouvel événement</h3>
                          <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <Label>Titre de l'événement *</Label>
                                <Input
                                  value={newEvent.title}
                                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                  placeholder="Concert Jazz, Soirée Networking..."
                                />
                              </div>
                              <div>
                                <Label>Date *</Label>
                                <Input
                                  type="date"
                                  value={newEvent.event_date}
                                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Heure</Label>
                                <Input
                                  type="time"
                                  value={newEvent.event_time}
                                  onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Lieu *</Label>
                                <Input
                                  value={newEvent.location}
                                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                  placeholder="La Friche Belle de Mai"
                                />
                              </div>
                              <div>
                                <Label>Adresse</Label>
                                <Input
                                  value={newEvent.address}
                                  onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
                                  placeholder="41 Rue Jobin, 13003 Marseille"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={newEvent.description}
                                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                  placeholder="Décrivez votre événement..."
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label>URL de l'image</Label>
                                <Input
                                  value={newEvent.image_url}
                                  onChange={(e) => setNewEvent({ ...newEvent, image_url: e.target.value })}
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <Label>Info prix</Label>
                                <Input
                                  value={newEvent.price_info}
                                  onChange={(e) => setNewEvent({ ...newEvent, price_info: e.target.value })}
                                  placeholder="Gratuit, 15€..."
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Lien billetterie / Plus d'infos</Label>
                                <Input
                                  value={newEvent.ticket_link}
                                  onChange={(e) => setNewEvent({ ...newEvent, ticket_link: e.target.value })}
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                            <Button type="submit" className="w-full">
                              Publier l'événement
                            </Button>
                          </form>
                        </Card>
                      )}

                      {/* Events List */}
                      {myEventsLoading ? (
                        <div className="text-center py-12">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : myEvents.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground mb-4">Vous n'avez pas encore publié d'événement</p>
                          <Button variant="outline" onClick={() => setShowCreateEvent(true)}>
                            Créer mon premier événement
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myEvents.map((event) => (
                            <Card key={event.event_id} className="p-4 hover:shadow-md transition-shadow">
                              <div className="flex gap-4">
                                {event.image_url && (
                                  <img 
                                    src={event.image_url} 
                                    alt={event.title}
                                    className="w-24 h-24 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{event.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    📅 {new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    {event.event_time && ` à ${event.event_time}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span>❤️ {event.likes_count || 0} likes</span>
                                    <span>💬 {event.comments_count || 0} commentaires</span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteEvent(event.event_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t text-center">
                        <Button variant="outline" onClick={() => window.open('/community-events', '_blank')}>
                          Voir tous les événements de la communauté →
                        </Button>
                      </div>
                    </Card>
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
                                  {booking.client_name && (
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                      <User className="h-4 w-4 mr-1" />
                                      Client: <span className="font-medium ml-1">{booking.client_name}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                  {/* Contact Client Button */}
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/messages?user=${booking.client_id}`)}
                                    data-testid={`contact-client-${booking.booking_id}`}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Contacter
                                  </Button>
                                  
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
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  {/* Subscription Tab */}
                  <TabsContent value="subscription">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-accent" />
                        Mon abonnement
                      </h3>
                      
                      {subscriptionPlan && (
                        <div className="space-y-6">
                          {/* Current Plan Card */}
                          <div className={`p-6 rounded-xl border-2 ${
                            subscriptionPlan.plan_id === 'premium' ? 'border-yellow-400 bg-yellow-50' :
                            subscriptionPlan.plan_id === 'pro' ? 'border-blue-400 bg-blue-50' :
                            'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                {subscriptionPlan.plan_id === 'premium' && <Crown className="h-6 w-6 text-yellow-500" />}
                                {subscriptionPlan.plan_id === 'pro' && <Star className="h-5 w-5 text-blue-500" />}
                                <div>
                                  <h4 className="text-xl font-bold">{subscriptionPlan.name}</h4>
                                  <p className="text-sm text-muted-foreground">{subscriptionPlan.description}</p>
                                </div>
                              </div>
                              <Badge className={
                                subscriptionPlan.plan_id === 'premium' ? 'bg-yellow-500' :
                                subscriptionPlan.plan_id === 'pro' ? 'bg-blue-500' : 'bg-gray-500'
                              }>
                                {subscription ? 'Actif' : 'Gratuit'}
                              </Badge>
                            </div>
                            
                            {subscription && (
                              <div className="text-sm text-muted-foreground mb-4">
                                <p>Cycle : {subscription.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}</p>
                                <p>Fin de période : {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}</p>
                                {subscription.cancel_at_period_end && (
                                  <p className="text-amber-600 mt-2">Annulation prévue en fin de période</p>
                                )}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="p-3 bg-white rounded-lg">
                                <p className="text-sm text-muted-foreground">Commission</p>
                                <p className="text-lg font-semibold">{(subscriptionPlan.limits?.commission_rate || 0.15) * 100}%</p>
                              </div>
                              <div className="p-3 bg-white rounded-lg">
                                <p className="text-sm text-muted-foreground">Réservations/mois</p>
                                <p className="text-lg font-semibold">
                                  {subscriptionPlan.limits?.max_bookings_per_month === -1 ? 'Illimité' : subscriptionPlan.limits?.max_bookings_per_month || 5}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Features List */}
                          <div>
                            <h5 className="font-medium mb-3">Fonctionnalités incluses</h5>
                            <ul className="space-y-2">
                              {subscriptionPlan.features?.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Upgrade CTA */}
                          {subscriptionPlan.plan_id !== 'premium' && (
                            <div className="pt-4 border-t">
                              <Button 
                                onClick={() => navigate('/pricing')}
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                {subscriptionPlan.plan_id === 'free' ? 'Passer à un abonnement payant' : 'Passer à Premium'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!subscriptionPlan && (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">Vous êtes actuellement sur le plan gratuit</p>
                          <Button onClick={() => navigate('/pricing')}>
                            Voir les offres
                          </Button>
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
              )}

              {/* Client View - only show if not provider and not needing profile */}
              {!isProvider && !needsProviderProfile && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="overview" data-testid="tab-overview">Vue d&apos;ensemble</TabsTrigger>
                    <TabsTrigger value="quotes" data-testid="tab-client-quotes">Mes devis</TabsTrigger>
                    <TabsTrigger value="bookings" data-testid="tab-bookings">Mes réservations</TabsTrigger>
                    <TabsTrigger value="marketplace-offers" data-testid="tab-marketplace-offers" className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      Mes offres
                    </TabsTrigger>
                    <TabsTrigger value="favorites" data-testid="tab-favorites" className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Favoris
                    </TabsTrigger>
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

                  <TabsContent value="marketplace-offers">
                    <MyMarketplaceOffers />
                  </TabsContent>

                  <TabsContent value="favorites">
                    <FavoritesManager />
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
                        onValueChange={(value) => {
                          if (value === 'Autre') {
                            setProfileData({ ...profileData, category: '' });
                          } else {
                            setProfileData({ ...profileData, category: value });
                          }
                        }}
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
                      
                      {/* Custom category field when "Autre" is selected */}
                      {(profileData.category === '' || profileData.category === 'Autre' || !categories.includes(profileData.category)) && (
                        <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <Label className="text-yellow-800">Proposer un nouveau métier</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={customCategory || profileData.category}
                              onChange={(e) => {
                                setCustomCategory(e.target.value);
                                setProfileData({ ...profileData, category: e.target.value });
                              }}
                              placeholder="Ex: Décorateur floral, Coach vocal..."
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={submitCategorySuggestion}
                              className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                            >
                              Suggérer
                            </Button>
                          </div>
                          <p className="text-xs text-yellow-600 mt-2">
                            Votre suggestion sera envoyée à l'administrateur pour validation.
                          </p>
                        </div>
                      )}
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
                      <Label>Pays d&apos;intervention * (vous pouvez en sélectionner plusieurs)</Label>
                      <CountryMultiSelect
                        value={profileData.countries}
                        onChange={(countries) => setProfileData({ ...profileData, countries })}
                        placeholder="Sélectionner les pays où vous intervenez"
                      />
                    </div>
                    <div>
                      <Label>Ville / Localisation *</Label>
                      <Input
                        required
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="Paris, Lyon, Marseille..."
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
          <MobileNav 
            user={userData || user} 
            unreadMessages={unreadMessages}
            pendingActions={pendingBookings + pendingQuotes}
          />
        </div>
      )}
    </ProtectedRoute>
  );
};

export default DashboardPage;
