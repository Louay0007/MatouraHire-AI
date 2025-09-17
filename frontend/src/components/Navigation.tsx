import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { 
  Brain, 
  FileText, 
  MessageSquare, 
  Search, 
  Activity, 
  ChartBar,
  Sun,
  Moon,
  Monitor,
  User,
  LogOut,
  Settings,
  TestTube
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Brain },
    { path: '/resume', label: 'Resume', icon: FileText },
    { path: '/interview', label: 'Interview', icon: MessageSquare },
    { path: '/job-matcher', label: 'Jobs', icon: Search },
    { path: '/footprint', label: 'Footprint', icon: Activity },
    { path: '/report', label: 'Report', icon: ChartBar },
  ];

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      default: return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 md:h-20 items-center justify-between px-4">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-fast">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground font-bold">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            MatouraHire AI
          </span>
        </Link>

        {/* Main Navigation */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-2 rounded-full border bg-card/60 px-2 py-2">
            {navItems.slice(1).map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} className="relative">
                <Button
                  variant={isActive(path) ? "accent" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 rounded-full px-4"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
                {isActive(path) && (
                  <span className="absolute -bottom-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Right side - Theme toggle, User menu */}
        <div className="flex items-center space-x-3">
          

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ThemeIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu or Auth Buttons */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-3 rounded-full border h-16">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <User className="h-10 w-10" />
                  )}
                  <span className="hidden md:inline text-base font-semibold">
                    {user?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="hero" size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && (
        <div className="md:hidden">
          <div className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full border bg-card/90 backdrop-blur px-3 py-2 shadow-lg">
            <div className="flex items-center gap-4">
              {navItems.slice(1).map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} className="flex flex-col items-center px-2">
                  <Icon className={`h-5 w-5 ${isActive(path) ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] mt-0.5 ${isActive(path) ? 'text-accent' : 'text-muted-foreground'}`}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;