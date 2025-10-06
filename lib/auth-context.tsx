'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'DOCENTE';
  docente?: {
    id: string;
    nombre: string;
    apellido: string;
    curso: string;
    materia: string;
  } | null;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  isAdmin: () => boolean;
  isDocente: () => boolean;
  getAuthHeaders: () => { [key: string]: string };
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos de autenticación del localStorage al inicializar
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken && storedUser) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Validar token al cargar la aplicación
  useEffect(() => {
    if (accessToken && !isLoading) {
      checkAuth();
    }
  }, [accessToken, isLoading]);

  const saveAuthData = (token: string, refresh: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setAccessToken(token);
    setRefreshToken(refresh);
    setUser(userData);
  };

  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const loginUrl = `${base}/api/auth/login`;
      console.log('🔐 Attempting login to:', loginUrl);
      console.log('🌐 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        saveAuthData(data.accessToken, data.refreshToken, data.user);
        return true;
      } else {
        console.error('Login failed:', data.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('💥 Login fetch error:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        loginUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/login`
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Note: The backend doesn't have a logout endpoint in the AUTH_README.md
    // For now, just clear local auth data. If logout endpoint exists, uncomment below:
    // if (accessToken) {
    //   const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    //   fetch(`${base}/api/auth/logout`, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     credentials: 'include',
    //   }).catch(error => {
    //     console.error('Logout request failed:', error);
    //   });
    // }
    
    clearAuthData();
  };

  const checkAuth = async (): Promise<boolean> => {
    if (!accessToken) {
      return false;
    }

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${base}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Update the user state from the validation response
          setUser(data.user);
          return true;
        }
      } else if (response.status === 401) {
        // Token expirado o inválido
        clearAuthData();
      }
      
      return false;
    } catch (error) {
      console.error('Auth validation error:', error);
      clearAuthData();
      return false;
    }
  };

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };

  const isDocente = (): boolean => {
    return user?.role === 'DOCENTE';
  };

  const getAuthHeaders = (): { [key: string]: string } => {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    accessToken,
    refreshToken,
    login,
    logout,
    checkAuth,
    isAdmin,
    isDocente,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};