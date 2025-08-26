// app/equipos/page.tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { HeaderProfesional } from "@/components/header-profesional"
import { CrudEquipos } from "../../components/crudEquipos"
import { Server } from "lucide-react" // ícono representativo de equipos

export default function EquiposPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderProfesional />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <Card className="shadow-professional hover:shadow-professional-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Gestión de Equipos</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Administra los equipos disponibles, su estado y características
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CrudEquipos />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
