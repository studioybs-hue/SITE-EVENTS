import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Users, Star, TrendingDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const PackagesPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [eventTypeFilter, setEventTypeFilter] = React.useState('');

  const eventTypes = ['Mariage', 'Anniversaire', 'Événement professionnel', 'Autre'];

  React.useEffect(() => {
    checkAuth();
    fetchPackages();
  }, [eventTypeFilter]);

  const checkAuth = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (response.ok) setUser(await response.json());
    } catch (e) {}
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const params = new URLSearchParams();
      if (eventTypeFilter) params.append('event_type', eventTypeFilter);

      // Fetch both event packages and provider packs
      const [eventPackagesRes, providerPacksRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/packages?${params}`),
        fetch(`${BACKEND_URL}/api/packs?${params}`)
      ]);
      
      const eventPackages = await eventPackagesRes.json();
      const providerPacks = await providerPacksRes.json();
      
      // Normalize provider packs to match event package format
      const normalizedProviderPacks = (providerPacks || []).map(pack => ({
        ...pack,
        package_id: pack.pack_id,
        original_price: pack.price,
        total_price: pack.price,
        discounted_price: pack.price,
        discount_percentage: 0,
        services_included: pack.features || [],
        services: pack.features || [],
        providers: pack.provider ? [pack.provider] : [],
        is_provider_pack: true
      }));
      
      // Combine both types
      const allPackages = [...(eventPackages || []), ...normalizedProviderPacks];
      setPackages(allPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPackage = (packageId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/dashboard', { state: { bookPackage: packageId } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />

      <div className="px-6 md:px-12 lg:px-24 py-12">
        {/* Hero Section */}
        <motion.div 
          className="max-w-7xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-secondary/50 px-4 py-2 rounded-full mb-6">
            <Package className="h-4 w-4 text-accent" />
            <span className="text-xs uppercase tracking-widest font-semibold text-accent">
              Offres Exclusives
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-medium tracking-tight text-foreground mb-6">
            Packs Événement
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Économisez jusqu'à 30% en combinant plusieurs prestataires. Organisez votre événement en toute sérénité avec nos packs tout-en-un.
          </p>

          {/* Filter */}
          <div className="max-w-md mx-auto">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="h-12 bg-white" data-testid="event-type-filter">
                <SelectValue placeholder="Tous les types d'événements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Packages Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">Chargement des packs...</p>
            </div>
          ) : packages.length === 0 ? (
            <Card className="p-12 text-center" data-testid="no-packages">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun pack disponible</h3>
              <p className="text-muted-foreground mb-6">
                Les packs seront bientôt disponibles. Revenez plus tard !
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.package_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col" data-testid={`package-card-${pkg.package_id || pkg.pack_id}`}>
                    {/* Image */}
                    <div className="relative h-48 bg-muted">
                      {(pkg.image_url || pkg.image) ? (
                        <img
                          src={pkg.image_url || pkg.image}
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                          <Package className="h-16 w-16 text-accent/50" />
                        </div>
                      )}
                      {/* Discount Badge - only show if there's a discount */}
                      {pkg.discount_percentage > 0 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-accent text-accent-foreground font-semibold" data-testid="discount-badge">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            -{pkg.discount_percentage}%
                          </Badge>
                        </div>
                      )}
                      {/* Provider Pack Badge */}
                      {pkg.is_provider_pack && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-blue-500 text-white font-semibold">
                            Pack Prestataire
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-2xl font-heading font-semibold text-foreground mb-2" data-testid="package-name">
                          {pkg.name}
                        </h3>
                        {/* Provider name for provider packs */}
                        {pkg.is_provider_pack && pkg.provider && (
                          <p className="text-sm text-accent font-medium mb-2">
                            Par {pkg.provider.business_name}
                          </p>
                        )}
                        <Badge variant="secondary" className="text-xs mb-3">
                          {pkg.event_type || 'Événement'}
                        </Badge>
                        <p className="text-sm text-muted-foreground leading-relaxed" data-testid="package-description">
                          {pkg.description}
                        </p>
                      </div>

                      {/* Providers */}
                      <div className="mb-4">
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{(pkg.providers || []).length} prestataires inclus</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(pkg.providers || []).slice(0, 3).map((provider, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {provider.category || provider.service_type || 'Prestataire'}
                            </Badge>
                          ))}
                          {(pkg.providers || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{pkg.providers.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Services */}
                      <div className="mb-6 flex-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                          Services inclus
                        </p>
                        <ul className="space-y-1">
                          {(pkg.services_included || pkg.services || []).slice(0, 4).map((service, i) => (
                            <li key={i} className="flex items-start text-sm">
                              <Check className="h-4 w-4 text-accent mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{service}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pricing */}
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-baseline justify-between mb-4">
                          <div>
                            <span className="text-sm text-muted-foreground line-through" data-testid="original-price">
                              {pkg.original_price || pkg.total_price}€
                            </span>
                            <div className="text-3xl font-semibold text-foreground" data-testid="discounted-price">
                              {pkg.discounted_price}€
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Économie</div>
                            <div className="text-lg font-semibold text-accent">
                              {(pkg.original_price || pkg.total_price) - pkg.discounted_price}€
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleBookPackage(pkg.package_id)}
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
                          data-testid="book-package-btn"
                        >
                          Réserver ce pack
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto mt-24">
          <div className="bg-gradient-to-br from-secondary/30 to-muted/50 rounded-sm p-12 text-center">
            <h2 className="text-3xl font-heading font-semibold mb-6">
              Pourquoi choisir un pack ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Économies garanties</h3>
                <p className="text-sm text-muted-foreground">
                  Jusqu'à 30% de réduction sur le tarif normal
                </p>
              </div>
              <div>
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Coordination simplifiée</h3>
                <p className="text-sm text-muted-foreground">
                  Tous vos prestataires en un seul booking
                </p>
              </div>
              <div>
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Qualité vérifiée</h3>
                <p className="text-sm text-muted-foreground">
                  Prestataires sélectionnés qui travaillent ensemble
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackagesPage;
