"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { CalendarDays, GraduationCap, Laptop, LayoutDashboard, Layers, Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/protected-route"
import UserNavigation from "@/components/user-navigation"
import { Button } from "@/components/ui/button"

interface ItemNav {
  href: string
  etiqueta: string
  Icono: typeof LayoutDashboard
  soloAdmin?: boolean
}

const NAV: ItemNav[] = [
  { href: "/", etiqueta: "Panel", Icono: LayoutDashboard, soloAdmin: true },
  { href: "/reservas", etiqueta: "Reservas", Icono: CalendarDays },
  { href: "/docentes", etiqueta: "Docentes", Icono: GraduationCap, soloAdmin: true },
  { href: "/equipos", etiqueta: "Equipos", Icono: Laptop, soloAdmin: true },
  { href: "/agrupaciones", etiqueta: "Agrupaciones", Icono: Layers, soloAdmin: true },
]

interface AppShellProps {
  children: React.ReactNode
  titulo: string
  descripcion?: string
  /** Acciones de la pantalla (por ejemplo "Nueva reserva"). */
  acciones?: React.ReactNode
  requireAdmin?: boolean
}

/**
 * Marco común de la aplicación: cabecera, navegación por rol y contenedor.
 * Antes cada pantalla armaba su propio encabezado, con tres variantes distintas
 * y sin indicar en qué sección estabas.
 */
export function AppShell({ children, titulo, descripcion, acciones, requireAdmin = false }: AppShellProps) {
  const { isAdmin } = useAuth()
  const pathname = usePathname()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const items = NAV.filter((item) => !item.soloAdmin || isAdmin())

  const esActivo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex h-16 items-center gap-4">
              <Link href="/reservas" className="flex items-center gap-2 shrink-0">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="hidden font-semibold tracking-tight sm:block">Reserva de Equipos</span>
              </Link>

              <nav aria-label="Secciones" className="hidden md:flex items-center gap-1 ml-2">
                {items.map(({ href, etiqueta, Icono }) => {
                  const activo = esActivo(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={activo ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        activo
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icono className="h-4 w-4" aria-hidden="true" />
                      {etiqueta}
                    </Link>
                  )
                })}
              </nav>

              <div className="ml-auto flex items-center gap-2">
                <UserNavigation />
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                  aria-expanded={menuAbierto}
                  onClick={() => setMenuAbierto((v) => !v)}
                >
                  {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {menuAbierto && (
              <nav aria-label="Secciones" className="md:hidden pb-3 flex flex-col gap-1">
                {items.map(({ href, etiqueta, Icono }) => {
                  const activo = esActivo(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuAbierto(false)}
                      aria-current={activo ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                        activo ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icono className="h-4 w-4" aria-hidden="true" />
                      {etiqueta}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h1>
              {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
            </div>
            {acciones && <div className="flex items-center gap-2">{acciones}</div>}
          </div>

          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
