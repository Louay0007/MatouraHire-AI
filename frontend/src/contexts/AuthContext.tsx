import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLogin, useRegister, useMe, useLogout, useUpdateProfile } from '@/hooks/useApiHooks';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginMut = useLogin();
  const registerMut = useRegister();
  const meMut = useMe();
  const logoutMut = useLogout();

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('auth_user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res: any = await loginMut.mutateAsync({ email, password });
      const u = res?.user;
      if (u) setUser({ id: u.id, email: u.email, name: u.name, avatar: u.avatarUrl });
      setIsLoading(false);
      return !!u;
    } catch (e) {
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res: any = await registerMut.mutateAsync({ email, password, name });
      const u = res?.user;
      if (u) setUser({ id: u.id, email: u.email, name: u.name, avatar: u.avatarUrl });
      setIsLoading(false);
      return !!u;
    } catch (e) {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    logoutMut.mutate();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};