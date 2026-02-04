import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Edit, Trash2, GripVertical, Euro, Clock, 
  ToggleLeft, ToggleRight, Package, ChevronUp, ChevronDown,
  X, Save
} from 'lucide-react';
import { toast } from 'sonner';

const ServiceManager = ({ providerId }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    price: '',
    options: []
  });
  const [newOption, setNewOption] = useState({ name: '', price: '', description: '' });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const durations = [
    { value: '1h', label: '1 heure' },
    { value: '2h', label: '2 heures' },
    { value: '3h', label: '3 heures' },
    { value: '4h', label: '4 heures' },
    { value: 'demi-journee', label: 'Demi-journée' },
    { value: 'journee', label: 'Journée complète' },
    { value: 'weekend', label: 'Week-end' },
    { value: 'sur-mesure', label: 'Sur mesure' }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/services/me?include_inactive=true`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        title: service.title,
        description: service.description,
        duration: service.duration || '',
        price: service.price.toString(),
        options: service.options || []
      });
    } else {
      setEditingService(null);
      setFormData({
        title: '',
        description: '',
        duration: '',
        price: '',
        options: []
      });
    }
    setNewOption({ name: '', price: '', description: '' });
    setDialogOpen(true);
  };

  const handleAddOption = () => {
    if (!newOption.name.trim()) return;
    setFormData({
      ...formData,
      options: [...formData.options, {
        name: newOption.name,
        price: parseFloat(newOption.price) || 0,
        description: newOption.description || null
      }]
    });
    setNewOption({ name: '', price: '', description: '' });
  };

  const handleRemoveOption = (index) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      title: formData.title,
      description: formData.description,
      duration: formData.duration || null,
      price: parseFloat(formData.price),
      options: formData.options
    };

    try {
      const url = editingService 
        ? `${BACKEND_URL}/api/services/${editingService.service_id}`
        : `${BACKEND_URL}/api/services`;
      
      const response = await fetch(url, {
        method: editingService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingService ? 'Prestation modifiée' : 'Prestation créée');
        setDialogOpen(false);
        fetchServices();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/services/${service.service_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !service.is_active }),
      });

      if (response.ok) {
        toast.success(service.is_active ? 'Prestation désactivée' : 'Prestation activée');
        fetchServices();
      }
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Prestation supprimée');
        setDeleteConfirm(null);
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleMoveService = async (index, direction) => {
    const newServices = [...services];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newServices.length) return;
    
    // Swap
    [newServices[index], newServices[targetIndex]] = [newServices[targetIndex], newServices[index]];
    
    // Update display orders
    const orders = newServices.map((s, i) => ({
      service_id: s.service_id,
      display_order: i
    }));

    setServices(newServices);

    try {
      await fetch(`${BACKEND_URL}/api/services/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orders),
      });
    } catch (error) {
      console.error('Error reordering:', error);
      fetchServices(); // Revert on error
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-semibold" data-testid="services-title">
            Mes Prestations
          </h2>
          <p className="text-sm text-muted-foreground">
            {services.length} prestation{services.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="add-service-btn">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">Aucune prestation</p>
          <Button variant="outline" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Créer ma première prestation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={service.service_id}
              className={`border rounded-lg p-4 transition-all ${
                service.is_active 
                  ? 'border-border bg-card' 
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
              data-testid="service-item"
            >
              <div className="flex items-start gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => handleMoveService(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-secondary rounded disabled:opacity-30"
                    data-testid={`move-up-${service.service_id}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveService(index, 'down')}
                    disabled={index === services.length - 1}
                    className="p-1 hover:bg-secondary rounded disabled:opacity-30"
                    data-testid={`move-down-${service.service_id}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Service info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{service.title}</h3>
                    {!service.is_active && (
                      <Badge variant="secondary" className="text-xs">Désactivé</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <Euro className="h-4 w-4" />
                      {service.price}€
                    </span>
                    {service.duration && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {durations.find(d => d.value === service.duration)?.label || service.duration}
                      </span>
                    )}
                    {service.options?.length > 0 && (
                      <span className="text-muted-foreground">
                        +{service.options.length} option{service.options.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(service)}
                    title={service.is_active ? 'Désactiver' : 'Activer'}
                    data-testid={`toggle-${service.service_id}`}
                  >
                    {service.is_active ? (
                      <ToggleRight className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(service)}
                    data-testid={`edit-${service.service_id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm(service.service_id)}
                    data-testid={`delete-${service.service_id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Options preview */}
              {service.options?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Options disponibles :</p>
                  <div className="flex flex-wrap gap-2">
                    {service.options.map((opt, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {opt.name} {opt.price > 0 && `(+${opt.price}€)`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Reportage photo mariage"
                data-testid="service-title-input"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre prestation en détail..."
                data-testid="service-description-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="500"
                  data-testid="service-price-input"
                />
              </div>
              <div>
                <Label htmlFor="duration">Durée</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger data-testid="service-duration-select">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options Section */}
            <div className="border border-border rounded-lg p-4">
              <Label className="mb-3 block">Options supplémentaires</Label>
              
              {formData.options.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary/50 rounded">
                      <span className="flex-1 text-sm">{opt.name}</span>
                      <span className="text-sm text-muted-foreground">+{opt.price}€</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Nom de l'option"
                  value={newOption.name}
                  onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                  className="flex-1"
                  data-testid="option-name-input"
                />
                <Input
                  type="number"
                  placeholder="Prix €"
                  value={newOption.price}
                  onChange={(e) => setNewOption({ ...newOption, price: e.target.value })}
                  className="w-24"
                  data-testid="option-price-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                  data-testid="add-option-btn"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" data-testid="save-service-btn">
                <Save className="h-4 w-4 mr-2" />
                {editingService ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette prestation ?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Cette action est irréversible. La prestation sera définitivement supprimée.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(deleteConfirm)}
              data-testid="confirm-delete-btn"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ServiceManager;
