import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Phone, BadgeCheck, MessageSquare, Calendar, Euro } from 'lucide-react';

const ProviderDetailPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchData();
  }, [providerId]);

  const fetchData = async () => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    
    try {
      const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (userRes.ok) setUser(await userRes.json());
    } catch (e) {}

    try {
      const res = await fetch(`${BACKEND_URL}/api/providers/${providerId}`);
      setProvider(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="text-center py-24">
          <p className="text-muted-foreground">Prestataire non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-heading font-medium">{provider.business_name}</h1>
                {provider.verified && (
                  <Badge className="bg-accent text-accent-foreground">
                    <BadgeCheck className="h-3 w-3 mr-1" />Vérifié
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <Badge variant="secondary">{provider.category}</Badge>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />{provider.location}
                </div>
                {provider.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-accent text-accent mr-1" />
                    {provider.rating} ({provider.total_reviews})
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="p-6">
                <h2 className="text-2xl font-heading font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
              </Card>
              <Card className="p-6">
                <h2 className="text-2xl font-heading font-semibold mb-4">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((service, i) => (
                    <Badge key={i} variant="secondary">{service}</Badge>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6 sticky top-24">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tarifs</p>
                    <div className="flex items-center text-2xl font-semibold">
                      <Euro className="h-6 w-6 mr-1 text-accent" />
                      {provider.pricing_range}
                    </div>
                  </div>
                  {provider.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Téléphone</p>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />{provider.phone}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3 pt-4 border-t">
                    <Button 
                      onClick={() => user ? navigate('/dashboard') : navigate('/login')}
                      className="w-full rounded-full"
                      data-testid="booking-btn"
                    >
                      <Calendar className="h-5 w-5 mr-2" />Réserver
                    </Button>
                    <Button
                      onClick={() => user ? navigate('/messages') : navigate('/login')}
                      variant="outline"
                      className="w-full rounded-full"
                      data-testid="message-btn"
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />Message
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailPage;
