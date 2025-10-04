"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CrudDocentes } from "@/components/crudDocentes"
import { CrudEquipos } from "@/components/crudEquipos"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { GraduationCap, Server } from "lucide-react"

export default function AdminLinks() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Administración del Sistema</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-professional hover:shadow-professional-lg transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Gestión de Docentes</CardTitle>
                  <CardDescription className="text-muted-foreground">Administra los datos personales y profesionales de los docentes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div id="crud-docentes" className="w-full">
                <CrudDocentes />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-professional hover:shadow-professional-lg transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Gestión de Equipos</CardTitle>
                  <CardDescription className="text-muted-foreground">Administra los equipos disponibles, su estado y características</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div id="crud-equipos" className="w-full">
                <CrudEquipos />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

