import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CapacitySettings = ({ providerId, initialValue = 1 }) => {
  const { t } = useTranslation();
  const [capacity, setCapacity] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCapacity(initialValue);
  }, [initialValue]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ max_bookings_per_day: capacity })
      });

      if (response.ok) {
        toast.success('Capacité mise à jour');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving capacity:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Capacité journalière</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Définissez le nombre maximum de clients que vous pouvez prendre par jour. Par exemple, un photographe peut faire 2 séances photo le même jour.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Combien de clients pouvez-vous prendre par jour ?
          </p>
          
          <div className="flex items-center gap-4">
            <Select
              value={capacity.toString()}
              onValueChange={(value) => setCapacity(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]" data-testid="capacity-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 client / jour</SelectItem>
                <SelectItem value="2">2 clients / jour</SelectItem>
                <SelectItem value="3">3 clients / jour</SelectItem>
                <SelectItem value="4">4 clients / jour</SelectItem>
                <SelectItem value="5">5 clients / jour</SelectItem>
                <SelectItem value="6">6 clients / jour</SelectItem>
                <SelectItem value="7">7 clients / jour</SelectItem>
                <SelectItem value="8">8 clients / jour</SelectItem>
                <SelectItem value="9">9 clients / jour</SelectItem>
                <SelectItem value="10">10 clients / jour</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSave} 
              disabled={saving || capacity === initialValue}
              data-testid="save-capacity-btn"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
        
        {/* Visual indicator */}
        <div className="hidden sm:flex items-center gap-1 p-3 bg-accent/10 rounded-lg">
          {Array.from({ length: Math.min(capacity, 5) }).map((_, i) => (
            <div 
              key={i} 
              className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"
            >
              <Users className="h-4 w-4 text-accent" />
            </div>
          ))}
          {capacity > 5 && (
            <span className="text-sm font-medium text-accent ml-1">+{capacity - 5}</span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CapacitySettings;
