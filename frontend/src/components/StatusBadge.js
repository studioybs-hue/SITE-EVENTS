import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

const statusConfig = {
  new_message: {
    label: 'Nouveau message',
    icon: MessageCircle,
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-600 text-white animate-pulse'
  },
  pending_booking: {
    label: 'Réservation en attente',
    icon: Clock,
    variant: 'default',
    className: 'bg-amber-500 hover:bg-amber-600 text-white'
  },
  action_required: {
    label: 'Action requise',
    icon: AlertTriangle,
    variant: 'default',
    className: 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
  },
  confirmed: {
    label: 'Confirmé',
    icon: CheckCircle,
    variant: 'default',
    className: 'bg-emerald-500 hover:bg-emerald-600 text-white'
  },
  new_quote: {
    label: 'Nouveau devis',
    icon: Bell,
    variant: 'default',
    className: 'bg-purple-500 hover:bg-purple-600 text-white animate-pulse'
  },
  quote_received: {
    label: 'Devis reçu',
    icon: Bell,
    variant: 'default',
    className: 'bg-indigo-500 hover:bg-indigo-600 text-white'
  },
  deposit_pending: {
    label: 'Acompte à payer',
    icon: AlertTriangle,
    variant: 'default',
    className: 'bg-orange-500 hover:bg-orange-600 text-white'
  }
};

export const StatusBadge = ({ 
  type, 
  count = null, 
  showIcon = true, 
  size = 'default',
  onClick = null,
  className = ''
}) => {
  const config = statusConfig[type];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    small: 'text-[10px] px-1.5 py-0.5',
    default: 'text-xs px-2 py-1',
    large: 'text-sm px-3 py-1.5'
  };

  return (
    <Badge 
      className={`${config.className} ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {showIcon && <Icon className={`${size === 'small' ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1`} />}
      {config.label}
      {count !== null && count > 0 && (
        <span className="ml-1.5 bg-white/20 px-1.5 rounded-full">{count}</span>
      )}
    </Badge>
  );
};

// Notification dot for icons
export const NotificationDot = ({ show = true, count = null, position = 'top-right' }) => {
  if (!show) return null;

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  if (count !== null && count > 0) {
    return (
      <span className={`absolute ${positionClasses[position]} min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse`}>
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  return (
    <span className={`absolute ${positionClasses[position]} w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse`} />
  );
};

// Action card with prominent CTA
export const ActionCard = ({ 
  title, 
  description, 
  status,
  primaryAction,
  secondaryAction,
  children 
}) => {
  return (
    <div className="p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>
        {status && <StatusBadge type={status} size="small" />}
      </div>
      
      {children}
      
      {(primaryAction || secondaryAction) && (
        <div className="flex gap-2 mt-3">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="flex-1 bg-accent text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
              data-testid={primaryAction.testId}
            >
              {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="flex-1 bg-secondary text-secondary-foreground text-sm font-medium py-2 px-3 rounded-md hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1.5"
              data-testid={secondaryAction.testId}
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
