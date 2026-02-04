import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Euro, BadgeCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React from 'react';

const ProviderCard = ({ provider }) => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) setUser(await res.json());
      } catch (e) {}
    };
    checkAuth();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="provider-card overflow-hidden border-border/50 hover:shadow-lg group cursor-pointer" data-testid={`provider-card-${provider.provider_id}`}>
          {/* Image */}
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
                <Badge className="bg-accent text-accent-foreground" data-testid="verified-badge">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-1" data-testid="provider-name">
                {provider.business_name}
              </h3>
              <Badge variant="secondary" className="text-xs" data-testid="provider-category">
                {provider.category}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2" data-testid="provider-description">
              {provider.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span data-testid="provider-location">{provider.location}</span>
              </div>
              {provider.rating > 0 && (
                <div className="flex items-center space-x-1" data-testid="provider-rating">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{provider.rating}</span>
                  <span className="text-xs text-muted-foreground">({provider.total_reviews})</span>
                </div>
              )}
            </div>

            <div className="flex items-center text-sm pt-2 border-t border-border">
              <Euro className="h-4 w-4 mr-1 text-accent" />
              <span className="font-medium text-foreground" data-testid="provider-pricing">{provider.pricing_range}</span>
            </div>
          </div>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading">
            {provider.business_name}
            {provider.verified && (
              <Badge className="ml-3 bg-accent text-accent-foreground">
                <BadgeCheck className="h-3 w-3 mr-1" />Vérifié
              </Badge>
            )}
          </DialogTitle>
          <div className="flex items-center space-x-4 text-muted-foreground pt-2">
            <Badge variant="secondary">{provider.category}</Badge>
            <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{provider.location}</span>
            {provider.rating > 0 && (
              <span className="flex items-center">
                <Star className="h-4 w-4 fill-accent text-accent mr-1" />
                {provider.rating} ({provider.total_reviews} avis)
              </span>
            )}
          </div>
        </DialogHeader>

        {!user && (
          <div className="my-6 p-6 bg-secondary/20 rounded-sm border-2 border-accent/20 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Pour contacter ce prestataire</h3>
            <p className="text-muted-foreground mb-4">
              Créez un compte gratuit ou connectez-vous
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/login')} className="rounded-full">
                Créer un compte
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">
                Se connecter
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {provider.portfolio_images && provider.portfolio_images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {provider.portfolio_images.slice(0, 4).map((img, idx) => (
                <img key={idx} src={img} alt={`Portfolio ${idx + 1}`} className="w-full h-48 object-cover rounded-sm" />
              ))}
            </div>
          )}

          <div>
            <h3 className="text-xl font-heading font-semibold mb-3">À propos</h3>
            <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-semibold mb-3">Services</h3>
            <div className="flex flex-wrap gap-2">
              {provider.services.map((s, i) => (
                <Badge key={i} variant="secondary">{s}</Badge>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Tarifs</p>
                <p className="text-2xl font-semibold">{provider.pricing_range}</p>
              </div>
              {provider.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className={user ? 'font-medium' : 'font-medium blur-sm'}>
                    {provider.phone}
                  </p>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex gap-3">
                <Button onClick={() => navigate('/dashboard')} className="flex-1 rounded-full">
                  Demander un devis
                </Button>
                <Button onClick={() => navigate(`/messages?user=${provider.user_id}`)} variant="outline" className="flex-1 rounded-full">
                  Envoyer un message
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate('/login')} className="w-full rounded-full">
                🔒 Se connecter pour contacter
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderCard;