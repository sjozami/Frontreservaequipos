"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useModulosOcupados } from '@/hooks/use-reservas';
import { MODULOS_HORARIOS } from '@/lib/constants';
import type { EquipoEscolar } from '@/lib/types';

interface DisponibilidadModulosProps {
  equipos: EquipoEscolar[];
}

export function DisponibilidadModulos({ equipos }: DisponibilidadModulosProps) {
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>();
  
  const { 
    modulosOcupados, 
    loading, 
    error, 
    isModuloOcupado,
    getModulosOcupadosParaEquipoYFecha 
  } = useModulosOcupados(fechaSeleccionada, equipoSeleccionado);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Disponibilidad de Módulos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Equipo */}
          <div>
            <label className="text-sm font-medium">Equipo</label>
            <Select value={equipoSeleccionado} onValueChange={setEquipoSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar equipo" />
              </SelectTrigger>
              <SelectContent>
                {equipos.map((equipo) => (
                  <SelectItem key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Fecha */}
          <div>
            <label className="text-sm font-medium">Fecha</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaSeleccionada ? format(fechaSeleccionada, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fechaSeleccionada}
                  onSelect={setFechaSeleccionada}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Módulos */}
      {equipoSeleccionado && fechaSeleccionada && (
        <Card>
          <CardHeader>
            <CardTitle>Módulos - {format(fechaSeleccionada, "PPP", { locale: es })}</CardTitle>
            {loading && <p className="text-sm text-muted-foreground">Cargando disponibilidad...</p>}
            {error && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">Error: {error}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {MODULOS_HORARIOS.map((modulo) => {
                const ocupado = isModuloOcupado(equipoSeleccionado, fechaSeleccionada, modulo.numero);
                
                return (
                  <div
                    key={modulo.numero}
                    className={`border-2 rounded-lg p-3 ${
                      ocupado
                        ? "border-red-500 bg-red-100"
                        : "border-green-500 bg-green-100"
                    }`}
                  >
                    <div className="text-center">
                      <p className={`font-medium text-sm ${ocupado ? "text-red-700" : "text-green-700"}`}>
                        {modulo.nombre}
                      </p>
                      <p className={`text-xs ${ocupado ? "text-red-600" : "text-green-600"}`}>
                        {modulo.horaInicio} - {modulo.horaFin}
                      </p>
                      <div className="flex items-center justify-center mt-1">
                        <span className={`text-xs font-medium ${ocupado ? "text-red-600" : "text-green-600"}`}>
                          {ocupado ? "OCUPADO" : "LIBRE"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Resumen</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Módulos libres: {MODULOS_HORARIOS.length - getModulosOcupadosParaEquipoYFecha(equipoSeleccionado, fechaSeleccionada).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Módulos ocupados: {getModulosOcupadosParaEquipoYFecha(equipoSeleccionado, fechaSeleccionada).length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}