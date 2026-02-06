import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Star, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PricingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        
        // Get current subscription if provider
        if (data.user_type === 'provider') {
          const subRes = await fetch(`${BACKEND_URL}/api/subscriptions/my-subscription`, { 
            credentials: 'include' 
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            setCurrentPlan(subData.plan?.plan_id || 'free');
          }
        }
      }
    } catch (e) {
      // Not authenticated
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/subscriptions/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans);
      }
    } catch (e) {
      console.error('Error fetching plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/login-pro');
      return;
    }

    if (user.user_type !== 'provider') {
      alert('Seuls les prestataires peuvent souscrire à un abonnement');
      return;
    }

    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/subscriptions/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: isYearly ? 'yearly' : 'monthly',
          origin_url: window.location.origin
        })
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      } else {
        const error = await res.json();
        alert(error.detail || 'Erreur lors de la création du paiement');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      alert('Erreur de connexion');
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'premium': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'pro': return <Star className="h-6 w-6 text-blue-500" />;
      default: return <Zap className="h-6 w-6 text-gray-500" />;
    }
  };

  const getPlanStyle = (planId) => {
    switch (planId) {
      case 'premium': 
        return {
          card: 'border-2 border-yellow-400 shadow-xl scale-105 bg-gradient-to-br from-yellow-50 to-orange-50',
          button: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
        };
      case 'pro': 
        return {
          card: 'border-2 border-blue-400 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50',
          button: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white'
        };
      default: 
        return {
          card: 'border border-gray-200',
          button: 'bg-gray-800 hover:bg-gray-900 text-white'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Choisissez votre formule
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Développez votre activité avec nos outils professionnels
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
              Mensuel
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
              Annuel
            </Label>
            {isYearly && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
                2 mois offerts
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const style = getPlanStyle(plan.plan_id);
            const price = isYearly ? plan.price_yearly : plan.price_monthly;
            const isCurrentPlan = currentPlan === plan.plan_id;
            
            return (
              <Card 
                key={plan.plan_id} 
                className={`relative transition-all duration-300 hover:shadow-lg ${style.card}`}
                data-testid={`plan-card-${plan.plan_id}`}
              >
                {plan.plan_id === 'premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1">
                      Populaire
                    </Badge>
                  </div>
                )}
                
                {plan.plan_id === 'pro' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1">
                      Recommandé
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.plan_id)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{price}€</span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{isYearly ? 'an' : 'mois'}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${style.button}`}
                    onClick={() => handleSubscribe(plan.plan_id)}
                    disabled={isCurrentPlan}
                    data-testid={`subscribe-btn-${plan.plan_id}`}
                  >
                    {isCurrentPlan ? (
                      'Abonnement actuel'
                    ) : plan.plan_id === 'free' ? (
                      'Commencer gratuitement'
                    ) : (
                      <>
                        Choisir {plan.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Puis-je changer de formule à tout moment ?</h3>
              <p className="text-muted-foreground">
                Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. 
                Le changement prendra effet à la fin de votre période de facturation en cours.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Comment fonctionne la commission ?</h3>
              <p className="text-muted-foreground">
                La commission est prélevée uniquement sur les réservations payées via la plateforme. 
                Plus votre abonnement est élevé, plus la commission est réduite.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Quels moyens de paiement acceptez-vous ?</h3>
              <p className="text-muted-foreground">
                Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
