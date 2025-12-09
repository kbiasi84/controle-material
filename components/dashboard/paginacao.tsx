'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginacaoProps {
  paginaAtual: number
  totalPaginas: number
  totalRegistros: number
  registrosPorPagina: number
  baseUrl: string
}

export function Paginacao({ 
  paginaAtual, 
  totalPaginas, 
  totalRegistros,
  registrosPorPagina,
  baseUrl 
}: PaginacaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const irParaPagina = (pagina: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (pagina === 1) {
      params.delete('pagina')
    } else {
      params.set('pagina', pagina.toString())
    }
    router.push(`${baseUrl}?${params.toString()}`, { scroll: false })
  }

  // Calcula range de registros exibidos
  const inicio = (paginaAtual - 1) * registrosPorPagina + 1
  const fim = Math.min(paginaAtual * registrosPorPagina, totalRegistros)

  // Gera array de páginas a exibir
  const gerarPaginas = () => {
    const paginas: (number | string)[] = []
    const maxPaginas = 5

    if (totalPaginas <= maxPaginas) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i)
      }
    } else {
      // Sempre mostra primeira página
      paginas.push(1)

      if (paginaAtual > 3) {
        paginas.push('...')
      }

      // Páginas ao redor da atual
      const start = Math.max(2, paginaAtual - 1)
      const end = Math.min(totalPaginas - 1, paginaAtual + 1)

      for (let i = start; i <= end; i++) {
        if (!paginas.includes(i)) {
          paginas.push(i)
        }
      }

      if (paginaAtual < totalPaginas - 2) {
        paginas.push('...')
      }

      // Sempre mostra última página
      if (!paginas.includes(totalPaginas)) {
        paginas.push(totalPaginas)
      }
    }

    return paginas
  }

  if (totalPaginas <= 1) {
    return (
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-500 text-center">
          Exibindo {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Info */}
      <p className="text-sm text-slate-500">
        Exibindo <span className="font-bold text-slate-700">{inicio}</span> a{' '}
        <span className="font-bold text-slate-700">{fim}</span> de{' '}
        <span className="font-bold text-slate-700">{totalRegistros}</span> registros
      </p>

      {/* Controles */}
      <div className="flex items-center gap-1">
        {/* Primeira página */}
        <button
          onClick={() => irParaPagina(1)}
          disabled={paginaAtual === 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Primeira página"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        {/* Página anterior */}
        <button
          onClick={() => irParaPagina(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Números das páginas */}
        <div className="flex items-center gap-1 mx-2">
          {gerarPaginas().map((pagina, index) => (
            pagina === '...' ? (
              <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={pagina}
                onClick={() => irParaPagina(pagina as number)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  paginaAtual === pagina
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pagina}
              </button>
            )
          ))}
        </div>

        {/* Próxima página */}
        <button
          onClick={() => irParaPagina(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Próxima página"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Última página */}
        <button
          onClick={() => irParaPagina(totalPaginas)}
          disabled={paginaAtual === totalPaginas}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

