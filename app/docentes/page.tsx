"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { HeaderProfesional } from "@/components/header-profesional"
import { CrudDocentes } from "@/components/crudDocentes"
import { Users } from "lucide-react"

export default function DocentesPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderProfesional />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <Card className="shadow-professional hover:shadow-professional-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Gestión de Docentes</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Administra los datos personales y profesionales de los docentes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CrudDocentes />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
