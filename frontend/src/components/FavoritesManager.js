import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Heart, Star, MapPin, Trash2, Bell, BellOff, 
  MessageCircle, ExternalLink, Loader2, StickyNote,
  CheckCircle, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const FavoritesManager = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [notes, setNotes] = useState('');
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/favorites`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (providerId, providerName) => {
    if (!window.confirm(`Retirer ${providerName} de vos favoris ?`)) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/favorites/${providerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(f => f.provider_id !== providerId));
        toast.success('Retiré des favoris');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleToggleAlert = async (providerId, currentValue) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/favorites/${providerId}?alert_availability=${!currentValue}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        setFavorites(prev => prev.map(f => 
          f.provider_id === providerId 
            ? { ...f, alert_availability: !currentValue }
            : f
        ));
        toast.success(!currentValue ? 'Alerte activée' : 'Alerte désactivée');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingFavorite) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/favorites/${editingFavorite.provider_id}?notes=${encodeURIComponent(notes)}`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (response.ok) {
        setFavorites(prev => prev.map(f => 
          f.provider_id === editingFavorite.provider_id 
            ? { ...f, notes }
            : f
        ));
        toast.success('Notes enregistrées');
        setEditingFavorite(null);
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const openNotes = (favorite) => {
    setEditingFavorite(favorite);
    setNotes(favorite.notes || '');
  };

  const alertsCount = favorites.filter(f => f.alert_availability).length;

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Prestataires favoris
          </h2>
          <p className="text-sm text-muted-foreground">
            {favorites.length} favori{favorites.length > 1 ? 's' : ''} • {alertsCount} alerte{alertsCount > 1 ? 's' : ''} active{alertsCount > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/search')}>
          Découvrir plus de prestataires
        </Button>
      </div>

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <Card className="p-8 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-3">Aucun prestataire favori</p>
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez des prestataires à vos favoris pour y accéder rapidement
          </p>
          <Button onClick={() => navigate('/search')}>
            Rechercher des prestataires
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((favorite) => (
            <Card key={favorite.favorite_id} className="p-4 hover:shadow-md transition-shadow" data-testid="favorite-item">
              <div className="flex gap-4">
                {/* Avatar */}
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarImage src={favorite.provider_picture ? `${BACKEND_URL}${favorite.provider_picture}` : undefined} />
                  <AvatarFallback className="text-lg bg-accent/10">
                    {favorite.provider_name?.[0]?.toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold truncate flex items-center gap-2">
                        {favorite.provider_name}
                        {favorite.provider_verified && (
                          <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {favorite.provider_category}
                        </Badge>
                        {favorite.provider_location && (
                          <>
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{favorite.provider_location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{favorite.provider_rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>

                  {/* Notes preview */}
                  {favorite.notes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
                      📝 {favorite.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/search?provider=${favorite.provider_id}`)}
                      className="h-8"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Voir le profil
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/messages?provider=${favorite.provider_id}`)}
                      className="h-8"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Contacter
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openNotes(favorite)}
                      className="h-8"
                    >
                      <StickyNote className="h-3 w-3" />
                    </Button>

                    {/* Alert Toggle */}
                    <button
                      onClick={() => handleToggleAlert(favorite.provider_id, favorite.alert_availability)}
                      className={`p-1.5 rounded-md transition-colors ${
                        favorite.alert_availability 
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      title={favorite.alert_availability ? 'Désactiver l\'alerte' : 'Activer l\'alerte disponibilité'}
                    >
                      {favorite.alert_availability ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFavorite(favorite.provider_id, favorite.provider_name)}
                      className="h-8 text-destructive hover:text-destructive ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Alert badge */}
              {favorite.alert_availability && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <Bell className="h-3 w-3" />
                    <span>Alerte disponibilité activée</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Notes Dialog */}
      <Dialog open={!!editingFavorite} onOpenChange={(open) => !open && setEditingFavorite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Notes sur {editingFavorite?.provider_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vos notes personnelles</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Excellent pour les mariages, disponible le week-end..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ces notes sont privées et visibles uniquement par vous.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingFavorite(null)}>
                Annuler
              </Button>
              <Button onClick={handleSaveNotes}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FavoritesManager;
