import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Users, Star, TrendingDown, Check, X, MapPin, Phone, Mail, MessageCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const PackagesPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [eventTypeFilter, setEventTypeFilter] = React.useState('');
  const [selectedPack, setSelectedPack] = React.useState(null);
  const [providerDetails, setProviderDetails] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  const eventTypes = ['Mariage', 'Anniversaire', 'Événement professionnel', 'Autre'];
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  React.useEffect(() => {
    checkAuth();
    fetchPackages();
  }, [eventTypeFilter]);

  const checkAuth = async () => {
    try {
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

  const handleViewPack = async (pkg) => {
    setSelectedPack(pkg);
    
    // Get provider details
    const providerId = pkg.provider_id || (pkg.providers && pkg.providers[0]?.provider_id);
    if (providerId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/providers/${providerId}`);
        if (res.ok) {
          const provider = await res.json();
          setProviderDetails(provider);
        }
      } catch (e) {
        console.error('Error fetching provider:', e);
      }
    }
    setShowModal(true);
  };

  const handleContactProvider = () => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/packages' } });
      return;
    }
    if (providerDetails) {
      navigate('/messages', { state: { providerId: providerDetails.provider_id } });
    }
  };

  const handleBookPack = () => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/packages' } });
      return;
    }
    // Navigate to provider page to book
    if (providerDetails) {
      navigate(`/search`, { state: { openProvider: providerDetails.provider_id, bookPack: selectedPack } });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPack(null);
    setProviderDetails(null);
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
                            {pkg.discount_percentage > 0 && (
                              <span className="text-sm text-muted-foreground line-through" data-testid="original-price">
                                {pkg.original_price || pkg.total_price}€
                              </span>
                            )}
                            <div className="text-3xl font-semibold text-foreground" data-testid="discounted-price">
                              {pkg.discounted_price || pkg.price}€
                            </div>
                          </div>
                          {pkg.discount_percentage > 0 && (
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Économie</div>
                              <div className="text-lg font-semibold text-accent">
                                {(pkg.original_price || pkg.total_price) - pkg.discounted_price}€
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleViewPack(pkg)}
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
                          data-testid="view-package-btn"
                        >
                          Voir ce pack
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

      {/* Pack Detail Modal */}
      {showModal && selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header with image */}
            <div className="relative h-48 bg-muted">
              {(selectedPack.image_url || selectedPack.image) ? (
                <img
                  src={selectedPack.image_url || selectedPack.image}
                  alt={selectedPack.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                  <Package className="h-16 w-16 text-accent/50" />
                </div>
              )}
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
              {selectedPack.discount_percentage > 0 && (
                <Badge className="absolute top-4 left-4 bg-accent text-white">
                  -{selectedPack.discount_percentage}% de réduction
                </Badge>
              )}
            </div>

            <div className="p-6">
              {/* Pack Title */}
              <h2 className="text-2xl font-bold mb-2">{selectedPack.name}</h2>
              <Badge variant="secondary" className="mb-4">{selectedPack.event_type || 'Événement'}</Badge>
              
              {/* Provider Info */}
              {providerDetails && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Prestataire
                  </h3>
                  <div className="flex items-center gap-4">
                    {providerDetails.profile_image && (
                      <img 
                        src={providerDetails.profile_image.startsWith('/') ? `${BACKEND_URL}${providerDetails.profile_image}` : providerDetails.profile_image}
                        alt={providerDetails.business_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{providerDetails.business_name}</p>
                      <p className="text-sm text-muted-foreground">{providerDetails.category}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {providerDetails.location}
                      </div>
                      {providerDetails.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{providerDetails.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-muted-foreground mb-6">{selectedPack.description}</p>

              {/* Services Included */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Services inclus</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {(selectedPack.services_included || selectedPack.services || selectedPack.features || []).map((service, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Prix du pack</p>
                    {selectedPack.discount_percentage > 0 && (
                      <span className="text-sm line-through text-muted-foreground mr-2">
                        {selectedPack.original_price || selectedPack.total_price}€
                      </span>
                    )}
                    <span className="text-3xl font-bold">{selectedPack.discounted_price || selectedPack.price}€</span>
                  </div>
                  {selectedPack.discount_percentage > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Économie</p>
                      <p className="text-xl font-semibold text-green-600">
                        {(selectedPack.original_price || selectedPack.total_price) - selectedPack.discounted_price}€
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleContactProvider}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
                <Button 
                  className="flex-1 bg-accent hover:bg-accent/90"
                  onClick={handleBookPack}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Réserver ce pack
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
