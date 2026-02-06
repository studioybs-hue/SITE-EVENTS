import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, CreditCard, BarChart3, Shield, 
  Search, ChevronLeft, ChevronRight, Eye, Ban, Trash2,
  CheckCircle, XCircle, Crown, Star, LogOut, Settings,
  Calendar, Package, MessageSquare, Globe, Image, Phone, Mail, MapPin, Video, Plus, Save, Quote
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPage = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard stats
  const [stats, setStats] = useState(null);
  
  // Site Content
  const [siteContent, setSiteContent] = useState(null);
  const [savingContent, setSavingContent] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ client_name: '', event_type: '', rating: 5, comment: '', image: '' });
  const [newImage, setNewImage] = useState({ url: '', title: '', description: '' });
  
  // Users
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersTypeFilter, setUsersTypeFilter] = useState('all');
  
  // Providers
  const [providers, setProviders] = useState([]);
  const [providersPage, setProvidersPage] = useState(1);
  const [providersTotalPages, setProvidersTotalPages] = useState(1);
  const [providersSearch, setProvidersSearch] = useState('');
  
  // Subscriptions
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subscriptionsTotalPages, setSubscriptionsTotalPages] = useState(1);
  
  // Bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (admin) {
      if (activeTab === 'dashboard') fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'providers') fetchProviders();
      if (activeTab === 'subscriptions') fetchSubscriptions();
      if (activeTab === 'bookings') fetchBookings();
    }
  }, [admin, activeTab, usersPage, usersSearch, usersTypeFilter, providersPage, providersSearch, subscriptionsPage, bookingsPage]);

  const checkAdminAuth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data);
      } else {
        navigate('/admin/login');
      }
    } catch (e) {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/stats`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      let url = `${BACKEND_URL}/api/admin/users?page=${usersPage}&limit=10`;
      if (usersSearch) url += `&search=${encodeURIComponent(usersSearch)}`;
      if (usersTypeFilter !== 'all') url += `&user_type=${usersTypeFilter}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUsersTotalPages(data.pages);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchProviders = async () => {
    try {
      let url = `${BACKEND_URL}/api/admin/providers?page=${providersPage}&limit=10`;
      if (providersSearch) url += `&search=${encodeURIComponent(providersSearch)}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
        setProvidersTotalPages(data.pages);
      }
    } catch (e) {
      console.error('Error fetching providers:', e);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/subscriptions?page=${subscriptionsPage}&limit=10`, { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
        setSubscriptionsTotalPages(data.pages);
      }
    } catch (e) {
      console.error('Error fetching subscriptions:', e);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/bookings?page=${bookingsPage}&limit=10`, { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
        setBookingsTotalPages(data.pages);
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir bloquer/débloquer cet utilisateur ?')) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Error blocking user:', e);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('ATTENTION: Cette action est irréversible. Supprimer cet utilisateur ?')) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleVerifyProvider = async (providerId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/providers/${providerId}/verify`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        fetchProviders();
      }
    } catch (e) {
      console.error('Error verifying provider:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/logout`, { 
        method: 'POST',
        credentials: 'include' 
      });
    } catch (e) {
      // Continue anyway
    }
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-xl font-bold">Administration</h1>
              <p className="text-sm text-gray-400">Lumière Events</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{admin?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-300 hover:text-white">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" data-testid="admin-tab-dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="providers" data-testid="admin-tab-providers">
              <Settings className="h-4 w-4 mr-2" />
              Prestataires
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="admin-tab-subscriptions">
              <CreditCard className="h-4 w-4 mr-2" />
              Abonnements
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="admin-tab-bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Réservations
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {stats && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Utilisateurs total</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_users}</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats.new_users_this_month} ce mois
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Prestataires</CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_providers}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.total_clients} clients
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Réservations</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_bookings}</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats.new_bookings_this_month} ce mois
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_revenue.toFixed(2)}€</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats.revenue_this_month.toFixed(2)}€ ce mois
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Subscriptions Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Abonnements actifs</CardTitle>
                    <CardDescription>Répartition par formule</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-8">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-400"></div>
                        <span>Gratuit: {stats.active_subscriptions.free || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                        <span>Pro: {stats.active_subscriptions.pro || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-500"></div>
                        <span>Premium: {stats.active_subscriptions.premium || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={usersSearch}
                      onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={usersTypeFilter} onValueChange={(v) => { setUsersTypeFilter(v); setUsersPage(1); }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="client">Clients</SelectItem>
                      <SelectItem value="provider">Prestataires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.user_type === 'provider' ? 'default' : 'secondary'}>
                            {user.user_type === 'provider' ? 'Prestataire' : 'Client'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          {user.is_blocked ? (
                            <Badge variant="destructive">Bloqué</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">Actif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleBlockUser(user.user_id)}>
                              <Ban className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.user_id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">Page {usersPage} sur {usersTotalPages}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                      disabled={usersPage === usersTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des prestataires</CardTitle>
                <div className="mt-4">
                  <Input
                    placeholder="Rechercher par nom ou catégorie..."
                    value={providersSearch}
                    onChange={(e) => { setProvidersSearch(e.target.value); setProvidersPage(1); }}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Abonnement</TableHead>
                      <TableHead>Vérifié</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => (
                      <TableRow key={provider.provider_id}>
                        <TableCell className="font-medium">{provider.business_name}</TableCell>
                        <TableCell>{provider.category}</TableCell>
                        <TableCell>{provider.location}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              provider.subscription_plan === 'premium' ? 'bg-yellow-500' :
                              provider.subscription_plan === 'pro' ? 'bg-blue-500' : 'bg-gray-400'
                            }
                          >
                            {provider.subscription_plan === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                            {provider.subscription_plan === 'pro' && <Star className="h-3 w-3 mr-1" />}
                            {provider.subscription_plan || 'Gratuit'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {provider.verified ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-300" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerifyProvider(provider.provider_id)}
                          >
                            {provider.verified ? 'Retirer' : 'Vérifier'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">Page {providersPage} sur {providersTotalPages}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setProvidersPage(p => Math.max(1, p - 1))}
                      disabled={providersPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setProvidersPage(p => Math.min(providersTotalPages, p + 1))}
                      disabled={providersPage === providersTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des abonnements</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prestataire</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Fin période</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.subscription_id}>
                        <TableCell className="font-medium">
                          {sub.provider?.business_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              sub.plan_id === 'premium' ? 'bg-yellow-500' :
                              sub.plan_id === 'pro' ? 'bg-blue-500' : 'bg-gray-400'
                            }
                          >
                            {sub.plan_id}
                          </Badge>
                        </TableCell>
                        <TableCell>{sub.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                            {sub.status === 'active' ? 'Actif' : sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(sub.current_period_end).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {subscriptions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun abonnement payant pour le moment
                  </div>
                )}
                
                {/* Pagination */}
                {subscriptionsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-muted-foreground">Page {subscriptionsPage} sur {subscriptionsTotalPages}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSubscriptionsPage(p => Math.max(1, p - 1))}
                        disabled={subscriptionsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSubscriptionsPage(p => Math.min(subscriptionsTotalPages, p + 1))}
                        disabled={subscriptionsPage === subscriptionsTotalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Réservations récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date événement</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Créée le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.booking_id}>
                        <TableCell className="font-mono text-sm">{booking.booking_id.slice(-8)}</TableCell>
                        <TableCell>{booking.event_type || 'N/A'}</TableCell>
                        <TableCell>{booking.event_date || 'N/A'}</TableCell>
                        <TableCell>{booking.total_amount?.toFixed(2) || '0.00'}€</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'pending' ? 'secondary' :
                              booking.status === 'cancelled' ? 'destructive' : 'outline'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(booking.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {bookings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune réservation pour le moment
                  </div>
                )}
                
                {/* Pagination */}
                {bookingsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-muted-foreground">Page {bookingsPage} sur {bookingsTotalPages}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                        disabled={bookingsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setBookingsPage(p => Math.min(bookingsTotalPages, p + 1))}
                        disabled={bookingsPage === bookingsTotalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
