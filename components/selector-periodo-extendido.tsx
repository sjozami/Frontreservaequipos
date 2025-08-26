"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import type { PeriodoTipo, PeriodoReserva } from "@/lib/types"
import { PERIODOS_PREDEFINIDOS } from "@/lib/types"

interface SelectorPeriodoExtendidoProps {
  periodoSeleccionado?: PeriodoReserva
  onSeleccionarPeriodo: (periodo: PeriodoReserva) => void
  añoBase?: number
}

export function SelectorPeriodoExtendido({
  periodoSeleccionado,
  onSeleccionarPeriodo,
  añoBase = new Date().getFullYear(),
}: SelectorPeriodoExtendidoProps) {
  const [tipoPeriodo, setTipoPeriodo] = useState<PeriodoTipo>(periodoSeleccionado?.tipo || "mensual")
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoBase)
  const [fechaInicioPersonalizada, setFechaInicioPersonalizada] = useState<Date>(
    periodoSeleccionado?.fechaInicio || new Date(),
  )
  const [fechaFinPersonalizada, setFechaFinPersonalizada] = useState<Date>(periodoSeleccionado?.fechaFin || new Date())

  // Generar años disponibles (año actual ± 2 años)
  const añosDisponibles = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  // Calcular período basado en selección
  const periodoCalculado =
    tipoPeriodo === "mensual"
      ? {
          tipo: tipoPeriodo,
          fechaInicio: fechaInicioPersonalizada,
          fechaFin: fechaFinPersonalizada,
          descripcion: `${format(fechaInicioPersonalizada, "dd/MM/yyyy", { locale: es })} - ${format(fechaFinPersonalizada, "dd/MM/yyyy", { locale: es })}`,
        }
      : PERIODOS_PREDEFINIDOS[tipoPeriodo](añoSeleccionado)

  const duracionDias = differenceInDays(periodoCalculado.fechaFin, periodoCalculado.fechaInicio) + 1

  // Validaciones
  const esValido = periodoCalculado.fechaInicio < periodoCalculado.fechaFin
  const esPeriodoLargo = duracionDias > 90 // Más de 3 meses
  const esPeriodoMuyLargo = duracionDias > 180 // Más de 6 meses

  useEffect(() => {
    if (esValido) {
      onSeleccionarPeriodo(periodoCalculado)
    }
  }, [tipoPeriodo, añoSeleccionado, fechaInicioPersonalizada, fechaFinPersonalizada, esValido])

  const getPeriodoInfo = (tipo: PeriodoTipo) => {
    switch (tipo) {
      case "hasta-julio":
        return {
          nombre: "Hasta Julio",
          descripcion: "Enero - Julio (7 meses)",
          duracion: "~210 días",
          color: "bg-blue-100 text-blue-800",
        }
      case "hasta-diciembre":
        return {
          nombre: "Hasta Diciembre",
          descripcion: "Enero - Diciembre (12 meses)",
          duracion: "~365 días",
          color: "bg-purple-100 text-purple-800",
        }
      case "mensual":
        return {
          nombre: "Personalizado",
          descripcion: "Período personalizable",
          duracion: "Variable",
          color: "bg-gray-100 text-gray-800",
        }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Selector de Período
        </CardTitle>
        <CardDescription>Selecciona el tipo de período para la reserva o agrupación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de tipo de período */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tipo de Período</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["mensual", "hasta-julio", "hasta-diciembre"] as PeriodoTipo[]).map((tipo) => {
              const info = getPeriodoInfo(tipo)
              return (
                <Card
                  key={tipo}
                  className={`cursor-pointer transition-all ${
                    tipoPeriodo === tipo ? "ring-2 ring-primary" : "hover:shadow-md"
                  }`}
                  onClick={() => setTipoPeriodo(tipo)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{info.nombre}</h4>
                      <Badge className={info.color}>{info.duracion}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{info.descripcion}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Configuración específica por tipo */}
        {tipoPeriodo !== "mensual" ? (
          <div>
            <label className="text-sm font-medium mb-2 block">Año</label>
            <Select
              value={añoSeleccionado.toString()}
              onValueChange={(value) => setAñoSeleccionado(Number.parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {añosDisponibles.map((año) => (
                  <SelectItem key={año} value={año.toString()}>
                    {año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fecha de Inicio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaInicioPersonalizada, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaInicioPersonalizada}
                    onSelect={(date) => date && setFechaInicioPersonalizada(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fecha de Fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaFinPersonalizada, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaFinPersonalizada}
                    onSelect={(date) => date && setFechaFinPersonalizada(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Información del período calculado */}
        <Card className={`${esValido ? "bg-muted" : "bg-destructive/10 border-destructive"}`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {!esValido && <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />}
              <div className="flex-1">
                <h4 className="font-medium mb-2">{esValido ? "Período Seleccionado" : "Período Inválido"}</h4>
                {esValido ? (
                  <div className="space-y-2">
                    <p className="text-sm">{periodoCalculado.descripcion}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{duracionDias}</span>
                        <span className="text-muted-foreground"> días</span>
                      </div>
                      <div>
                        <span className="font-medium">{Math.ceil(duracionDias / 7)}</span>
                        <span className="text-muted-foreground"> semanas</span>
                      </div>
                      <div>
                        <span className="font-medium">{Math.ceil(duracionDias / 30)}</span>
                        <span className="text-muted-foreground"> meses aprox.</span>
                      </div>
                    </div>

                    {/* Advertencias para períodos largos */}
                    {esPeriodoMuyLargo && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <p className="text-sm text-amber-800">
                          Período muy largo (más de 6 meses). Considera dividir en períodos más cortos.
                        </p>
                      </div>
                    )}
                    {esPeriodoLargo && !esPeriodoMuyLargo && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-800">
                          Período largo (más de 3 meses). Ideal para agrupaciones.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">La fecha de inicio debe ser anterior a la fecha de fin.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
