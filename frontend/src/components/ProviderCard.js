import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Euro, BadgeCheck, Lock, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ProviderCard = ({ provider }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) setUser(await res.json());
      } catch (e) {}
    };
    checkAuth();
  }, []);

  const isAuth = !!user;

  if (expanded) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4" onClick={() => setExpanded(false)}>
        <div className="max-w-4xl mx-auto bg-white rounded-sm p-8 my-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-heading font-semibold">{provider.business_name}</h2>
                {provider.verified && (
                  <Badge className="bg-accent text-accent-foreground">
                    <BadgeCheck className="h-3 w-3 mr-1" />Vérifié
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Badge variant="secondary">{provider.category}</Badge>
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{provider.location}</span>
                {provider.rating > 0 && (
                  <span className="flex items-center">
                    <Star className="h-4 w-4 fill-accent text-accent mr-1" />
                    {provider.rating} ({provider.total_reviews})
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-6 w-6" />
            </button>
          </div>

          {!isAuth && (
            <div className="mb-6 p-6 bg-secondary/20 rounded-sm border-2 border-accent/20 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Pour contacter ce prestataire</h3>
              <p className="text-muted-foreground mb-4">Créez un compte gratuit ou connectez-vous</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary text-primary-foreground rounded-full">
                  Créer un compte
                </button>
                <button onClick={() => navigate('/login')} className="px-6 py-2 border-2 border-primary text-primary rounded-full">
                  Se connecter
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {provider.portfolio_images && provider.portfolio_images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {provider.portfolio_images.slice(0, 4).map((img, idx) => (
                  <img key={idx} src={img} alt="" className="w-full h-48 object-cover rounded-sm" />
                ))}
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Services</h3>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((s, i) => (
                  <Badge key={i} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tarifs</p>
                  <p className="text-2xl font-semibold">{provider.pricing_range}</p>
                </div>
                {provider.phone && (
                  <div className={isAuth ? '' : 'relative'}>
                    <p className="text-sm text-muted-foreground mb-1">Téléphone</p>
                    <p className={isAuth ? 'font-medium' : 'font-medium blur-sm'}>{provider.phone}</p>
                    {!isAuth && (
                      <div className="absolute inset-0 flex items-center">
                        <Lock className="h-5 w-5 text-accent" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isAuth ? (
                <div className="flex gap-3">
                  <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 bg-primary text-primary-foreground rounded-full">
                    Demander un devis
                  </button>
                  <button onClick={() => navigate('/messages')} className="flex-1 py-3 border-2 border-primary text-primary rounded-full">
                    Message
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate('/login')} className="w-full py-3 bg-primary text-primary-foreground rounded-full">
                  🔒 Se connecter pour contacter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }} data-testid={`provider-card-${provider.provider_id}`}>
      <Card className="provider-card overflow-hidden border-border/50 hover:shadow-lg group">
        <div className="relative h-48 overflow-hidden bg-muted">
          {provider.portfolio_images && provider.portfolio_images.length > 0 ? (
            <img
              src={provider.portfolio_images[0]}
              alt={provider.business_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Aucune image</span>
            </div>
          )}
          {provider.verified && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-accent text-accent-foreground">
                <BadgeCheck className="h-3 w-3 mr-1" />Vérifié
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
              {provider.business_name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {provider.category}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {provider.description}
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{provider.location}</span>
            </div>
            {provider.rating > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-medium text-foreground">{provider.rating}</span>
                <span className="text-xs text-muted-foreground">({provider.total_reviews})</span>
              </div>
            )}
          </div>

          <div className="flex items-center text-sm pt-2 border-t border-border">
            <Euro className="h-4 w-4 mr-1 text-accent" />
            <span className="font-medium text-foreground">{provider.pricing_range}</span>
          </div>
          
          <div className="pt-2 text-center">
            <span className="text-sm text-accent font-medium">→ Cliquer pour voir les détails</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProviderCard;