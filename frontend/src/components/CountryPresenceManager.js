import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Plus, Trash2, Edit, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'KM', name: 'Comores', flag: '🇰🇲' },
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CountryPresenceManager = () => {
  const { t } = useTranslation();
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresence, setEditingPresence] = useState(null);
  const [formData, setFormData] = useState({
    country: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchPresences();
  }, []);

  const fetchPresences = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/country-presence`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPresences(data);
      }
    } catch (error) {
      console.error('Error fetching presences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.country || !formData.start_date || !formData.end_date) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.start_date > formData.end_date) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    try {
      const url = editingPresence 
        ? `${BACKEND_URL}/api/country-presence/${editingPresence.presence_id}`
        : `${BACKEND_URL}/api/country-presence`;
      
      const response = await fetch(url, {
        method: editingPresence ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingPresence ? 'Période modifiée' : 'Période ajoutée');
        setDialogOpen(false);
        setEditingPresence(null);
        setFormData({ country: '', start_date: '', end_date: '', notes: '' });
        fetchPresences();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving presence:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (presenceId) => {
    if (!window.confirm('Supprimer cette période ?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/country-presence/${presenceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Période supprimée');
        fetchPresences();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting presence:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditDialog = (presence) => {
    setEditingPresence(presence);
    setFormData({
      country: presence.country,
      start_date: presence.start_date,
      end_date: presence.end_date,
      notes: presence.notes || ''
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingPresence(null);
    setFormData({ country: '', start_date: '', end_date: '', notes: '' });
    setDialogOpen(true);
  };

  const getCountryInfo = (code) => COUNTRIES.find(c => c.code === code) || { name: code, flag: '🏳️' };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isCurrentOrFuture = (endDate) => {
    return new Date(endDate) >= new Date(new Date().toISOString().split('T')[0]);
  };

  // Separate current/future from past presences
  const currentPresences = presences.filter(p => isCurrentOrFuture(p.end_date));
  const pastPresences = presences.filter(p => !isCurrentOrFuture(p.end_date));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Mes déplacements
          </h3>
          <p className="text-sm text-muted-foreground">
            Indiquez dans quels pays vous serez disponible et à quelles dates
          </p>
        </div>
        <Button onClick={openNewDialog} data-testid="add-presence-btn">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une période
        </Button>
      </div>

      {/* Current/Future presences */}
      {currentPresences.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Périodes à venir</h4>
          <div className="grid gap-3">
            {currentPresences.map((presence) => {
              const country = getCountryInfo(presence.country);
              const isActive = new Date(presence.start_date) <= new Date() && new Date(presence.end_date) >= new Date();
              
              return (
                <Card 
                  key={presence.presence_id} 
                  className={`p-4 ${isActive ? 'border-green-500 bg-green-50' : ''}`}
                  data-testid={`presence-${presence.presence_id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t(`countries.${presence.country}`) || country.name}</span>
                          {isActive && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Actuellement
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(presence.start_date)} → {formatDate(presence.end_date)}
                        </div>
                        {presence.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{presence.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(presence)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(presence.presence_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past presences */}
      {pastPresences.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Périodes passées</h4>
          <div className="grid gap-2 opacity-60">
            {pastPresences.slice(0, 5).map((presence) => {
              const country = getCountryInfo(presence.country);
              
              return (
                <Card key={presence.presence_id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span className="text-sm">{t(`countries.${presence.country}`) || country.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(presence.start_date)} → {formatDate(presence.end_date)}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      onClick={() => handleDelete(presence.presence_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {presences.length === 0 && (
        <Card className="p-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas encore indiqué de déplacements.<br />
            Ajoutez vos périodes de présence dans différents pays.
          </p>
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter ma première période
          </Button>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPresence ? 'Modifier la période' : 'Nouvelle période de présence'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Pays *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger data-testid="presence-country-select">
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{t(`countries.${c.code}`) || c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  data-testid="presence-start-date"
                />
              </div>
              <div>
                <Label>Date de fin *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  data-testid="presence-end-date"
                />
              </div>
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Ex: Disponible pour mariages et événements"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" data-testid="save-presence-btn">
                {editingPresence ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CountryPresenceManager;
