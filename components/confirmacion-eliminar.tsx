"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { AgrupacionReserva } from "@/lib/types"
import { calcularEstadisticasAgrupacion } from "@/lib/reservas-utils"

interface ConfirmacionEliminarProps {
  agrupacion: AgrupacionReserva | null
  abierto: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmacionEliminar({ agrupacion, abierto, onConfirmar, onCancelar }: ConfirmacionEliminarProps) {
  if (!agrupacion) return null

  const stats = calcularEstadisticasAgrupacion(agrupacion)

  return (
    <AlertDialog open={abierto} onOpenChange={onCancelar}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar agrupación?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>Esta acción no se puede deshacer. Se eliminará permanentemente la siguiente agrupación:</p>

              <div className="border rounded-lg p-4 bg-muted">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{agrupacion.nombre}</h4>
                    <p className="text-sm text-muted-foreground">
                      Usuario: {agrupacion.usuario} • {agrupacion.periodo.descripcion}
                    </p>
                  </div>
                  <Badge variant={agrupacion.estado === "activa" ? "default" : "secondary"}>{agrupacion.estado}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-primary">{stats.totalReservas}</div>
                    <div className="text-muted-foreground">Reservas</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-accent">{stats.modulosUnicos}</div>
                    <div className="text-muted-foreground">Módulos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-secondary">{stats.equiposUnicos}</div>
                    <div className="text-muted-foreground">Equipos</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Las reservas individuales no se eliminarán, solo se desagrupará la colección.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelar}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar} className="bg-destructive hover:bg-destructive/90">
            Eliminar Agrupación
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
