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
  docenteCurso?: string
  docenteMateria?: string
  /** El docente tiene clase en este módulo según la grilla: qué y con quién. */
  claseDocente?: { materia: string; curso: string }
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
  disponible: "border-border bg-card hover:border-primary/60 hover:bg-primary/5",
  propio: "border-primary/40 bg-primary/5",
  confirmada: "border-estado-ocupado-borde bg-estado-ocupado-bg",
  pendiente: "border-estado-pendiente-borde bg-estado-pendiente-bg",
  pasado: "border-estado-pasado-borde bg-estado-pasado-bg",
  "sin-contexto": "border-dashed border-border bg-muted/40",
}

const LEYENDA: { clase: string; texto: string }[] = [
  { clase: "border-border bg-card", texto: "Disponible" },
  { clase: "border-estado-clase-borde bg-estado-clase-bg", texto: "Tiene clase" },
  { clase: "border-primary bg-primary/15", texto: "Seleccionado" },
  { clase: "border-estado-ocupado-borde bg-estado-ocupado-bg", texto: "Ocupado" },
  { clase: "border-estado-pendiente-borde bg-estado-pendiente-bg", texto: "Reservado (pendiente)" },
  { clase: "border-estado-pasado-borde bg-estado-pasado-bg", texto: "Ya pasó" },
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
          const { disponible, estado, razon, docenteNombre, docenteCurso, docenteMateria, claseDocente } =
            getDisponibilidad(modulo.numero)
          const seleccionado = seleccionados.includes(modulo.numero)
          const ocupadoPorOtro = estado === "confirmada" || estado === "pendiente"
          // Módulo libre en el que además el docente tiene clase: es el candidato
          // natural a reservar, así que se destaca.
          const esSuHorario = !!claseDocente && !ocupadoPorOtro && estado !== "pasado"

          // "3°A • Historia": el contexto de quién lo ocupa, cuando lo tenemos.
          const contextoDocente = [docenteCurso, docenteMateria].filter(Boolean).join(" • ")

          // Qué dicta acá el docente se dice siempre que se sepa, incluso si
          // todavía falta elegir el equipo: es el dato que evita preguntar.
          const suClase = claseDocente ? `Dicta ${claseDocente.materia} en ${claseDocente.curso}.` : ""

          const detalle = ocupadoPorOtro
            ? docenteNombre
              ? `${razon} por ${docenteNombre}${contextoDocente ? ` (${contextoDocente})` : ""}`
              : `${razon} — no se puede seleccionar`
            : estado === "pasado"
              ? `${suClase} Este módulo ya pasó`.trim()
              : estado === "sin-contexto"
                ? `${suClase} Elegí equipo y fecha`.trim()
                : `${suClase} ${seleccionado ? `Quitar ${modulo.nombre}` : `Seleccionar ${modulo.nombre}`}`.trim()

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
                seleccionado
                  ? ESTILOS.seleccionado
                  : esSuHorario
                    ? "border-estado-clase-borde bg-estado-clase-bg hover:border-estado-clase"
                    : ESTILOS[estado]
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
                      estado === "pendiente" ? "text-estado-pendiente" : "text-estado-ocupado"
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
                <div className="mt-1">
                  <p
                    className={`text-[11px] font-medium uppercase tracking-wide ${
                      estado === "pendiente" ? "text-estado-pendiente" : "text-estado-ocupado"
                    }`}
                  >
                    {razon}
                  </p>
                  {docenteNombre && (
                    <>
                      <p className="mt-0.5 text-xs font-medium leading-tight text-foreground/80 break-words">
                        {docenteNombre}
                      </p>
                      {contextoDocente && (
                        <p className="text-[11px] leading-tight text-muted-foreground break-words">
                          {contextoDocente}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              {estado === "pasado" && (
                <p className="text-[11px] font-medium mt-1 text-estado-pasado">Ya pasó</p>
              )}

              {/* Qué le toca dictar al docente en este módulo. */}
              {esSuHorario && (
                <p className="mt-1 text-[11px] font-medium leading-tight text-estado-clase">
                  {claseDocente!.materia}
                  <span className="block font-normal text-muted-foreground">{claseDocente!.curso}</span>
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
