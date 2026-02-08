import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Heart, MessageCircle, MapPin, Calendar, Clock, ExternalLink, Plus, Send, Trash2, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { useSiteMode } from '@/contexts/SiteModeContext';

const CommunityEventsPage = () => {
  const navigate = useNavigate();
  const { mode, isEvents } = useSiteMode();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    address: '',
    image_url: '',
    ticket_link: '',
    price_info: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, [page]);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (e) {
      // Not logged in
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/events?page=${page}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setTotalPages(data.pages);
      }
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/events/${eventId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedEvent(data);
      }
    } catch (e) {
      console.error('Error fetching event:', e);
    }
  };

  const handleLike = async (eventId) => {
    if (!user) {
      toast.error('Connectez-vous pour aimer cet événement');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/events/${eventId}/like`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setEvents(events.map(e => 
          e.event_id === eventId 
            ? { ...e, likes_count: data.likes_count, user_liked: data.liked }
            : e
        ));
        if (selectedEvent?.event_id === eventId) {
          setSelectedEvent({ ...selectedEvent, likes_count: data.likes_count, user_liked: data.liked });
        }
      }
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast.error('Connectez-vous pour commenter');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/events/${selectedEvent.event_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const comment = await res.json();
        setSelectedEvent({
          ...selectedEvent,
          comments: [comment, ...selectedEvent.comments],
          comments_count: selectedEvent.comments_count + 1
        });
        setNewComment('');
        toast.success('Commentaire ajouté');
      }
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/events/${selectedEvent.event_id}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setSelectedEvent({
          ...selectedEvent,
          comments: selectedEvent.comments.filter(c => c.comment_id !== commentId),
          comments_count: selectedEvent.comments_count - 1
        });
        toast.success('Commentaire supprimé');
      }
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop grande (max 5MB)');
      return;
    }
    
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/events/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: event.target.result })
        });
        if (res.ok) {
          const data = await res.json();
          setNewEvent({ ...newEvent, image_url: data.image_url });
          toast.success('Image uploadée !');
        } else {
          toast.error('Erreur lors de l\'upload');
        }
      } catch (err) {
        toast.error('Erreur de connexion');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_date || !newEvent.location) {
      toast.error('Remplissez les champs obligatoires');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        toast.success('Événement publié !');
        setCreateDialogOpen(false);
        setNewEvent({
          title: '', description: '', event_date: '', event_time: '',
          location: '', address: '', image_url: '', ticket_link: '', price_info: ''
        });
        fetchEvents();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (e) {
      toast.error('Erreur de connexion');
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const handleLogout = () => setUser(null);

  // Redirect if not in events mode
  if (!isEvents) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center py-24">
          <h1 className="text-2xl font-bold mb-4">Cette page n'est disponible qu'en mode Événements</h1>
          <Button onClick={() => navigate('/welcome')}>Changer de mode</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground">
                🎉 Événements à venir
              </h1>
              <p className="text-muted-foreground mt-2">
                Découvrez les événements organisés par nos prestataires
              </p>
            </div>
            
            {user?.user_type === 'provider' && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white" data-testid="create-event-btn">
                    <Plus className="h-5 w-5 mr-2" />
                    Publier un événement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un événement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Titre de l'événement *</Label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Concert Jazz, Soirée Networking..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={newEvent.event_date}
                          onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Heure</Label>
                        <Input
                          type="time"
                          value={newEvent.event_time}
                          onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Lieu *</Label>
                      <Input
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="La Friche Belle de Mai, Marseille"
                      />
                    </div>
                    <div>
                      <Label>Adresse complète</Label>
                      <Input
                        value={newEvent.address}
                        onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
                        placeholder="41 Rue Jobin, 13003 Marseille"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Décrivez votre événement..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>URL de l'image</Label>
                      <Input
                        value={newEvent.image_url}
                        onChange={(e) => setNewEvent({ ...newEvent, image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Lien billetterie</Label>
                      <Input
                        value={newEvent.ticket_link}
                        onChange={(e) => setNewEvent({ ...newEvent, ticket_link: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Info prix</Label>
                      <Input
                        value={newEvent.price_info}
                        onChange={(e) => setNewEvent({ ...newEvent, price_info: e.target.value })}
                        placeholder="Gratuit, 15€, Sur réservation..."
                      />
                    </div>
                    <Button onClick={handleCreateEvent} className="w-full">
                      Publier l'événement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-medium mb-2">Aucun événement pour le moment</h3>
              <p className="text-muted-foreground">Les prestataires n'ont pas encore publié d'événements</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card 
                    key={event.event_id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => fetchEventDetails(event.event_id)}
                    data-testid={`event-card-${event.event_id}`}
                  >
                    {event.image_url && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(event.event_date)}
                        </Badge>
                        {event.event_time && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.event_time}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2 line-clamp-2">{event.title}</h3>
                      
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>

                      {event.provider && (
                        <div className="flex items-center gap-2 mb-4">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={event.provider.profile_image} />
                            <AvatarFallback>{event.provider.business_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {event.provider.business_name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLike(event.event_id); }}
                          className={`flex items-center gap-1 text-sm ${event.user_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        >
                          <Heart className={`h-5 w-5 ${event.user_liked ? 'fill-current' : ''}`} />
                          {event.likes_count || 0}
                        </button>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageCircle className="h-5 w-5" />
                          {event.comments_count || 0}
                        </div>
                        {event.price_info && (
                          <Badge>{event.price_info}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedEvent.image_url && (
              <img 
                src={selectedEvent.image_url} 
                alt={selectedEvent.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}
            
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                {selectedEvent.provider && (
                  <p className="text-muted-foreground">
                    Par {selectedEvent.provider.business_name}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(selectedEvent.event_date)}
                </Badge>
                {selectedEvent.event_time && (
                  <Badge variant="outline" className="text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {selectedEvent.event_time}
                  </Badge>
                )}
                {selectedEvent.price_info && (
                  <Badge className="text-sm">{selectedEvent.price_info}</Badge>
                )}
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{selectedEvent.location}</p>
                  {selectedEvent.address && (
                    <p className="text-sm text-muted-foreground">{selectedEvent.address}</p>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              )}

              {selectedEvent.ticket_link && (
                <a 
                  href={selectedEvent.ticket_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Réserver / Plus d'infos
                </a>
              )}

              {/* Like & Comments */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={() => handleLike(selectedEvent.event_id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                      selectedEvent.user_liked 
                        ? 'bg-red-50 border-red-200 text-red-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${selectedEvent.user_liked ? 'fill-current' : ''}`} />
                    {selectedEvent.likes_count} J'aime
                  </button>
                  <span className="text-muted-foreground">
                    {selectedEvent.comments_count} commentaires
                  </span>
                </div>

                {/* Add comment */}
                {user && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    />
                    <Button onClick={handleComment} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Comments list */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedEvent.comments?.map((comment) => (
                    <div key={comment.comment_id} className="flex gap-3 p-3 bg-muted rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{comment.user_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          {user?.user_id === comment.user_id && (
                            <button 
                              onClick={() => handleDeleteComment(comment.comment_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CommunityEventsPage;
