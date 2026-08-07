"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface OpcionBuscable {
  valor: string
  etiqueta: string
  /** Texto secundario (materias, curso). También se usa para buscar. */
  detalle?: string
}

interface Props {
  opciones: OpcionBuscable[]
  valor?: string
  onChange: (valor: string) => void
  placeholder?: string
  placeholderBusqueda?: string
  vacio?: string
  id?: string
  invalido?: boolean
  describedBy?: string
  className?: string
}

/**
 * Selector con buscador. Con listas largas —23 docentes y subiendo— desplegar y
 * scrollear es más lento que escribir tres letras del apellido.
 *
 * La búsqueda ignora acentos y mayúsculas, y también mira el detalle, así se
 * puede encontrar un docente por la materia que dicta.
 */
export function SelectorBuscable({
  opciones,
  valor,
  onChange,
  placeholder = "Seleccionar…",
  placeholderBusqueda = "Buscar…",
  vacio = "Sin resultados",
  id,
  invalido,
  describedBy,
  className,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const seleccionada = opciones.find((o) => o.valor === valor)

  const normalizar = (t: string) =>
    t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          aria-invalid={invalido}
          aria-describedby={describedBy}
          className={cn(
            "w-full justify-between font-normal",
            !seleccionada && "text-muted-foreground",
            invalido && "border-destructive",
            className
          )}
        >
          <span className="truncate text-left">{seleccionada?.etiqueta ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[18rem] p-0" align="start">
        <Command
          filter={(value, search) => {
            // `value` es "etiqueta detalle" (ver CommandItem): así se puede
            // buscar por nombre o por materia indistintamente.
            return normalizar(value).includes(normalizar(search)) ? 1 : 0
          }}
        >
          <CommandInput placeholder={placeholderBusqueda} />
          <CommandList>
            <CommandEmpty>{vacio}</CommandEmpty>
            <CommandGroup>
              {opciones.map((o) => (
                <CommandItem
                  key={o.valor}
                  value={`${o.etiqueta} ${o.detalle ?? ""}`}
                  onSelect={() => {
                    onChange(o.valor)
                    setAbierto(false)
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4 shrink-0", valor === o.valor ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{o.etiqueta}</span>
                    {o.detalle && (
                      <span className="block truncate text-xs text-muted-foreground">{o.detalle}</span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
