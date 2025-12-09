'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export function HistoricoFiltros() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentSearch = searchParams.get('busca') || ''
  const currentStatus = searchParams.get('status') || 'TODOS'
  const currentPeriodo = searchParams.get('periodo') || '30'
  
  const [searchValue, setSearchValue] = useState(currentSearch)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sincroniza o input com a URL
  useEffect(() => {
    if (currentSearch !== searchValue && !timeoutRef.current) {
      setSearchValue(currentSearch)
    }
  }, [currentSearch])

  // Debounce da busca
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (searchValue.length >= 3 || searchValue.length === 0) {
        const params = new URLSearchParams(searchParams.toString())
        if (searchValue.length >= 3) {
          params.set('busca', searchValue)
        } else {
          params.delete('busca')
        }
        params.delete('pagina') // Reset página ao buscar
        router.push(`/dashboard/historico?${params.toString()}`, { scroll: false })
      }
      timeoutRef.current = null
    }, 400)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchValue])

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'TODOS') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    params.delete('pagina') // Reset página ao filtrar
    router.push(`/dashboard/historico?${params.toString()}`, { scroll: false })
  }

  const handlePeriodoChange = (periodo: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', periodo)
    params.delete('pagina') // Reset página ao filtrar
    router.push(`/dashboard/historico?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por código ou nome do material..." 
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
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="EM_POSSE">Em Posse</option>
            <option value="DEVOLVIDO">Devolvido</option>
          </select>
          <select 
            value={currentPeriodo}
            onChange={(e) => handlePeriodoChange(e.target.value)}
            className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="1">Últimas 24h</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
        </div>
      </div>
    </div>
  )
}

