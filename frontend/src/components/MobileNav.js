import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MobileNav = ({ user, unreadMessages = 0, pendingActions = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Accueil',
      showWhen: 'always'
    },
    { 
      path: '/search', 
      icon: Search, 
      label: 'Rechercher',
      showWhen: 'always'
    },
    { 
      path: '/messages', 
      icon: MessageCircle, 
      label: 'Chat',
      badge: unreadMessages,
      showWhen: 'authenticated'
    },
    { 
      path: '/dashboard', 
      icon: Calendar, 
      label: 'Tableau',
      badge: pendingActions,
      showWhen: 'authenticated'
    },
    { 
      path: '/profile', 
      icon: User, 
      label: 'Profil',
      showWhen: 'authenticated'
    },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.showWhen === 'always') return true;
    if (item.showWhen === 'authenticated' && user) return true;
    return false;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 relative transition-colors ${
                isActive 
                  ? 'text-accent' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
