import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, BadgeCheck, MessageCircle, ChevronDown, User, Calendar, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ReviewSection = ({ providerId, providerName, isOwner = false }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified_count: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [canReview, setCanReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    booking_id: ''
  });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [providerId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reviews/provider/${providerId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setStats({
          total: data.total,
          verified_count: data.verified_count,
          average_rating: data.average_rating
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reviews/can-review/${providerId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCanReview(data);
      }
    } catch (error) {
      // Not logged in
      setCanReview(null);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider_id: providerId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          booking_id: reviewForm.booking_id || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.is_verified ? 'Avis vérifié publié !' : 'Avis publié !');
        setWriteReviewOpen(false);
        setReviewForm({ rating: 5, comment: '', booking_id: '' });
        fetchReviews();
        checkCanReview();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de la publication');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResponse = async (reviewId) => {
    if (!responseText.trim()) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/reviews/${reviewId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response: responseText })
      });

      if (response.ok) {
        toast.success('Réponse publiée');
        setRespondingTo(null);
        setResponseText('');
        fetchReviews();
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    });
  };

  const StarRating = ({ rating, size = 'md', interactive = false, onChange }) => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            <Star 
              className={`${sizeClass} ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Avis clients
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {stats.total > 0 ? (
              <>
                <span className="flex items-center gap-1">
                  <StarRating rating={Math.round(stats.average_rating)} size="sm" />
                  <span className="font-semibold text-foreground">{stats.average_rating}</span>
                </span>
                <span>{stats.total} avis</span>
                {stats.verified_count > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <BadgeCheck className="h-3 w-3" />
                    {stats.verified_count} vérifié{stats.verified_count > 1 ? 's' : ''}
                  </span>
                )}
              </>
            ) : (
              <span>Aucun avis pour le moment</span>
            )}
          </div>
        </div>
        
        {canReview && !isOwner && (
          <Button onClick={() => setWriteReviewOpen(true)} data-testid="write-review-btn">
            <Star className="h-4 w-4 mr-2" />
            Laisser un avis
          </Button>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <Card key={review.review_id} className="p-4" data-testid={`review-${review.review_id}`}>
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-semibold shrink-0">
                  {review.client_picture ? (
                    <img src={review.client_picture} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    review.client_name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-medium">{review.client_name || 'Client'}</span>
                    {review.is_verified && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        Client vérifié
                      </Badge>
                    )}
                  </div>
                  
                  {/* Rating and date */}
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                    {review.event_type && (
                      <Badge variant="outline" className="text-xs">
                        {review.event_type}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Comment */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                  
                  {/* Provider Response */}
                  {review.provider_response && (
                    <div className="mt-3 pl-4 border-l-2 border-accent/30 bg-accent/5 rounded-r-lg p-3">
                      <p className="text-xs font-medium text-accent mb-1">
                        Réponse de {providerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.provider_response}
                      </p>
                    </div>
                  )}
                  
                  {/* Respond button for owner */}
                  {isOwner && !review.provider_response && (
                    <div className="mt-3">
                      {respondingTo === review.review_id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Votre réponse..."
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSubmitResponse(review.review_id)}>
                              <Send className="h-3 w-3 mr-1" />
                              Publier
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}>
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setRespondingTo(review.review_id)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Répondre
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {reviews.length > 3 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm text-accent hover:text-accent/80 flex items-center justify-center gap-1"
            >
              {showAll ? 'Voir moins' : `Voir les ${reviews.length - 3} autres avis`}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Aucun avis pour le moment</p>
          {canReview && !isOwner && (
            <p className="text-sm text-muted-foreground mt-2">
              Soyez le premier à donner votre avis !
            </p>
          )}
        </Card>
      )}

      {/* Write Review Dialog */}
      <Dialog open={writeReviewOpen} onOpenChange={setWriteReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Laisser un avis</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Verified review option */}
            {canReview?.eligible_bookings?.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Vous pouvez laisser un avis vérifié
                </p>
                <Select
                  value={reviewForm.booking_id || "none"}
                  onValueChange={(value) => setReviewForm(prev => ({ ...prev, booking_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Sélectionner une réservation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Avis non vérifié</SelectItem>
                    {canReview.eligible_bookings.map((booking) => (
                      <SelectItem key={booking.booking_id} value={booking.booking_id}>
                        {booking.event_type} - {booking.event_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-emerald-600 mt-2">
                  Un avis vérifié montre que vous avez réellement utilisé ce prestataire
                </p>
              </div>
            )}

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <div className="flex items-center gap-2">
                <StarRating 
                  rating={reviewForm.rating} 
                  size="lg" 
                  interactive 
                  onChange={(rating) => setReviewForm(prev => ({ ...prev, rating }))}
                />
                <span className="text-lg font-semibold">{reviewForm.rating}/5</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2">Votre avis *</label>
              <Textarea
                required
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Partagez votre expérience avec ce prestataire..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWriteReviewOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting || !reviewForm.comment}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publier
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSection;
