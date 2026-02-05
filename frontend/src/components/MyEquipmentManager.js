import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Package, Edit, Trash2, Eye, MessageCircle, 
  ImagePlus, X, Loader2, CheckCircle, Clock, ShoppingBag,
  Euro, MapPin, Tag
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  available: { label: 'Disponible', color: 'bg-emerald-500', icon: CheckCircle },
  reserved: { label: 'Réservé', color: 'bg-amber-500', icon: Clock },
  sold: { label: 'Vendu', color: 'bg-gray-500', icon: ShoppingBag },
  rented: { label: 'En location', color: 'bg-blue-500', icon: Package }
};

const CONDITION_LABELS = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'Correct'
};

const CATEGORIES = [
  'Audio', 'Lumières', 'Décoration', 'Mobilier',
  'Vidéo', 'Photographie', 'Cuisine', 'Autre'
];

const MyEquipmentManager = () => {
  const [items, setItems] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedItemInquiries, setSelectedItemInquiries] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    rental_available: false,
    rental_price_per_day: '',
    location: '',
    condition: 'good',
    images: []
  });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchMyItems();
    fetchInquiries();
  }, []);

  const fetchMyItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/my-items`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace-inquiries/received`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [...formData.images];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineuse (max 5MB)`);
        continue;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const response = await fetch(`${BACKEND_URL}/api/marketplace/upload-image`, {
          method: 'POST',
          credentials: 'include',
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.image_url);
        } else {
          toast.error(`Échec de l'upload de ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setFormData(prev => ({ ...prev, images: uploadedUrls }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      price: '',
      rental_available: false,
      rental_price_per_day: '',
      location: '',
      condition: 'good',
      images: []
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          rental_price_per_day: formData.rental_price_per_day ? parseFloat(formData.rental_price_per_day) : null,
        }),
      });

      if (response.ok) {
        toast.success('Article créé avec succès');
        setCreateOpen(false);
        resetForm();
        fetchMyItems();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/${editItem.item_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          rental_price_per_day: formData.rental_price_per_day ? parseFloat(formData.rental_price_per_day) : null,
        }),
      });

      if (response.ok) {
        toast.success('Article mis à jour');
        setEditItem(null);
        resetForm();
        fetchMyItems();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Statut mis à jour');
        fetchMyItems();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Article supprimé');
        fetchMyItems();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleInquiryAction = async (inquiryId, status) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace-inquiries/${inquiryId}?status=${status}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(status === 'accepted' ? 'Offre acceptée ! L\'acheteur peut maintenant payer.' : 'Offre refusée');
        fetchInquiries();
        fetchMyItems();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const openEdit = (item) => {
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price.toString(),
      rental_available: item.rental_available,
      rental_price_per_day: item.rental_price_per_day?.toString() || '',
      location: item.location,
      condition: item.condition,
      images: item.images || []
    });
    setEditItem(item);
  };

  const getItemInquiries = (itemId) => {
    return inquiries.filter(i => i.item_id === itemId);
  };

  const pendingInquiriesCount = inquiries.filter(i => i.status === 'pending').length;

  // Stats
  const availableCount = items.filter(i => i.status === 'available').length;
  const reservedCount = items.filter(i => i.status === 'reserved').length;
  const soldCount = items.filter(i => i.status === 'sold').length;

  // Form change handlers
  const handleInputChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mon Matériel
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} article{items.length > 1 ? 's' : ''} publié{items.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="add-equipment-btn">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Disponibles</p>
              <p className="text-xl font-bold text-emerald-600">{availableCount}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-500/30" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Réservés</p>
              <p className="text-xl font-bold text-amber-600">{reservedCount}</p>
            </div>
            <Clock className="h-6 w-6 text-amber-500/30" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Vendus</p>
              <p className="text-xl font-bold text-gray-600">{soldCount}</p>
            </div>
            <ShoppingBag className="h-6 w-6 text-gray-500/30" />
          </div>
        </Card>
        <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedItemInquiries('all')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Messages</p>
              <p className="text-xl font-bold text-blue-600">{pendingInquiriesCount}</p>
            </div>
            <MessageCircle className="h-6 w-6 text-blue-500/30" />
          </div>
          {pendingInquiriesCount > 0 && (
            <p className="text-[10px] text-blue-600 mt-1">Voir les messages →</p>
          )}
        </Card>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-3">Aucun article publié</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Publier mon premier article
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.available;
            const itemInquiries = getItemInquiries(item.item_id);
            const pendingInquiries = itemInquiries.filter(i => i.status === 'pending');
            const pendingCount = pendingInquiries.length;
            
            return (
              <Card key={item.item_id} className="p-4" data-testid="equipment-item">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden bg-muted shrink-0">
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={`${BACKEND_URL}${item.images[0]}`} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          {item.category}
                          <span>•</span>
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      </div>
                      <Badge className={`${statusConfig.color} text-white shrink-0`}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{item.price}€</span>
                      </div>
                      {item.rental_available && (
                        <div className="text-sm text-muted-foreground">
                          Location: {item.rental_price_per_day}€/jour
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {CONDITION_LABELS[item.condition]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Eye className="h-3 w-3" />
                      {item.views_count || 0} vues
                      <span>•</span>
                      <MessageCircle className="h-3 w-3" />
                      {item.inquiries_count || 0} messages
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 relative z-10">
                      <Select
                        value={item.status}
                        onValueChange={(value) => handleStatusChange(item.item_id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                          <SelectItem value="available">Disponible</SelectItem>
                          <SelectItem value="reserved">Réservé</SelectItem>
                          <SelectItem value="sold">Vendu</SelectItem>
                          <SelectItem value="rented">En location</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>

                      {itemInquiries.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedItemInquiries(item.item_id)}
                          className={pendingCount > 0 ? "text-blue-600 border-blue-200" : ""}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {itemInquiries.length} message{itemInquiries.length > 1 ? 's' : ''}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.item_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Offres en attente - affichées directement sur la carte */}
                {pendingInquiries.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {pendingInquiries.length} offre{pendingInquiries.length > 1 ? 's' : ''} en attente
                    </h4>
                    <div className="space-y-3">
                      {pendingInquiries.map((inquiry) => (
                        <div 
                          key={inquiry.inquiry_id} 
                          className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                          data-testid={`inquiry-${inquiry.inquiry_id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{inquiry.buyer_name}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {inquiry.message}
                              </p>
                              {inquiry.offer_amount && (
                                <p className="text-sm font-bold text-emerald-600 mt-2">
                                  Offre: {inquiry.offer_amount}€
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleInquiryAction(inquiry.inquiry_id, 'accepted')}
                                data-testid={`accept-btn-${inquiry.inquiry_id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accepter
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-destructive border-destructive hover:bg-destructive/10"
                                onClick={() => handleInquiryAction(inquiry.inquiry_id, 'declined')}
                                data-testid={`decline-btn-${inquiry.inquiry_id}`}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Refuser
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un article</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Images */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <ImagePlus className="h-4 w-4" />
                Photos de l'article
              </Label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {formData.images.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <img src={`${BACKEND_URL}${url}`} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center hover:border-accent transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                multiple
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Max 8 photos, 5MB chacune</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Titre *</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  placeholder="Ex: Enceinte JBL EON615"
                />
              </div>

              <div className="col-span-2">
                <Label>Description *</Label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  rows={3}
                  placeholder="Décrivez votre article..."
                />
              </div>

              <div>
                <Label>Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleSelectChange('category')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>État *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={handleSelectChange('condition')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Neuf</SelectItem>
                    <SelectItem value="like_new">Comme neuf</SelectItem>
                    <SelectItem value="good">Bon état</SelectItem>
                    <SelectItem value="fair">Correct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prix de vente (€) *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange('price')}
                />
              </div>

              <div>
                <Label>Localisation *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  placeholder="Paris, France"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="rental-create"
                    checked={formData.rental_available}
                    onChange={handleInputChange('rental_available')}
                  />
                  <Label htmlFor="rental-create">Disponible à la location</Label>
                </div>
                {formData.rental_available && (
                  <div>
                    <Label>Prix de location par jour (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rental_price_per_day}
                      onChange={handleInputChange('rental_price_per_day')}
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Publier l'article
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Images */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <ImagePlus className="h-4 w-4" />
                Photos de l'article
              </Label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {formData.images.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <img src={`${BACKEND_URL}${url}`} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center hover:border-accent transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                multiple
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Max 8 photos, 5MB chacune</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Titre *</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  placeholder="Ex: Enceinte JBL EON615"
                />
              </div>

              <div className="col-span-2">
                <Label>Description *</Label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  rows={3}
                  placeholder="Décrivez votre article..."
                />
              </div>

              <div>
                <Label>Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleSelectChange('category')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>État *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={handleSelectChange('condition')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Neuf</SelectItem>
                    <SelectItem value="like_new">Comme neuf</SelectItem>
                    <SelectItem value="good">Bon état</SelectItem>
                    <SelectItem value="fair">Correct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prix de vente (€) *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange('price')}
                />
              </div>

              <div>
                <Label>Localisation *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  placeholder="Paris, France"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="rental-edit"
                    checked={formData.rental_available}
                    onChange={handleInputChange('rental_available')}
                  />
                  <Label htmlFor="rental-edit">Disponible à la location</Label>
                </div>
                {formData.rental_available && (
                  <div>
                    <Label>Prix de location par jour (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rental_price_per_day}
                      onChange={handleInputChange('rental_price_per_day')}
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Mettre à jour
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inquiries Dialog */}
      <Dialog open={!!selectedItemInquiries} onOpenChange={(open) => !open && setSelectedItemInquiries(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages reçus
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {(selectedItemInquiries === 'all' ? inquiries : inquiries.filter(i => i.item_id === selectedItemInquiries))
              .map((inquiry) => (
                <Card key={inquiry.inquiry_id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{inquiry.buyer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inquiry.item_title}
                      </p>
                    </div>
                    <Badge variant={inquiry.status === 'pending' ? 'default' : 
                                   inquiry.status === 'accepted' ? 'success' :
                                   inquiry.status === 'paid' ? 'success' : 'secondary'}>
                      {inquiry.status === 'pending' ? 'Nouveau' : 
                       inquiry.status === 'accepted' ? 'Accepté' : 
                       inquiry.status === 'paid' ? 'Payé' :
                       inquiry.status === 'declined' ? 'Refusé' : 'Répondu'}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{inquiry.message}</p>
                  {inquiry.offer_amount && (
                    <p className="text-sm font-medium text-accent mb-2">
                      Offre: {inquiry.offer_amount}€
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(inquiry.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  
                  {/* Action buttons for pending inquiries */}
                  {inquiry.status === 'pending' && inquiry.offer_amount && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleInquiryAction(inquiry.inquiry_id, 'accepted')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepter
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleInquiryAction(inquiry.inquiry_id, 'declined')}
                      >
                        Refuser
                      </Button>
                    </div>
                  )}
                  
                  {inquiry.status === 'accepted' && (
                    <div className="p-2 bg-amber-50 rounded text-sm text-amber-700">
                      En attente du paiement de l'acheteur
                    </div>
                  )}
                  
                  {inquiry.status === 'paid' && (
                    <div className="p-2 bg-emerald-50 rounded text-sm text-emerald-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Paiement reçu !
                    </div>
                  )}
                </Card>
              ))}
            {((selectedItemInquiries === 'all' ? inquiries : inquiries.filter(i => i.item_id === selectedItemInquiries)).length === 0) && (
              <p className="text-center text-muted-foreground py-4">Aucun message</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyEquipmentManager;
