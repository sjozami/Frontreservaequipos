'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireDocente?: boolean;
  allowRoles?: ('ADMIN' | 'DOCENTE')[];
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireDocente = false,
  allowRoles,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isAdmin, isDocente } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) {
      return; // Esperar mientras se carga
    }

    if (!isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    // Verificar autorización basada en roles
    let authorized = false;

    if (allowRoles) {
      // Si se especifican roles permitidos, verificar si el usuario tiene uno de ellos
      authorized = allowRoles.includes(user?.role || 'DOCENTE');
    } else if (requireAdmin) {
      // Si se requiere admin específicamente
      authorized = isAdmin();
    } else if (requireDocente) {
      // Si se requiere docente específicamente (admin también puede acceder)
      authorized = isDocente() || isAdmin();
    } else {
      // Si no se especifican restricciones, cualquier usuario autenticado puede acceder
      authorized = true;
    }

    setIsAuthorized(authorized);

    if (!authorized) {
      // Si no está autorizado, redirigir según el rol
      if (isAdmin()) {
        router.push('/'); // Dashboard admin
      } else {
        router.push('/reservas'); // Vista por defecto para docentes
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, requireDocente, allowRoles, router, isAdmin, isDocente, fallbackPath]);

  // Mostrar loading mientras se verifica autenticación
  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (se redirige)
  if (!isAuthenticated) {
    return null;
  }

  // Si no está autorizado, mostrar mensaje de acceso denegado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Tu rol actual: <span className="font-medium">{user?.role}</span>
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push(isAdmin() ? '/' : '/reservas')}
                className="w-full"
              >
                Ir al Panel Principal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="w-full"
              >
                Volver Atrás
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}

// Componentes específicos para diferentes tipos de protección
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      {children}
    </ProtectedRoute>
  );
}

export function DocenteRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireDocente={true}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}