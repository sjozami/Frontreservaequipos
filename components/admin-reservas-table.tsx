"use client"

import React, { useMemo, useState } from "react"
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatearHorarioModulos } from "@/lib/reservas-utils"

interface Props {
  reservas: ReservaEscolar[]
  docentes: Docente[]
  equipos: EquipoEscolar[]
  pageSize?: number
  onView?: (r: ReservaEscolar) => void
  onEdit?: (r: ReservaEscolar) => void
  onCancel?: (r: ReservaEscolar) => void
}

export default function AdminReservasTable({ reservas, docentes, equipos, pageSize = 10, onView, onEdit, onCancel, onCancelSeries }: Props & { onCancelSeries?: (grupoId: string) => void }) {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<"fecha" | "equipo" | "docente" | "estado">("fecha")
  const [dir, setDir] = useState<"asc" | "desc">("asc")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const sorted = useMemo(() => {
    const copy = [...reservas]
    copy.sort((a, b) => {
      let va: any
      let vb: any
      if (sortBy === "fecha") {
        va = typeof a.fecha === 'string' ? new Date(a.fecha).getTime() : a.fecha.getTime()
        vb = typeof b.fecha === 'string' ? new Date(b.fecha).getTime() : b.fecha.getTime()
      } else if (sortBy === "equipo") {
        const ea = equipos.find((e) => e.id === a.equipoId)?.nombre ?? ""
        const eb = equipos.find((e) => e.id === b.equipoId)?.nombre ?? ""
        va = ea.toLowerCase(); vb = eb.toLowerCase()
      } else if (sortBy === "docente") {
        const da = docentes.find((d) => d.id === a.docenteId)?.apellido ?? ""
        const db = docentes.find((d) => d.id === b.docenteId)?.apellido ?? ""
        va = da.toLowerCase(); vb = db.toLowerCase()
      } else {
        va = a.estado; vb = b.estado
      }

      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [reservas, sortBy, dir, docentes, equipos])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize)

  // Build groups: series grouped by grupoRecurrenteId, and singles
  const seriesGroups = useMemo(() => {
    const map = new Map<string, ReservaEscolar[]>()
    for (const r of sorted) {
      if (r.grupoRecurrenteId) {
        const arr = map.get(r.grupoRecurrenteId) ?? []
        arr.push(r)
        map.set(r.grupoRecurrenteId, arr)
      }
    }
    return map
  }, [sorted])

  const singles = useMemo(() => sorted.filter((r) => !r.grupoRecurrenteId), [sorted])

  const toggleSort = (col: typeof sortBy) => {
    if (col === sortBy) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setDir('asc') }
    setPage(1)
  }

  const toggleGroup = (gid: string) => setExpandedGroups(e => ({ ...e, [gid]: !e[gid] }))

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-sm text-muted-foreground">
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('fecha')}>Fecha ▾</th>
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('equipo')}>Equipo</th>
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('docente')}>Docente</th>
              <th className="p-2">Horario</th>
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('estado')}>Estado</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(seriesGroups.entries()).map(([gid, reservasGrupo]) => {
              const primera = reservasGrupo[0]
              const docente = docentes.find((d) => d.id === primera.docenteId)
              const equipo = equipos.find((e) => e.id === primera.equipoId)
              const total = reservasGrupo.length
              return (
                <React.Fragment key={`group-${gid}`}>
                  <tr className="border-t bg-muted/5">
                    <td className="p-2 align-middle" colSpan={1}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleGroup(gid)} className="text-sm font-medium">{expandedGroups[gid] ? '▾' : '▸'}</button>
                        <div className="text-sm font-medium">{(typeof primera.fecha === 'string' ? new Date(primera.fecha) : primera.fecha).toLocaleDateString('es-ES', { timeZone: "UTC" })}</div>
                        <div className="text-xs text-muted-foreground"> • {reservasGrupo[0].frecuencia ?? ''} • {total} fechas</div>
                      </div>
                    </td>
                    <td className="p-2">{equipo?.nombre ?? '—'}</td>
                    <td className="p-2">{docente ? `${docente.nombre} ${docente.apellido}` : '—'}</td>
                    <td className="p-2 text-sm">{formatearHorarioModulos(primera.modulos)}</td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-sm">Recurrente</Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => expandedGroups[gid] ? toggleGroup(gid) : toggleGroup(gid)}>{expandedGroups[gid] ? 'Contraer' : 'Expandir'}</Button>
                        <Button size="sm" variant="outline" onClick={() => onEdit?.(primera)}>Editar Serie</Button>
                        {onCancelSeries && (
                          <Button size="sm" variant="destructive" onClick={() => onCancelSeries(gid)}>Cancelar Serie</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedGroups[gid] && reservasGrupo.map((r) => {
                    const docente = docentes.find((d) => d.id === r.docenteId)
                    const equipo = equipos.find((e) => e.id === r.equipoId)
                    return (
                      <tr key={r.id} className="border-t bg-white">
                        <td className="p-2 align-middle">
                          <div className="text-sm">{(typeof r.fecha === 'string' ? new Date(r.fecha) : r.fecha).toLocaleDateString('es-ES', { timeZone: "UTC" })}</div>
                          <div className="text-xs text-muted-foreground">{(typeof r.fecha === 'string' ? new Date(r.fecha) : r.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-2">{equipo?.nombre ?? '—'}</td>
                        <td className="p-2">{docente ? `${docente.nombre} ${docente.apellido}` : '—'}</td>
                        <td className="p-2 text-sm">{formatearHorarioModulos(r.modulos)}</td>
                        <td className="p-2">
                          <Badge variant={r.estado === 'confirmada' ? 'default' : r.estado === 'pendiente' ? 'secondary' : 'destructive'} className="text-sm px-2 py-1">
                            {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => onView?.(r)}>Ver</Button>
                            <Button size="sm" variant="outline" onClick={() => onEdit?.(r)}>Editar</Button>
                            <Button size="sm" variant="destructive" onClick={() => onCancel?.(r)}>Cancelar</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              )
            })}

            {singles.map((r) => {
              const docente = docentes.find((d) => d.id === r.docenteId)
              const equipo = equipos.find((e) => e.id === r.equipoId)
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-2 align-middle">
                    <div className="text-sm font-medium">{(typeof r.fecha === 'string' ? new Date(r.fecha) : r.fecha).toLocaleDateString('es-ES', { timeZone: "UTC" })}</div>
                    <div className="text-xs text-muted-foreground">{(typeof r.fecha === 'string' ? new Date(r.fecha) : r.fecha).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="text-sm">{equipo?.nombre ?? '—'}</div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="text-sm">{docente ? `${docente.nombre} ${docente.apellido}` : '—'}</div>
                    <div className="text-xs text-muted-foreground">{docente?.curso ?? ''}</div>
                  </td>
                  <td className="p-2 align-middle text-sm">{formatearHorarioModulos(r.modulos)}</td>
                  <td className="p-2 align-middle">
                    <Badge variant={r.estado === 'confirmada' ? 'default' : r.estado === 'pendiente' ? 'secondary' : 'destructive'} className="text-sm px-2 py-1">
                      {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onView?.(r)}>Ver</Button>
                      <Button size="sm" variant="outline" onClick={() => onEdit?.(r)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => onCancel?.(r)}>Cancelar</Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">Página {page} de {totalPages} • {reservas.length} reservas</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setPage(1)} disabled={page === 1}>Primera</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Anterior</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Siguiente</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Última</Button>
        </div>
      </div>
    </div>
  )
}
