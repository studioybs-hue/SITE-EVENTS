import { Link } from 'react-router-dom';
import { MapPin, Euro, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MarketplaceCard = ({ item }) => {
  return (
    <Link to={`/marketplace/${item.item_id}`} data-testid={`marketplace-item-${item.item_id}`}>
      <Card className="provider-card overflow-hidden border-border/50 hover:shadow-lg group">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {item.images && item.images.length > 0 ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Aucune image</span>
            </div>
          )}
          {item.rental_available && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-secondary text-secondary-foreground" data-testid="rental-badge">
                <Clock className="h-3 w-3 mr-1" />
                Location
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-heading text-xl font-semibold text-foreground mb-1" data-testid="item-title">
              {item.title}
            </h3>
            <Badge variant="secondary" className="text-xs" data-testid="item-category">
              {item.category}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2" data-testid="item-description">
            {item.description}
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span data-testid="item-location">{item.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center text-lg font-semibold text-foreground">
              <Euro className="h-5 w-5 mr-1 text-accent" />
              <span data-testid="item-price">{item.price}</span>
            </div>
            {item.rental_available && item.rental_price_per_day && (
              <div className="text-sm text-muted-foreground" data-testid="rental-price">
                {item.rental_price_per_day}€/jour
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default MarketplaceCard;