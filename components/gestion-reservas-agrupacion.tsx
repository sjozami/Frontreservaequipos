"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CrudDocentes } from "@/components/crudDocentes"
import { CrudEquipos } from "@/components/crudEquipos"

export default function AdminLinks() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      <h1 className="text-2xl font-bold">Administración del Sistema</h1>
      <div className="flex gap-8">
        <a href="#crud-docentes">
          <Button size="lg" variant="secondary">Administrar Docentes</Button>
        </a>
        <a href="#crud-equipos">
          <Button size="lg" variant="secondary">Administrar Equipos</Button>
        </a>
      </div>
      <div id="crud-docentes" className="w-full max-w-3xl mt-12">
        <CrudDocentes />
      </div>
      <div id="crud-equipos" className="w-full max-w-3xl mt-12">
        <CrudEquipos />
      </div>
    </div>
  )
}

