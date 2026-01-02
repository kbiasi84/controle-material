'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Search,
    Package,
    Building2,
    ClipboardCheck,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    User,
    Printer,
} from 'lucide-react'
import { getMateriaisPorUnidade, getMateriaisParaImpressao } from './actions'

// Tipos
interface Unidade {
    id: number
    nome: string
}

interface MaterialUnidade {
    id: number
    codigo: string
    descricao: string
    tipo: string
    status: string
    usuarioEmUso: { id: number; nome: string; identificacao: string } | null
}

interface InventarioClientProps {
    unidades: Unidade[]
}

// Componente de Badge
function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'warning' | 'success' | 'info' }) {
    const colors = {
        default: 'bg-slate-100 text-slate-700',
        warning: 'bg-amber-100 text-amber-700',
        success: 'bg-green-100 text-green-700',
        info: 'bg-blue-100 text-blue-700',
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}>
            {children}
        </span>
    )
}

// Status badge para materiais
function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'DISPONIVEL':
            return <Badge variant="success">Disponível</Badge>
        case 'EM_USO':
            return <Badge variant="warning">Em Uso</Badge>
        case 'MANUTENCAO':
            return <Badge variant="info">Manutenção</Badge>
        case 'INATIVO':
            return <Badge variant="default">Inativo</Badge>
        default:
            return <Badge>{status}</Badge>
    }
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

// Função para traduzir status
function getStatusText(status: string): string {
    switch (status) {
        case 'DISPONIVEL':
            return 'Disponível'
        case 'EM_USO':
            return 'Em Uso'
        case 'MANUTENCAO':
            return 'Manutenção'
        case 'INATIVO':
            return 'Inativo'
        default:
            return status
    }
}

// Componente Principal
export function InventarioClient({ unidades }: InventarioClientProps) {
    // Estado da página
    const [selectedUnidade, setSelectedUnidade] = useState<number | null>(null)
    const [unidadeBusca, setUnidadeBusca] = useState('')
    const [unidadeStatus, setUnidadeStatus] = useState('')
    const [unidadeReport, setUnidadeReport] = useState<{
        unidade: { id: number; nome: string } | null
        materiais: MaterialUnidade[]
        quantitativoPorTipo: { tipo: string; quantidade: number }[]
        total: number
        totalPaginas: number
        paginaAtual: number
    } | null>(null)
    const [unidadeLoading, setUnidadeLoading] = useState(false)
    const [printing, setPrinting] = useState(false)

    // Função para buscar materiais por unidade
    const fetchUnidadeReport = useCallback(async (unidadeId: number, page: number = 1) => {
        setUnidadeLoading(true)
        const result = await getMateriaisPorUnidade(unidadeId, unidadeBusca, unidadeStatus, page)
        setUnidadeReport(result as NonNullable<typeof unidadeReport>)
        setUnidadeLoading(false)
    }, [unidadeBusca, unidadeStatus])

    // Função para imprimir relatório
    const handlePrint = async () => {
        if (!selectedUnidade) return

        setPrinting(true)
        try {
            const result = await getMateriaisParaImpressao(selectedUnidade, unidadeStatus)

            if (!result.unidade || result.materiais.length === 0) {
                alert('Não há materiais para imprimir.')
                setPrinting(false)
                return
            }

            // Gerar HTML para impressão
            const dataFormatada = new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })

            const statusFiltro = unidadeStatus ? getStatusText(unidadeStatus) : 'Todos'

            const quantitativoHtml = result.quantitativoPorTipo
                .map(q => `<span style="margin-right: 16px;"><strong>${q.tipo}:</strong> ${q.quantidade}</span>`)
                .join('')

            const materiaisHtml = result.materiais
                .map((m) => `
                    <tr>
                        <td style="border: 1px solid #333; padding: 6px 8px; text-align: center; width: 40px;">
                            <div style="width: 16px; height: 16px; border: 2px solid #333; margin: 0 auto;"></div>
                        </td>
                        <td style="border: 1px solid #333; padding: 6px 8px;">${m.tipo}</td>
                        <td style="border: 1px solid #333; padding: 6px 8px; font-family: monospace; font-size: 11px;">${m.codigo}</td>
                        <td style="border: 1px solid #333; padding: 6px 8px;">${m.descricao}</td>
                        <td style="border: 1px solid #333; padding: 6px 8px; text-align: center;">${getStatusText(m.status)}</td>
                        <td style="border: 1px solid #333; padding: 6px 8px;">${m.usuarioEmUso ? `${m.usuarioEmUso.nome} (${m.usuarioEmUso.identificacao})` : '-'}</td>
                    </tr>
                `)
                .join('')

            const printHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Relatório de Inventário - ${result.unidade.nome}</title>
                    <style>
                        @page { margin: 15mm; size: A4 portrait; }
                        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
                        h1 { font-size: 18px; margin-bottom: 4px; }
                        h2 { font-size: 14px; margin-top: 0; color: #444; font-weight: normal; }
                        .header { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
                        .info { margin-bottom: 16px; font-size: 11px; color: #555; }
                        .quantitativo { margin-bottom: 16px; padding: 8px; background: #f5f5f5; border-radius: 4px; }
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th { background: #333; color: white; padding: 8px; text-align: left; font-weight: bold; }
                        th:first-child { width: 50px; text-align: center; }
                        tr:nth-child(even) { background: #f9f9f9; }
                        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ccc; }
                        .signature-line { display: flex; justify-content: space-between; margin-top: 48px; }
                        .signature { width: 250px; text-align: center; }
                        .signature-line-bottom { border-top: 1px solid #000; margin-top: 40px; padding-top: 4px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>RELATÓRIO DE CONFERÊNCIA DE INVENTÁRIO</h1>
                        <h2>${result.unidade.nome}</h2>
                    </div>
                    
                    <div class="info">
                        <strong>Data de Emissão:</strong> ${dataFormatada} | 
                        <strong>Filtro de Status:</strong> ${statusFiltro} | 
                        <strong>Total de Materiais:</strong> ${result.total}
                    </div>

                    <div class="quantitativo">
                        <strong>Quantitativo por Tipo:</strong> ${quantitativoHtml}
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px; text-align: center;">✓</th>
                                <th style="width: 100px;">Tipo</th>
                                <th style="width: 120px;">Código</th>
                                <th>Descrição</th>
                                <th style="width: 80px; text-align: center;">Status</th>
                                <th style="width: 180px;">Em Uso Por</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materiaisHtml}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p><strong>Observações da Conferência:</strong></p>
                        <div style="border: 1px solid #ccc; min-height: 60px; padding: 8px; margin-top: 8px;"></div>
                        
                        <div class="signature-line">
                            <div class="signature">
                                <div class="signature-line-bottom">Responsável pela Conferência</div>
                            </div>
                            <div class="signature">
                                <div class="signature-line-bottom">Controlador da Unidade</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `

            // Abrir janela de impressão
            const printWindow = window.open('', '_blank')
            if (printWindow) {
                printWindow.document.write(printHtml)
                printWindow.document.close()
                printWindow.focus()
                setTimeout(() => {
                    printWindow.print()
                    printWindow.close()
                }, 250)
            }
        } catch {
            alert('Erro ao gerar relatório para impressão.')
        } finally {
            setPrinting(false)
        }
    }

    // Refaz busca quando filtros mudam
    useEffect(() => {
        if (selectedUnidade) {
            const timeout = setTimeout(() => {
                fetchUnidadeReport(selectedUnidade, 1)
            }, 300)
            return () => clearTimeout(timeout)
        }
    }, [unidadeBusca, unidadeStatus, selectedUnidade, fetchUnidadeReport])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventário</h2>
                    <p className="text-slate-500 mt-1">
                        Conferência geral de materiais disponíveis por unidade
                    </p>
                </div>
                {unidadeReport && unidadeReport.materiais.length > 0 && (
                    <button
                        onClick={handlePrint}
                        disabled={printing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {printing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Printer className="w-5 h-5" />
                        )}
                        Imprimir Relatório
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Selecionar Unidade
                        </label>
                        <select
                            value={selectedUnidade || ''}
                            onChange={(e) => {
                                const id = parseInt(e.target.value)
                                setSelectedUnidade(id || null)
                                if (id) {
                                    fetchUnidadeReport(id, 1)
                                } else {
                                    setUnidadeReport(null)
                                }
                            }}
                            className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-700 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
                        >
                            <option value="">Selecione uma unidade...</option>
                            {unidades.map((u) => (
                                <option key={u.id} value={u.id}>{u.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:w-64">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Status
                        </label>
                        <select
                            value={unidadeStatus}
                            onChange={(e) => setUnidadeStatus(e.target.value)}
                            className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-700 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
                        >
                            <option value="">Todos</option>
                            <option value="DISPONIVEL">Disponível</option>
                            <option value="EM_USO">Em Uso</option>
                            <option value="MANUTENCAO">Manutenção</option>
                            <option value="INATIVO">Inativo</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Busca por material */}
            {selectedUnidade && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Buscar Material (mínimo 3 caracteres)
                    </label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={unidadeBusca}
                            onChange={(e) => setUnidadeBusca(e.target.value)}
                            placeholder="Digite o código, descrição ou tipo..."
                            className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-700 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Unidade Selecionada + Cards de Quantitativo */}
            {unidadeReport?.unidade && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    {/* Header da unidade */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{unidadeReport.unidade.nome}</p>
                            <p className="text-sm text-slate-500">{unidadeReport.total} materiais encontrados</p>
                        </div>
                    </div>

                    {/* Cards de Quantitativo por Tipo */}
                    {unidadeReport.quantitativoPorTipo && unidadeReport.quantitativoPorTipo.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                            {unidadeReport.quantitativoPorTipo.map((item) => (
                                <div
                                    key={item.tipo}
                                    className="bg-slate-50 rounded-lg border border-slate-200 p-2 text-center hover:bg-slate-100 transition-colors"
                                >
                                    <p className="text-lg font-bold text-slate-800">{item.quantidade}</p>
                                    <p className="text-xs text-slate-500 truncate" title={item.tipo}>
                                        {item.tipo}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tabela de Materiais */}
            {unidadeLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : unidadeReport && unidadeReport.materiais.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b-2 border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Material
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Em Uso Por
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {unidadeReport.materiais.map((material) => (
                                    <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800">{material.descricao}</p>
                                                <p className="text-sm text-slate-400 font-mono">
                                                    {material.codigo} - {material.tipo}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-medium">{material.tipo}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={material.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {material.usuarioEmUso ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-amber-500" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">{material.usuarioEmUso.nome}</p>
                                                        <p className="text-xs text-slate-400">{material.usuarioEmUso.identificacao}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginacao
                        paginaAtual={unidadeReport.paginaAtual}
                        totalPaginas={unidadeReport.totalPaginas}
                        totalRegistros={unidadeReport.total}
                        onPageChange={(page) => fetchUnidadeReport(selectedUnidade!, page)}
                    />
                </div>
            ) : selectedUnidade ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">Nenhum material encontrado</h3>
                    <p className="text-slate-400 text-base mt-2">
                        Ajuste os filtros ou selecione outra unidade.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <ClipboardCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">Selecione uma unidade</h3>
                    <p className="text-slate-400 text-base mt-2">
                        Escolha uma unidade para conferir o inventário de materiais.
                    </p>
                </div>
            )}
        </div>
    )
}
