import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { 
  Building2, 
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  ChevronRight,
} from 'lucide-react'

export default async function GestaoUnidadesPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão
  if (session.perfil !== 'GESTOR' && session.perfil !== 'ADMINISTRADOR') {
    redirect('/dashboard?error=unauthorized')
  }

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca unidades visíveis com hierarquia
  const unidades = await prisma.unidade.findMany({
    where: {
      id: { in: permissoes.unidadesVisiveis }
    },
    include: {
      unidadeSuperior: true,
      subordinadas: true,
      usuarios: true,
      materiais: true,
    },
    orderBy: { nome: 'asc' },
  })

  // Organiza em árvore hierárquica
  const unidadesMap = new Map(unidades.map(u => [u.id, u]))
  const rootUnidades = unidades.filter(u => 
    !u.unidadeSuperiorId || !permissoes.unidadesVisiveis.includes(u.unidadeSuperiorId)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Unidades</h2>
          <p className="text-slate-500 mt-1">
            Gerencie a estrutura organizacional e hierarquia de unidades
          </p>
        </div>
        
        {/* Action Button */}
        <button className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5 mr-2.5" />
          Nova Unidade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{unidades.length}</p>
              <p className="text-sm text-slate-500">Total de Unidades</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {unidades.reduce((acc, u) => acc + u.usuarios.length, 0)}
              </p>
              <p className="text-sm text-slate-500">Total de Usuários</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {unidades.reduce((acc, u) => acc + u.materiais.length, 0)}
              </p>
              <p className="text-sm text-slate-500">Total de Materiais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome ou sigla da unidade..." 
              className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Árvore de Unidades */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700">Estrutura Organizacional</h3>
        
        {unidades.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600">Nenhuma unidade cadastrada</h3>
            <p className="text-slate-400 text-base mt-2">
              Clique em &quot;Nova Unidade&quot; para começar a cadastrar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootUnidades.map((unidade) => (
              <UnidadeCard key={unidade.id} unidade={unidade} unidadesMap={unidadesMap} level={0} />
            ))}
          </div>
        )}
      </div>

      {/* Tabela de Unidades */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700">Lista Completa</h3>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Superior
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Usuários
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
                {unidades.map((unidade) => (
                  <tr key={unidade.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{unidade.nome}</p>
                          {unidade.sigla && (
                            <p className="text-sm text-slate-400">{unidade.sigla}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {unidade.unidadeSuperior ? (
                        <span className="text-slate-600">{unidade.unidadeSuperior.nome}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        {unidade.usuarios.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        <Package className="w-3.5 h-3.5 mr-1.5" />
                        {unidade.materiais.length}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de Card de Unidade (Árvore)
function UnidadeCard({ 
  unidade, 
  unidadesMap, 
  level 
}: { 
  unidade: any
  unidadesMap: Map<number, any>
  level: number 
}) {
  const subordinadas = unidade.subordinadas.filter((s: any) => unidadesMap.has(s.id))
  
  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-slate-200 pl-4' : ''}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              level === 0 ? 'bg-blue-600 text-white' : 
              level === 1 ? 'bg-orange-500 text-white' : 
              level === 2 ? 'bg-purple-600 text-white' : 
              'bg-slate-600 text-white'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">{unidade.nome}</h4>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-slate-500 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {unidade.usuarios.length} usuários
                </span>
                <span className="text-sm text-slate-500 flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  {unidade.materiais.length} materiais
                </span>
                {subordinadas.length > 0 && (
                  <span className="text-sm text-slate-500 flex items-center">
                    <ChevronRight className="w-4 h-4 mr-1" />
                    {subordinadas.length} subordinadas
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {subordinadas.length > 0 && (
        <div className="mt-4 space-y-4">
          {subordinadas.map((sub: any) => (
            <UnidadeCard 
              key={sub.id} 
              unidade={unidadesMap.get(sub.id)} 
              unidadesMap={unidadesMap} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

