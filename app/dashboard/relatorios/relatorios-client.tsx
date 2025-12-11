'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Search,
    Package,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileText,
    Clock,
} from 'lucide-react'
import {
    searchMateriais,
    searchUsuarios,
    getRelatorioMaterial,
    getRelatorioUsuario
} from './actions'

// Tipos
interface MaterialOption {
    id: number
    codigoIdentificacao: string
    descricao: string
    tipoNome: string
}

interface UsuarioOption {
    id: number
    identificacao: string
    nome: string
    unidadeNome: string
}

interface MovimentacaoMaterial {
    id: number
    dataRetirada: string
    dataDevolucao: string | null
    obsRetirada: string | null
    obsDevolucao: string | null
    usuario: { id: number; nome: string; identificacao: string }
    respRetirada: { id: number; nome: string; identificacao: string }
    respDevolucao: { id: number; nome: string; identificacao: string } | null
}

interface MovimentacaoUsuario {
    id: number
    dataRetirada: string
    dataDevolucao: string | null
    obsRetirada: string | null
    obsDevolucao: string | null
    material: { id: number; codigo: string; descricao: string; tipo: string }
    respRetirada: { id: number; nome: string; identificacao: string }
    respDevolucao: { id: number; nome: string; identificacao: string } | null
}

// Formatador de data pt-BR
function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Componente de Badge
function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'warning' | 'success' }) {
    const colors = {
        default: 'bg-slate-100 text-slate-700',
        warning: 'bg-amber-100 text-amber-700',
        success: 'bg-green-100 text-green-700',
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}>
            {children}
        </span>
    )
}

// Componente de Combobox
function Combobox<T extends { id: number }>({
    placeholder,
    onSearch,
    onSelect,
    renderOption,
    icon: Icon,
}: {
    placeholder: string
    onSearch: (query: string) => Promise<T[]>
    onSelect: (item: T) => void
    renderOption: (item: T) => React.ReactNode
    icon: React.ElementType
}) {
    const [query, setQuery] = useState('')
    const [options, setOptions] = useState<T[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (query.length >= 3) {
            setIsLoading(true)
            const timeout = setTimeout(async () => {
                const results = await onSearch(query)
                setOptions(results)
                setIsOpen(true)
                setIsLoading(false)
            }, 300)
            return () => clearTimeout(timeout)
        } else {
            setOptions([])
            setIsOpen(false)
        }
    }, [query, onSearch])

    return (
        <div className="relative">
            <div className="relative">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-700 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
            {isOpen && options.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {options.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onSelect(item)
                                setQuery('')
                                setIsOpen(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                            {renderOption(item)}
                        </button>
                    ))}
                </div>
            )}
            {isOpen && options.length === 0 && query.length >= 3 && !isLoading && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-slate-500">
                    Nenhum resultado encontrado
                </div>
            )}
        </div>
    )
}

// Componente de Paginação
function Paginacao({
    paginaAtual,
    totalPaginas,
    totalRegistros,
    onPageChange,
}: {
    paginaAtual: number
    totalPaginas: number
    totalRegistros: number
    onPageChange: (page: number) => void
}) {
    const registrosPorPagina = 15
    const inicio = (paginaAtual - 1) * registrosPorPagina + 1
    const fim = Math.min(paginaAtual * registrosPorPagina, totalRegistros)

    const gerarPaginas = () => {
        const paginas: (number | string)[] = []
        const maxPaginas = 5

        if (totalPaginas <= maxPaginas) {
            for (let i = 1; i <= totalPaginas; i++) {
                paginas.push(i)
            }
        } else {
            paginas.push(1)
            if (paginaAtual > 3) paginas.push('...')
            const start = Math.max(2, paginaAtual - 1)
            const end = Math.min(totalPaginas - 1, paginaAtual + 1)
            for (let i = start; i <= end; i++) {
                if (!paginas.includes(i)) paginas.push(i)
            }
            if (paginaAtual < totalPaginas - 2) paginas.push('...')
            if (!paginas.includes(totalPaginas)) paginas.push(totalPaginas)
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
            <p className="text-sm text-slate-500">
                Exibindo <span className="font-bold text-slate-700">{inicio}</span> a{' '}
                <span className="font-bold text-slate-700">{fim}</span> de{' '}
                <span className="font-bold text-slate-700">{totalRegistros}</span> registros
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={paginaAtual === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronsLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onPageChange(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 mx-2">
                    {gerarPaginas().map((pagina, index) =>
                        pagina === '...' ? (
                            <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-400">
                                ...
                            </span>
                        ) : (
                            <button
                                key={pagina}
                                onClick={() => onPageChange(pagina as number)}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${paginaAtual === pagina
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {pagina}
                            </button>
                        )
                    )}
                </div>
                <button
                    onClick={() => onPageChange(paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onPageChange(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronsRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

// Componente Principal
export function RelatoriosClient() {
    const [activeTab, setActiveTab] = useState<'material' | 'usuario'>('material')

    // Filtros de data
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')

    // Estado da aba Material
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(null)
    const [materialReport, setMaterialReport] = useState<{
        material: { id: number; codigo: string; descricao: string; tipo: string; unidade: string } | null
        movimentacoes: MovimentacaoMaterial[]
        total: number
        totalPaginas: number
        paginaAtual: number
    } | null>(null)
    const [materialLoading, setMaterialLoading] = useState(false)

    // Estado da aba Usuário
    const [selectedUsuario, setSelectedUsuario] = useState<UsuarioOption | null>(null)
    const [usuarioReport, setUsuarioReport] = useState<{
        usuario: { id: number; identificacao: string; nome: string; unidade: string } | null
        movimentacoes: MovimentacaoUsuario[]
        total: number
        totalPaginas: number
        paginaAtual: number
    } | null>(null)
    const [usuarioLoading, setUsuarioLoading] = useState(false)

    // Função para buscar relatório de material
    const fetchMaterialReport = useCallback(async (materialId: number, page: number = 1) => {
        setMaterialLoading(true)
        const dateRange = {
            from: dateFrom ? new Date(dateFrom) : undefined,
            to: dateTo ? new Date(dateTo) : undefined,
        }
        const result = await getRelatorioMaterial(materialId, dateRange, page)
        setMaterialReport(result as typeof materialReport)
        setMaterialLoading(false)
    }, [dateFrom, dateTo])

    // Função para buscar relatório de usuário
    const fetchUsuarioReport = useCallback(async (usuarioId: number, page: number = 1) => {
        setUsuarioLoading(true)
        const dateRange = {
            from: dateFrom ? new Date(dateFrom) : undefined,
            to: dateTo ? new Date(dateTo) : undefined,
        }
        const result = await getRelatorioUsuario(usuarioId, dateRange, page)
        setUsuarioReport(result as typeof usuarioReport)
        setUsuarioLoading(false)
    }, [dateFrom, dateTo])

    // Refaz a busca quando as datas mudam
    useEffect(() => {
        if (selectedMaterial) {
            fetchMaterialReport(selectedMaterial.id, 1)
        }
    }, [dateFrom, dateTo, selectedMaterial, fetchMaterialReport])

    useEffect(() => {
        if (selectedUsuario) {
            fetchUsuarioReport(selectedUsuario.id, 1)
        }
    }, [dateFrom, dateTo, selectedUsuario, fetchUsuarioReport])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
                    <p className="text-slate-500 mt-1">
                        Consulte o histórico de movimentações por material ou usuário
                    </p>
                </div>
            </div>

            {/* Filtro de Data */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-3 text-slate-600">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Filtrar por Período:</span>
                    </div>
                    <div className="flex gap-3 flex-1">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-12 px-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                        <span className="flex items-center text-slate-400">até</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-12 px-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => { setDateFrom(''); setDateTo('') }}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('material')}
                        className={`flex-1 px-6 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'material'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Package className="w-5 h-5" />
                        Histórico do Material
                    </button>
                    <button
                        onClick={() => setActiveTab('usuario')}
                        className={`flex-1 px-6 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'usuario'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        Histórico do Usuário
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'material' && (
                        <div className="space-y-6">
                            {/* Busca de Material */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Buscar Material (mínimo 3 caracteres)
                                </label>
                                <Combobox<MaterialOption>
                                    placeholder="Digite o código ou descrição do material..."
                                    icon={Search}
                                    onSearch={searchMateriais}
                                    onSelect={(item) => {
                                        setSelectedMaterial(item)
                                        fetchMaterialReport(item.id, 1)
                                    }}
                                    renderOption={(item) => (
                                        <div>
                                            <div className="font-bold text-slate-800">{item.codigoIdentificacao}</div>
                                            <div className="text-sm text-slate-500">{item.descricao} • {item.tipoNome}</div>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Material Selecionado */}
                            {selectedMaterial && materialReport?.material && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-6 h-6 text-blue-600" />
                                        <div>
                                            <p className="font-bold text-blue-900">{materialReport.material.codigo}</p>
                                            <p className="text-sm text-blue-700">{materialReport.material.descricao} • {materialReport.material.tipo} • {materialReport.material.unidade}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabela de Movimentações */}
                            {materialLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : materialReport && materialReport.movimentacoes.length > 0 ? (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Policial</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Retirada</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Resp. Retirada</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Devolução</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Resp. Devolução</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Observações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {materialReport.movimentacoes.map((mov) => (
                                                    <tr key={mov.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-slate-800">{mov.usuario.nome}</div>
                                                            <div className="text-xs text-slate-500">{mov.usuario.identificacao}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3 text-slate-400" />
                                                                {formatDate(mov.dataRetirada)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm text-slate-700">{mov.respRetirada.nome}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {mov.dataDevolucao ? (
                                                                <div className="flex items-center gap-1 text-slate-700">
                                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                                    {formatDate(mov.dataDevolucao)}
                                                                </div>
                                                            ) : (
                                                                <Badge variant="warning">Pendente</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">
                                                            {mov.respDevolucao?.nome || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                                                            {(mov.obsRetirada || mov.obsDevolucao) ? (
                                                                <div className="space-y-1">
                                                                    {mov.obsRetirada && <p><span className="font-medium">Ret:</span> {mov.obsRetirada}</p>}
                                                                    {mov.obsDevolucao && <p><span className="font-medium">Dev:</span> {mov.obsDevolucao}</p>}
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Paginacao
                                        paginaAtual={materialReport.paginaAtual}
                                        totalPaginas={materialReport.totalPaginas}
                                        totalRegistros={materialReport.total}
                                        onPageChange={(page) => fetchMaterialReport(selectedMaterial!.id, page)}
                                    />
                                </div>
                            ) : selectedMaterial ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Nenhuma movimentação encontrada para este material</p>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Selecione um material para visualizar o histórico</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'usuario' && (
                        <div className="space-y-6">
                            {/* Busca de Usuário */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Buscar Usuário (mínimo 3 caracteres)
                                </label>
                                <Combobox<UsuarioOption>
                                    placeholder="Digite o nome ou matrícula do usuário..."
                                    icon={Search}
                                    onSearch={searchUsuarios}
                                    onSelect={(item) => {
                                        setSelectedUsuario(item)
                                        fetchUsuarioReport(item.id, 1)
                                    }}
                                    renderOption={(item) => (
                                        <div>
                                            <div className="font-bold text-slate-800">{item.nome}</div>
                                            <div className="text-sm text-slate-500">{item.identificacao} • {item.unidadeNome}</div>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Usuário Selecionado */}
                            {selectedUsuario && usuarioReport?.usuario && (
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                    <div className="flex items-center gap-3">
                                        <User className="w-6 h-6 text-purple-600" />
                                        <div>
                                            <p className="font-bold text-purple-900">{usuarioReport.usuario.nome}</p>
                                            <p className="text-sm text-purple-700">{usuarioReport.usuario.identificacao} • {usuarioReport.usuario.unidade}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabela de Movimentações */}
                            {usuarioLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : usuarioReport && usuarioReport.movimentacoes.length > 0 ? (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Material</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Retirada</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Resp. Retirada</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Devolução</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Resp. Devolução</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Observações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {usuarioReport.movimentacoes.map((mov) => (
                                                    <tr key={mov.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-slate-800">{mov.material.codigo}</div>
                                                            <div className="text-xs text-slate-500">{mov.material.descricao} • {mov.material.tipo}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3 text-slate-400" />
                                                                {formatDate(mov.dataRetirada)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm text-slate-700">{mov.respRetirada.nome}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {mov.dataDevolucao ? (
                                                                <div className="flex items-center gap-1 text-slate-700">
                                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                                    {formatDate(mov.dataDevolucao)}
                                                                </div>
                                                            ) : (
                                                                <Badge variant="warning">Pendente</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">
                                                            {mov.respDevolucao?.nome || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                                                            {(mov.obsRetirada || mov.obsDevolucao) ? (
                                                                <div className="space-y-1">
                                                                    {mov.obsRetirada && <p><span className="font-medium">Ret:</span> {mov.obsRetirada}</p>}
                                                                    {mov.obsDevolucao && <p><span className="font-medium">Dev:</span> {mov.obsDevolucao}</p>}
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Paginacao
                                        paginaAtual={usuarioReport.paginaAtual}
                                        totalPaginas={usuarioReport.totalPaginas}
                                        totalRegistros={usuarioReport.total}
                                        onPageChange={(page) => fetchUsuarioReport(selectedUsuario!.id, page)}
                                    />
                                </div>
                            ) : selectedUsuario ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Nenhuma movimentação encontrada para este usuário</p>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Selecione um usuário para visualizar o histórico</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
