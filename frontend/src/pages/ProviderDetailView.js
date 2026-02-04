import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function ProviderDetailView() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('selectedProvider');
    if (data) {
      setProvider(JSON.parse(data));
    }

    const checkAuth = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) setUser(await res.json());
      } catch (e) {}
    };
    checkAuth();
  }, []);

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">Prestataire non trouvé</p>
          <button 
            onClick={() => navigate('/search')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  const isAuth = !!user;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/search')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            ← Retour à la recherche
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl md:text-5xl font-heading font-medium text-foreground">
                {provider.business_name}
              </h1>
              {provider.verified && (
                <span className="px-3 py-1 bg-accent text-accent-foreground rounded-sm text-sm font-semibold">
                  ✓ Vérifié
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-sm text-sm">
                {provider.category}
              </span>
              <span>📍 {provider.location}</span>
              {provider.rating > 0 && (
                <span>⭐ {provider.rating} ({provider.total_reviews} avis)</span>
              )}
            </div>
          </div>

          {!isAuth && (
            <div className="mb-8 p-8 bg-white rounded-sm border-2 border-accent/20 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="text-5xl mb-4">🔒</div>
                <h2 className="text-2xl font-heading font-semibold mb-3">
                  Pour contacter ce prestataire
                </h2>
                <p className="text-muted-foreground mb-6 text-lg">
                  Créez un compte gratuit ou connectez-vous pour accéder aux coordonnées complètes,
                  envoyer des messages et réserver directement.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:scale-105 transition-transform"
                  >
                    👤 Créer un compte gratuit
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 border-2 border-primary text-primary rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    🔑 Se connecter
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {provider.portfolio_images && provider.portfolio_images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {provider.portfolio_images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="h-64 overflow-hidden rounded-sm">
                      <img src={img} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white p-6 rounded-sm border border-border">
                <h2 className="text-2xl font-heading font-semibold mb-4">À propos</h2>
                <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
              </div>

              <div className="bg-white p-6 rounded-sm border border-border">
                <h2 className="text-2xl font-heading font-semibold mb-4">Services proposés</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((service, i) => (
                    <span key={i} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-sm text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white p-6 rounded-sm border border-border sticky top-24">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tarifs</p>
                    <div className="text-3xl font-semibold text-foreground">
                      {provider.pricing_range}
                    </div>
                  </div>

                  {provider.phone && (
                    <div className={isAuth ? '' : 'relative'}>
                      <p className="text-sm text-muted-foreground mb-2">Téléphone</p>
                      <div className={isAuth ? 'text-foreground font-medium' : 'text-foreground font-medium blur-sm select-none'}>
                        {provider.phone}
                      </div>
                      {!isAuth && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl">🔒</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-border">
                    {isAuth ? (
                      <>
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium hover:scale-105 transition-transform"
                        >
                          Demander un devis
                        </button>
                        <button
                          onClick={() => navigate(`/messages?user=${provider.user_id}`)}
                          className="w-full py-3 border-2 border-primary text-primary rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          💬 Envoyer un message
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate('/login')}
                          className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium hover:scale-105 transition-transform"
                        >
                          🔒 Se connecter pour contacter
                        </button>
                        <p className="text-xs text-center text-muted-foreground">
                          Inscription gratuite et rapide
                        </p>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="mr-2">✓</span>
                      <span>Prestataire vérifié</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="mr-2">✓</span>
                      <span>Paiement sécurisé</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderDetailView;
