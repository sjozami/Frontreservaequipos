import { GraduationCap, Bell, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function HeaderProfesional() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-professional">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo y título institucional */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl shadow-professional">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">Instituto Educativo </h1>
            <p className="text-sm text-muted-foreground">Sistema de Reservas de Equipamiento</p>
          </div>
        </div>

        {/* Navegación y acciones */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">Prof. Sergio Jozami</span>
                  <span className="text-xs text-muted-foreground">Administrador</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
