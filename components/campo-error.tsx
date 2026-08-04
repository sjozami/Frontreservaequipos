import { AlertCircle } from "lucide-react"

/**
 * Mensaje de error de un campo.
 * Va con role="alert" para que el lector de pantalla lo anuncie al aparecer:
 * un <p> con texto rojo solo comunica el error a quien puede verlo.
 */
export function CampoError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null

  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}
