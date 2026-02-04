import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Home, Search, MessageSquare, ShoppingBag, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
                    className="rounded-full h-10 px-4"
                    data-testid="user-menu-trigger"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Tableau de bord
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
              <Button 
                onClick={() => navigate('/login')}
                className="rounded-full h-10 px-6 bg-primary text-primary-foreground hover:scale-105 transition-transform"
                data-testid="nav-login-btn"
              >
                Connexion
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;