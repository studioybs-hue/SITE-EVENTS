import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProviderCard from '@/components/ProviderCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
  });

  const categories = [
    'DJ',
    'Photographe',
    'Vidéaste',
    'Traiteur',
    'Décorateur',
    'Wedding Planner',
    'Fleuriste',
    'Animateur',
    'Loueur de matériel',
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchProviders();
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

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${BACKEND_URL}/api/providers?${params}`);
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.search) params.set('search', filters.search);
    setSearchParams(params);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="px-6 md:px-12 lg:px-24 py-12">
        {/* Search Header */}
        <div className="max-w-7xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-6">
            Rechercher un prestataire
          </h1>

          {/* Search Filters */}
          <div className="bg-white p-6 rounded-sm border border-border/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="h-12"
                data-testid="search-input"
              />
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger className="h-12" data-testid="category-select">
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
                data-testid="location-input"
              />
              <Button
                onClick={handleSearch}
                className="h-12 rounded-full bg-primary text-primary-foreground"
                data-testid="search-btn"
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
          ) : providers.length === 0 ? (
            <div className="text-center py-12" data-testid="no-results">
              <p className="text-muted-foreground">Aucun prestataire trouvé</p>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-6" data-testid="results-count">
                {providers.length} prestataire{providers.length > 1 ? 's' : ''} trouvé{providers.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {providers.map((provider) => (
                  <ProviderCard key={provider.provider_id} provider={provider} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;