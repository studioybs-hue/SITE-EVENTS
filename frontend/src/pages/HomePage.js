import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Users, Calendar, MessageSquare, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        // Not logged in
      }
    };
    checkAuth();
  }, [BACKEND_URL]);

  const handleLogout = () => {
    setUser(null);
  };

  const categories = [
    {
      name: 'Photographes',
      value: 'Photographe',
      image: 'https://images.unsplash.com/photo-1761435728013-a2169d043924?crop=entropy&cs=srgb&fm=jpg&q=85',
    },
    {
      name: 'DJ & Musiciens',
      value: 'DJ',
      image: 'https://images.unsplash.com/photo-1524680319993-fe837ad4bf2d?crop=entropy&cs=srgb&fm=jpg&q=85',
    },
    {
      name: 'Traiteurs',
      value: 'Traiteur',
      image: 'https://images.unsplash.com/photo-1745573674360-644c2edec427?crop=entropy&cs=srgb&fm=jpg&q=85',
    },
    {
      name: 'Fleuristes',
      value: 'Fleuriste',
      image: 'https://images.unsplash.com/photo-1561459821-7b58693c171a?crop=entropy&cs=srgb&fm=jpg&q=85',
    },
  ];

  const features = [
    {
      icon: Search,
      title: 'Recherche avancée',
      description: 'Trouvez le prestataire parfait selon vos critères et disponibilités',
    },
    {
      icon: Calendar,
      title: 'Réservation facile',
      description: 'Réservez en ligne avec paiement sécurisé et confirmation instantanée',
    },
    {
      icon: MessageSquare,
      title: 'Messagerie directe',
      description: 'Échangez en temps réel avec vos prestataires',
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace B2B',
      description: 'Pour les prestataires : achetez ou louez du matériel professionnel',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative hero-texture py-24 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Text Content */}
            <motion.div 
              className="md:col-span-7 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-accent mb-4 block">
                  Plateforme Événementielle Premium
                </span>
                <h1 className="text-5xl md:text-7xl font-heading font-medium tracking-tight leading-tight text-foreground">
                  Votre évènement parfait commence ici
                </h1>
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
                Connectez-vous avec les meilleurs prestataires événementiels. Photographes, DJ, traiteurs, décorateurs... Tout pour créer des moments inoubliables.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/search')}
                  className="rounded-full h-12 px-8 bg-primary text-primary-foreground hover:scale-105 transition-transform"
                  data-testid="hero-search-btn"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher un prestataire
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login/pro')}
                  className="rounded-full h-12 px-8 border-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  data-testid="hero-provider-btn"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Espace Prestataire
                </Button>
              </div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div 
              className="md:col-span-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1745573672923-6cf4c5979dd2?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Évènement élégant"
                  className="rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-4">
              Nos catégories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos prestataires sélectionnés dans chaque catégorie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => navigate(`/search?category=${category.value}`)}
                className="cursor-pointer group"
                data-testid={`category-${category.value}`}
              >
                <div className="relative h-64 overflow-hidden rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <h3 className="text-2xl font-heading font-medium text-white">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-4">
              Pourquoi choisir Lumière Events ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-sm border border-border/60 hover:shadow-lg transition-shadow"
                data-testid={`feature-${index}`}
              >
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Promo Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-gradient-to-br from-secondary/30 to-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs uppercase tracking-widest font-semibold text-accent mb-4 block">
                Nouvelle Fonctionnalité
              </span>
              <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-6">
                Packs Événement
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Économisez jusqu'à 30% en combinant plusieurs prestataires. DJ, photographe, traiteur... Tout inclus dans un seul pack négocié pour vous.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-semibold">✓</span>
                  </div>
                  <span className="text-foreground">Économies garanties jusqu'à 30%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-semibold">✓</span>
                  </div>
                  <span className="text-foreground">Coordination simplifiée entre prestataires</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-semibold">✓</span>
                  </div>
                  <span className="text-foreground">Prestataires sélectionnés qui travaillent ensemble</span>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/packages')}
                className="rounded-full h-12 px-8 bg-primary text-primary-foreground hover:scale-105 transition-transform"
                data-testid="cta-packages-btn"
              >
                Découvrir les packs
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Événement élégant"
                className="rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-sm shadow-lg border border-border">
                <div className="text-sm text-muted-foreground mb-1">Économies moyennes</div>
                <div className="text-3xl font-semibold text-accent">25%</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight">
            Prêt à organiser votre évènement ?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez des milliers de clients satisfaits et découvrez les meilleurs prestataires pour votre évènement.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/search')}
            className="rounded-full h-12 px-8 bg-accent text-accent-foreground hover:scale-105 transition-transform"
            data-testid="cta-search-btn"
          >
            Commencer maintenant
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-semibold">Lumière Events</h3>
              <p className="text-sm text-muted-foreground">
                La plateforme de référence pour vos évènements inoubliables.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/search" className="hover:text-accent transition-colors">Rechercher</a></li>
                <li><a href="/marketplace" className="hover:text-accent transition-colors">Marketplace</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 Lumière Events. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;