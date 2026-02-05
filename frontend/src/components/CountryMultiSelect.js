import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'KM', name: 'Comores', flag: '🇰🇲' },
];

const CountryMultiSelect = ({ value = [], onChange, placeholder = "Sélectionner les pays" }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggleCountry = (code) => {
    if (value.includes(code)) {
      onChange(value.filter(c => c !== code));
    } else {
      onChange([...value, code]);
    }
  };

  const removeCountry = (code, e) => {
    e.stopPropagation();
    onChange(value.filter(c => c !== code));
  };

  const getCountryInfo = (code) => COUNTRIES.find(c => c.code === code);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] px-3 py-2"
          data-testid="country-multi-select"
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              value.map(code => {
                const country = getCountryInfo(code);
                return country ? (
                  <Badge 
                    key={code} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-2 py-0.5"
                  >
                    <span>{country.flag}</span>
                    <span className="text-xs">{t(`countries.${code}`) || country.name}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={(e) => removeCountry(code, e)}
                    />
                  </Badge>
                ) : null;
              })
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[9999]" align="start">
        <div className="max-h-[300px] overflow-y-auto p-2">
          {COUNTRIES.map((country) => (
            <div
              key={country.code}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md hover:bg-accent/10 ${
                value.includes(country.code) ? 'bg-accent/5' : ''
              }`}
              onClick={() => toggleCountry(country.code)}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                value.includes(country.code) ? 'bg-primary border-primary' : 'border-input'
              }`}>
                {value.includes(country.code) && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-lg">{country.flag}</span>
              <span className="text-sm">{t(`countries.${country.code}`) || country.name}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CountryMultiSelect;
