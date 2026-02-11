import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Users, Target, Award, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const AboutPage = () => {
  const navigate = useNavigate();
  const [siteContent, setSiteContent] = useState(null);
  const siteMode = localStorage.getItem('siteMode') || 'events';
  const isEvents = siteMode === 'events';

  useEffect(() => {
    fetchSiteContent();
  }, []);

  const fetchSiteContent = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/site-content`);
      if (res.ok) {
        const data = await res.json();
        setSiteContent(data);
      }
    } catch (e) {
      console.error('Error fetching site content:', e);
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Communauté de prestataires',
      description: isEvents 
        ? 'Des centaines de professionnels de l\'événementiel à votre service'
        : 'Des artisans et professionnels qualifiés près de chez vous'
    },
    {
      icon: Target,
      title: 'Mise en relation simplifiée',
      description: 'Trouvez le prestataire idéal en quelques clics grâce à notre système de recherche avancé'
    },
    {
      icon: Award,
      title: 'Qualité garantie',
      description: 'Des profils vérifiés, des avis clients authentiques et un suivi personnalisé'
    },
    {
      icon: Heart,
      title: 'Satisfaction client',
      description: 'Notre priorité est votre satisfaction. Support disponible 7j/7'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              À propos de Je Suis {isEvents ? 'Events' : 'Pro'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {isEvents 
                ? 'La plateforme de référence pour organiser vos événements et mariages avec les meilleurs prestataires'
                : 'Votre solution pour trouver des professionnels qualifiés pour tous vos travaux et services'
              }
            </p>
          </div>

          {/* Mission */}
          <Card className="mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Notre Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                {isEvents ? (
                  <>
                    Je Suis Events a été créé avec une vision simple : faciliter l'organisation de vos événements 
                    en vous connectant avec les meilleurs prestataires de votre région. Que ce soit pour un mariage, 
                    une fête d'anniversaire, un événement d'entreprise ou toute autre célébration, nous vous aidons 
                    à trouver les professionnels qui transformeront votre vision en réalité.
                  </>
                ) : (
                  <>
                    Je Suis Pro connecte les particuliers avec des professionnels qualifiés pour tous types de travaux 
                    et services. Plombiers, électriciens, artisans... trouvez rapidement le bon professionnel, 
                    consultez les avis et réservez en toute confiance.
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <h2 className="text-2xl font-bold mb-6 text-center">Pourquoi nous choisir ?</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-4xl font-bold">{siteContent?.stats?.providers_count || '500+'}</p>
                  <p className="text-sm opacity-80">Prestataires</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">{siteContent?.stats?.events_count || '2000+'}</p>
                  <p className="text-sm opacity-80">{isEvents ? 'Événements' : 'Services'}</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">{siteContent?.stats?.satisfaction || '98%'}</p>
                  <p className="text-sm opacity-80">Satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Prêt à commencer ?</h2>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/search')}>
                Trouver un prestataire
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Devenir prestataire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
