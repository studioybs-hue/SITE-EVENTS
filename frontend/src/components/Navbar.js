import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, MessageSquare, LayoutDashboard, Settings, Building, Heart, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isProvider = user?.user_type === 'provider';
  
  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="border-b border-border bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="nav-logo">
            <div className="text-2xl font-heading font-semibold text-primary">Lumière Events</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/search" 
              className="text-foreground hover:text-accent transition-colors font-medium"
              data-testid="nav-search-link"
            >
              {t('nav.search')}
            </Link>
            <Link 
              to="/packages" 
              className="text-foreground hover:text-accent transition-colors font-medium"
              data-testid="nav-packages-link"
            >
              {t('nav.packages')}
            </Link>
            <Link 
              to="/marketplace" 
              className="text-foreground hover:text-accent transition-colors font-medium"
              data-testid="nav-marketplace-link"
            >
              {t('nav.marketplace')}
            </Link>
            {user && (
              <Link 
                to="/messages" 
                className="text-foreground hover:text-accent transition-colors font-medium"
                data-testid="nav-messages-link"
              >
                {t('nav.messages')}
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSelector />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 border-2 transition-all hover:shadow-md ${
                      isProvider 
                        ? 'border-slate-300 hover:border-slate-400' 
                        : 'border-accent/30 hover:border-accent/50'
                    }`}
                    data-testid="user-menu-trigger"
                  >
                    {/* Avatar */}
                    <Avatar className={`h-8 w-8 ring-2 ${isProvider ? 'ring-slate-200' : 'ring-accent/20'}`}>
                      {user.picture ? (
                        <AvatarImage src={user.picture} alt={user.name} />
                      ) : null}
                      <AvatarFallback className={`text-xs font-semibold ${
                        isProvider 
                          ? 'bg-slate-700 text-white' 
                          : 'bg-accent/10 text-accent'
                      }`}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Name and badge - hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-sm font-medium max-w-[100px] truncate">
                        {user.name?.split(' ')[0]}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] px-1.5 py-0 ${
                          isProvider 
                            ? 'bg-slate-700 text-white' 
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {isProvider ? 'PRO' : t('auth.client')}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {/* User profile header */}
                  <div className={`p-3 mb-1 rounded-lg mx-2 ${
                    isProvider ? 'bg-slate-50' : 'bg-accent/5'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Avatar className={`h-12 w-12 ring-2 ${isProvider ? 'ring-slate-200' : 'ring-accent/20'}`}>
                        {user.picture ? (
                          <AvatarImage src={user.picture} alt={user.name} />
                        ) : null}
                        <AvatarFallback className={`text-base font-semibold ${
                          isProvider 
                            ? 'bg-slate-700 text-white' 
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <Badge 
                          className={`mt-1 text-[10px] ${
                            isProvider 
                              ? 'bg-slate-700 text-white' 
                              : 'bg-accent text-white'
                          }`}
                        >
                          {isProvider ? (
                            <><Building className="h-3 w-3 mr-1" /> {t('auth.provider')}</>
                          ) : (
                            <><Heart className="h-3 w-3 mr-1" /> {t('auth.client')}</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {isProvider ? t('dashboard.providerTitle') : t('dashboard.clientTitle')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')} data-testid="menu-messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('nav.messages')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">
                    <User className="h-4 w-4 mr-2" />
                    {t('dashboard.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="menu-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('dashboard.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    data-testid="menu-logout"
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/login/pro')}
                  className="rounded-full h-10 px-4 text-muted-foreground hover:text-foreground"
                  data-testid="nav-pro-btn"
                >
                  {t('auth.loginPro')}
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/login')}
                  className="rounded-full h-10 w-10 hover:bg-accent/10"
                  data-testid="nav-login-btn"
                  title={t('nav.login')}
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
