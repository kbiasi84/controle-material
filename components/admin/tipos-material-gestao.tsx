'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Tag,
    Plus,
    Edit,
    Trash2,
    Package,
    ChevronLeft,
    ChevronRight,
    Search,
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
} from 'lucide-react'
import { criarTipoMaterial, editarTipoMaterial, excluirTipoMaterial } from '@/app/dashboard/tipos-material/actions'

interface TipoMaterial {
    id: number
    nome: string
    _count: {
        materiais: number
    }
}

interface TiposMaterialGestaoProps {
    tipos: TipoMaterial[]
    paginaAtual: number
    totalPaginas: number
    totalRegistros: number
    registrosPorPagina: number
}

export function TiposMaterialGestao({
    tipos,
    paginaAtual,
    totalPaginas,
    totalRegistros,
    registrosPorPagina,
}: TiposMaterialGestaoProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Estados dos modais
    const [modalNovoOpen, setModalNovoOpen] = useState(false)
    const [tipoEditando, setTipoEditando] = useState<TipoMaterial | null>(null)
    const [tipoExcluindo, setTipoExcluindo] = useState<TipoMaterial | null>(null)

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
            router.push(`/dashboard/tipos-material?${params.toString()}`, { scroll: false })
        }, 400)

        return () => clearTimeout(timeout)
    }

    const handlePageChange = (novaPagina: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('pagina', novaPagina.toString())
        router.push(`/dashboard/tipos-material?${params.toString()}`, { scroll: false })
    }

    const inicioRegistros = (paginaAtual - 1) * registrosPorPagina + 1
    const fimRegistros = Math.min(paginaAtual * registrosPorPagina, totalRegistros)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Tipos de Material</h2>
                    <p className="text-slate-500 mt-1">
                        Gerencie as categorias de materiais do sistema
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Botão Novo Tipo */}
                    <button
                        onClick={() => setModalNovoOpen(true)}
                        className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2.5" />
                        Novo Tipo
                    </button>
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
                            placeholder="Buscar por nome... (mínimo 3 caracteres)"
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

            {/* Tabela de Tipos */}
            {tipos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">Nenhum tipo encontrado</h3>
                    <p className="text-slate-400 text-base mt-2">
                        Clique em &quot;Novo Tipo&quot; para começar a cadastrar.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b-2 border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Materiais
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tipos.map((tipo) => (
                                    <tr key={tipo.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-slate-800 text-base">{tipo.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                <Package className="w-3.5 h-3.5 mr-1.5" />
                                                {tipo._count.materiais}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setTipoEditando(tipo)}
                                                    className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setTipoExcluindo(tipo)}
                                                    className="p-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
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
                                <span className="font-bold text-slate-700">{totalRegistros}</span> tipos
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

            {/* Modal Novo Tipo */}
            <ModalTipo
                isOpen={modalNovoOpen}
                onClose={() => setModalNovoOpen(false)}
            />

            {/* Modal Editar Tipo */}
            <ModalTipo
                isOpen={!!tipoEditando}
                onClose={() => setTipoEditando(null)}
                tipo={tipoEditando}
            />

            {/* Modal Excluir Tipo */}
            <ModalExcluirTipo
                isOpen={!!tipoExcluindo}
                onClose={() => setTipoExcluindo(null)}
                tipo={tipoExcluindo}
            />
        </div>
    )
}

// ============ MODAL TIPO (Criar/Editar) ============

interface ModalTipoProps {
    isOpen: boolean
    onClose: () => void
    tipo?: TipoMaterial | null
}

function ModalTipo({ isOpen, onClose, tipo }: ModalTipoProps) {
    const isEdicao = !!tipo
    const [isLoading, setIsLoading] = useState(false)
    const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)

    const [formData, setFormData] = useState({
        nome: '',
    })

    // Atualiza form quando muda o tipo ou abre o modal
    useEffect(() => {
        if (isOpen) {
            if (tipo) {
                setFormData({
                    nome: tipo.nome,
                })
            } else {
                setFormData({
                    nome: '',
                })
            }
            setResultado(null)
        }
    }, [isOpen, tipo])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setResultado(null)

        // Validações
        if (!formData.nome.trim()) {
            setResultado({ success: false, message: 'Informe o nome do tipo de material.' })
            setIsLoading(false)
            return
        }

        try {
            let result
            if (isEdicao && tipo) {
                result = await editarTipoMaterial({
                    id: tipo.id,
                    nome: formData.nome,
                })
            } else {
                result = await criarTipoMaterial({
                    nome: formData.nome,
                })
            }

            setResultado(result)

            if (result.success) {
                setTimeout(() => {
                    onClose()
                }, 1500)
            }
        } catch {
            setResultado({ success: false, message: 'Erro ao processar a solicitação.' })
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Tag className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEdicao ? 'Editar Tipo' : 'Novo Tipo'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {isEdicao ? 'Atualize os dados do tipo' : 'Preencha os dados do novo tipo'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {resultado && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${resultado.success
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            {resultado.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                            )}
                            <p className="text-sm font-medium">{resultado.message}</p>
                        </div>
                    )}

                    {/* Card com informações do tipo (apenas na edição) */}
                    {isEdicao && tipo && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <p className="font-bold text-slate-800">{tipo.nome}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                <span className="flex items-center">
                                    <Package className="w-4 h-4 mr-1" />
                                    {tipo._count.materiais} materiais
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Novo nome do tipo*
                            </label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                                placeholder="Ex: ETILÔMETRO"
                                className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors uppercase"
                            />
                        </div>
                    </div>

                    {isEdicao && (
                        <p className="text-sm text-slate-500 mt-4">
                            ⚠️ Tipos com materiais vinculados não podem ser editados.
                        </p>
                    )}

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl text-base font-bold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isEdicao ? 'Salvando...' : 'Criando...'}
                                </>
                            ) : (
                                isEdicao ? 'Salvar Alterações' : 'Criar Tipo'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ============ MODAL EXCLUIR TIPO ============

interface ModalExcluirTipoProps {
    isOpen: boolean
    onClose: () => void
    tipo: TipoMaterial | null
}

function ModalExcluirTipo({ isOpen, onClose, tipo }: ModalExcluirTipoProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)

    const handleExcluir = async () => {
        if (!tipo) return

        setIsLoading(true)
        setResultado(null)

        try {
            const result = await excluirTipoMaterial(tipo.id)
            setResultado(result)

            if (result.success) {
                setTimeout(() => {
                    handleClose()
                }, 1500)
            }
        } catch {
            setResultado({ success: false, message: 'Erro ao processar a exclusão.' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setResultado(null)
        onClose()
    }

    if (!isOpen || !tipo) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Excluir Tipo</h2>
                            <p className="text-sm text-slate-500">Esta ação não pode ser desfeita</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {resultado && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${resultado.success
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            {resultado.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                            )}
                            <p className="text-sm font-medium">{resultado.message}</p>
                        </div>
                    )}

                    {!resultado?.success && (
                        <>
                            <p className="text-slate-600 mb-4">
                                Tem certeza que deseja excluir o tipo:
                            </p>

                            <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                <p className="font-bold text-slate-800">{tipo.nome}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                    <span className="flex items-center">
                                        <Package className="w-4 h-4 mr-1" />
                                        {tipo._count.materiais} materiais
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 mb-6">
                                ⚠️ Tipos com materiais vinculados não podem ser excluídos.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 h-12 rounded-xl text-base font-bold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExcluir}
                                    disabled={isLoading}
                                    className="flex-1 h-12 rounded-xl text-base font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Excluindo...
                                        </>
                                    ) : (
                                        'Sim, Excluir'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
