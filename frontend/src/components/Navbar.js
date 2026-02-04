import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Home, Search, MessageSquare, ShoppingBag, LayoutDashboard, Settings, Building, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

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
              Rechercher
            </Link>
            <Link 
              to="/packages" 
              className="text-foreground hover:text-accent transition-colors font-medium"
              data-testid="nav-packages-link"
            >
              Packs Événement
            </Link>
            <Link 
              to="/marketplace" 
              className="text-foreground hover:text-accent transition-colors font-medium"
              data-testid="nav-marketplace-link"
            >
              Marketplace B2B
            </Link>
            {user && (
              <Link 
                to="/messages" 
                className="text-foreground hover:text-accent transition-colors font-medium"
                data-testid="nav-messages-link"
              >
                Messages
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`rounded-full h-10 px-4 ${isProvider ? 'border-slate-700' : 'border-accent'}`}
                    data-testid="user-menu-trigger"
                  >
                    {isProvider ? (
                      <Building className="h-4 w-4 mr-2 text-slate-700" />
                    ) : (
                      <Heart className="h-4 w-4 mr-2 text-accent" />
                    )}
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 text-[10px] px-1.5 py-0 ${
                        isProvider 
                          ? 'bg-slate-700 text-white' 
                          : 'bg-accent/10 text-accent'
                      }`}
                    >
                      {isProvider ? 'PRO' : 'Client'}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* User type indicator at top */}
                  <div className={`px-3 py-2 mb-1 rounded-md mx-2 ${
                    isProvider ? 'bg-slate-100' : 'bg-accent/5'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isProvider ? (
                        <Building className="h-4 w-4 text-slate-700" />
                      ) : (
                        <Heart className="h-4 w-4 text-accent" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isProvider ? 'Compte Prestataire' : 'Compte Client'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {isProvider ? 'Espace Prestataire' : 'Mon Espace'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')} data-testid="menu-messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">
                    <User className="h-4 w-4 mr-2" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="menu-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/login/pro')}
                  className="rounded-full h-10 px-4 text-muted-foreground hover:text-foreground"
                  data-testid="nav-pro-btn"
                >
                  Espace Pro
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  className="rounded-full h-10 px-6 bg-primary text-primary-foreground hover:scale-105 transition-transform"
                  data-testid="nav-login-btn"
                >
                  Connexion
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