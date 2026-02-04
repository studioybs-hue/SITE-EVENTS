import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Euro, BadgeCheck, Lock, UserPlus, LogIn, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ProviderCard = ({ provider }) => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [open, setOpen] = React.useState(false);

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

  const isAuth = !!user;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div data-testid={`provider-card-${provider.provider_id}`}>
          <Card className="provider-card overflow-hidden border-border/50 hover:shadow-lg group cursor-pointer">
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
            </div>
          </Card>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading flex items-center gap-3">
            {provider.business_name}
            {provider.verified && (
              <Badge className="bg-accent text-accent-foreground">
                <BadgeCheck className="h-4 w-4 mr-1" />Vérifié
              </Badge>
            )}
          </DialogTitle>
          <div className="flex items-center gap-4 text-muted-foreground pt-2">
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

        <div className="space-y-6 mt-4">
          {!isAuth && (
            <div className="p-6 bg-gradient-to-br from-secondary/30 to-muted/40 rounded-sm border-2 border-accent/20 text-center">
              <div className="max-w-xl mx-auto">
                <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">
                  Pour contacter ce prestataire
                </h3>
                <p className="text-muted-foreground mb-6">
                  Créez un compte gratuit ou connectez-vous pour accéder aux coordonnées complètes, envoyer des messages et réserver directement.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => { setOpen(false); navigate('/login'); }}
                    className="rounded-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Créer un compte gratuit
                  </Button>
                  <Button
                    onClick={() => { setOpen(false); navigate('/login'); }}
                    variant="outline"
                    className="rounded-full"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Se connecter
                  </Button>
                </div>
              </div>
            </div>
          )}

          {provider.portfolio_images && provider.portfolio_images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {provider.portfolio_images.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Portfolio ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-sm"
                />
              ))}
            </div>
          )}

          <div>
            <h3 className="text-xl font-heading font-semibold mb-3">À propos</h3>
            <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-semibold mb-3">Services proposés</h3>
            <div className="flex flex-wrap gap-2">
              {provider.services.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tarifs</p>
                <div className="text-2xl font-semibold text-foreground">{provider.pricing_range}</div>
              </div>
              {provider.phone && (
                <div className={isAuth ? '' : 'relative'}>
                  <p className="text-sm text-muted-foreground mb-2">Téléphone</p>
                  <div className={isAuth ? 'font-medium flex items-center' : 'font-medium flex items-center blur-sm select-none'}>
                    <Phone className="h-4 w-4 mr-2" />
                    {provider.phone}
                  </div>
                  {!isAuth && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-accent" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {isAuth ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => { setOpen(false); navigate('/dashboard'); }}
                  className="flex-1 rounded-full h-12"
                >
                  Demander un devis
                </Button>
                <Button
                  onClick={() => { setOpen(false); navigate(`/messages?user=${provider.user_id}`); }}
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                >
                  Envoyer un message
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => { setOpen(false); navigate('/login'); }}
                className="w-full rounded-full h-12"
              >
                <Lock className="h-4 w-4 mr-2" />
                Se connecter pour contacter
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderCard;