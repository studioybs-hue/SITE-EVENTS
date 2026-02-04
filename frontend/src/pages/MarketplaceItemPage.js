import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, MapPin, Euro, Clock, Package, User, 
  MessageCircle, Phone, Mail, Eye, Calendar, Check,
  ChevronLeft, ChevronRight, Loader2, Send, Tag
} from 'lucide-react';
import { toast } from 'sonner';

const CONDITION_LABELS = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'Correct'
};

const STATUS_LABELS = {
  available: { label: 'Disponible', color: 'bg-emerald-500' },
  reserved: { label: 'Réservé', color: 'bg-amber-500' },
  sold: { label: 'Vendu', color: 'bg-gray-500' },
  rented: { label: 'En location', color: 'bg-blue-500' }
};

const MarketplaceItemPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    message: '',
    inquiry_type: 'question',
    offer_amount: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchItem();
    checkAuth();
  }, [itemId]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        setUser(await response.json());
      }
    } catch (error) {}
  };

  const fetchItem = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/${itemId}`);
      if (response.ok) {
        const data = await response.json();
        setItem(data);
        
        // Fetch seller info
        if (data.seller_id) {
          try {
            const sellerRes = await fetch(`${BACKEND_URL}/api/providers?user_id=${data.seller_id}`);
            if (sellerRes.ok) {
              const providers = await sellerRes.json();
              const sellerProfile = providers.find(p => p.user_id === data.seller_id);
              if (sellerProfile) {
                setSeller(sellerProfile);
              }
            }
          } catch (e) {}
        }
      } else {
        toast.error('Article non trouvé');
        navigate('/marketplace');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Connectez-vous pour contacter le vendeur');
      navigate('/login');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/${itemId}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          item_id: itemId,
          message: inquiryForm.message,
          inquiry_type: inquiryForm.inquiry_type,
          offer_amount: inquiryForm.offer_amount ? parseFloat(inquiryForm.offer_amount) : null
        }),
      });

      if (response.ok) {
        toast.success('Message envoyé au vendeur');
        setContactOpen(false);
        setInquiryForm({ message: '', inquiry_type: 'question', offer_amount: '' });
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const nextImage = () => {
    if (item?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Article non trouvé</p>
      </div>
    );
  }

  const statusConfig = STATUS_LABELS[item.status] || STATUS_LABELS.available;
  const isOwner = user && user.user_id === item.seller_id;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="px-4 md:px-12 lg:px-24 py-6 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/marketplace')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au marketplace
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {item.images && item.images.length > 0 ? (
                  <>
                    <img
                      src={`${BACKEND_URL}${item.images[currentImageIndex]}`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {item.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Status badge */}
                <Badge className={`absolute top-3 right-3 ${statusConfig.color} text-white`}>
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Thumbnails */}
              {item.images && item.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 ${
                        idx === currentImageIndex ? 'border-accent' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={`${BACKEND_URL}${img}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant="outline">{CONDITION_LABELS[item.condition]}</Badge>
                  {item.rental_available && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Clock className="h-3 w-3 mr-1" />
                      Location dispo
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-heading font-semibold mb-2">
                  {item.title}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{item.location}</span>
                </div>
              </div>

              {/* Price */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Prix de vente</p>
                    <p className="text-3xl font-bold text-accent flex items-center">
                      <Euro className="h-6 w-6 mr-1" />
                      {item.price}
                    </p>
                  </div>
                  {item.rental_available && item.rental_price_per_day && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="text-xl font-semibold">
                        {item.rental_price_per_day}€<span className="text-sm font-normal">/jour</span>
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {item.views_count || 0} vues
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {item.inquiries_count || 0} messages
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>

              {/* Seller info */}
              {item.seller_name && (
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={seller?.profile_image ? `${BACKEND_URL}${seller.profile_image}` : undefined} />
                      <AvatarFallback>{item.seller_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{item.seller_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {seller?.category || 'Prestataire'}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Actions */}
              {!isOwner && item.status === 'available' && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    size="lg"
                    onClick={() => setContactOpen(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contacter le vendeur
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      setInquiryForm(prev => ({ ...prev, inquiry_type: 'offer' }));
                      setContactOpen(true);
                    }}
                  >
                    <Euro className="h-4 w-4 mr-2" />
                    Faire une offre
                  </Button>
                </div>
              )}

              {isOwner && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Gérer cet article
                </Button>
              )}

              {item.status !== 'available' && !isOwner && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground">
                    Cet article n'est plus disponible à la vente
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {inquiryForm.inquiry_type === 'offer' ? 'Faire une offre' : 'Contacter le vendeur'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendInquiry} className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground">Prix: {item.price}€</p>
            </div>

            {inquiryForm.inquiry_type === 'offer' && (
              <div>
                <Label>Votre offre (€)</Label>
                <Input
                  type="number"
                  min="1"
                  value={inquiryForm.offer_amount}
                  onChange={(e) => setInquiryForm(prev => ({ ...prev, offer_amount: e.target.value }))}
                  placeholder={`Prix demandé: ${item.price}€`}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label>Message</Label>
              <Textarea
                required
                value={inquiryForm.message}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder={inquiryForm.inquiry_type === 'offer' 
                  ? "Expliquez votre offre..." 
                  : "Posez vos questions sur l'article..."
                }
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setContactOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={sending} className="flex-1">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MobileNav user={user} />
    </div>
  );
};

export default MarketplaceItemPage;
