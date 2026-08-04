import { useState, useEffect, useCallback } from 'react';
import { obtenerModulosOcupados } from '@/lib/reservaController';
import type { ModuloOcupado } from '@/lib/types';

/**
 * Hook para obtener módulos ocupados y detectar conflictos
 */
export function useModulosOcupados(fecha?: Date, equipoId?: string) {
  const [modulosOcupados, setModulosOcupados] = useState<ModuloOcupado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fecha && !equipoId) {
      setModulosOcupados([]);
      return;
    }

    const loadModulosOcupados = async () => {
      console.log('[useModulosOcupados] Loading módulos ocupados...', { fecha: fecha?.toDateString(), equipoId });
      setLoading(true);
      setError(null);
      try {
        const datos = await obtenerModulosOcupados(fecha, equipoId);
        console.log('[useModulosOcupados] Loaded módulos ocupados:', datos);
        setModulosOcupados(datos);
      } catch (err) {
        console.error('[useModulosOcupados] Error loading módulos ocupados:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar módulos ocupados');
        setModulosOcupados([]);
      } finally {
        setLoading(false);
      }
    };

    loadModulosOcupados();
  }, [fecha?.toDateString(), equipoId]); // Only re-run when date or equipoId changes

  /**
   * Verifica si un módulo específico está ocupado
   */
  // useCallback en las tres helpers: se pasan como dependencia de efectos en los
  // formularios/modales. Sin identidad estable el efecto corre en cada render y,
  // si además hace setState, entra en loop ("Maximum update depth exceeded").
  const isModuloOcupado = useCallback((equipoId: string, fecha: Date, modulo: number): boolean => {
    const fechaStr = fecha.toISOString().split('T')[0]; // "2025-10-07"
    
    const ocupado = modulosOcupados.some(
      ocupadoItem => {
        // Backend sends "2025-10-07T00:00:00.000Z", extract date part
        const fechaBackend = ocupadoItem.fecha.split('T')[0]; // "2025-10-07"
        return ocupadoItem.equipoId === equipoId && 
               fechaBackend === fechaStr && 
               ocupadoItem.modulos.includes(modulo);
      }
    );
    
    if (ocupado) {
      console.log(`[isModuloOcupado] Módulo ${modulo} está ocupado:`, { 
        equipoId, 
        fechaStr, 
        modulosOcupados: modulosOcupados.length,
        ocupadoItem: modulosOcupados.find(item => 
          item.equipoId === equipoId && 
          item.fecha.split('T')[0] === fechaStr && 
          item.modulos.includes(modulo)
        )
      });
    }
    
    return ocupado;
  }, [modulosOcupados]);

  /**
   * Obtiene los módulos ocupados para un equipo y fecha específicos
   */
  const getModulosOcupadosParaEquipoYFecha = useCallback((equipoId: string, fecha: Date): number[] => {
    const fechaStr = fecha.toISOString().split('T')[0];
    
    // Collect all modules from all reservations for this equipment and date
    const modulosOcupadosArray: number[] = [];
    modulosOcupados.forEach(ocupado => {
      const fechaBackend = ocupado.fecha.split('T')[0];
      if (ocupado.equipoId === equipoId && fechaBackend === fechaStr) {
        modulosOcupadosArray.push(...ocupado.modulos);
      }
    });
    
    // Remove duplicates and sort
    return [...new Set(modulosOcupadosArray)].sort((a, b) => a - b);
  }, [modulosOcupados]);

  /**
   * Verifica si hay conflictos con una selección de módulos
   */
  const tieneConflictos = useCallback((equipoId: string, fecha: Date, modulosSeleccionados: number[]): boolean => {
    const modulosOcupadosEquipo = getModulosOcupadosParaEquipoYFecha(equipoId, fecha);
    return modulosSeleccionados.some(modulo => modulosOcupadosEquipo.includes(modulo));
  }, [getModulosOcupadosParaEquipoYFecha]);

  /**
   * Devuelve el estado de ocupación de un módulo, o null si está libre.
   * Sirve para que la UI distinga una reserva confirmada de una pendiente
   * en vez de mostrar todo como un "ocupado" indistinto.
   */
  const getOcupacionModulo = useCallback((
    equipoId: string,
    fecha: Date,
    modulo: number
  ): { estado: string; docenteNombre?: string; docenteCurso?: string; docenteMateria?: string } | null => {
    const fechaStr = fecha.toISOString().split('T')[0];

    const ocupacion = modulosOcupados.find(item =>
      item.equipoId === equipoId &&
      item.fecha.split('T')[0] === fechaStr &&
      item.modulos.includes(modulo)
    );

    if (!ocupacion) return null;
    return {
      estado: ocupacion.estado,
      docenteNombre: ocupacion.docenteNombre,
      docenteCurso: ocupacion.docenteCurso,
      docenteMateria: ocupacion.docenteMateria
    };
  }, [modulosOcupados]);

  return {
    modulosOcupados,
    loading,
    error,
    isModuloOcupado,
    getOcupacionModulo,
    getModulosOcupadosParaEquipoYFecha,
    tieneConflictos,
    refresh: () => {
      if (fecha || equipoId) {
        obtenerModulosOcupados(fecha, equipoId).then(setModulosOcupados);
      }
    }
  };
}