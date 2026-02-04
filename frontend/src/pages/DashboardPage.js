import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Euro, MapPin, User, Building, Plus } from 'lucide-react';
import { toast } from 'sonner';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      // Fetch user
      const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const userData = await userRes.json();
      setUser(userData);

      // Fetch bookings
      const bookingsRes = await fetch(`${BACKEND_URL}/api/bookings`, {
        credentials: 'include',
      });
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/auth/profile?user_type=provider`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setCreateProfileOpen(true);
    } catch (error) {
      console.error('Error updating user type:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
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

  return (
    <ProtectedRoute>
      {(userData) => (
        <div className="min-h-screen bg-background">
          <Navbar user={userData || user} onLogout={handleLogout} />

          <div className="px-6 md:px-12 lg:px-24 py-12">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-heading font-medium text-foreground mb-2" data-testid="dashboard-title">
                    Tableau de bord
                  </h1>
                  <p className="text-muted-foreground">Bienvenue, {userData?.name || user?.name}</p>
                </div>
                {userData?.user_type === 'client' && (
                  <Button
                    onClick={handleBecomeProvider}
                    className="rounded-full"
                    data-testid="become-provider-btn"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Devenir prestataire
                  </Button>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Réservations</p>
                      <p className="text-3xl font-semibold" data-testid="bookings-count">{bookings.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-accent" />
                  </div>
                </Card>
                {providerProfile && (
                  <>
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Note moyenne</p>
                          <p className="text-3xl font-semibold" data-testid="rating">{providerProfile.rating.toFixed(1)}</p>
                        </div>
                        <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-semibold">
                          ★
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Avis</p>
                          <p className="text-3xl font-semibold" data-testid="reviews-count">{providerProfile.total_reviews}</p>
                        </div>
                        <User className="h-8 w-8 text-accent" />
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="bookings" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="bookings" data-testid="tab-bookings">Mes réservations</TabsTrigger>
                  {providerProfile && (
                    <TabsTrigger value="profile" data-testid="tab-profile">Mon profil</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="bookings">
                  <Card className="p-6">
                    <h2 className="text-2xl font-heading font-semibold mb-6">Réservations</h2>
                    {bookings.length === 0 ? (
                      <p className="text-muted-foreground" data-testid="no-bookings">Aucune réservation</p>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <div
                            key={booking.booking_id}
                            className="border border-border rounded-sm p-4 hover:shadow-sm transition-shadow"
                            data-testid="booking-item"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                  <h3 className="font-semibold text-lg">{booking.event_type}</h3>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground space-x-4">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(booking.event_date).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {booking.event_location}
                                  </div>
                                  <div className="flex items-center">
                                    <Euro className="h-4 w-4 mr-1" />
                                    {booking.total_amount}€
                                  </div>
                                </div>
                                {booking.notes && (
                                  <p className="text-sm text-muted-foreground">Notes: {booking.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {providerProfile && (
                  <TabsContent value="profile">
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-heading font-semibold">Mon profil prestataire</h2>
                        <Button
                          onClick={() => navigate(`/providers/${providerProfile.provider_id}`)}
                          variant="outline"
                          data-testid="view-public-profile-btn"
                        >
                          Voir le profil public
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Nom commercial</Label>
                          <p className="text-foreground font-medium">{providerProfile.business_name}</p>
                        </div>
                        <div>
                          <Label>Catégorie</Label>
                          <p className="text-foreground font-medium">{providerProfile.category}</p>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <p className="text-muted-foreground">{providerProfile.description}</p>
                        </div>
                        <div>
                          <Label>Localisation</Label>
                          <p className="text-foreground font-medium">{providerProfile.location}</p>
                        </div>
                        <div>
                          <Label>Tarifs</Label>
                          <p className="text-foreground font-medium">{providerProfile.pricing_range}</p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>

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
      )}
    </ProtectedRoute>
  );
};

export default DashboardPage;