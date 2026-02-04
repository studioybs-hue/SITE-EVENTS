import { Link } from 'react-router-dom';
import { MapPin, Star, Euro, BadgeCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ProviderCard = ({ provider }) => {
  // For now, just show details without navigation since ProviderDetailPage has Babel issues
  return (
    <Card className="provider-card overflow-hidden border-border/50 hover:shadow-lg group" data-testid={`provider-card-${provider.provider_id}`}>
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
        
        <div className="pt-2">
          <p className="text-xs text-muted-foreground italic">
            Voir plus de détails et contacter via Dashboard
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ProviderCard;