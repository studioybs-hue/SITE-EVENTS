import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Users, Calendar, MessageSquare, ShoppingBag, Wrench, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { useSiteMode } from '@/contexts/SiteModeContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { mode, theme, isEvents, isPro, clearMode } = useSiteMode();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Images for categories based on mode
  const categoryImages = {
    // Events
    photographer: 'https://images.unsplash.com/photo-1761435728013-a2169d043924?crop=entropy&cs=srgb&fm=jpg&q=85',
    videographer: 'https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?crop=entropy&cs=srgb&fm=jpg&q=85',
    dj: 'https://images.unsplash.com/photo-1524680319993-fe837ad4bf2d?crop=entropy&cs=srgb&fm=jpg&q=85',
    caterer: 'https://images.unsplash.com/photo-1745573674360-644c2edec427?crop=entropy&cs=srgb&fm=jpg&q=85',
    florist: 'https://images.unsplash.com/photo-1561459821-7b58693c171a?crop=entropy&cs=srgb&fm=jpg&q=85',
    decorator: 'https://images.unsplash.com/photo-1478146059778-58e4e2d9f926?crop=entropy&cs=srgb&fm=jpg&q=85',
    makeup: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?crop=entropy&cs=srgb&fm=jpg&q=85',
    venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?crop=entropy&cs=srgb&fm=jpg&q=85',
    animator: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?crop=entropy&cs=srgb&fm=jpg&q=85',
    wedding_planner: 'https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=srgb&fm=jpg&q=85',
    // Pro
    electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?crop=entropy&cs=srgb&fm=jpg&q=85',
    plumber: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?crop=entropy&cs=srgb&fm=jpg&q=85',
    locksmith: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=srgb&fm=jpg&q=85',
    painter: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?crop=entropy&cs=srgb&fm=jpg&q=85',
    carpenter: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?crop=entropy&cs=srgb&fm=jpg&q=85',
    gardener: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?crop=entropy&cs=srgb&fm=jpg&q=85',
    hvac: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?crop=entropy&cs=srgb&fm=jpg&q=85',
    cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?crop=entropy&cs=srgb&fm=jpg&q=85',
    mason: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?crop=entropy&cs=srgb&fm=jpg&q=85',
    mover: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?crop=entropy&cs=srgb&fm=jpg&q=85',
  };

  // Hero images based on mode
  const heroImages = {
    events: 'https://images.unsplash.com/photo-1745573672923-6cf4c5979dd2?crop=entropy&cs=srgb&fm=jpg&q=85',
    pro: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?crop=entropy&cs=srgb&fm=jpg&q=85',
  };

  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, [mode]);

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

  const fetchCategories = async () => {
    if (!mode) return;
    try {
      setLoadingCategories(true);
      const response = await fetch(`${BACKEND_URL}/api/categories/${mode}`);
      if (response.ok) {
        const data = await response.json();
        // Add images to categories
        const categoriesWithImages = data.slice(0, 4).map(cat => ({
          ...cat,
          image: categoryImages[cat.id] || 'https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=srgb&fm=jpg&q=85'
        }));
        setCategories(categoriesWithImages);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Mode-specific content
  const content = {
    events: {
      heroLabel: 'Plateforme Événementielle Premium',
      heroTitle: 'Votre évènement parfait commence ici',
      heroSubtitle: 'Connectez-vous avec les meilleurs prestataires événementiels. Photographes, DJ, traiteurs, décorateurs... Tout pour créer des moments inoubliables.',
      categoriesTitle: 'Nos catégories événementielles',
      categoriesSubtitle: 'Découvrez nos prestataires sélectionnés dans chaque catégorie',
      packagesTitle: 'Packs Événement',
      packagesSubtitle: 'Économisez jusqu\'à 30% en combinant plusieurs prestataires. DJ, photographe, traiteur... Tout inclus dans un seul pack négocié pour vous.',
      ctaTitle: 'Prêt à organiser votre évènement ?',
      ctaSubtitle: 'Rejoignez des milliers de clients satisfaits et découvrez les meilleurs prestataires pour votre évènement.',
      footerDescription: 'La plateforme de référence pour vos évènements inoubliables.',
    },
    pro: {
      heroLabel: 'Services Professionnels',
      heroTitle: 'Des artisans qualifiés pour tous vos travaux',
      heroSubtitle: 'Électriciens, plombiers, serruriers, peintres... Trouvez rapidement des professionnels certifiés près de chez vous.',
      categoriesTitle: 'Nos corps de métier',
      categoriesSubtitle: 'Des artisans qualifiés pour tous vos besoins',
      packagesTitle: 'Packs Rénovation',
      packagesSubtitle: 'Économisez jusqu\'à 25% en combinant plusieurs artisans. Électricien, plombier, peintre... Tout inclus dans un seul pack.',
      ctaTitle: 'Besoin d\'un professionnel ?',
      ctaSubtitle: 'Trouvez rapidement un artisan qualifié pour vos travaux.',
      footerDescription: 'La plateforme de référence pour trouver des artisans qualifiés.',
    },
  };

  const currentContent = content[mode] || content.events;

  const features = isEvents ? [
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
  ] : [
    {
      icon: Search,
      title: 'Recherche rapide',
      description: 'Trouvez un artisan disponible près de chez vous en quelques clics',
    },
    {
      icon: Wrench,
      title: 'Devis gratuit',
      description: 'Recevez des devis détaillés et comparez les offres',
    },
    {
      icon: MessageSquare,
      title: 'Contact direct',
      description: 'Discutez directement avec les professionnels',
    },
    {
      icon: Calendar,
      title: 'Intervention rapide',
      description: 'Des artisans disponibles pour vos urgences',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

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
                <span className={`text-xs uppercase tracking-widest font-semibold mb-4 block ${isPro ? 'text-blue-500' : 'text-accent'}`}>
                  {currentContent.heroLabel}
                </span>
                <h1 className="text-5xl md:text-7xl font-heading font-medium tracking-tight leading-tight text-foreground">
                  {currentContent.heroTitle}
                </h1>
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
                {currentContent.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/search')}
                  className={`rounded-full h-12 px-8 text-white hover:scale-105 transition-transform ${isPro ? 'bg-blue-500 hover:bg-blue-600' : 'bg-primary'}`}
                  data-testid="hero-search-btn"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {isEvents ? 'Rechercher un prestataire' : 'Trouver un artisan'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login/pro')}
                  className={`rounded-full h-12 px-8 transition-colors ${isPro ? 'border-blue-500 hover:bg-blue-500 hover:text-white' : 'border-primary hover:bg-primary hover:text-primary-foreground'}`}
                  data-testid="hero-provider-btn"
                >
                  <Users className="h-5 w-5 mr-2" />
                  {isEvents ? 'Espace Prestataire' : 'Espace Artisan'}
                </Button>
              </div>
              
              {/* Mode switcher */}
              <div className="pt-4">
                <button
                  onClick={clearMode}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  data-testid="switch-mode-btn"
                >
                  <ArrowRight className="h-4 w-4" />
                  {isEvents ? 'Voir les services professionnels' : 'Voir les événements'}
                </button>
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
                  src={heroImages[mode] || heroImages.events}
                  alt={isEvents ? 'Évènement élégant' : 'Artisan professionnel'}
                  className="rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full"
                />
                {/* Mode badge */}
                <div className={`absolute -bottom-4 -left-4 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg ${isPro ? 'bg-blue-500' : 'bg-primary'}`}>
                  {isPro ? (
                    <span className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Mode Professionnels
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Mode Événements
                    </span>
                  )}
                </div>
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
              {currentContent.categoriesTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {currentContent.categoriesSubtitle}
            </p>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isPro ? 'border-blue-500' : 'border-accent'}`}></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => navigate(`/search?category=${category.name}`)}
                  className="cursor-pointer group"
                  data-testid={`category-${category.id}`}
                >
                  <div className="relative h-64 overflow-hidden rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                      <div>
                        <span className="text-2xl mb-2 block">{category.icon}</span>
                        <h3 className="text-2xl font-heading font-medium text-white">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* View all categories button */}
          <div className="text-center mt-12">
            <Button
              variant="outline"
              onClick={() => navigate('/search')}
              className={`rounded-full px-8 ${isPro ? 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white' : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`}
              data-testid="view-all-categories-btn"
            >
              Voir toutes les catégories
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-4">
              Pourquoi choisir Lumière {isEvents ? 'Events' : 'Pro'} ?
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
                <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${isPro ? 'bg-blue-500/10' : 'bg-secondary'}`}>
                  <feature.icon className={`h-6 w-6 ${isPro ? 'text-blue-500' : 'text-primary'}`} />
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
      {isEvents && (
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
                  {currentContent.packagesTitle}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {currentContent.packagesSubtitle}
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
      )}

      {/* CTA Section */}
      <section className={`py-24 md:py-32 px-6 md:px-12 lg:px-24 text-white ${isPro ? 'bg-blue-600' : 'bg-primary'}`}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight">
            {currentContent.ctaTitle}
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {currentContent.ctaSubtitle}
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/search')}
            className={`rounded-full h-12 px-8 hover:scale-105 transition-transform ${isPro ? 'bg-white text-blue-600 hover:bg-gray-100' : 'bg-accent text-accent-foreground'}`}
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
              <h3 className="text-xl font-heading font-semibold">
                Lumière {isEvents ? 'Events' : 'Pro'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentContent.footerDescription}
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
            <p>© 2026 Lumière {isEvents ? 'Events' : 'Pro'}. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
