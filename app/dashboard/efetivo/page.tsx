import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Search,
  Package,
  User,
  Building2,
  ArrowUpFromLine,
  Eye,
} from 'lucide-react'

export default async function ControleEfetivoPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão
  if (session.perfil !== 'CONTROLADOR' && session.perfil !== 'GESTOR') {
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

  // Busca materiais em uso (com usuário responsável)
  const materiaisEmUso = await prisma.material.findMany({
    where: {
      unidadeId: { in: permissoes.unidadesVisiveis },
      status: 'EM_USO',
    },
    include: {
      tipo: true,
      unidade: true,
    },
  })

  // Busca movimentações ativas (retiradas sem devolução)
  const movimentacoesAtivas = await prisma.movimentacao.findMany({
    where: {
      material: {
        unidadeId: { in: permissoes.unidadesVisiveis },
      },
      dataDevolucao: null, // Ainda não devolvido
    },
    include: {
      usuario: true,
      material: {
        include: {
          tipo: true,
        }
      },
    },
    orderBy: { dataRetirada: 'desc' },
  })

  // Agrupa materiais por usuário
  const materiaisPorUsuario = movimentacoesAtivas.reduce((acc, mov) => {
    const key = mov.usuarioId
    if (!acc[key]) {
      acc[key] = {
        usuario: mov.usuario,
        materiais: []
      }
    }
    acc[key].materiais.push(mov.material)
    return acc
  }, {} as Record<number, { usuario: typeof movimentacoesAtivas[0]['usuario'], materiais: typeof movimentacoesAtivas[0]['material'][] }>)

  const totalMaterialEmUso = materiaisEmUso.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controle de Efetivo</h2>
          <p className="text-slate-500 mt-1">
            Gerencie materiais e equipamentos do pessoal da sua unidade
          </p>
        </div>
        
        {/* Stats Badges */}
        <div className="flex gap-3">
          <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-purple-100 text-purple-800 border-2 border-purple-200">
            <Users className="w-5 h-5 mr-2.5" />
            {usuarios.length} Usuários
          </span>
          <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-orange-100 text-orange-800 border-2 border-orange-200">
            <Package className="w-5 h-5 mr-2.5" />
            {totalMaterialEmUso} Em Uso
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome do usuário..." 
              className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
              <option>Todos os Usuários</option>
              <option>Com material em posse</option>
              <option>Sem material</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Usuários com Materiais */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700">Usuários com Material em Posse</h3>
        
        {Object.keys(materiaisPorUsuario).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600">Nenhum material em uso</h3>
            <p className="text-slate-400 text-base mt-2">
              Todos os materiais estão disponíveis no estoque.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.values(materiaisPorUsuario).map(({ usuario, materiais }) => (
              <div 
                key={usuario.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                {/* User Header */}
                <div className="flex items-start gap-4 mb-5 pb-5 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">
                      {usuario.nome}
                    </h3>
                    <p className="text-sm text-slate-400 font-mono mt-1">
                      {usuario.identificacao}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-1 mt-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                      {usuario.perfil}
                    </span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    {materiais.length} {materiais.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Materials List */}
                <div className="space-y-3">
                  {materiais.slice(0, 3).map((material) => (
                    <div key={material.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-700 truncate">
                          {material.descricao || material.tipo.nome}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {material.codigoIdentificacao}
                        </p>
                      </div>
                    </div>
                  ))}
                  {materiais.length > 3 && (
                    <p className="text-sm text-slate-400 text-center py-2">
                      + {materiais.length - 3} outros materiais
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100">
                  <button className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </button>
                  <button className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700">
                    <ArrowUpFromLine className="w-4 h-4 mr-2" />
                    Retirar Para
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de todos os usuários */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700">Todos os Usuários da Unidade</h3>
        
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
                    Materiais
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((usuario) => {
                  const qtdMateriais = materiaisPorUsuario[usuario.id]?.materiais.length || 0
                  return (
                    <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{usuario.nome}</p>
                            <p className="text-sm text-slate-400 font-mono">{usuario.identificacao}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                          {usuario.perfil}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600">
                          <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                          {usuario.unidade.nome}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {qtdMateriais > 0 ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            {qtdMateriais} em posse
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                          Retirar Para
                        </button>
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
