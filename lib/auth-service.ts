import { User } from './auth-context';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  // Función para hacer requests autenticadas
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = localStorage.getItem('accessToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

    console.log('🌐 AuthService.fetchWithAuth:', {
      url: fullUrl,
      method: options.method || 'GET',
      headers,
      baseUrl: this.baseUrl,
      hasToken: !!accessToken
    });

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Si recibimos un 401, el token expiró
    if (response.status === 401) {
      // Intentar refresh token si está disponible
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Reintentar la request original con el nuevo token
        const newAccessToken = localStorage.getItem('accessToken');
        if (newAccessToken) {
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          return fetch(url, {
            ...options,
            headers,
          });
        }
      } else {
        // Si no se pudo refrescar, limpiar datos y redirigir al login
        this.clearAuthData();
        window.location.href = '/login';
      }
    }

    return response;
  }

  // Intentar refrescar el token
  async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return false;
    }

    try {
      const url = `${this.baseUrl}/api/auth/refresh`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (response.ok) {
        const data: LoginResponse = await response.json();
        this.saveAuthData(data.accessToken, data.refreshToken, data.user);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Login
  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        this.saveAuthData(data.accessToken, data.refreshToken, data.user);
        return { data };
      } else {
        return { error: data.message || 'Error de autenticación' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Error de conexión' };
    }
  }

  // Logout
  async logout(): Promise<void> {
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      try {
        await fetch(`${this.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    
    this.clearAuthData();
  }

  // Validar token
  async validateToken(): Promise<ApiResponse<{ user: User }>> {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      return { error: 'No token found' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        return { data };
      } else {
        return { error: data.message || 'Token inválido' };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return { error: 'Error de validación' };
    }
  }

  // Registrar usuario (solo para admins)
  async register(userData: {
    username: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'DOCENTE';
    docenteData?: {
      nombre: string;
      apellido: string;
      curso: string;
      materia: string;
    };
  }): Promise<ApiResponse<User>> {
    try {
      const response = await this.fetchWithAuth('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { data };
      } else {
        return { error: data.message || 'Error al registrar usuario' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Error de conexión' };
    }
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Verificar si el usuario es admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  // Verificar si el usuario es docente
  isDocente(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'DOCENTE';
  }

  // Obtener headers de autenticación
  getAuthHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const accessToken = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    return !!(accessToken && user);
  }

  // Guardar datos de autenticación
  private saveAuthData(accessToken: string, refreshToken: string, user: User): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Limpiar datos de autenticación
  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Función helper para hacer GET requests autenticadas
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithAuth(url);
      const data = await response.json();
      
      if (response.ok) {
        return { data };
      } else {
        return { error: data.message || 'Error en la petición' };
      }
    } catch (error) {
      console.error('GET request error:', error);
      return { error: 'Error de conexión' };
    }
  }

  // Función helper para hacer POST requests autenticadas
  async post<T>(url: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { data };
      } else {
        return { error: data.message || 'Error en la petición' };
      }
    } catch (error) {
      console.error('POST request error:', error);
      return { error: 'Error de conexión' };
    }
  }

  // Función helper para hacer PUT requests autenticadas
  async put<T>(url: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithAuth(url, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { data };
      } else {
        return { error: data.message || 'Error en la petición' };
      }
    } catch (error) {
      console.error('PUT request error:', error);
      return { error: 'Error de conexión' };
    }
  }

  // Función helper para hacer DELETE requests autenticadas
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithAuth(url, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { data };
      } else {
        return { error: data.message || 'Error en la petición' };
      }
    } catch (error) {
      console.error('DELETE request error:', error);
      return { error: 'Error de conexión' };
    }
  }
}

// Instancia singleton del servicio
const authService = new AuthService();

export default authService;