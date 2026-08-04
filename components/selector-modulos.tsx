"use client"

import { Check, Lock } from "lucide-react"
import { MODULOS_HORARIOS } from "@/lib/constants"

/**
 * Estado de un módulo dentro de la grilla.
 * - disponible: se puede seleccionar
 * - propio: ya pertenece a la reserva que se está editando
 * - confirmada / pendiente: lo ocupa otra reserva, no se puede seleccionar
 * - pasado: el horario ya transcurrió (solo aplica al día de hoy)
 * - sin-contexto: falta elegir equipo o fecha, no sabemos la disponibilidad
 */
export type EstadoModulo =
  | "disponible"
  | "propio"
  | "confirmada"
  | "pendiente"
  | "pasado"
  | "sin-contexto"

export interface DisponibilidadModulo {
  disponible: boolean
  estado: EstadoModulo
  razon?: string
  docenteNombre?: string
}

interface SelectorModulosProps {
  seleccionados: number[]
  getDisponibilidad: (modulo: number) => DisponibilidadModulo
  onToggle: (modulo: number, seleccionar: boolean) => void
  /** Mensaje cuando todavía no hay equipo/fecha elegidos. */
  mensajeSinContexto?: string
}

const ESTILOS: Record<EstadoModulo | "seleccionado", string> = {
  seleccionado: "border-primary bg-primary/10 ring-2 ring-primary/25",
  disponible: "border-border bg-background hover:border-primary/60 hover:bg-primary/5",
  propio: "border-primary/40 bg-primary/5",
  confirmada: "border-red-300 bg-red-50",
  pendiente: "border-orange-300 bg-orange-50",
  pasado: "border-muted bg-muted/60",
  "sin-contexto": "border-dashed border-border bg-muted/30",
}

const LEYENDA: { clase: string; texto: string }[] = [
  { clase: "border-border bg-background", texto: "Disponible" },
  { clase: "border-primary bg-primary/15", texto: "Seleccionado" },
  { clase: "border-red-400 bg-red-100", texto: "Ocupado" },
  { clase: "border-orange-400 bg-orange-100", texto: "Reservado (pendiente)" },
  { clase: "border-muted bg-muted", texto: "Ya pasó" },
]

export function SelectorModulos({
  seleccionados,
  getDisponibilidad,
  onToggle,
  mensajeSinContexto = "Elegí un equipo y una fecha para ver qué módulos están libres.",
}: SelectorModulosProps) {
  const faltaContexto = getDisponibilidad(MODULOS_HORARIOS[0].numero).estado === "sin-contexto"

  return (
    <div>
      {faltaContexto ? (
        <p className="text-sm text-muted-foreground mb-4">{mensajeSinContexto}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs text-muted-foreground">
          {LEYENDA.map((item) => (
            <span key={item.texto} className="flex items-center gap-1.5">
              <span className={`inline-block w-3 h-3 rounded-sm border-2 ${item.clase}`} />
              {item.texto}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {MODULOS_HORARIOS.map((modulo) => {
          const { disponible, estado, razon, docenteNombre } = getDisponibilidad(modulo.numero)
          const seleccionado = seleccionados.includes(modulo.numero)
          const ocupadoPorOtro = estado === "confirmada" || estado === "pendiente"

          const detalle = ocupadoPorOtro
            ? docenteNombre
              ? `${razon} por ${docenteNombre}`
              : `${razon} — no se puede seleccionar`
            : estado === "pasado"
              ? "Este módulo ya pasó"
              : estado === "sin-contexto"
                ? "Elegí equipo y fecha"
                : seleccionado
                  ? `Quitar ${modulo.nombre}`
                  : `Seleccionar ${modulo.nombre}`

          return (
            <button
              key={modulo.numero}
              type="button"
              disabled={!disponible}
              aria-pressed={seleccionado}
              title={detalle}
              aria-label={`${modulo.nombre}, ${modulo.horaInicio} a ${modulo.horaFin}. ${detalle}`}
              onClick={() => onToggle(modulo.numero, !seleccionado)}
              className={`relative text-left border-2 rounded-lg p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                seleccionado ? ESTILOS.seleccionado : ESTILOS[estado]
              } ${disponible ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={`font-semibold text-sm tabular-nums ${
                    ocupadoPorOtro ? "text-foreground/70" : estado === "pasado" ? "text-muted-foreground" : ""
                  }`}
                >
                  {modulo.numero}º
                </span>
                {seleccionado && <Check className="w-4 h-4 text-primary shrink-0" />}
                {ocupadoPorOtro && (
                  <Lock
                    className={`w-3.5 h-3.5 shrink-0 ${
                      estado === "pendiente" ? "text-orange-500" : "text-red-500"
                    }`}
                  />
                )}
              </div>

              <p
                className={`text-xs tabular-nums mt-0.5 ${
                  estado === "pasado" ? "text-muted-foreground/70" : "text-muted-foreground"
                }`}
              >
                {modulo.horaInicio}–{modulo.horaFin}
              </p>

              {ocupadoPorOtro && (
                <p
                  className={`text-[11px] font-medium mt-1 uppercase tracking-wide ${
                    estado === "pendiente" ? "text-orange-600" : "text-red-600"
                  }`}
                >
                  {razon}
                </p>
              )}
              {estado === "pasado" && (
                <p className="text-[11px] font-medium mt-1 text-muted-foreground">Ya pasó</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
