// app/equipos/page.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CrudEquipos } from "@/components/crudEquipos"
import { AppShell } from "@/components/app-shell"

export default function EquiposPage() {
  return (
    <AppShell
      requireAdmin
      titulo="Equipos"
      descripcion="Equipos que se pueden reservar, su ubicación y disponibilidad."
    >
      <Card>
        <CardContent className="pt-6">
          <CrudEquipos />
        </CardContent>
      </Card>
    </AppShell>
  )
}
