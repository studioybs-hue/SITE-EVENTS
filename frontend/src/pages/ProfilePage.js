import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Camera, Mail, Phone, MapPin, Heart, Bell, 
  Save, Loader2, Check, Euro
} from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { id: 'wedding', label: 'Mariage' },
  { id: 'birthday', label: 'Anniversaire' },
  { id: 'corporate', label: 'Événement d\'entreprise' },
  { id: 'baptism', label: 'Baptême' },
  { id: 'graduation', label: 'Remise de diplôme' },
  { id: 'engagement', label: 'Fiançailles' },
  { id: 'baby_shower', label: 'Baby shower' },
  { id: 'other', label: 'Autre' }
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    picture: null,
    preferences: {
      budget_min: '',
      budget_max: '',
      event_types: [],
      preferred_location: ''
    },
    notification_settings: {
      email_new_message: true,
      email_quote_received: true,
      email_booking_update: true,
      email_marketing: false,
      push_enabled: true
    }
  });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Populate form with existing data
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          picture: userData.picture || null,
          preferences: {
            budget_min: userData.preferences?.budget_min || '',
            budget_max: userData.preferences?.budget_max || '',
            event_types: userData.preferences?.event_types || [],
            preferred_location: userData.preferences?.preferred_location || ''
          },
          notification_settings: {
            email_new_message: userData.notification_settings?.email_new_message ?? true,
            email_quote_received: userData.notification_settings?.email_quote_received ?? true,
            email_booking_update: userData.notification_settings?.email_booking_update ?? true,
            email_marketing: userData.notification_settings?.email_marketing ?? false,
            push_enabled: userData.notification_settings?.push_enabled ?? true
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 5MB)');
      return;
    }

    setUploadingAvatar(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/me/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, picture: data.picture }));
        setUser(prev => ({ ...prev, picture: data.picture }));
        toast.success('Photo de profil mise à jour');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEventTypeToggle = (eventType) => {
    setFormData(prev => {
      const currentTypes = prev.preferences.event_types;
      const newTypes = currentTypes.includes(eventType)
        ? currentTypes.filter(t => t !== eventType)
        : [...currentTypes, eventType];
      
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          event_types: newTypes
        }
      };
    });
  };

  const handleNotificationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const updatePayload = {
        name: formData.name,
        phone: formData.phone || null,
        preferences: {
          budget_min: formData.preferences.budget_min ? parseFloat(formData.preferences.budget_min) : null,
          budget_max: formData.preferences.budget_max ? parseFloat(formData.preferences.budget_max) : null,
          event_types: formData.preferences.event_types,
          preferred_location: formData.preferences.preferred_location || null
        },
        notification_settings: formData.notification_settings
      };

      const response = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast.success('Profil mis à jour avec succès');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {(userData) => (
        <div className="min-h-screen bg-background">
          <Navbar user={userData || user} onLogout={handleLogout} />

          <div className="px-6 md:px-12 lg:px-24 py-12">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-8">
                Mon Profil
              </h1>

              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profil</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Préférences</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                      <CardDescription>
                        Gérez vos informations de profil et votre photo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar Section */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={formData.picture ? `${BACKEND_URL}${formData.picture}` : user?.picture} />
                            <AvatarFallback className="text-2xl bg-accent/10">
                              {formData.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute bottom-0 right-0 p-2 bg-accent text-white rounded-full hover:bg-accent/90 transition-colors disabled:opacity-50"
                            data-testid="upload-avatar-btn"
                          >
                            {uploadingAvatar ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept=".jpg,.jpeg,.png,.gif,.webp"
                            className="hidden"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{formData.name}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Membre depuis {new Date(user?.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Nom complet
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Votre nom"
                            data-testid="profile-name-input"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </Label>
                          <Input
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            L'email ne peut pas être modifié
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Téléphone
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+33 6 12 34 56 78"
                            data-testid="profile-phone-input"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>Préférences événementielles</CardTitle>
                      <CardDescription>
                        Personnalisez vos préférences pour de meilleures recommandations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Budget Range */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2">
                          <Euro className="h-4 w-4" />
                          Budget estimé
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="budget_min" className="text-xs text-muted-foreground">
                              Minimum (€)
                            </Label>
                            <Input
                              id="budget_min"
                              type="number"
                              min="0"
                              value={formData.preferences.budget_min}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, budget_min: e.target.value }
                              }))}
                              placeholder="500"
                              data-testid="budget-min-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="budget_max" className="text-xs text-muted-foreground">
                              Maximum (€)
                            </Label>
                            <Input
                              id="budget_max"
                              type="number"
                              min="0"
                              value={formData.preferences.budget_max}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, budget_max: e.target.value }
                              }))}
                              placeholder="5000"
                              data-testid="budget-max-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preferred Location */}
                      <div className="grid gap-2">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Localisation préférée
                        </Label>
                        <Input
                          id="location"
                          value={formData.preferences.preferred_location}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, preferred_location: e.target.value }
                          }))}
                          placeholder="Paris, Île-de-France"
                          data-testid="preferred-location-input"
                        />
                      </div>

                      {/* Event Types */}
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Types d'événements qui vous intéressent
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {EVENT_TYPES.map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => handleEventTypeToggle(event.id)}
                              className={`px-3 py-2 text-sm rounded-md border transition-all ${
                                formData.preferences.event_types.includes(event.id)
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-background border-border hover:border-accent'
                              }`}
                              data-testid={`event-type-${event.id}`}
                            >
                              {formData.preferences.event_types.includes(event.id) && (
                                <Check className="h-3 w-3 inline mr-1" />
                              )}
                              {event.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres de notification</CardTitle>
                      <CardDescription>
                        Choisissez comment vous souhaitez être notifié
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Notifications par email
                        </h3>
                        
                        <div className="space-y-4 pl-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="email_new_message">Nouveaux messages</Label>
                              <p className="text-sm text-muted-foreground">
                                Recevez un email quand vous avez un nouveau message
                              </p>
                            </div>
                            <Switch
                              id="email_new_message"
                              checked={formData.notification_settings.email_new_message}
                              onCheckedChange={(checked) => handleNotificationChange('email_new_message', checked)}
                              data-testid="notif-email-message"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="email_quote_received">Devis reçus</Label>
                              <p className="text-sm text-muted-foreground">
                                Soyez notifié quand un prestataire répond à votre demande
                              </p>
                            </div>
                            <Switch
                              id="email_quote_received"
                              checked={formData.notification_settings.email_quote_received}
                              onCheckedChange={(checked) => handleNotificationChange('email_quote_received', checked)}
                              data-testid="notif-email-quote"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="email_booking_update">Mises à jour de réservation</Label>
                              <p className="text-sm text-muted-foreground">
                                Recevez les confirmations et changements de statut
                              </p>
                            </div>
                            <Switch
                              id="email_booking_update"
                              checked={formData.notification_settings.email_booking_update}
                              onCheckedChange={(checked) => handleNotificationChange('email_booking_update', checked)}
                              data-testid="notif-email-booking"
                            />
                          </div>

                          <div className="flex items-center justify-between border-t pt-4">
                            <div>
                              <Label htmlFor="email_marketing">Communications marketing</Label>
                              <p className="text-sm text-muted-foreground">
                                Offres spéciales, nouveaux prestataires, actualités
                              </p>
                            </div>
                            <Switch
                              id="email_marketing"
                              checked={formData.notification_settings.email_marketing}
                              onCheckedChange={(checked) => handleNotificationChange('email_marketing', checked)}
                              data-testid="notif-email-marketing"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-6">
                        <h3 className="font-medium flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Notifications push
                        </h3>
                        
                        <div className="pl-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="push_enabled">Activer les notifications push</Label>
                              <p className="text-sm text-muted-foreground">
                                Recevez des notifications en temps réel dans votre navigateur
                              </p>
                            </div>
                            <Switch
                              id="push_enabled"
                              checked={formData.notification_settings.push_enabled}
                              onCheckedChange={(checked) => handleNotificationChange('push_enabled', checked)}
                              data-testid="notif-push-enabled"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="min-w-[150px]"
                  data-testid="save-profile-btn"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default ProfilePage;
