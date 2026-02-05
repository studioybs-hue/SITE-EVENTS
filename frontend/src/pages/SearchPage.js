import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import ProviderCard from '@/components/ProviderCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar } from 'lucide-react';

const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Espagne' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'US', name: 'États-Unis' },
  { code: 'CA', name: 'Canada' },
  { code: 'MA', name: 'Maroc' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'KM', name: 'Comores' },
];

const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    country: searchParams.get('country') || '',
    event_date: searchParams.get('event_date') || '',
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
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.country && filters.country !== 'all') params.append('country', filters.country);
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
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.country && filters.country !== 'all') params.set('country', filters.country);
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
            {t('search.title')}
          </h1>

          {/* Search Filters */}
          <div className="bg-white p-6 rounded-sm border border-border/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder={t('search.placeholder')}
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
                  <SelectValue placeholder={t('search.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('search.allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{t(`categories.${cat}`) || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.country}
                onValueChange={(value) => setFilters({ ...filters, country: value })}
              >
                <SelectTrigger className="h-12" data-testid="country-select">
                  <SelectValue placeholder={t('search.country')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('search.allCountries')}</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{t(`countries.${c.code}`) || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={t('search.location')}
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
                {t('common.search')}
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12" data-testid="no-results">
              <p className="text-muted-foreground">{t('search.noResults')}</p>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-6" data-testid="results-count">
                {providers.length} {t('search.results')}
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