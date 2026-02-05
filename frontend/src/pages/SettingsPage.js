import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, Camera, Mail, Phone, Lock, Bell, CreditCard, 
  Crown, Save, Loader2, Check, Eye, EyeOff, AlertTriangle,
  Shield, Receipt, Calendar, Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  
  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    picture: null
  });
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    email_new_message: true,
    email_quote_received: true,
    email_booking_update: true,
    email_marketing: false,
    push_enabled: true,
    sms_enabled: false
  });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const sections = [
    { id: 'profile', label: 'Infos personnelles', icon: User },
    { id: 'security', label: 'Mot de passe', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Paiements & facturation', icon: CreditCard },
    { id: 'subscription', label: 'Abonnement', icon: Crown },
    { id: 'danger', label: 'Zone de danger', icon: AlertTriangle }
  ];

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
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          picture: userData.picture || null
        });
        setNotifications({
          email_new_message: userData.notification_settings?.email_new_message ?? true,
          email_quote_received: userData.notification_settings?.email_quote_received ?? true,
          email_booking_update: userData.notification_settings?.email_booking_update ?? true,
          email_marketing: userData.notification_settings?.email_marketing ?? false,
          push_enabled: userData.notification_settings?.push_enabled ?? true,
          sms_enabled: userData.notification_settings?.sms_enabled ?? false
        });
        // Check if user has password (not OAuth only)
        setHasPassword(!userData.picture?.includes('googleusercontent'));
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast.success('Profil mis à jour');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setChangingPassword(true);
    try {
      const endpoint = hasPassword ? '/api/auth/change-password' : '/api/auth/set-password';
      const body = hasPassword 
        ? { current_password: passwordForm.currentPassword, new_password: passwordForm.newPassword }
        : { new_password: passwordForm.newPassword };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success('Mot de passe modifié avec succès');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setHasPassword(true);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_settings: notifications }),
      });

      if (response.ok) {
        toast.success('Préférences de notification mises à jour');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur');
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
        <div className="min-h-screen bg-background pb-20 md:pb-0">
          <Navbar user={userData || user} onLogout={handleLogout} />

          <div className="px-4 md:px-12 lg:px-24 py-8 md:py-12">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <SettingsIcon className="h-8 w-8 text-accent" />
                <h1 className="text-3xl md:text-4xl font-heading font-medium text-foreground">
                  Paramètres
                </h1>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="md:w-64 shrink-0">
                  <Card className="p-2">
                    <nav className="space-y-1">
                      {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                              activeSection === section.id
                                ? 'bg-accent text-white'
                                : 'text-foreground hover:bg-muted'
                            }`}
                            data-testid={`settings-nav-${section.id}`}
                          >
                            <Icon className="h-4 w-4" />
                            {section.label}
                          </button>
                        );
                      })}
                    </nav>
                  </Card>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                  {/* Profile Section */}
                  {activeSection === 'profile' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Informations personnelles
                        </CardTitle>
                        <CardDescription>
                          Gérez vos informations de profil
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <Avatar className="h-20 w-20">
                              <AvatarImage src={formData.picture ? `${BACKEND_URL}${formData.picture}` : user?.picture} />
                              <AvatarFallback className="text-xl bg-accent/10">
                                {formData.name?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingAvatar}
                              className="absolute bottom-0 right-0 p-1.5 bg-accent text-white rounded-full hover:bg-accent/90 transition-colors"
                              data-testid="upload-avatar-btn"
                            >
                              {uploadingAvatar ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Camera className="h-3 w-3" />
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
                            <p className="font-medium">{user?.name}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <Badge variant="secondary" className="mt-1">
                              {user?.user_type === 'provider' ? 'Prestataire' : 'Client'}
                            </Badge>
                          </div>
                        </div>

                        <Separator />

                        {/* Form */}
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              data-testid="settings-name-input"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
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
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+33 6 12 34 56 78"
                              data-testid="settings-phone-input"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleSaveProfile} disabled={saving} data-testid="save-profile-btn">
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Enregistrer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Security Section */}
                  {activeSection === 'security' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Mot de passe
                        </CardTitle>
                        <CardDescription>
                          {hasPassword 
                            ? 'Modifiez votre mot de passe pour sécuriser votre compte'
                            : 'Définissez un mot de passe pour vous connecter sans Google'
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                          {hasPassword && (
                            <div className="grid gap-2">
                              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                              <div className="relative">
                                <Input
                                  id="currentPassword"
                                  type={showPasswords.current ? 'text' : 'password'}
                                  value={passwordForm.currentPassword}
                                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                  data-testid="current-password-input"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="grid gap-2">
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                data-testid="new-password-input"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                data-testid="confirm-password-input"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {passwordForm.newPassword && passwordForm.confirmPassword && 
                           passwordForm.newPassword !== passwordForm.confirmPassword && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Les mots de passe ne correspondent pas
                            </div>
                          )}

                          <div className="flex justify-end pt-2">
                            <Button 
                              type="submit" 
                              disabled={changingPassword || (hasPassword && !passwordForm.currentPassword) || !passwordForm.newPassword || !passwordForm.confirmPassword}
                              data-testid="change-password-btn"
                            >
                              {changingPassword ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Shield className="h-4 w-4 mr-2" />
                              )}
                              {hasPassword ? 'Modifier le mot de passe' : 'Définir le mot de passe'}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notifications Section */}
                  {activeSection === 'notifications' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          Notifications
                        </CardTitle>
                        <CardDescription>
                          Choisissez comment vous souhaitez être notifié
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Notifications par email
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Nouveaux messages</Label>
                                <p className="text-sm text-muted-foreground">Recevez un email pour chaque nouveau message</p>
                              </div>
                              <Switch
                                checked={notifications.email_new_message}
                                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_new_message: checked }))}
                                data-testid="notif-email-message"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Devis reçus</Label>
                                <p className="text-sm text-muted-foreground">Notification quand un prestataire répond</p>
                              </div>
                              <Switch
                                checked={notifications.email_quote_received}
                                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_quote_received: checked }))}
                                data-testid="notif-email-quote"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Mises à jour de réservation</Label>
                                <p className="text-sm text-muted-foreground">Confirmations et changements de statut</p>
                              </div>
                              <Switch
                                checked={notifications.email_booking_update}
                                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_booking_update: checked }))}
                                data-testid="notif-email-booking"
                              />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Communications marketing</Label>
                                <p className="text-sm text-muted-foreground">Offres spéciales et nouveautés</p>
                              </div>
                              <Switch
                                checked={notifications.email_marketing}
                                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_marketing: checked }))}
                                data-testid="notif-email-marketing"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Autres notifications
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Notifications push</Label>
                                <p className="text-sm text-muted-foreground">Notifications dans le navigateur</p>
                              </div>
                              <Switch
                                checked={notifications.push_enabled}
                                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push_enabled: checked }))}
                                data-testid="notif-push"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Notifications SMS</Label>
                                <p className="text-sm text-muted-foreground">Recevoir des SMS pour les rappels importants</p>
                              </div>
                              <Switch
                                checked={notifications.sms_enabled}
                                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms_enabled: checked }))}
                                data-testid="notif-sms"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button onClick={handleSaveNotifications} disabled={saving} data-testid="save-notifications-btn">
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Enregistrer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Billing Section */}
                  {activeSection === 'billing' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Paiements & facturation
                        </CardTitle>
                        <CardDescription>
                          Gérez vos moyens de paiement et consultez vos factures
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Payment Methods */}
                        <div>
                          <h3 className="font-medium mb-4">Moyens de paiement</h3>
                          <div className="border border-dashed border-border rounded-lg p-6 text-center">
                            <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground mb-3">Aucun moyen de paiement enregistré</p>
                            <Button variant="outline" disabled>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Ajouter une carte
                            </Button>
                            <p className="text-xs text-muted-foreground mt-3">
                              L'intégration des paiements sera bientôt disponible
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Invoices */}
                        <div>
                          <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Historique des factures
                          </h3>
                          <div className="border border-border rounded-lg">
                            <div className="p-6 text-center text-muted-foreground">
                              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>Aucune facture pour le moment</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Subscription Section */}
                  {activeSection === 'subscription' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5" />
                          Abonnement
                        </CardTitle>
                        <CardDescription>
                          Gérez votre abonnement et découvrez les avantages premium
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Current Plan */}
                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Plan actuel</span>
                            <Badge>Gratuit</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Vous utilisez actuellement le plan gratuit avec des fonctionnalités limitées.
                          </p>
                        </div>

                        {/* Plans Comparison */}
                        <div>
                          <h3 className="font-medium mb-4">Passer à Premium</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Basic Plan */}
                            <div className="border border-border rounded-lg p-5">
                              <h4 className="font-semibold mb-1">Basique</h4>
                              <p className="text-2xl font-bold mb-3">Gratuit</p>
                              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  Recherche de prestataires
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  Messagerie limitée
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  3 demandes de devis/mois
                                </li>
                              </ul>
                              <Button variant="outline" className="w-full" disabled>
                                Plan actuel
                              </Button>
                            </div>

                            {/* Premium Plan */}
                            <div className="border-2 border-accent rounded-lg p-5 relative">
                              <Badge className="absolute -top-2 right-4 bg-accent">Recommandé</Badge>
                              <h4 className="font-semibold mb-1">Premium</h4>
                              <p className="text-2xl font-bold mb-3">
                                19€<span className="text-sm font-normal text-muted-foreground">/mois</span>
                              </p>
                              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  Messagerie illimitée
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  Devis illimités
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  Priorité dans les résultats
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  Support prioritaire
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  Badge vérifié
                                </li>
                              </ul>
                              <Button className="w-full" disabled>
                                <Crown className="h-4 w-4 mr-2" />
                                Bientôt disponible
                              </Button>
                            </div>
                          </div>
                        </div>

                        {user?.user_type === 'provider' && (
                          <>
                            <Separator />
                            
                            {/* Provider Plans */}
                            <div>
                              <h3 className="font-medium mb-4">Plans Prestataire</h3>
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="border border-border rounded-lg p-4">
                                  <h4 className="font-semibold">Starter</h4>
                                  <p className="text-xl font-bold my-2">29€<span className="text-xs font-normal">/mois</span></p>
                                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                                    <li>• Profil visible</li>
                                    <li>• 10 devis/mois</li>
                                    <li>• Commission 8%</li>
                                  </ul>
                                  <Button variant="outline" size="sm" className="w-full" disabled>Bientôt</Button>
                                </div>
                                <div className="border-2 border-accent rounded-lg p-4">
                                  <h4 className="font-semibold">Pro</h4>
                                  <p className="text-xl font-bold my-2">59€<span className="text-xs font-normal">/mois</span></p>
                                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                                    <li>• Mise en avant</li>
                                    <li>• Devis illimités</li>
                                    <li>• Commission 5%</li>
                                  </ul>
                                  <Button size="sm" className="w-full" disabled>Bientôt</Button>
                                </div>
                                <div className="border border-border rounded-lg p-4">
                                  <h4 className="font-semibold">Enterprise</h4>
                                  <p className="text-xl font-bold my-2">99€<span className="text-xs font-normal">/mois</span></p>
                                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                                    <li>• Top des résultats</li>
                                    <li>• Multi-utilisateurs</li>
                                    <li>• Commission 3%</li>
                                  </ul>
                                  <Button variant="outline" size="sm" className="w-full" disabled>Bientôt</Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <MobileNav user={userData || user} />
        </div>
      )}
    </ProtectedRoute>
  );
};

export default SettingsPage;
