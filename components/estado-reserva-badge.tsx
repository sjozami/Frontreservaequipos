import { CheckCircle2, Clock, XCircle } from "lucide-react"

type EstadoReserva = "confirmada" | "pendiente" | "cancelada" | string

const ESTILOS: Record<string, { clase: string; etiqueta: string; Icono: typeof CheckCircle2 }> = {
  confirmada: {
    clase: "bg-estado-libre-bg text-estado-libre border-estado-libre-borde",
    etiqueta: "Confirmada",
    Icono: CheckCircle2,
  },
  pendiente: {
    clase: "bg-estado-pendiente-bg text-estado-pendiente border-estado-pendiente-borde",
    etiqueta: "Pendiente",
    Icono: Clock,
  },
  cancelada: {
    clase: "bg-estado-pasado-bg text-estado-pasado border-estado-pasado-borde",
    etiqueta: "Cancelada",
    Icono: XCircle,
  },
}

/**
 * Estado de una reserva con la misma forma en toda la app.
 * El color no es el único indicador: siempre lleva ícono y texto.
 */
export function EstadoReservaBadge({ estado, className = "" }: { estado: EstadoReserva; className?: string }) {
  const config = ESTILOS[estado] ?? {
    clase: "bg-muted text-muted-foreground border-border",
    etiqueta: estado,
    Icono: Clock,
  }
  const { clase, etiqueta, Icono } = config

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${clase} ${className}`}
    >
      <Icono className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {etiqueta}
    </span>
  )
}
