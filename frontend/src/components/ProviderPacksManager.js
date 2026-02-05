import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, Package, Trash2, Edit, Loader2, Euro, Calendar, 
  Users, Check, X, Image as ImageIcon, Upload
} from 'lucide-react';
import { toast } from 'sonner';

const ProviderPacksManager = ({ providerId }) => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPack, setEditPack] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    max_guests: '',
    features: [''],
    image: ''
  });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchPacks();
  }, [providerId]);

  const fetchPacks = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/providers/${providerId}/packs`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPacks(data);
      }
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFeatureChange = (index, value) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index] = value;
      return { ...prev, features: newFeatures };
    });
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await fetch(`${BACKEND_URL}/api/marketplace/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image: data.image_url }));
        toast.success('Image uploadée !');
      } else {
        toast.error('Erreur lors de l\'upload');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      max_guests: '',
      features: [''],
      image: ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Nom et prix requis');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/providers/${providerId}/packs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          max_guests: formData.max_guests ? parseInt(formData.max_guests) : null,
          features: formData.features.filter(f => f.trim() !== '')
        })
      });

      if (response.ok) {
        toast.success('Pack créé !');
        setCreateOpen(false);
        resetForm();
        fetchPacks();
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
      const response = await fetch(`${BACKEND_URL}/api/providers/packs/${editPack.pack_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          max_guests: formData.max_guests ? parseInt(formData.max_guests) : null,
          features: formData.features.filter(f => f.trim() !== '')
        })
      });

      if (response.ok) {
        toast.success('Pack mis à jour !');
        setEditPack(null);
        resetForm();
        fetchPacks();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (packId) => {
    if (!window.confirm('Supprimer ce pack ?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/providers/packs/${packId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Pack supprimé');
        fetchPacks();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const openEdit = (pack) => {
    setFormData({
      name: pack.name,
      description: pack.description || '',
      price: pack.price.toString(),
      duration: pack.duration || '',
      max_guests: pack.max_guests?.toString() || '',
      features: pack.features?.length > 0 ? pack.features : [''],
      image: pack.image || ''
    });
    setEditPack(pack);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mes Packs
          </h2>
          <p className="text-sm text-muted-foreground">
            {packs.length} pack{packs.length > 1 ? 's' : ''} • Proposez des offres packagées à vos clients
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="add-pack-btn">
          <Plus className="h-4 w-4 mr-2" />
          Créer un pack
        </Button>
      </div>

      {/* Packs Grid */}
      {packs.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-3">Aucun pack créé</p>
          <p className="text-sm text-muted-foreground mb-4">
            Créez des packs pour proposer des offres attractives à vos clients
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer mon premier pack
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <Card key={pack.pack_id} className="overflow-hidden" data-testid={`pack-${pack.pack_id}`}>
              {/* Pack Image */}
              {pack.image && (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={pack.image.startsWith('/') ? `${BACKEND_URL}${pack.image}` : pack.image}
                    alt={pack.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{pack.name}</h3>
                  <Badge className="bg-accent text-white">
                    {pack.price}€
                  </Badge>
                </div>
                
                {pack.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {pack.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                  {pack.duration && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {pack.duration}
                    </span>
                  )}
                  {pack.max_guests && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Max {pack.max_guests} pers.
                    </span>
                  )}
                </div>
                
                {pack.features && pack.features.length > 0 && (
                  <ul className="text-sm space-y-1 mb-4">
                    {pack.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {pack.features.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{pack.features.length - 3} autres...
                      </li>
                    )}
                  </ul>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEdit(pack)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(pack.pack_id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editPack} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false);
          setEditPack(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editPack ? 'Modifier le pack' : 'Créer un pack'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={editPack ? handleUpdate : handleCreate} className="space-y-4">
            {/* Image */}
            <div>
              <Label>Image du pack</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                ) : formData.image ? (
                  <div className="relative">
                    <img 
                      src={formData.image.startsWith('/') ? `${BACKEND_URL}${formData.image}` : formData.image}
                      alt="Pack"
                      className="h-32 mx-auto rounded object-cover"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Cliquez pour changer</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Ajouter une image</p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Name */}
            <div>
              <Label>Nom du pack *</Label>
              <Input
                required
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ex: Pack Mariage Complet"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={2}
                placeholder="Décrivez votre pack..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <Label>Prix (€) *</Label>
                <Input
                  required
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleFormChange}
                />
              </div>

              {/* Duration */}
              <div>
                <Label>Durée</Label>
                <Input
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  placeholder="Ex: 8 heures"
                />
              </div>
            </div>

            {/* Max guests */}
            <div>
              <Label>Nombre max de personnes</Label>
              <Input
                type="number"
                name="max_guests"
                min="1"
                value={formData.max_guests}
                onChange={handleFormChange}
                placeholder="Optionnel"
              />
            </div>

            {/* Features */}
            <div>
              <Label>Ce qui est inclus</Label>
              <div className="space-y-2 mt-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder="Ex: DJ professionnel"
                    />
                    {formData.features.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addFeature}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setCreateOpen(false);
                setEditPack(null);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button type="submit">
                {editPack ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderPacksManager;
