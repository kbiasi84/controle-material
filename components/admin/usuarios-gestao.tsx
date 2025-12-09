'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  User,
  UserCog,
  UserX,
  Plus,
  Edit,
  Trash2,
  Building2,
  Shield,
  Key,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import { criarUsuario, editarUsuario, excluirUsuario, inativarUsuario } from '@/app/dashboard/usuarios/actions'

interface Unidade {
  id: number
  nome: string
}

interface Usuario {
  id: number
  identificacao: string
  nome: string
  perfil: 'USUARIO' | 'CONTROLADOR' | 'GESTOR'
  unidadeId: number
  unidade: { nome: string }
}

interface UsuariosGestaoProps {
  usuarios: Usuario[]
  unidades: Unidade[]
  paginaAtual: number
  totalPaginas: number
  totalRegistros: number
  registrosPorPagina: number
}

export function UsuariosGestao({ 
  usuarios, 
  unidades,
  paginaAtual,
  totalPaginas,
  totalRegistros,
  registrosPorPagina,
}: UsuariosGestaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estados dos modais
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [usuarioExcluindo, setUsuarioExcluindo] = useState<Usuario | null>(null)

  // Estados dos filtros
  const currentPerfil = searchParams.get('perfil') || ''
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
    router.push(`/dashboard/usuarios?${params.toString()}`, { scroll: false })
  }

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
      router.push(`/dashboard/usuarios?${params.toString()}`, { scroll: false })
    }, 400)
    
    return () => clearTimeout(timeout)
  }

  const handlePageChange = (novaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pagina', novaPagina.toString())
    router.push(`/dashboard/usuarios?${params.toString()}`, { scroll: false })
  }

  const getPerfilConfig = (perfil: string) => {
    switch (perfil) {
      case 'GESTOR':
        return { 
          badge: 'bg-purple-50 text-purple-700 border-purple-200', 
          icon: <Shield className="w-3.5 h-3.5 mr-1.5" />, 
          label: 'Gestor',
          bgIcon: 'bg-purple-600'
        }
      case 'CONTROLADOR':
        return { 
          badge: 'bg-blue-50 text-blue-700 border-blue-200', 
          icon: <Key className="w-3.5 h-3.5 mr-1.5" />, 
          label: 'Controlador',
          bgIcon: 'bg-blue-600'
        }
      case 'USUARIO':
        return { 
          badge: 'bg-slate-50 text-slate-700 border-slate-200', 
          icon: <User className="w-3.5 h-3.5 mr-1.5" />, 
          label: 'Usuário',
          bgIcon: 'bg-slate-600'
        }
      default:
        return { 
          badge: 'bg-slate-50 text-slate-700 border-slate-200', 
          icon: <User className="w-3.5 h-3.5 mr-1.5" />, 
          label: perfil,
          bgIcon: 'bg-slate-600'
        }
    }
  }

  const inicioRegistros = (paginaAtual - 1) * registrosPorPagina + 1
  const fimRegistros = Math.min(paginaAtual * registrosPorPagina, totalRegistros)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
          <p className="text-slate-500 mt-1">
            Cadastre, edite e gerencie os usuários da sua região
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botão Novo Usuário */}
          <button 
            onClick={() => setModalNovoOpen(true)}
            className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2.5" />
            Novo Usuário
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
              placeholder="Buscar por nome ou identificação... (mínimo 3 caracteres)" 
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
              value={currentPerfil}
              onChange={(e) => updateUrl('perfil', e.target.value)}
              className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="">Todos os Perfis</option>
              <option value="GESTOR">Gestor</option>
              <option value="CONTROLADOR">Controlador</option>
              <option value="USUARIO">Usuário</option>
            </select>
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
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      {usuarios.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <UserCog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">Nenhum usuário encontrado</h3>
          <p className="text-slate-400 text-base mt-2">
            Clique em &quot;Novo Usuário&quot; para começar a cadastrar.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((usuario) => {
                  const perfilConfig = getPerfilConfig(usuario.perfil)
                  return (
                    <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${perfilConfig.bgIcon} text-white flex items-center justify-center shrink-0`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{usuario.nome}</p>
                            <p className="text-sm text-slate-400 font-mono">{usuario.identificacao}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${perfilConfig.badge}`}>
                          {perfilConfig.icon}
                          {perfilConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600">
                          <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                          {usuario.unidade.nome}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setUsuarioEditando(usuario)}
                            className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setUsuarioExcluindo(usuario)}
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
                <span className="font-bold text-slate-700">{totalRegistros}</span> usuários
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
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                          pageNum === paginaAtual
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

      {/* Modal Novo Usuário */}
      <ModalUsuario
        isOpen={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        unidades={unidades}
      />

      {/* Modal Editar Usuário */}
      <ModalUsuario
        isOpen={!!usuarioEditando}
        onClose={() => setUsuarioEditando(null)}
        unidades={unidades}
        usuario={usuarioEditando}
      />

      {/* Modal Excluir Usuário */}
      <ModalExcluirUsuario
        isOpen={!!usuarioExcluindo}
        onClose={() => setUsuarioExcluindo(null)}
        usuario={usuarioExcluindo}
      />
    </div>
  )
}

// ============ MODAL USUÁRIO (Criar/Editar) ============

interface ModalUsuarioProps {
  isOpen: boolean
  onClose: () => void
  unidades: Unidade[]
  usuario?: Usuario | null
}

function ModalUsuario({ isOpen, onClose, unidades, usuario }: ModalUsuarioProps) {
  const isEdicao = !!usuario
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)
  
  const [formData, setFormData] = useState({
    identificacao: '',
    nome: '',
    perfil: 'USUARIO' as 'USUARIO' | 'CONTROLADOR' | 'GESTOR',
    unidadeId: '',
  })

  // Atualiza form quando muda o usuário ou abre o modal
  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        setFormData({
          identificacao: usuario.identificacao,
          nome: usuario.nome,
          perfil: usuario.perfil,
          unidadeId: usuario.unidadeId.toString(),
        })
      } else {
        setFormData({
          identificacao: '',
          nome: '',
          perfil: 'USUARIO',
          unidadeId: unidades.length > 0 ? unidades[0].id.toString() : '',
        })
      }
      setResultado(null)
    }
  }, [isOpen, usuario, unidades])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResultado(null)

    // Validações
    if (!formData.identificacao.trim()) {
      setResultado({ success: false, message: 'Informe a identificação.' })
      setIsLoading(false)
      return
    }

    // Valida formato da identificação (000000-0)
    const rgPattern = /^\d{6}-\d$/
    if (!rgPattern.test(formData.identificacao)) {
      setResultado({ success: false, message: 'Identificação inválida. Use o formato: 000000-0' })
      setIsLoading(false)
      return
    }

    if (!formData.nome.trim()) {
      setResultado({ success: false, message: 'Informe o nome.' })
      setIsLoading(false)
      return
    }

    if (!formData.unidadeId) {
      setResultado({ success: false, message: 'Selecione a unidade.' })
      setIsLoading(false)
      return
    }

    try {
      let result
      if (isEdicao && usuario) {
        result = await editarUsuario({
          id: usuario.id,
          identificacao: formData.identificacao,
          nome: formData.nome,
          perfil: formData.perfil,
          unidadeId: parseInt(formData.unidadeId),
        })
      } else {
        // Senha padrão é a própria identificação
        result = await criarUsuario({
          identificacao: formData.identificacao,
          nome: formData.nome,
          senha: formData.identificacao,
          perfil: formData.perfil,
          unidadeId: parseInt(formData.unidadeId),
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
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserCog className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isEdicao ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <p className="text-sm text-slate-500">
                {isEdicao ? 'Atualize os dados do usuário' : 'Preencha os dados do novo usuário'}
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
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              resultado.success 
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

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Identificação (Funcional) *
              </label>
              <input
                type="text"
                value={formData.identificacao}
                onChange={(e) => {
                  // Remove tudo que não é número
                  let value = e.target.value.replace(/\D/g, '')
                  
                  // Limita a 7 dígitos (6 + 1 dígito verificador)
                  if (value.length > 7) {
                    value = value.slice(0, 7)
                  }
                  
                  // Formata com hífen antes do último dígito
                  if (value.length > 6) {
                    value = value.slice(0, 6) + '-' + value.slice(6)
                  }
                  
                  setFormData({ ...formData, identificacao: value })
                }}
                placeholder="Ex: 117241-7"
                maxLength={8}
                className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors font-mono tracking-wider"
              />
              <p className="text-xs text-slate-400 mt-1.5">Formato: 000000-0</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                placeholder="Ex: CB PM SILVA"
                className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Perfil *
              </label>
              <select
                value={formData.perfil}
                onChange={(e) => setFormData({ ...formData, perfil: e.target.value as 'USUARIO' | 'CONTROLADOR' | 'GESTOR' })}
                className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
              >
                <option value="USUARIO">Usuário</option>
                <option value="CONTROLADOR">Controlador</option>
                <option value="GESTOR">Gestor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Unidade *
              </label>
              <select
                value={formData.unidadeId}
                onChange={(e) => setFormData({ ...formData, unidadeId: e.target.value })}
                className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
              >
                <option value="">Selecione uma unidade</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id.toString()}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                isEdicao ? 'Salvar Alterações' : 'Criar Usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ MODAL EXCLUIR USUÁRIO ============

interface ModalExcluirUsuarioProps {
  isOpen: boolean
  onClose: () => void
  usuario: Usuario | null
}

function ModalExcluirUsuario({ isOpen, onClose, usuario }: ModalExcluirUsuarioProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInativando, setIsInativando] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string; podeInativar?: boolean } | null>(null)

  const handleExcluir = async () => {
    if (!usuario) return

    setIsLoading(true)
    setResultado(null)

    try {
      const result = await excluirUsuario(usuario.id)
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

  const handleInativar = async () => {
    if (!usuario) return

    setIsInativando(true)

    try {
      const result = await inativarUsuario(usuario.id)
      setResultado(result)

      if (result.success) {
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch {
      setResultado({ success: false, message: 'Erro ao processar a inativação.' })
    } finally {
      setIsInativando(false)
    }
  }

  const handleClose = () => {
    setResultado(null)
    onClose()
  }

  if (!isOpen || !usuario) return null

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
              <h2 className="text-xl font-bold text-slate-800">Excluir Usuário</h2>
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
          {/* Resultado de Sucesso */}
          {resultado?.success && (
            <div className="p-4 rounded-xl flex items-center gap-3 bg-green-50 text-green-800 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm font-medium">{resultado.message}</p>
            </div>
          )}

          {/* Pode Inativar - Mostrar opção */}
          {resultado && !resultado.success && resultado.podeInativar && (
            <>
              <div className="mb-4 p-4 rounded-xl flex items-start gap-3 bg-amber-50 text-amber-800 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{resultado.message}</p>
                  <p className="text-sm mt-1 text-amber-700">
                    Você pode inativar este usuário para que ele não consiga mais acessar o sistema.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="font-bold text-slate-800">{usuario.nome}</p>
                <p className="text-sm text-slate-500 font-mono">{usuario.identificacao}</p>
                <p className="text-sm text-slate-400 mt-1">{usuario.unidade.nome}</p>
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
                  onClick={handleInativar}
                  disabled={isInativando}
                  className="flex-1 h-12 rounded-xl text-base font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isInativando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Inativando...
                    </>
                  ) : (
                    <>
                      <UserX className="w-5 h-5" />
                      Inativar
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Erro sem opção de inativar */}
          {resultado && !resultado.success && !resultado.podeInativar && (
            <>
              <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm font-medium">{resultado.message}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full h-12 rounded-xl text-base font-bold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          )}

          {/* Estado inicial - Confirmação de exclusão */}
          {!resultado && (
            <>
              <p className="text-slate-600 mb-4">
                Tem certeza que deseja excluir o usuário:
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="font-bold text-slate-800">{usuario.nome}</p>
                <p className="text-sm text-slate-500 font-mono">{usuario.identificacao}</p>
                <p className="text-sm text-slate-400 mt-1">{usuario.unidade.nome}</p>
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

