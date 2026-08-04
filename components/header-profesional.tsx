"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  GraduationCap,
  LogOut,
  Shield,
  BookOpen,
  Calendar,
  Users,
  Laptop,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function HeaderProfesional() {
  const { user, logout, isAdmin, isDocente } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getUserInitials = () => {
    if (user?.docente) {
      return `${user.docente.nombre[0]}${user.docente.apellido[0]}`.toUpperCase()
    }
    return `${user?.username[0] ?? "?"}${user?.username[1] ?? ""}`.toUpperCase()
  }

  const getUserDisplayName = () => {
    if (user?.docente) {
      return `${user.docente.nombre} ${user.docente.apellido}`
    }
    return user?.username ?? "Invitado"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo y título institucional */}
        <button
          onClick={() => router.push(isAdmin() ? "/" : "/reservas")}
          className="flex items-center space-x-4 text-left"
          aria-label="Inicio"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">Instituto Educativo</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Sistema de Reservas de Equipamiento
            </p>
          </div>
        </button>

        {/* Navegación y acciones */}
        <div className="flex items-center space-x-2">
          <nav className="hidden md:flex items-center space-x-1">
            {isAdmin() && (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push("/docentes")}>
                  <Users className="h-4 w-4 mr-1" />
                  <span>Docentes</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push("/equipos")}>
                  <Laptop className="h-4 w-4 mr-1" />
                  <span>Equipos</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push("/reservas")}>
              <Calendar className="h-4 w-4 mr-1" />
              <span>Reservas</span>
            </Button>
          </nav>

          {/* Menú de usuario */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 pt-1">
                      <Badge
                        className={
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {user.role === "ADMIN" ? (
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
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Navegación móvil */}
                <div className="md:hidden">
                  <DropdownMenuItem onClick={() => router.push("/reservas")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Reservas</span>
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <>
                      <DropdownMenuItem onClick={() => router.push("/docentes")}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Docentes</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/equipos")}>
                        <Laptop className="mr-2 h-4 w-4" />
                        <span>Equipos</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}