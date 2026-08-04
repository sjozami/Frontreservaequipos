import { redirect } from "next/navigation"

// Ruta legada duplicada de /reservas. Redirige a la página oficial.
export default function PageReservasDocentes() {
  redirect("/reservas")
}