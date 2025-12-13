'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    ArrowRightLeft,
    Package,
    ChevronLeft,
    ChevronRight,
    Search,
    Building2,
    User,
    Calendar,
} from 'lucide-react'

interface Transferencia {
    id: number
    dataTransferencia: string
    observacao: string | null
    material: {
        codigoIdentificacao: string
        descricao: string
        tipo: string
    }
    origem: string
    destino: string
    responsavel: string
}

interface TransferenciasHistoricoProps {
    transferencias: Transferencia[]
    paginaAtual: number
    totalPaginas: number
    totalRegistros: number
    registrosPorPagina: number
}

export function TransferenciasHistorico({
    transferencias,
    paginaAtual,
    totalPaginas,
    totalRegistros,
    registrosPorPagina,
}: TransferenciasHistoricoProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Estados dos filtros
    const currentSearch = searchParams.get('busca') || ''
    const [searchValue, setSearchValue] = useState(currentSearch)

    // Handler para busca com debounce
    const handleSearchChange = (value: string) => {
        setSearchValue(value)

        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (value.length >= 3) {
                params.set('busca', value)
            } else {
                params.delete('busca')
            }
            params.delete('pagina')
            router.push(`/dashboard/transferencias?${params.toString()}`, { scroll: false })
        }, 400)

        return () => clearTimeout(timeout)
    }

    const handlePageChange = (novaPagina: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('pagina', novaPagina.toString())
        router.push(`/dashboard/transferencias?${params.toString()}`, { scroll: false })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const inicioRegistros = (paginaAtual - 1) * registrosPorPagina + 1
    const fimRegistros = Math.min(paginaAtual * registrosPorPagina, totalRegistros)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Histórico de Transferências</h2>
                    <p className="text-slate-500 mt-1">
                        Acompanhe todas as transferências de materiais realizadas
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Buscar por material, unidade ou responsável... (mínimo 3 caracteres)"
                            className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                        {searchValue.length > 0 && searchValue.length < 3 && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                +{3 - searchValue.length} caracteres
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de Transferências */}
            {transferencias.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <ArrowRightLeft className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">Nenhuma transferência encontrada</h3>
                    <p className="text-slate-400 text-base mt-2">
                        As transferências realizadas aparecerão aqui.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b-2 border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Material
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Origem → Destino
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Responsável
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Observação
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transferencias.map((transferencia) => (
                                    <tr key={transferencia.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-600">
                                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                <span className="text-sm">{formatDate(transferencia.dataTransferencia)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">
                                                        {transferencia.material.descricao || transferencia.material.tipo}
                                                    </p>
                                                    <p className="text-sm text-slate-400 font-mono">
                                                        {transferencia.material.codigoIdentificacao}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center text-slate-600">
                                                    <Building2 className="w-4 h-4 mr-1 text-slate-400" />
                                                    <span className="text-sm max-w-[120px] truncate" title={transferencia.origem}>
                                                        {transferencia.origem}
                                                    </span>
                                                </div>
                                                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                                                <div className="flex items-center text-slate-600">
                                                    <Building2 className="w-4 h-4 mr-1 text-blue-500" />
                                                    <span className="text-sm font-medium max-w-[120px] truncate" title={transferencia.destino}>
                                                        {transferencia.destino}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-600">
                                                <User className="w-4 h-4 mr-2 text-slate-400" />
                                                <span className="text-sm">{transferencia.responsavel}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500 max-w-[200px] truncate block" title={transferencia.observacao || ''}>
                                                {transferencia.observacao || '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {totalPaginas > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-500">
                                Mostrando <span className="font-bold text-slate-700">{inicioRegistros}</span> a{' '}
                                <span className="font-bold text-slate-700">{fimRegistros}</span> de{' '}
                                <span className="font-bold text-slate-700">{totalRegistros}</span> transferências
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(paginaAtual - 1)}
                                    disabled={paginaAtual <= 1}
                                    className="p-2 rounded-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                        let pageNum: number
                                        if (totalPaginas <= 5) {
                                            pageNum = i + 1
                                        } else if (paginaAtual <= 3) {
                                            pageNum = i + 1
                                        } else if (paginaAtual >= totalPaginas - 2) {
                                            pageNum = totalPaginas - 4 + i
                                        } else {
                                            pageNum = paginaAtual - 2 + i
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${pageNum === paginaAtual
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(paginaAtual + 1)}
                                    disabled={paginaAtual >= totalPaginas}
                                    className="p-2 rounded-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
