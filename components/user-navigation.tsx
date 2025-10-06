'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  BookOpen,
  Calendar,
  Users,
  Laptop
} from 'lucide-react';

export default function UserNavigation() {
  const { user, logout, isAdmin, isDocente } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getUserInitials = () => {
    if (user.docente) {
      return `${user.docente.nombre[0]}${user.docente.apellido[0]}`.toUpperCase();
    }
    return `${user.username[0]}${user.username[1] || ''}`.toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user.docente) {
      return `${user.docente.nombre} ${user.docente.apellido}`;
    }
    return user.username;
  };

  const getRoleBadgeColor = () => {
    return user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Navegación específica por rol */}
      <nav className="hidden md:flex items-center space-x-2">
        {isAdmin() && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/docentes')}
              className="flex items-center space-x-1"
            >
              <Users className="h-4 w-4" />
              <span>Docentes</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/equipos')}
              className="flex items-center space-x-1"
            >
              <Laptop className="h-4 w-4" />
              <span>Equipos</span>
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/reservas')}
          className="flex items-center space-x-1"
        >
          <Calendar className="h-4 w-4" />
          <span>Reservas</span>
        </Button>
        {isAdmin() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/agrupaciones')}
            className="flex items-center space-x-1"
          >
            <BookOpen className="h-4 w-4" />
            <span>Agrupaciones</span>
          </Button>
        )}
      </nav>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-600 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                  {user.role === 'ADMIN' ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Administrador
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3 w-3 mr-1" />
                      Docente
                    </>
                  )}
                </Badge>
              </div>
              {user.docente && (
                <div className="text-xs text-muted-foreground">
                  <div>Curso: {user.docente.curso}</div>
                  <div>Materia: {user.docente.materia}</div>
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Navegación móvil */}
          <div className="md:hidden">
            <DropdownMenuItem onClick={() => router.push('/reservas')}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Mis Reservas</span>
            </DropdownMenuItem>
            {isAdmin() && (
              <>
                <DropdownMenuItem onClick={() => router.push('/docentes')}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Gestión de Docentes</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/equipos')}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>Gestión de Equipos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/agrupaciones')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Agrupaciones</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
          </div>

          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}