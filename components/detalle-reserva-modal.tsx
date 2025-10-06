"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Package, BookOpen, FileText, Repeat } from "lucide-react";
import { formatearHorarioModulos } from "@/lib/reservas-utils";
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types";
import React from "react";

interface DetalleReservaModalProps {
  reserva: ReservaEscolar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditar: (reserva: ReservaEscolar) => void;
  onCancelar: (reserva: ReservaEscolar) => void;
  docentes: Docente[];
  equipos: EquipoEscolar[];
}

export function DetalleReservaModal(props: DetalleReservaModalProps) {
  const { reserva, open, onOpenChange, onEditar, onCancelar, docentes, equipos } = props;
  if (!reserva) return null;

  const docente = docentes.find((d) => d.id === reserva.docenteId);
  const equipo = equipos.find((e) => e.id === reserva.equipoId);

  const getFechaFinalizacion = () => {
    if (reserva.esRecurrente && reserva.fechaFin) {
      const fecha = typeof reserva.fechaFin === 'string' ? new Date(reserva.fechaFin) : reserva.fechaFin;
      return fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
      });
    }
    return null;
  };

  const getFrecuenciaTexto = () => {
    if (!reserva.esRecurrente) return null;

    switch (reserva.frecuencia) {
      case "diaria":
        return "Todos los días";
      case "semanal":
        return "Todas las semanas";
      case "mensual":
        return "Todos los meses";
      default:
        return "Frecuencia no especificada";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalle de Reserva
          </DialogTitle>
          <DialogDescription>Información completa de la reserva de equipamiento</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado y Equipo */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{equipo?.nombre || "Equipo desconocido"}</h3>
              <p className="text-sm text-muted-foreground">ID: {reserva.id}</p>
            </div>
            <Badge
              variant={
                reserva.estado === "confirmada"
                  ? "default"
                  : reserva.estado === "pendiente"
                    ? "secondary"
                    : "destructive"
              }
              className="text-sm px-3 py-1"
            >
              {reserva.estado.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          {/* Información del Docente */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Docente
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>
                <p className="font-medium">
                  {docente?.nombre} {docente?.apellido}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Curso:</span>
                <p className="font-medium">{docente?.curso}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Materia:</span>
                <p className="font-medium">{docente?.materia}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ID:</span>
                <p className="font-medium">{docente?.id}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Horarios */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horarios y Fechas
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fecha de inicio:</span>
                <span className="font-medium">
                  {(() => {
                    const fecha = typeof reserva.fecha === 'string' ? new Date(reserva.fecha) : reserva.fecha;
                    // Use UTC methods to display the date as stored, avoiding timezone interpretation
                    return fecha.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long", 
                      day: "numeric",
                      timeZone: "UTC"
                    });
                  })()}
                </span>
              </div>

              {getFechaFinalizacion() && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fecha de finalización:</span>
                  <span className="font-medium">{getFechaFinalizacion()}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Módulos:</span>
                <span className="font-medium">
                  {reserva.modulos.join(", ")} • {formatearHorarioModulos(reserva.modulos)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duración:</span>
                <span className="font-medium">{reserva.modulos.length} módulos ({reserva.modulos.length * 40} minutos)</span>
              </div>

              {reserva.esRecurrente && (
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Frecuencia:</span>
                  <span className="font-medium">{getFrecuenciaTexto()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          {reserva.observaciones && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Observaciones
                </h4>
                <p className="text-sm bg-muted p-3 rounded-md">{reserva.observaciones}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Información Adicional */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Información Adicional
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Fecha de creación:</span>
                <p className="font-medium">
                  {(typeof reserva.fechaCreacion === 'string' ? new Date(reserva.fechaCreacion) : reserva.fechaCreacion).toLocaleDateString("es-ES")} a las{" "}
                  {(typeof reserva.fechaCreacion === 'string' ? new Date(reserva.fechaCreacion) : reserva.fechaCreacion).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo de reserva:</span>
                <p className="font-medium">{reserva.esRecurrente ? "Recurrente" : "Individual"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {reserva.estado !== "cancelada" && (
            <>
              <Button variant="outline" onClick={() => onEditar(reserva)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => onCancelar(reserva)}>
                Cancelar Reserva
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
