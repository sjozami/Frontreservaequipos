'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, AlertTriangle } from 'lucide-react';
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
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    const role = user?.role;
    let authorized = false;

    if (allowRoles) {
      authorized = allowRoles.includes(role || 'DOCENTE');
    } else if (requireAdmin) {
      authorized = role === 'ADMIN';
    } else if (requireDocente) {
      authorized = role === 'DOCENTE' || role === 'ADMIN';
    } else {
      authorized = true;
    }

    if (!authorized && !redirectingRef.current) {
      redirectingRef.current = true;
      if (role === 'ADMIN') {
        router.push('/');
      } else {
        router.push('/reservas');
      }
    }
  }, [isAuthenticated, isLoading, user?.role, requireAdmin, requireDocente, allowRoles, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const role = user?.role;

  if (allowRoles) {
    if (!allowRoles.includes(role || 'DOCENTE')) {
      return <AccessDenied role={role} isAdmin={role === 'ADMIN'} />;
    }
  } else if (requireAdmin && role !== 'ADMIN') {
    return <AccessDenied role={role} isAdmin={false} />;
  } else if (requireDocente && role !== 'DOCENTE' && role !== 'ADMIN') {
    return <AccessDenied role={role} isAdmin={role === 'ADMIN'} />;
  }

  return <>{children}</>;
}

function AccessDenied({ role, isAdmin }: { role?: string; isAdmin: boolean }) {
  const router = useRouter();
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
            Tu rol actual: <span className="font-medium">{role}</span>
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => router.push(isAdmin ? '/' : '/reservas')}
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
