import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MarketplaceCard from '@/components/MarketplaceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
  });
  const [itemData, setItemData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    rental_available: false,
    rental_price_per_day: '',
    location: '',
    condition: 'good',
    images: [],
  });

  const categories = [
    'Audio', 'Lumières', 'Décoration', 'Mobilier',
    'Vidéo', 'Photographie', 'Cuisine', 'Autre'
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [searchParams]);

  const checkAuth = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      // Not authenticated
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);

      const response = await fetch(`${BACKEND_URL}/api/marketplace?${params}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    setSearchParams(params);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/marketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...itemData,
          price: parseFloat(itemData.price),
          rental_price_per_day: itemData.rental_price_per_day ? parseFloat(itemData.rental_price_per_day) : null,
        }),
      });

      if (response.ok) {
        toast.success('Article créé avec succès !');
        setCreateOpen(false);
        fetchItems();
        setItemData({
          title: '',
          description: '',
          category: '',
          price: '',
          rental_available: false,
          rental_price_per_day: '',
          location: '',
          condition: 'good',
          images: [],
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Échec de la création');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="px-6 md:px-12 lg:px-24 py-12">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-2">
                Marketplace B2B
              </h1>
              <p className="text-muted-foreground">
                Achetez ou louez du matériel professionnel entre prestataires
              </p>
            </div>
            {user && user.user_type === 'provider' && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full" data-testid="create-item-btn">
                    <Plus className="h-5 w-5 mr-2" />
                    Ajouter un article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un article</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateItem} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                      <Label>Titre *</Label>
                      <Input
                        required
                        value={itemData.title}
                        onChange={(e) => setItemData({ ...itemData, title: e.target.value })}
                        data-testid="item-title-input"
                      />
                    </div>
                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        required
                        value={itemData.description}
                        onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
                        rows={4}
                        data-testid="item-description-input"
                      />
                    </div>
                    <div>
                      <Label>Catégorie *</Label>
                      <Select
                        value={itemData.category}
                        onValueChange={(value) => setItemData({ ...itemData, category: value })}
                      >
                        <SelectTrigger data-testid="item-category-select">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prix de vente (€) *</Label>
                      <Input
                        required
                        type="number"
                        value={itemData.price}
                        onChange={(e) => setItemData({ ...itemData, price: e.target.value })}
                        data-testid="item-price-input"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="rental"
                        checked={itemData.rental_available}
                        onChange={(e) => setItemData({ ...itemData, rental_available: e.target.checked })}
                        data-testid="rental-checkbox"
                      />
                      <Label htmlFor="rental">Disponible à la location</Label>
                    </div>
                    {itemData.rental_available && (
                      <div>
                        <Label>Prix de location par jour (€)</Label>
                        <Input
                          type="number"
                          value={itemData.rental_price_per_day}
                          onChange={(e) => setItemData({ ...itemData, rental_price_per_day: e.target.value })}
                          data-testid="rental-price-input"
                        />
                      </div>
                    )}
                    <div>
                      <Label>Localisation *</Label>
                      <Input
                        required
                        value={itemData.location}
                        onChange={(e) => setItemData({ ...itemData, location: e.target.value })}
                        data-testid="item-location-input"
                      />
                    </div>
                    <div>
                      <Label>État *</Label>
                      <Select
                        value={itemData.condition}
                        onValueChange={(value) => setItemData({ ...itemData, condition: value })}
                      >
                        <SelectTrigger data-testid="condition-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Neuf</SelectItem>
                          <SelectItem value="like_new">Comme neuf</SelectItem>
                          <SelectItem value="good">Bon état</SelectItem>
                          <SelectItem value="fair">Correct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" data-testid="submit-item-btn">
                      Créer l'article
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search Filters */}
          <div className="bg-white p-6 rounded-sm border border-border/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger className="h-12" data-testid="filter-category-select">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Localisation"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="h-12"
                data-testid="filter-location-input"
              />
              <Button
                onClick={handleSearch}
                className="h-12 rounded-full bg-primary text-primary-foreground"
                data-testid="filter-search-btn"
              >
                <Search className="h-5 w-5 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">Chargement...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12" data-testid="no-items">
              <p className="text-muted-foreground">Aucun article trouvé</p>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-6" data-testid="items-count">
                {items.length} article{items.length > 1 ? 's' : ''} trouvé{items.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                  <MarketplaceCard key={item.item_id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;