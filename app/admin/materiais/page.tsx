import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { 
  Package, 
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  Filter,
  Zap,
  Radio,
  Car,
  Shield,
  Flashlight,
  Beaker,
  Lock,
} from 'lucide-react'

export default async function GestaoMateriaisPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão
  if (session.perfil !== 'GESTOR') {
    redirect('/dashboard?error=unauthorized')
  }

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca materiais das unidades visíveis
  const materiais = await prisma.material.findMany({
    where: {
      unidadeId: { in: permissoes.unidadesVisiveis }
    },
    include: {
      tipo: true,
      unidade: true,
    },
    orderBy: { id: 'desc' },
  })

  // Busca tipos de material para o filtro
  const tiposMaterial = await prisma.tipoMaterial.findMany({
    orderBy: { nome: 'asc' },
  })

  // Contadores
  const disponiveis = materiais.filter(m => m.status === 'DISPONIVEL').length
  const emUso = materiais.filter(m => m.status === 'EM_USO').length
  const manutencao = materiais.filter(m => m.status === 'MANUTENCAO').length

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
        return { badge: 'bg-green-50 text-green-700 border-green-200', text: 'Disponível' }
      case 'EM_USO':
        return { badge: 'bg-red-50 text-red-700 border-red-200', text: 'Em Uso' }
      case 'MANUTENCAO':
        return { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'Manutenção' }
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
      'Lanterna Tática': <Flashlight className="w-5 h-5" />,
      'Etilômetro': <Beaker className="w-5 h-5" />,
    }
    return icons[tipoNome] || <Package className="w-5 h-5" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Materiais</h2>
          <p className="text-slate-500 mt-1">
            Cadastre, edite e gerencie todos os materiais da sua região
          </p>
        </div>
        
        {/* Action Button */}
        <button className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5 mr-2.5" />
          Novo Material
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{materiais.length}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{disponiveis}</p>
              <p className="text-sm text-slate-500">Disponíveis</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{emUso}</p>
              <p className="text-sm text-slate-500">Em Uso</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{manutencao}</p>
              <p className="text-sm text-slate-500">Manutenção</p>
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
              placeholder="Buscar por código, descrição ou tipo..." 
              className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
              <option>Todos os Tipos</option>
              {tiposMaterial.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
              ))}
            </select>
            <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
              <option>Todos os Status</option>
              <option value="DISPONIVEL">Disponível</option>
              <option value="EM_USO">Em Uso</option>
              <option value="MANUTENCAO">Manutenção</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Materiais */}
      {materiais.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">Nenhum material cadastrado</h3>
          <p className="text-slate-400 text-base mt-2">
            Clique em "Novo Material" para começar a cadastrar.
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
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                            {getIconByType(material.tipo.nome)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {material.descricao || material.tipo.nome}
                            </p>
                            <p className="text-sm text-slate-400 font-mono">
                              {material.codigoIdentificacao}
                            </p>
                          </div>
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
      )}
    </div>
  )
}

