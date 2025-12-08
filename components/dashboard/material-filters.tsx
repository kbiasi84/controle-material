'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface TipoMaterial {
  id: number
  nome: string
}

interface MaterialFiltersProps {
  tipos: TipoMaterial[]
}

export function MaterialFilters({ tipos }: MaterialFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentStatus = searchParams.get('status') || 'DISPONIVEL'
  const currentTipo = searchParams.get('tipo') || ''
  const currentSearch = searchParams.get('search') || ''
  
  const [searchValue, setSearchValue] = useState(currentSearch)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handler para mudança de busca com debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    
    // Limpa timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Só faz a busca após 3 caracteres ou se limpar
    timeoutRef.current = setTimeout(() => {
      if (value.length >= 3 || value.length === 0) {
        const params = new URLSearchParams(searchParams.toString())
        if (value.length >= 3) {
          params.set('search', value)
        } else {
          params.delete('search')
        }
        router.push(`/dashboard?${params.toString()}`, { scroll: false })
      }
      timeoutRef.current = null
    }, 400)
  }, [searchParams, router])

  // Handler para mudança de status (imediato, sem debounce)
  const handleStatusChange = useCallback((status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('status', status)
    router.push(`/dashboard?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // Handler para mudança de tipo (imediato, sem debounce)
  const handleTipoChange = useCallback((tipoId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tipoId) {
      params.set('tipo', tipoId)
    } else {
      params.delete('tipo')
    }
    router.push(`/dashboard?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por código ou nome... (mínimo 3 caracteres)" 
            className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchValue.length > 0 && searchValue.length < 3 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              +{3 - searchValue.length} caracteres
            </span>
          )}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            value={currentTipo}
            onChange={(e) => handleTipoChange(e.target.value)}
            className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="">Todos os Tipos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id.toString()}>
                {tipo.nome}
              </option>
            ))}
          </select>
          <select 
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="TODOS">Todos</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="EM_USO">Em Uso</option>
            <option value="MANUTENCAO">Manutenção</option>
          </select>
        </div>
      </div>
    </div>
  )
}
