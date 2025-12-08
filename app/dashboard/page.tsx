import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { MaterialFilters } from '@/components/dashboard/material-filters'
import { 
  Zap, 
  Radio, 
  Car, 
  Shield, 
  ArrowUpFromLine,
  ArrowDownToLine,
  CircleDot,
  Flashlight,
  Beaker,
  Lock,
} from 'lucide-react'

interface DashboardPageProps {
  searchParams: Promise<{ status?: string; search?: string; tipo?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession()

  if (!session) {
    return null
  }

  const params = await searchParams
  const statusFilter = params.status || 'DISPONIVEL' // Default: DISPONIVEL
  const searchFilter = params.search || ''
  const tipoFilter = params.tipo || '' // Vazio = Todos

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca tipos de material do banco
  const tiposMaterial = await prisma.tipoMaterial.findMany({
    orderBy: { nome: 'asc' },
  })

  // Busca TODOS os materiais
  const todosMateriais = await prisma.material.findMany({
    where: { unidadeId: { in: permissoes.unidadesVisiveis } },
    include: {
      tipo: true,
      unidade: true,
    },
  })

  // Filtra materiais baseado no status selecionado
  let materiaisFiltrados = todosMateriais

  if (statusFilter !== 'TODOS') {
    materiaisFiltrados = materiaisFiltrados.filter(m => m.status === statusFilter)
  }

  // Filtra por tipo (se selecionado)
  if (tipoFilter) {
    const tipoId = parseInt(tipoFilter)
    if (!isNaN(tipoId)) {
      materiaisFiltrados = materiaisFiltrados.filter(m => m.tipoId === tipoId)
    }
  }

  // Filtra por busca (se tiver 3+ caracteres)
  if (searchFilter.length >= 3) {
    const searchLower = searchFilter.toLowerCase()
    materiaisFiltrados = materiaisFiltrados.filter(m => 
      m.codigoIdentificacao.toLowerCase().includes(searchLower) ||
      m.descricao.toLowerCase().includes(searchLower) ||
      m.tipo.nome.toLowerCase().includes(searchLower)
    )
  }

  // Ícone baseado no tipo de material
  const getIconByType = (tipoNome: string) => {
    const icons: Record<string, { icon: React.ReactNode; bg: string }> = {
      'Taser': { icon: <Zap className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
      'Rádio Comunicador': { icon: <Radio className="w-7 h-7" />, bg: 'bg-slate-600 text-white' },
      'Viatura': { icon: <Car className="w-7 h-7" />, bg: 'bg-amber-500 text-white' },
      'Colete Balístico': { icon: <Shield className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
      'Algema': { icon: <Lock className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
      'Lanterna Tática': { icon: <Flashlight className="w-7 h-7" />, bg: 'bg-slate-600 text-white' },
      'Etilômetro': { icon: <Beaker className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
    }
    return icons[tipoNome] || { icon: <Shield className="w-7 h-7" />, bg: 'bg-slate-500 text-white' }
  }

  // Status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
        return {
          badge: 'bg-green-50 text-green-700 border-green-200',
          dot: 'bg-green-500',
          text: 'Disponível',
          iconBg: 'bg-teal-600 text-white'
        }
      case 'EM_USO':
        return {
          badge: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          text: 'Em Uso',
          iconBg: 'bg-slate-400 text-white'
        }
      case 'MANUTENCAO':
        return {
          badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          dot: 'bg-yellow-500',
          text: 'Manutenção',
          iconBg: 'bg-amber-500 text-white'
        }
      default:
        return {
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          text: status,
          iconBg: 'bg-slate-500 text-white'
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel de Controle</h2>
          <p className="text-slate-500 mt-1">
            Visão geral dos materiais da sua região ({session.unidadeNome})
          </p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <MaterialFilters 
        tipos={tiposMaterial.map(t => ({ id: t.id, nome: t.nome }))}
      />

      {/* Materials Grid */}
      {materiaisFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">
            {searchFilter.length >= 3 
              ? 'Nenhum material encontrado para esta busca'
              : 'Nenhum material com os filtros selecionados'}
          </h3>
          <p className="text-slate-400 text-base mt-2">
            {searchFilter.length >= 3 
              ? 'Tente buscar por outro termo ou limpe a busca.'
              : 'Selecione outros filtros para ver mais materiais.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materiaisFiltrados.map((material) => {
            const iconConfig = getIconByType(material.tipo.nome)
            const statusConfig = getStatusConfig(material.status)
            
            return (
              <div 
                key={material.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 group flex flex-col"
              >
                {/* Header com ícone e info */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-xl ${material.status === 'EM_USO' ? statusConfig.iconBg : material.status === 'MANUTENCAO' ? statusConfig.iconBg : iconConfig.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                    {iconConfig.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                      {material.descricao || material.tipo.nome}
                    </h3>
                    <p className="text-sm text-slate-400 font-mono mt-1">
                      {material.codigoIdentificacao}
                    </p>
                  </div>
                </div>

                {/* Status e Info */}
                <div className="mb-5 flex-1">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.badge} mb-4`}>
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-2`}></span>
                    {statusConfig.text}
                  </div>
                  
                  {material.observacaoAtual && (
                    <p className="text-sm text-slate-500 flex items-center pl-1">
                      <CircleDot className="w-4 h-4 mr-2 text-slate-400 shrink-0 fill-slate-400" />
                      <span className="truncate">{material.observacaoAtual}</span>
                    </p>
                  )}
                </div>

                {/* Action Button */}
                {material.status === 'DISPONIVEL' && (
                  <button className="w-full py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                    <ArrowUpFromLine className="w-5 h-5 mr-2.5" />
                    Retirar
                  </button>
                )}
                {material.status === 'EM_USO' && (
                  <button className="w-full py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                    <ArrowDownToLine className="w-5 h-5 mr-2.5" />
                    Devolver
                  </button>
                )}
                {material.status === 'MANUTENCAO' && (
                  <button className="w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center bg-slate-100 text-slate-400 cursor-not-allowed">
                    Detalhes
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
