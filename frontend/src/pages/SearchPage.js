import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import ProviderCard from '@/components/ProviderCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, Wrench, Sparkles } from 'lucide-react';
import { useSiteMode } from '@/contexts/SiteModeContext';

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
  const { mode, isEvents, isPro, clearMode } = useSiteMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    country: searchParams.get('country') || '',
    event_date: searchParams.get('event_date') || '',
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (mode) {
      fetchCategories();
    }
  }, [mode]);

  useEffect(() => {
    fetchProviders();
  }, [searchParams]);

  const checkAuth = async () => {
    try {
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

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(`${BACKEND_URL}/api/categories/${mode}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.country && filters.country !== 'all') params.append('country', filters.country);
      if (filters.event_date) params.append('event_date', filters.event_date);
      if (filters.search) params.append('search', filters.search);
      // Filter providers by mode (events or pro)
      if (mode) params.append('mode', mode);

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
    if (filters.event_date) params.set('event_date', filters.event_date);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isPro ? (
                  <Wrench className="h-6 w-6 text-blue-500" />
                ) : (
                  <Sparkles className="h-6 w-6 text-accent" />
                )}
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${isPro ? 'bg-blue-500/10 text-blue-500' : 'bg-accent/10 text-accent'}`}>
                  Mode {isEvents ? 'Événements' : 'Professionnels'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground">
                {isEvents ? t('search.title') : 'Trouver un artisan'}
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={clearMode}
              className={`hidden md:flex items-center gap-2 ${isPro ? 'border-blue-500 text-blue-500' : 'border-primary text-primary'}`}
              data-testid="switch-mode-search-btn"
            >
              {isEvents ? 'Voir les professionnels' : 'Voir les événements'}
            </Button>
          </div>

          {/* Search Filters */}
          <div className="bg-white p-6 rounded-sm border border-border/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Input
                placeholder={isEvents ? t('search.placeholder') : 'Rechercher un artisan...'}
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
                  <SelectValue placeholder={isEvents ? t('search.category') : 'Corps de métier'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isEvents ? t('search.allCategories') : 'Tous les métiers'}</SelectItem>
                  {loadingCategories ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))
                  )}
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
              <div className="relative">
                <Input
                  type="date"
                  value={filters.event_date}
                  onChange={(e) => setFilters({ ...filters, event_date: e.target.value })}
                  className="h-12 pl-10"
                  data-testid="event-date-input"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <Input
                placeholder={t('search.location')}
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="h-12"
                data-testid="location-input"
              />
              <Button
                onClick={handleSearch}
                className={`h-12 rounded-full text-white ${isPro ? 'bg-blue-500 hover:bg-blue-600' : 'bg-primary'}`}
                data-testid="search-btn"
              >
                <Search className="h-5 w-5 mr-2" />
                {t('common.search')}
              </Button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        {!loadingCategories && categories.length > 0 && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilters({ ...filters, category: '' });
                  handleSearch();
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !filters.category || filters.category === 'all'
                    ? isPro ? 'bg-blue-500 text-white' : 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                data-testid="category-pill-all"
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFilters({ ...filters, category: cat.name });
                    const params = new URLSearchParams(searchParams);
                    params.set('category', cat.name);
                    setSearchParams(params);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    filters.category === cat.name
                      ? isPro ? 'bg-blue-500 text-white' : 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`category-pill-${cat.id}`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto ${isPro ? 'border-blue-500' : 'border-accent'}`}></div>
              <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12" data-testid="no-results">
              <div className="text-6xl mb-4">{isEvents ? '🎉' : '🔧'}</div>
              <p className="text-xl font-medium text-foreground mb-2">
                {isEvents ? 'Aucun prestataire trouvé' : 'Aucun artisan trouvé'}
              </p>
              <p className="text-muted-foreground">{t('search.noResults')}</p>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-6" data-testid="results-count">
                {providers.length} {isEvents ? t('search.results') : 'artisans trouvés'}
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
