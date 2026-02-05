import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

const ProfileImageUploader = ({ currentImage, onImageUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 5MB)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          
          // Update the provider profile with the new image
          const updateResponse = await fetch(`${BACKEND_URL}/api/providers/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ profile_image: data.image_url })
          });

          if (updateResponse.ok) {
            toast.success('Photo de profil mise à jour !');
            if (onImageUpdate) onImageUpdate(data.image_url);
          } else {
            toast.error('Erreur lors de la mise à jour');
          }
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
    });

    xhr.open('POST', `${BACKEND_URL}/api/marketplace/upload-image`);
    xhr.withCredentials = true;
    xhr.send(formData);
  };

  const removeImage = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/providers/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profile_image: null })
      });

      if (response.ok) {
        toast.success('Photo supprimée');
        if (onImageUpdate) onImageUpdate(null);
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Image Preview */}
      <div className="relative">
        <div 
          className={`w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center border-4 border-white shadow-lg ${
            !currentImage && !uploading ? 'cursor-pointer hover:opacity-80' : ''
          }`}
          onClick={() => !uploading && !currentImage && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
              <span className="text-xs text-accent mt-1">{uploadProgress}%</span>
            </div>
          ) : currentImage ? (
            <img 
              src={currentImage.startsWith('/') ? `${BACKEND_URL}${currentImage}` : currentImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto" />
              <span className="text-xs text-muted-foreground">Ajouter</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {currentImage && !uploading && (
          <button
            onClick={removeImage}
            className="absolute -top-1 -right-1 p-1.5 bg-destructive text-white rounded-full shadow-md hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Change photo button */}
        {currentImage && !uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-2 bg-accent text-white rounded-full shadow-md hover:bg-accent/90"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {!currentImage && !uploading && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Ajouter une photo
        </Button>
      )}
    </div>
  );
};

export default ProfileImageUploader;
