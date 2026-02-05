import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, Video, Image, Youtube, Trash2, Edit, Eye, 
  Loader2, X, Play, GripVertical, Link2, Upload
} from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: 'wedding', label: 'Mariage' },
  { value: 'birthday', label: 'Anniversaire' },
  { value: 'corporate', label: 'Entreprise' },
  { value: 'baptism', label: 'Baptême' },
  { value: 'party', label: 'Soirée' },
  { value: 'other', label: 'Autre' }
];

const PortfolioManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaType, setMediaType] = useState('photo');
  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);
  
  const [formData, setFormData] = useState({
    media_type: 'photo',
    media_url: '',
    thumbnail_url: '',
    title: '',
    description: '',
    event_type: ''
  });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio/my-items`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'media_type') {
      setMediaType(value);
    }
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      toast.error('Format non supporté. Utilisez une image ou une vidéo.');
      return;
    }

    // Size limits
    const maxSize = isVideo ? 1024 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (max ${isVideo ? '1GB' : '5MB'})`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const endpoint = isVideo 
      ? `${BACKEND_URL}/api/portfolio/upload-video`
      : `${BACKEND_URL}/api/marketplace/upload-image`;

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url = isVideo ? data.video_url : data.image_url;
          setFormData(prev => ({
            ...prev,
            media_url: url,
            media_type: isVideo ? 'video' : 'photo'
          }));
          setMediaType(isVideo ? 'video' : 'photo');
          toast.success('Fichier uploadé !');
        } catch (err) {
          toast.error('Erreur lors du traitement');
        }
      } else {
        toast.error('Erreur lors de l\'upload');
      }
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });

    xhr.addEventListener('error', () => {
      toast.error('Erreur de connexion');
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });

    xhr.addEventListener('abort', () => {
      toast.info('Upload annulé');
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });

    xhr.open('POST', endpoint);
    xhr.withCredentials = true;
    xhr.send(uploadFormData);
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
    }
  };

  const extractVideoId = (url) => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };
    
    return null;
  };

  const handleExternalUrl = () => {
    const url = formData.media_url;
    const videoInfo = extractVideoId(url);
    
    if (videoInfo) {
      setFormData(prev => ({
        ...prev,
        media_type: videoInfo.platform,
        thumbnail_url: videoInfo.platform === 'youtube' 
          ? `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
          : ''
      }));
      setMediaType(videoInfo.platform);
      toast.success(`Vidéo ${videoInfo.platform === 'youtube' ? 'YouTube' : 'Vimeo'} détectée !`);
    }
  };

  const resetForm = () => {
    setFormData({
      media_type: 'photo',
      media_url: '',
      thumbnail_url: '',
      title: '',
      description: '',
      event_type: ''
    });
    setMediaType('photo');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.media_url) {
      toast.error('Veuillez ajouter un média');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Story ajoutée !');
        setCreateOpen(false);
        resetForm();
        fetchItems();
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
      const response = await fetch(`${BACKEND_URL}/api/portfolio/${editItem.item_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          event_type: formData.event_type
        }),
      });

      if (response.ok) {
        toast.success('Story mise à jour');
        setEditItem(null);
        resetForm();
        fetchItems();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Supprimer cette story ?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Story supprimée');
        fetchItems();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const openEdit = (item) => {
    setFormData({
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || '',
      title: item.title || '',
      description: item.description || '',
      event_type: item.event_type || ''
    });
    setMediaType(item.media_type);
    setEditItem(item);
  };

  const getMediaPreview = (item) => {
    const url = item.media_url;
    
    if (item.media_type === 'photo') {
      return (
        <img 
          src={url.startsWith('/') ? `${BACKEND_URL}${url}` : url} 
          alt={item.title || 'Portfolio'} 
          className="w-full h-full object-cover"
        />
      );
    }
    
    if (item.media_type === 'video') {
      return (
        <div className="relative w-full h-full bg-black">
          <video 
            src={url.startsWith('/') ? `${BACKEND_URL}${url}` : url}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-3">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        </div>
      );
    }
    
    if (item.media_type === 'youtube') {
      const videoInfo = extractVideoId(url);
      const thumbUrl = item.thumbnail_url || (videoInfo ? `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg` : '');
      return (
        <div className="relative w-full h-full">
          <img src={thumbUrl} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 rounded-full p-2">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
          <Badge className="absolute bottom-2 right-2 bg-red-600">YouTube</Badge>
        </div>
      );
    }
    
    if (item.media_type === 'vimeo') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-400 to-blue-600">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-2">
              <Play className="h-5 w-5 text-blue-600 fill-blue-600" />
            </div>
          </div>
          <Badge className="absolute bottom-2 right-2 bg-blue-600">Vimeo</Badge>
        </div>
      );
    }
    
    return null;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'vimeo': return <Video className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
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
            <Video className="h-5 w-5" />
            Mon Portfolio (Stories)
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} média{items.length > 1 ? 's' : ''} • Photos et vidéos de vos réalisations
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="add-portfolio-btn">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une story
        </Button>
      </div>

      {/* Items Grid - Story style */}
      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <Video className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-3">Aucune story publiée</p>
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez des photos et vidéos de vos événements pour attirer plus de clients
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter ma première story
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <div 
              key={item.item_id} 
              className="relative group aspect-[9/16] rounded-xl overflow-hidden bg-muted shadow-md hover:shadow-lg transition-shadow"
              data-testid={`portfolio-item-${item.item_id}`}
            >
              {getMediaPreview(item)}
              
              {/* Overlay with info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {item.title && (
                    <p className="text-white font-medium text-sm truncate">{item.title}</p>
                  )}
                  {item.event_type && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {EVENT_TYPES.find(t => t.value === item.event_type)?.label || item.event_type}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                    <Eye className="h-3 w-3" />
                    {item.views_count} vues
                  </div>
                </div>
              </div>

              {/* Type badge */}
              <div className="absolute top-2 left-2">
                <Badge className="bg-white/90 text-foreground shadow-sm">
                  {getTypeIcon(item.media_type)}
                </Badge>
              </div>

              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(item)}
                  className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(item.item_id)}
                  className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-100 text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editItem} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false);
          setEditItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Modifier la story' : 'Ajouter une story'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={editItem ? handleUpdate : handleCreate} className="space-y-4">
            {/* Media Type Selection (only for create) */}
            {!editItem && (
              <div>
                <Label>Type de média</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { value: 'photo', icon: Image, label: 'Photo' },
                    { value: 'video', icon: Video, label: 'Vidéo' },
                    { value: 'youtube', icon: Youtube, label: 'YouTube' },
                    { value: 'vimeo', icon: Video, label: 'Vimeo' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleSelectChange('media_type', type.value)}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                        mediaType === type.value 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <type.icon className="h-5 w-5" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Media Upload/URL Input */}
            {!editItem && (
              <div>
                {(mediaType === 'photo' || mediaType === 'video') ? (
                  <div>
                    <Label>Fichier</Label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                      ) : formData.media_url ? (
                        <div className="text-sm text-accent">
                          Fichier uploadé ✓
                          <p className="text-xs text-muted-foreground mt-1">Cliquez pour changer</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Cliquez pour {mediaType === 'photo' ? 'une photo' : 'une vidéo'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max {mediaType === 'video' ? '1GB' : '5MB'}
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div>
                    <Label>URL {mediaType === 'youtube' ? 'YouTube' : 'Vimeo'}</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        name="media_url"
                        value={formData.media_url}
                        onChange={handleFormChange}
                        placeholder={`https://${mediaType === 'youtube' ? 'youtube.com/watch?v=...' : 'vimeo.com/...'}`}
                      />
                      <Button type="button" variant="outline" onClick={handleExternalUrl}>
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview (for edit mode) */}
            {editItem && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {getMediaPreview(editItem)}
              </div>
            )}

            {/* Title */}
            <div>
              <Label>Titre (optionnel)</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Ex: Mariage de Sophie & Pierre"
              />
            </div>

            {/* Event Type */}
            <div>
              <Label>Type d'événement</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => handleSelectChange('event_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={2}
                placeholder="Décrivez cette réalisation..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setCreateOpen(false);
                setEditItem(null);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button type="submit" disabled={!editItem && !formData.media_url}>
                {editItem ? 'Mettre à jour' : 'Publier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioManager;
