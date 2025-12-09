import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { 
  UserCog, 
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  Shield,
  User,
  Key,
} from 'lucide-react'

export default async function GestaoUsuariosPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão (apenas GESTOR)
  if (session.perfil !== 'GESTOR') {
    redirect('/dashboard?error=unauthorized')
  }

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca usuários das unidades visíveis
  const usuarios = await prisma.usuario.findMany({
    where: {
      unidadeId: { in: permissoes.unidadesVisiveis }
    },
    include: {
      unidade: true,
    },
    orderBy: { nome: 'asc' },
  })

  // Busca unidades para o filtro
  const unidades = await prisma.unidade.findMany({
    where: {
      id: { in: permissoes.unidadesVisiveis }
    },
    orderBy: { nome: 'asc' },
  })

  // Contadores por perfil
  const gestores = usuarios.filter(u => u.perfil === 'GESTOR').length
  const controladores = usuarios.filter(u => u.perfil === 'CONTROLADOR').length
  const usuariosComuns = usuarios.filter(u => u.perfil === 'USUARIO').length

  const getPerfilConfig = (perfil: string) => {
    switch (perfil) {
      case 'GESTOR':
        return { badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Shield className="w-3.5 h-3.5 mr-1.5" />, label: 'Gestor' }
      case 'CONTROLADOR':
        return { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Key className="w-3.5 h-3.5 mr-1.5" />, label: 'Controlador' }
      case 'USUARIO':
        return { badge: 'bg-slate-50 text-slate-700 border-slate-200', icon: <User className="w-3.5 h-3.5 mr-1.5" />, label: 'Usuário' }
      default:
        return { badge: 'bg-slate-50 text-slate-700 border-slate-200', icon: <User className="w-3.5 h-3.5 mr-1.5" />, label: perfil }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
          <p className="text-slate-500 mt-1">
            Cadastre, edite e gerencie os usuários da sua região
          </p>
        </div>
        
        {/* Action Button */}
        <button className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5 mr-2.5" />
          Novo Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <UserCog className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{usuarios.length}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{gestores}</p>
              <p className="text-sm text-slate-500">Gestores</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{controladores}</p>
              <p className="text-sm text-slate-500">Controladores</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-600">{usuariosComuns}</p>
              <p className="text-sm text-slate-500">Usuários</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome ou identificação..." 
              className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
              <option>Todos os Perfis</option>
              <option value="GESTOR">Gestor</option>
              <option value="CONTROLADOR">Controlador</option>
              <option value="USUARIO">Usuário</option>
            </select>
            <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
              <option>Todas as Unidades</option>
              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Usuários */}
      {usuarios.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <UserCog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">Nenhum usuário cadastrado</h3>
          <p className="text-slate-400 text-base mt-2">
            Clique em &quot;Novo Usuário&quot; para começar a cadastrar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map((usuario) => {
            const perfilConfig = getPerfilConfig(usuario.perfil)
            return (
              <div 
                key={usuario.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    usuario.perfil === 'GESTOR' ? 'bg-purple-600 text-white' :
                    usuario.perfil === 'CONTROLADOR' ? 'bg-blue-600 text-white' :
                    'bg-slate-600 text-white'
                  }`}>
                    <User className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                      {usuario.nome}
                    </h3>
                    <p className="text-sm text-slate-400 font-mono mt-1">
                      {usuario.identificacao}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${perfilConfig.badge}`}>
                      {perfilConfig.icon}
                      {perfilConfig.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-slate-500">
                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{usuario.unidade.nome}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-5 border-t border-slate-100">
                  <button className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>
                  <button className="p-3 rounded-xl text-red-600 hover:bg-red-50 border-2 border-red-200 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela de Usuários */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700">Lista Completa</h3>
        
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Status
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
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            usuario.perfil === 'GESTOR' ? 'bg-purple-100 text-purple-600' :
                            usuario.perfil === 'CONTROLADOR' ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
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
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button className="p-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
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
        </div>
      </div>
    </div>
  )
}

