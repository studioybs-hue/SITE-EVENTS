import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, BadgeCheck, Lock, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const ProviderDetailPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      try {
        const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (userRes.ok) setUser(await userRes.json());
      } catch (e) {}

      try {
        const [providerRes, reviewsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/providers/${providerId}`),
          fetch(`${BACKEND_URL}/api/reviews/${providerId}`)
        ]);
        
        if (providerRes.ok) setProvider(await providerRes.json());
        if (reviewsRes.ok) setReviews(await reviewsRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [providerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="text-center py-24">
          <p className="text-muted-foreground">Prestataire non trouvé</p>
          <Button onClick={() => navigate('/search')} className="mt-4">
            Retour à la recherche
          </Button>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-4xl md:text-5xl font-heading font-medium text-foreground" data-testid="provider-name">
                {provider.business_name}
              </h1>
              {provider.verified && (
                <Badge className="bg-accent text-accent-foreground" data-testid="verified-badge">
                  <BadgeCheck className="h-4 w-4 mr-1" />
                  Vérifié
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <Badge variant="secondary" className="text-sm">{provider.category}</Badge>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{provider.location}</span>
              </div>
              {provider.rating > 0 && (
                <div className="flex items-center" data-testid="provider-rating">
                  <Star className="h-4 w-4 fill-accent text-accent mr-1" />
                  <span className="font-medium">{provider.rating}</span>
                  <span className="ml-1 text-sm">({provider.total_reviews} avis)</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Auth Gate for Non-Authenticated Users */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="mb-8 p-8 bg-gradient-to-br from-secondary/20 to-muted/30 border-2 border-accent/20">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-accent" />
                  </div>
                  <h2 className="text-2xl font-heading font-semibold mb-3">
                    Pour contacter ce prestataire
                  </h2>
                  <p className="text-muted-foreground mb-6 text-lg">
                    Créez un compte gratuit ou connectez-vous pour accéder aux coordonnées complètes, envoyer des messages et réserver directement.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      size="lg"
                      onClick={() => navigate('/login')}
                      className="rounded-full h-12 px-8 bg-primary text-primary-foreground hover:scale-105 transition-transform"
                      data-testid="auth-create-account-btn"
                    >
                      <UserPlus className="h-5 w-5 mr-2" />
                      Créer un compte gratuit
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/login')}
                      className="rounded-full h-12 px-8 border-primary hover:bg-primary hover:text-primary-foreground"
                      data-testid="auth-login-btn"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Se connecter
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio Images */}
              {provider.portfolio_images && provider.portfolio_images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {provider.portfolio_images.slice(0, 4).map((img, index) => (
                      <div
                        key={index}
                        className="relative h-64 overflow-hidden rounded-sm"
                        data-testid={`portfolio-image-${index}`}
                      >
                        <img
                          src={img}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-heading font-semibold mb-4">À propos</h2>
                  <p className="text-muted-foreground leading-relaxed" data-testid="provider-description">
                    {provider.description}
                  </p>
                </Card>
              </motion.div>

              {/* Services */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-heading font-semibold mb-4">Services proposés</h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service, i) => (
                      <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-heading font-semibold mb-6">Avis clients</h2>
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8" data-testid="no-reviews">
                      Aucun avis pour le moment
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {reviews.slice(0, isAuthenticated ? reviews.length : 3).map((review, idx) => (
                        <div 
                          key={review.review_id} 
                          className={`pb-6 border-b border-border last:border-0 ${!isAuthenticated && idx === 2 ? 'relative' : ''}`}
                          data-testid="review-item"
                        >
                          <div className="flex items-center space-x-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-accent text-accent'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed">{review.comment}</p>
                          
                          {!isAuthenticated && idx === 2 && (
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-4">
                              <p className="text-sm text-muted-foreground font-medium">
                                Connectez-vous pour voir tous les avis
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6 sticky top-24">
                <div className="space-y-6">
                  {/* Pricing */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tarifs</p>
                    <div className="text-3xl font-semibold text-foreground" data-testid="provider-pricing">
                      {provider.pricing_range}
                    </div>
                  </div>

                  {/* Contact Info - Blurred if not authenticated */}
                  {provider.phone && (
                    <div className={`relative ${!isAuthenticated ? 'select-none' : ''}`}>
                      <p className="text-sm text-muted-foreground mb-2">Téléphone</p>
                      <div className={`text-foreground font-medium ${!isAuthenticated ? 'blur-sm' : ''}`}>
                        {provider.phone}
                      </div>
                      {!isAuthenticated && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="h-4 w-4 text-accent" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    {isAuthenticated ? (
                      <>
                        <Button
                          onClick={() => navigate('/dashboard')}
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
                          data-testid="booking-btn"
                        >
                          Demander un devis
                        </Button>
                        <Button
                          onClick={() => navigate(`/messages?user=${provider.user_id}`)}
                          variant="outline"
                          className="w-full h-12 rounded-full border-primary hover:bg-primary hover:text-primary-foreground"
                          data-testid="message-btn"
                        >
                          Envoyer un message
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => navigate('/login')}
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
                          data-testid="sidebar-auth-btn"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Se connecter pour contacter
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Inscription gratuite et rapide
                        </p>
                      </>
                    )}
                  </div>

                  {/* Trust Signals */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                        <BadgeCheck className="h-4 w-4 text-accent" />
                      </div>
                      <span>Prestataire vérifié</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                        <Star className="h-4 w-4 text-accent" />
                      </div>
                      <span>Paiement sécurisé</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailPage;
