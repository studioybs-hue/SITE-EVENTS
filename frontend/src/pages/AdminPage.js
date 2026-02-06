import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, CreditCard, BarChart3, Shield, 
  Search, ChevronLeft, ChevronRight, Eye, Ban, Trash2,
  CheckCircle, XCircle, Crown, Star, LogOut, Settings,
  Calendar, Package, MessageSquare, Globe, Image, Phone, Mail, MapPin, Video, Plus, Save, Quote, AlertTriangle, MessageCircle, X
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
  
  // Moderation
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [flaggedPage, setFlaggedPage] = useState(1);
  const [flaggedTotalPages, setFlaggedTotalPages] = useState(1);
  const [moderationKeywords, setModerationKeywords] = useState([]);
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  
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
      if (activeTab === 'moderation') { fetchFlaggedMessages(); fetchModerationKeywords(); }
      if (activeTab === 'subscriptions') fetchSubscriptions();
      if (activeTab === 'bookings') fetchBookings();
      if (activeTab === 'site') fetchSiteContent();
    }
  }, [admin, activeTab, usersPage, usersSearch, usersTypeFilter, providersPage, providersSearch, subscriptionsPage, bookingsPage, flaggedPage]);

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

  // Moderation Functions
  const fetchFlaggedMessages = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderation/flagged?page=${flaggedPage}&limit=20`, { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setFlaggedMessages(data.flagged_messages);
        setFlaggedTotalPages(data.pages);
      }
    } catch (e) {
      console.error('Error fetching flagged messages:', e);
    }
  };

  const fetchModerationKeywords = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderation/keywords`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setModerationKeywords(data.keywords || []);
        setModerationEnabled(data.enabled !== false);
      }
    } catch (e) {
      console.error('Error fetching keywords:', e);
    }
  };

  const saveModerationKeywords = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/moderation/keywords`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keywords: moderationKeywords, enabled: moderationEnabled })
      });
      alert('Mots-clés sauvegardés !');
    } catch (e) {
      console.error('Error saving keywords:', e);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !moderationKeywords.includes(newKeyword.trim().toLowerCase())) {
      setModerationKeywords([...moderationKeywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    setModerationKeywords(moderationKeywords.filter(k => k !== keyword));
  };

  const updateFlagStatus = async (flagId, status, notes = '') => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/moderation/flagged/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });
      fetchFlaggedMessages();
    } catch (e) {
      console.error('Error updating flag status:', e);
    }
  };

  const viewConversation = async (conversationId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderation/conversation/${conversationId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data);
        setConversationMessages(data.messages);
      }
    } catch (e) {
      console.error('Error fetching conversation:', e);
    }
  };

  const [userConversations, setUserConversations] = useState(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState(null);

  const viewUserAllConversations = async (userId, userName) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderation/user-conversations/${userId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUserConversations(data);
        setSelectedUserForChat({ userId, userName });
      }
    } catch (e) {
      console.error('Error fetching user conversations:', e);
    }
  };

  const blockUserFromModeration = async (userId, reason) => {
    if (!window.confirm('Bloquer cet utilisateur ?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/admin/moderation/block-user/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      alert('Utilisateur bloqué');
      fetchFlaggedMessages();
    } catch (e) {
      console.error('Error blocking user:', e);
    }
  };

  // Site Content Functions
  const fetchSiteContent = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/site-content`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSiteContent(data);
      }
    } catch (e) {
      console.error('Error fetching site content:', e);
    }
  };

  const saveSiteContent = async () => {
    setSavingContent(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/site-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(siteContent)
      });
      if (res.ok) {
        alert('Contenu sauvegardé !');
      }
    } catch (e) {
      console.error('Error saving site content:', e);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSavingContent(false);
    }
  };

  const addTestimonial = async () => {
    if (!newTestimonial.client_name || !newTestimonial.comment) {
      alert('Veuillez remplir le nom et le commentaire');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/site-content/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTestimonial)
      });
      if (res.ok) {
        setNewTestimonial({ client_name: '', event_type: '', rating: 5, comment: '', image: '' });
        fetchSiteContent();
      }
    } catch (e) {
      console.error('Error adding testimonial:', e);
    }
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Supprimer ce témoignage ?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/admin/site-content/testimonials/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchSiteContent();
    } catch (e) {
      console.error('Error deleting testimonial:', e);
    }
  };

  const addFeaturedImage = async () => {
    if (!newImage.url) {
      alert('Veuillez entrer une URL d\'image');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/site-content/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newImage)
      });
      if (res.ok) {
        setNewImage({ url: '', title: '', description: '' });
        fetchSiteContent();
      }
    } catch (e) {
      console.error('Error adding image:', e);
    }
  };

  const deleteFeaturedImage = async (id) => {
    if (!window.confirm('Supprimer cette image ?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/admin/site-content/images/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchSiteContent();
    } catch (e) {
      console.error('Error deleting image:', e);
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
          <TabsList className="grid w-full grid-cols-7 mb-6">
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
            <TabsTrigger value="moderation" data-testid="admin-tab-moderation">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Modération
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="admin-tab-subscriptions">
              <CreditCard className="h-4 w-4 mr-2" />
              Abonnements
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="admin-tab-bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Réservations
            </TabsTrigger>
            <TabsTrigger value="site" data-testid="admin-tab-site">
              <Globe className="h-4 w-4 mr-2" />
              Gestion Site
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

          {/* Moderation Tab */}
          <TabsContent value="moderation">
            <div className="space-y-6">
              {/* Keywords Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Mots-clés de modération
                  </CardTitle>
                  <CardDescription>
                    Les messages contenant ces mots seront automatiquement signalés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={moderationEnabled}
                        onChange={(e) => setModerationEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Modération activée
                    </label>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Ajouter un mot-clé..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword}>
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {moderationKeywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1">
                        {keyword}
                        <button 
                          onClick={() => removeKeyword(keyword)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <Button onClick={saveModerationKeywords} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" /> Sauvegarder les mots-clés
                  </Button>
                </CardContent>
              </Card>

              {/* Flagged Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-red-500" />
                    Messages signalés
                    {flaggedMessages.length > 0 && (
                      <Badge variant="destructive">{flaggedMessages.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Messages détectés comme potentiellement inappropriés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {flaggedMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>Aucun message signalé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {flaggedMessages.map((flag) => (
                        <div key={flag.flag_id} className={`p-4 border rounded-lg ${
                          flag.status === 'pending' ? 'border-red-300 bg-red-50' :
                          flag.status === 'reviewed' ? 'border-yellow-300 bg-yellow-50' :
                          'border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <button 
                                  className="font-semibold text-blue-600 hover:underline"
                                  onClick={() => viewUserAllConversations(flag.sender_id, flag.sender?.name)}
                                >
                                  {flag.sender?.name || 'Inconnu'}
                                </button>
                                <span className="text-muted-foreground">→</span>
                                <button 
                                  className="font-semibold text-blue-600 hover:underline"
                                  onClick={() => viewUserAllConversations(flag.receiver_id, flag.receiver?.name)}
                                >
                                  {flag.receiver?.name || 'Inconnu'}
                                </button>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(flag.flagged_at).toLocaleString('fr-FR')}
                              </div>
                            </div>
                            <Badge variant={
                              flag.status === 'pending' ? 'destructive' :
                              flag.status === 'reviewed' ? 'outline' :
                              flag.status === 'action_taken' ? 'default' : 'secondary'
                            }>
                              {flag.status === 'pending' ? 'En attente' :
                               flag.status === 'reviewed' ? 'Examiné' :
                               flag.status === 'action_taken' ? 'Action prise' : 'Ignoré'}
                            </Badge>
                          </div>
                          
                          <div className="bg-white p-3 rounded border mb-3">
                            <p className="text-sm">{flag.content}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-muted-foreground">Mots détectés:</span>
                            {flag.flagged_keywords?.map((kw, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewConversation(flag.conversation_id)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Cette conversation
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => viewUserAllConversations(flag.sender_id, flag.sender?.name)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" /> Toutes les conversations
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateFlagStatus(flag.flag_id, 'reviewed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Marquer examiné
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateFlagStatus(flag.flag_id, 'dismissed')}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Ignorer
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => blockUserFromModeration(flag.sender_id, 'Message inapproprié')}
                            >
                              <Ban className="h-4 w-4 mr-1" /> Bloquer expéditeur
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {flaggedTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">Page {flaggedPage} sur {flaggedTotalPages}</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFlaggedPage(p => Math.max(1, p - 1))}
                          disabled={flaggedPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFlaggedPage(p => Math.min(flaggedTotalPages, p + 1))}
                          disabled={flaggedPage === flaggedTotalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation Modal */}
              {selectedConversation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center">
                      <h3 className="font-semibold">Historique de la conversation</h3>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                      {conversationMessages.map((msg, i) => {
                        const sender = selectedConversation.participants?.[msg.sender_id];
                        return (
                          <div key={i} className="p-3 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{sender?.name || msg.sender_id}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* All User Conversations Modal */}
              {selectedUserForChat && userConversations && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setSelectedUserForChat(null); setUserConversations(null); }}>
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <MessageCircle className="h-5 w-5 text-blue-500" />
                          Toutes les conversations de {userConversations.user?.name || 'Utilisateur'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {userConversations.total_conversations} conversation(s) • {userConversations.total_messages} message(s) total
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedUserForChat(null); setUserConversations(null); }}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto max-h-[70vh]">
                      {userConversations.conversations?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>Aucune conversation trouvée</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {userConversations.conversations?.map((conv, idx) => (
                            <div key={idx} className="border rounded-lg overflow-hidden">
                              {/* Conversation Header */}
                              <div className="bg-gray-100 p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{conv.partner?.name || 'Utilisateur supprimé'}</p>
                                    <p className="text-xs text-muted-foreground">{conv.partner?.email}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">
                                  {conv.message_count} message(s)
                                </Badge>
                              </div>
                              
                              {/* Messages List */}
                              <div className="p-3 space-y-2 max-h-64 overflow-y-auto bg-gray-50/50">
                                {conv.messages?.map((msg, msgIdx) => {
                                  const isFromTargetUser = msg.sender_id === selectedUserForChat.userId;
                                  return (
                                    <div 
                                      key={msgIdx} 
                                      className={`p-2 rounded-lg text-sm ${
                                        isFromTargetUser 
                                          ? 'bg-blue-100 ml-8' 
                                          : 'bg-white border mr-8'
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className={`font-medium text-xs ${isFromTargetUser ? 'text-blue-700' : 'text-gray-700'}`}>
                                          {isFromTargetUser ? userConversations.user?.name : conv.partner?.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(msg.created_at).toLocaleString('fr-FR')}
                                        </span>
                                      </div>
                                      <p className="text-gray-800">{msg.content}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Email: {userConversations.user?.email}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Bloquer ${userConversations.user?.name} ?`)) {
                              blockUserFromModeration(selectedUserForChat.userId, 'Comportement inapproprié');
                              setSelectedUserForChat(null);
                              setUserConversations(null);
                            }
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" /> Bloquer cet utilisateur
                        </Button>
                        <Button variant="outline" onClick={() => { setSelectedUserForChat(null); setUserConversations(null); }}>
                          Fermer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

          {/* Site Content Management Tab */}
          <TabsContent value="site">
            <div className="space-y-6">
              {/* Hero Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Section Accueil (Hero)
                  </CardTitle>
                  <CardDescription>Personnalisez le titre, sous-titre et l&apos;image/vidéo de fond</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Titre principal</Label>
                    <Input
                      value={siteContent?.hero?.title || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        hero: { ...siteContent?.hero, title: e.target.value }
                      })}
                      placeholder="Trouvez les meilleurs prestataires..."
                    />
                  </div>
                  <div>
                    <Label>Sous-titre</Label>
                    <Textarea
                      value={siteContent?.hero?.subtitle || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        hero: { ...siteContent?.hero, subtitle: e.target.value }
                      })}
                      placeholder="Photographes, DJ, traiteurs..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>URL Image de fond</Label>
                      <Input
                        value={siteContent?.hero?.background_image || ''}
                        onChange={(e) => setSiteContent({
                          ...siteContent,
                          hero: { ...siteContent?.hero, background_image: e.target.value }
                        })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>URL Vidéo de fond (optionnel)</Label>
                      <Input
                        value={siteContent?.hero?.background_video || ''}
                        onChange={(e) => setSiteContent({
                          ...siteContent,
                          hero: { ...siteContent?.hero, background_video: e.target.value }
                        })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Informations de Contact
                  </CardTitle>
                  <CardDescription>Coordonnées affichées sur le site</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <Input
                      value={siteContent?.contact?.email || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        contact: { ...siteContent?.contact, email: e.target.value }
                      })}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Téléphone
                    </Label>
                    <Input
                      value={siteContent?.contact?.phone || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        contact: { ...siteContent?.contact, phone: e.target.value }
                      })}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" /> Ligne VIP (urgences)
                    </Label>
                    <Input
                      value={siteContent?.contact?.vip_phone || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        contact: { ...siteContent?.contact, vip_phone: e.target.value }
                      })}
                      placeholder="+33 1 23 45 67 90"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Adresse
                    </Label>
                    <Input
                      value={siteContent?.contact?.address || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        contact: { ...siteContent?.contact, address: e.target.value }
                      })}
                      placeholder="Paris, France"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Testimonials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Quote className="h-5 w-5" />
                    Avis Clients
                  </CardTitle>
                  <CardDescription>Témoignages affichés sur la page d&apos;accueil</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add new testimonial form */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Ajouter un témoignage
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Input
                        placeholder="Nom du client"
                        value={newTestimonial.client_name}
                        onChange={(e) => setNewTestimonial({...newTestimonial, client_name: e.target.value})}
                      />
                      <Input
                        placeholder="Type d'événement (ex: Mariage)"
                        value={newTestimonial.event_type}
                        onChange={(e) => setNewTestimonial({...newTestimonial, event_type: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Select 
                        value={String(newTestimonial.rating)} 
                        onValueChange={(v) => setNewTestimonial({...newTestimonial, rating: parseInt(v)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Note" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                          <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                          <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="URL photo client (optionnel)"
                        value={newTestimonial.image}
                        onChange={(e) => setNewTestimonial({...newTestimonial, image: e.target.value})}
                      />
                    </div>
                    <Textarea
                      placeholder="Commentaire du client..."
                      value={newTestimonial.comment}
                      onChange={(e) => setNewTestimonial({...newTestimonial, comment: e.target.value})}
                      className="mb-4"
                    />
                    <Button onClick={addTestimonial}>
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  </div>

                  {/* Existing testimonials */}
                  <div className="space-y-4">
                    {(siteContent?.testimonials || []).map((t) => (
                      <div key={t.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex gap-4">
                          {t.image && (
                            <img src={t.image} alt={t.client_name} className="w-12 h-12 rounded-full object-cover" />
                          )}
                          <div>
                            <div className="font-medium">{t.client_name}</div>
                            <div className="text-sm text-muted-foreground">{t.event_type}</div>
                            <div className="text-yellow-500">{'⭐'.repeat(t.rating)}</div>
                            <p className="text-sm mt-2">{t.comment}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteTestimonial(t.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {(!siteContent?.testimonials || siteContent.testimonials.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">Aucun témoignage ajouté</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Featured Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Images/Vidéos de la galerie
                  </CardTitle>
                  <CardDescription>Images affichées sur la page d&apos;accueil</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add new image form */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Ajouter une image
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <Input
                        placeholder="URL de l'image"
                        value={newImage.url}
                        onChange={(e) => setNewImage({...newImage, url: e.target.value})}
                      />
                      <Input
                        placeholder="Titre (optionnel)"
                        value={newImage.title}
                        onChange={(e) => setNewImage({...newImage, title: e.target.value})}
                      />
                      <Input
                        placeholder="Description (optionnel)"
                        value={newImage.description}
                        onChange={(e) => setNewImage({...newImage, description: e.target.value})}
                      />
                    </div>
                    <Button onClick={addFeaturedImage}>
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  </div>

                  {/* Existing images */}
                  <div className="grid grid-cols-4 gap-4">
                    {(siteContent?.featured_images || []).map((img) => (
                      <div key={img.id} className="relative group">
                        <img 
                          src={img.url} 
                          alt={img.title || 'Image'} 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteFeaturedImage(img.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {img.title && (
                          <p className="text-xs mt-1 truncate">{img.title}</p>
                        )}
                      </div>
                    ))}
                    {(!siteContent?.featured_images || siteContent.featured_images.length === 0) && (
                      <p className="col-span-4 text-center text-muted-foreground py-4">Aucune image ajoutée</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Statistiques affichées
                  </CardTitle>
                  <CardDescription>Chiffres mis en avant sur la page d&apos;accueil</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Nombre de prestataires</Label>
                    <Input
                      value={siteContent?.stats?.providers_count || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        stats: { ...siteContent?.stats, providers_count: e.target.value }
                      })}
                      placeholder="500+"
                    />
                  </div>
                  <div>
                    <Label>Événements réalisés</Label>
                    <Input
                      value={siteContent?.stats?.events_count || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        stats: { ...siteContent?.stats, events_count: e.target.value }
                      })}
                      placeholder="2000+"
                    />
                  </div>
                  <div>
                    <Label>Taux de satisfaction</Label>
                    <Input
                      value={siteContent?.stats?.satisfaction_rate || ''}
                      onChange={(e) => setSiteContent({
                        ...siteContent,
                        stats: { ...siteContent?.stats, satisfaction_rate: e.target.value }
                      })}
                      placeholder="98%"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  onClick={saveSiteContent}
                  disabled={savingContent}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingContent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder toutes les modifications
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
