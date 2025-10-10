import { useState, useEffect } from 'react';
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
  const isModuloOcupado = (equipoId: string, fecha: Date, modulo: number): boolean => {
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
  };

  /**
   * Obtiene los módulos ocupados para un equipo y fecha específicos
   */
  const getModulosOcupadosParaEquipoYFecha = (equipoId: string, fecha: Date): number[] => {
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
  };

  /**
   * Verifica si hay conflictos con una selección de módulos
   */
  const tieneConflictos = (equipoId: string, fecha: Date, modulosSeleccionados: number[]): boolean => {
    const modulosOcupadosEquipo = getModulosOcupadosParaEquipoYFecha(equipoId, fecha);
    return modulosSeleccionados.some(modulo => modulosOcupadosEquipo.includes(modulo));
  };

  return {
    modulosOcupados,
    loading,
    error,
    isModuloOcupado,
    getModulosOcupadosParaEquipoYFecha,
    tieneConflictos,
    refresh: () => {
      if (fecha || equipoId) {
        obtenerModulosOcupados(fecha, equipoId).then(setModulosOcupados);
      }
    }
  };
}