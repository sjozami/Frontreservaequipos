"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CrudDocentes } from "@/components/crudDocentes"
import { AppShell } from "@/components/app-shell"

export default function DocentesPage() {
  return (
    <AppShell
      requireAdmin
      titulo="Docentes"
      descripcion="Datos personales y profesionales de quienes pueden reservar equipos."
    >
      <Card>
        <CardContent className="pt-6">
          <CrudDocentes />
        </CardContent>
      </Card>
    </AppShell>
  )
}
