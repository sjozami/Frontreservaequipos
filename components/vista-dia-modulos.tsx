"use client"

import { useMemo } from "react"
import { CalendarDays } from "lucide-react"
import { MODULOS_HORARIOS } from "@/lib/constants"
import { claveFecha, formatearFechaLarga } from "@/lib/fechas"
import { EstadoReservaBadge } from "@/components/estado-reserva-badge"
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types"

interface Props {
  reservas: ReservaEscolar[]
  docentes: Docente[]
  equipos: EquipoEscolar[]
  /** Día a mostrar. Sin fecha se muestra el día de hoy. */
  fecha?: Date | null
  onVer?: (r: ReservaEscolar) => void
}

/**
 * La jornada de un día: módulos en filas, equipos en columnas.
 *
 * Una tabla de reservas obliga a leer fila por fila para saber si un equipo
 * está libre a tal hora. Acá eso se ve de un vistazo: cada celda es un equipo
 * en un módulo, y las vacías son las horas disponibles.
 */
export function VistaDiaModulos({ reservas, docentes, equipos, fecha, onVer }: Props) {
  const dia = fecha ?? new Date()
  const claveDia = claveFecha(dia)

  const reservasDelDia = useMemo(
    () => reservas.filter((r) => claveFecha(r.fecha) === claveDia && r.estado !== "cancelada"),
    [reservas, claveDia]
  )

  // (equipoId|modulo) -> reserva que lo ocupa
  const ocupacion = useMemo(() => {
    const mapa = new Map<string, ReservaEscolar>()
    reservasDelDia.forEach((r) => {
      r.modulos?.forEach((m) => mapa.set(`${r.equipoId}|${m}`, r))
    })
    return mapa
  }, [reservasDelDia])

  const nombreDocente = (r: ReservaEscolar) => {
    const d = docentes.find((x) => x.id === r.docenteId)
    return d ? `${d.nombre} ${d.apellido}` : "—"
  }

  if (equipos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
        <p className="font-medium">No hay equipos cargados</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold first-letter:uppercase">{formatearFechaLarga(dia)}</h3>
        <p className="text-sm text-muted-foreground">
          {reservasDelDia.length} reserva{reservasDelDia.length === 1 ? "" : "s"} ·{" "}
          {equipos.length} equipo{equipos.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Ocupación por módulo y equipo del {formatearFechaLarga(dia)}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-card border-b p-2 text-left font-medium text-muted-foreground">
                Módulo
              </th>
              {equipos.map((e) => (
                <th
                  key={e.id}
                  scope="col"
                  className="border-b p-2 text-left font-medium text-muted-foreground min-w-[10rem]"
                >
                  {e.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULOS_HORARIOS.map((m) => (
              <tr key={m.numero} className="border-b last:border-0">
                <th scope="row" className="sticky left-0 z-10 bg-card p-2 text-left align-top font-normal whitespace-nowrap">
                  <span className="font-medium tabular-nums">{m.numero}º</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {m.horaInicio}–{m.horaFin}
                  </span>
                </th>

                {equipos.map((e) => {
                  const r = ocupacion.get(`${e.id}|${m.numero}`)

                  if (!r) {
                    return (
                      <td key={e.id} className="p-1 align-top">
                        <div className="rounded-md border border-dashed bg-muted/20 p-2 text-xs text-muted-foreground">
                          Libre
                        </div>
                      </td>
                    )
                  }

                  const contenido = (
                    <>
                      <span className="block font-medium leading-tight">{nombreDocente(r)}</span>
                      {(r.curso || r.materia) && (
                        <span className="block text-xs leading-tight text-muted-foreground">
                          {[r.materia, r.curso].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <EstadoReservaBadge estado={r.estado} className="mt-1" />
                    </>
                  )

                  const estilo =
                    r.estado === "pendiente"
                      ? "border-estado-pendiente-borde bg-estado-pendiente-bg"
                      : "border-estado-ocupado-borde bg-estado-ocupado-bg"

                  return (
                    <td key={e.id} className="p-1 align-top">
                      {onVer ? (
                        <button
                          type="button"
                          onClick={() => onVer(r)}
                          aria-label={`Ver reserva de ${nombreDocente(r)}, ${m.nombre}, ${e.nombre}`}
                          className={`w-full rounded-md border p-2 text-left transition-colors hover:brightness-95 ${estilo}`}
                        >
                          {contenido}
                        </button>
                      ) : (
                        <div className={`rounded-md border p-2 ${estilo}`}>{contenido}</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
