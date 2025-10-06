"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, Package, User } from "lucide-react";
import { formatearHorarioModulos } from "@/lib/reservas-utils";
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types";
import React from "react";

interface CancelarReservaModalProps {
  reserva: ReservaEscolar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (reserva: ReservaEscolar) => void;
  docentes: Docente[];
  equipos: EquipoEscolar[];
}

export function CancelarReservaModal(props: CancelarReservaModalProps) {
  const { reserva, open, onOpenChange, onConfirmar, docentes, equipos } = props;
  if (!reserva) return null;

  const docente = docentes.find((d) => d.id === reserva.docenteId);
  const equipo = equipos.find((e) => e.id === reserva.equipoId);

  const handleConfirmar = () => {
    onConfirmar(reserva);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Cancelar Reserva
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la reserva */}
          <div className="bg-muted p-4 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Detalles de la reserva</h4>
              <Badge variant="outline">{reserva.estado}</Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>
                  <strong>Equipo:</strong> {equipo?.nombre}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>
                  <strong>Docente:</strong> {docente?.nombre} {docente?.apellido}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  <strong>Fecha:</strong> {(typeof reserva.fecha === 'string' ? new Date(reserva.fecha) : reserva.fecha).toLocaleDateString("es-ES", { timeZone: "UTC" })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  <strong>Horario:</strong> {formatearHorarioModulos(reserva.modulos)}
                </span>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Importante:</p>
                <p className="text-destructive/80">
                  Al cancelar esta reserva, el equipo quedará disponible para otros docentes en este horario.
                  {reserva.esRecurrente &&
                    " Esta acción cancelará solo esta reserva individual, no toda la serie recurrente."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            No, mantener reserva
          </Button>
          <Button variant="destructive" onClick={handleConfirmar}>
            Sí, cancelar reserva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
