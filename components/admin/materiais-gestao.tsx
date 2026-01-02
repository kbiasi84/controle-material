'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Building2,
  Zap,
  Radio,
  Car,
  Shield,
  Lock,
  Beaker,
  ChevronLeft,
  ChevronRight,
  Search,
  Wrench,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react'
import { ModalMaterial } from './modal-material'
import { ModalExcluirMaterial } from './modal-excluir-material'
import { concluirManutencao } from '@/app/dashboard/manutencao-actions'

interface TipoMaterial {
  id: number
  nome: string
}

interface Unidade {
  id: number
  nome: string
}

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
  status: 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO'
  observacaoAtual: string | null
  enviadoManutencaoPor: string | null
  tipoId: number
  unidadeId: number
  tipo: { nome: string }
  unidade: { nome: string }
}

interface MateriaisGestaoProps {
  materiais: Material[]
  tipos: TipoMaterial[]
  unidades: Unidade[]
  paginaAtual: number
  totalPaginas: number
  totalRegistros: number
  registrosPorPagina: number
  manutencao: number
}

export function MateriaisGestao({
  materiais,
  tipos,
  unidades,
  paginaAtual,
  totalPaginas,
  totalRegistros,
  registrosPorPagina,
  manutencao,
}: MateriaisGestaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estados dos modais
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null)
  const [materialExcluindo, setMaterialExcluindo] = useState<Material | null>(null)
  const [materialTransferindo, setMaterialTransferindo] = useState<Material | null>(null)
  const [materialManutencao, setMaterialManutencao] = useState<Material | null>(null)

  // Estados dos filtros
  const currentTipo = searchParams.get('tipo') || ''
  const currentStatus = searchParams.get('status') || ''
  const currentUnidade = searchParams.get('unidade') || ''
  const currentSearch = searchParams.get('busca') || ''
  const [searchValue, setSearchValue] = useState(currentSearch)

  // Handler para atualizar URL
  const updateUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('pagina')
    router.push(`/dashboard/materiais?${params.toString()}`, { scroll: false })
  }

  // Handler para busca com debounce
  const handleSearchChange = (value: string) => {
    setSearchValue(value)

    // Debounce simples
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.length >= 3) {
        params.set('busca', value)
      } else {
        params.delete('busca')
      }
      params.delete('pagina')
      router.push(`/dashboard/materiais?${params.toString()}`, { scroll: false })
    }, 400)

    return () => clearTimeout(timeout)
  }

  const handlePageChange = (novaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pagina', novaPagina.toString())
    router.push(`/dashboard/materiais?${params.toString()}`, { scroll: false })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
        return { badge: 'bg-green-50 text-green-700 border-green-200', text: 'Disponível' }
      case 'EM_USO':
        return { badge: 'bg-red-50 text-red-700 border-red-200', text: 'Em Uso' }
      case 'MANUTENCAO':
        return { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'Manutenção' }
      case 'INATIVO':
        return { badge: 'bg-slate-100 text-slate-500 border-slate-300', text: 'Inativo' }
      default:
        return { badge: 'bg-slate-50 text-slate-700 border-slate-200', text: status }
    }
  }

  const getIconByType = (tipoNome: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Taser': <Zap className="w-5 h-5" />,
      'Rádio Comunicador': <Radio className="w-5 h-5" />,
      'Viatura': <Car className="w-5 h-5" />,
      'Colete Balístico': <Shield className="w-5 h-5" />,
      'Algema': <Lock className="w-5 h-5" />,
      'Etilômetro': <Beaker className="w-5 h-5" />,
    }
    return icons[tipoNome] || <Package className="w-5 h-5" />
  }

  const inicioRegistros = (paginaAtual - 1) * registrosPorPagina + 1
  const fimRegistros = Math.min(paginaAtual * registrosPorPagina, totalRegistros)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Materiais</h2>
          <p className="text-slate-500 mt-1">
            Cadastre, edite e gerencie todos os materiais da sua região
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge Manutenção */}
          {manutencao > 0 && (
            <div className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-200">
              <Package className="w-5 h-5 mr-2.5" />
              {manutencao} em Manutenção
            </div>
          )}

          {/* Botão Novo Material */}
          <button
            onClick={() => setModalNovoOpen(true)}
            className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2.5" />
            Novo Material
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
              placeholder="Buscar por código, descrição ou tipo... (mínimo 3 caracteres)"
              className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            {searchValue.length > 0 && searchValue.length < 3 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                +{3 - searchValue.length} caracteres
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <select
              value={currentUnidade}
              onChange={(e) => updateUrl('unidade', e.target.value)}
              className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="">Todas as Unidades</option>
              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id.toString()}>{unidade.nome}</option>
              ))}
            </select>
            <select
              value={currentTipo}
              onChange={(e) => updateUrl('tipo', e.target.value)}
              className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="">Todos os Tipos</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id.toString()}>{tipo.nome}</option>
              ))}
            </select>
            <select
              value={currentStatus}
              onChange={(e) => updateUrl('status', e.target.value)}
              className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="">Todos os Status</option>
              <option value="DISPONIVEL">Disponível</option>
              <option value="EM_USO">Em Uso</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Materiais */}
      {materiais.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">Nenhum material encontrado</h3>
          <p className="text-slate-400 text-base mt-2">
            Clique em &quot;Novo Material&quot; para começar a cadastrar.
          </p>
        </div>
      ) : (
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
                    Unidade
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materiais.map((material) => {
                  const statusConfig = getStatusConfig(material.status)
                  return (
                    <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800">
                            {material.descricao || material.tipo.nome}
                          </p>
                          <p className="text-sm text-slate-400 font-mono">
                            {material.codigoIdentificacao}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 font-medium">{material.tipo.nome}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600">
                          <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                          {material.unidade.nome}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.badge}`}>
                          {statusConfig.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {material.status === 'DISPONIVEL' && (
                            <button
                              onClick={() => setMaterialTransferindo(material)}
                              className="p-2.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Transferir para outra unidade"
                            >
                              <ArrowRightLeft className="w-5 h-5" />
                            </button>
                          )}
                          {material.status === 'MANUTENCAO' && (
                            <button
                              onClick={() => setMaterialManutencao(material)}
                              className="p-2.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                              title="Concluir Manutenção"
                            >
                              <Wrench className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setMaterialEditando(material)}
                            className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setMaterialExcluindo(material)}
                            className="p-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Mostrando <span className="font-bold text-slate-700">{inicioRegistros}</span> a{' '}
                <span className="font-bold text-slate-700">{fimRegistros}</span> de{' '}
                <span className="font-bold text-slate-700">{totalRegistros}</span> materiais
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

      {/* Modal Novo Material */}
      <ModalMaterial
        isOpen={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        tipos={tipos}
        unidades={unidades}
      />

      {/* Modal Editar Material */}
      <ModalMaterial
        isOpen={!!materialEditando}
        onClose={() => setMaterialEditando(null)}
        tipos={tipos}
        unidades={unidades}
        material={materialEditando}
      />

      {/* Modal Excluir Material */}
      <ModalExcluirMaterial
        isOpen={!!materialExcluindo}
        onClose={() => setMaterialExcluindo(null)}
        material={materialExcluindo}
      />

      {/* Modal Concluir Manutenção */}
      <ModalConcluirManutencao
        isOpen={!!materialManutencao}
        onClose={() => setMaterialManutencao(null)}
        material={materialManutencao}
      />

      {/* Modal Transferir Material */}
      <ModalTransferirMaterial
        isOpen={!!materialTransferindo}
        onClose={() => setMaterialTransferindo(null)}
        material={materialTransferindo}
        unidades={unidades}
      />
    </div>
  )
}

// ============ MODAL CONCLUIR MANUTENÇÃO ============

interface ModalConcluirManutencaoProps {
  isOpen: boolean
  onClose: () => void
  material: Material | null
}

function ModalConcluirManutencao({ isOpen, onClose, material }: ModalConcluirManutencaoProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)

  const handleConcluir = async () => {
    if (!material) return

    setIsLoading(true)
    setResultado(null)

    try {
      const result = await concluirManutencao(material.id)
      setResultado(result)

      if (result.success) {
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch {
      setResultado({ success: false, message: 'Erro ao processar a operação.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setResultado(null)
    onClose()
  }

  if (!isOpen || !material) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Material em Manutenção</h2>
              <p className="text-sm text-slate-500">Verificar e concluir manutenção</p>
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
          {/* Resultado */}
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
              {/* Info do Material */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="font-bold text-slate-800">{material.descricao || material.tipo.nome}</p>
                <p className="text-sm text-slate-500 font-mono">{material.codigoIdentificacao}</p>
                <p className="text-sm text-slate-400 mt-1">{material.unidade.nome}</p>
                {material.enviadoManutencaoPor && (
                  <p className="text-sm text-slate-500 mt-2">
                    <span className="font-medium">Enviado por:</span> {material.enviadoManutencaoPor}
                  </p>
                )}
              </div>

              {/* Observação da Manutenção */}
              {material.observacaoAtual && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Motivo da Manutenção:
                  </label>
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-800">{material.observacaoAtual}</p>
                  </div>
                </div>
              )}

              {!material.observacaoAtual && (
                <p className="text-sm text-slate-500 mb-6">
                  Nenhuma observação registrada para esta manutenção.
                </p>
              )}

              <p className="text-sm text-slate-500 mb-6">
                Ao concluir, o material voltará ao status <strong>Disponível</strong>.
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
                  onClick={handleConcluir}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl text-base font-bold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Concluindo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Concluir Manutenção
                    </>
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

// ============ MODAL TRANSFERIR MATERIAL ============

import { transferirMaterial } from '@/app/dashboard/transferencia-actions'

interface ModalTransferirMaterialProps {
  isOpen: boolean
  onClose: () => void
  material: Material | null
  unidades: Unidade[]
}

function ModalTransferirMaterial({ isOpen, onClose, material, unidades }: ModalTransferirMaterialProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)
  const [destinoId, setDestinoId] = useState('')
  const [observacao, setObservacao] = useState('')

  // Reset form when modal opens
  const handleOpen = () => {
    if (isOpen && material) {
      // Filtra a unidade atual do material
      const unidadesDisponiveis = unidades.filter(u => u.id !== material.unidadeId)
      setDestinoId(unidadesDisponiveis.length > 0 ? unidadesDisponiveis[0].id.toString() : '')
      setObservacao('')
      setResultado(null)
    }
  }

  // Effect to reset form
  if (isOpen && material && destinoId === '' && resultado === null) {
    handleOpen()
  }

  const handleTransferir = async () => {
    if (!material || !destinoId) return

    setIsLoading(true)
    setResultado(null)

    try {
      const result = await transferirMaterial({
        materialId: material.id,
        destinoId: parseInt(destinoId),
        observacao: observacao || undefined,
      })
      setResultado(result)

      if (result.success) {
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch {
      setResultado({ success: false, message: 'Erro ao processar a transferência.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setResultado(null)
    setDestinoId('')
    setObservacao('')
    onClose()
  }

  if (!isOpen || !material) return null

  // Filtra a unidade atual do material
  const unidadesDisponiveis = unidades.filter(u => u.id !== material.unidadeId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Transferir Material</h2>
              <p className="text-sm text-slate-500">Mover para outra unidade</p>
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
          {/* Resultado */}
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
              {/* Info do Material */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="font-bold text-slate-800">{material.descricao || material.tipo.nome}</p>
                <p className="text-sm text-slate-500 font-mono">{material.codigoIdentificacao}</p>
                <div className="flex items-center text-sm text-slate-400 mt-2">
                  <Building2 className="w-4 h-4 mr-1" />
                  Unidade atual: {material.unidade.nome}
                </div>
              </div>

              {/* Seleção de Unidade Destino */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Unidade de Destino *
                </label>
                {unidadesDisponiveis.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma outra unidade disponível para transferência.</p>
                ) : (
                  <select
                    value={destinoId}
                    onChange={(e) => setDestinoId(e.target.value)}
                    className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    {unidadesDisponiveis.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Observação */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Motivo da transferência..."
                  rows={3}
                  className="w-full px-4 py-3 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                />
              </div>

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
                  onClick={handleTransferir}
                  disabled={isLoading || unidadesDisponiveis.length === 0}
                  className="flex-1 h-12 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Transferindo...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" />
                      Confirmar Transferência
                    </>
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
