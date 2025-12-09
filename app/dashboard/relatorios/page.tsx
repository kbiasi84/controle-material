import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { 
  FileText, 
  Download,
  Printer,
  Calendar,
  Package,
  Users,
  Building2,
  TrendingUp,
  ClipboardList,
  History,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

export default async function RelatoriosPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão (GESTOR ou ADMINISTRADOR)
  if (session.perfil !== 'GESTOR' && session.perfil !== 'ADMINISTRADOR') {
    redirect('/dashboard?error=unauthorized')
  }

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca dados para os relatórios
  const [materiais, usuarios, movimentacoes] = await Promise.all([
    prisma.material.findMany({
      where: { unidadeId: { in: permissoes.unidadesVisiveis } },
      include: { tipo: true, unidade: true },
    }),
    prisma.usuario.findMany({
      where: { unidadeId: { in: permissoes.unidadesVisiveis } },
      include: { unidade: true },
    }),
    prisma.movimentacao.findMany({
      where: { 
        material: { unidadeId: { in: permissoes.unidadesVisiveis } }
      },
      include: {
        material: { include: { tipo: true } },
        usuario: true,
      },
      orderBy: { dataRetirada: 'desc' },
      take: 100,
    }),
  ])

  // Estatísticas
  const materiaisDisponiveis = materiais.filter(m => m.status === 'DISPONIVEL').length
  const materiaisEmUso = materiais.filter(m => m.status === 'EM_USO').length
  const materiaisManutencao = materiais.filter(m => m.status === 'MANUTENCAO').length
  const movimentacoesHoje = movimentacoes.filter(m => {
    const hoje = new Date()
    const dataMovimentacao = new Date(m.dataRetirada)
    return dataMovimentacao.toDateString() === hoje.toDateString()
  }).length

  const relatoriosDisponiveis = [
    {
      id: 'inventario',
      titulo: 'Inventário Geral',
      descricao: 'Lista completa de todos os materiais cadastrados',
      icon: <Package className="w-6 h-6" />,
      cor: 'bg-blue-600',
      dados: `${materiais.length} materiais`,
    },
    {
      id: 'disponibilidade',
      titulo: 'Disponibilidade de Materiais',
      descricao: 'Materiais por status (disponível, em uso, manutenção)',
      icon: <CheckCircle className="w-6 h-6" />,
      cor: 'bg-green-600',
      dados: `${materiaisDisponiveis} disponíveis`,
    },
    {
      id: 'movimentacoes',
      titulo: 'Movimentações',
      descricao: 'Histórico de retiradas e devoluções',
      icon: <History className="w-6 h-6" />,
      cor: 'bg-purple-600',
      dados: `${movimentacoes.length} registros`,
    },
    {
      id: 'usuarios',
      titulo: 'Usuários e Perfis',
      descricao: 'Lista de usuários por unidade e perfil',
      icon: <Users className="w-6 h-6" />,
      cor: 'bg-orange-500',
      dados: `${usuarios.length} usuários`,
    },
    {
      id: 'manutencao',
      titulo: 'Materiais em Manutenção',
      descricao: 'Lista de materiais aguardando manutenção',
      icon: <AlertTriangle className="w-6 h-6" />,
      cor: 'bg-yellow-500',
      dados: `${materiaisManutencao} em manutenção`,
    },
    {
      id: 'utilizacao',
      titulo: 'Taxa de Utilização',
      descricao: 'Análise de uso dos materiais por período',
      icon: <TrendingUp className="w-6 h-6" />,
      cor: 'bg-teal-600',
      dados: `${materiaisEmUso} em uso`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-slate-500 mt-1">
            Gere e imprima relatórios do sistema
          </p>
        </div>
      </div>

      {/* Stats Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{materiais.length}</p>
              <p className="text-sm text-slate-500">Materiais</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{usuarios.length}</p>
              <p className="text-sm text-slate-500">Usuários</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <History className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{movimentacoesHoje}</p>
              <p className="text-sm text-slate-500">Mov. Hoje</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{permissoes.unidadesVisiveis.length}</p>
              <p className="text-sm text-slate-500">Unidades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Período do Relatório:</span>
          </div>
          <div className="flex gap-3 flex-1">
            <input 
              type="date" 
              className="h-12 px-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <span className="flex items-center text-slate-400">até</span>
            <input 
              type="date" 
              className="h-12 px-4 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
            <option>Todas as Unidades</option>
            {/* Unidades seriam listadas aqui */}
          </select>
        </div>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatoriosDisponiveis.map((relatorio) => (
          <div 
            key={relatorio.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white ${relatorio.cor}`}>
                {relatorio.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">
                  {relatorio.titulo}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {relatorio.descricao}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="mb-5 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Dados disponíveis:</span>
                <span className="font-bold text-slate-700">{relatorio.dados}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </button>
              <button className="p-3 rounded-xl text-slate-600 hover:bg-slate-100 border-2 border-slate-200 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Relatório Personalizado */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-slate-800 text-white flex items-center justify-center">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xl">Relatório Personalizado</h3>
            <p className="text-slate-500 mt-1">
              Monte um relatório com os dados que você precisa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-700">Materiais</span>
          </label>
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-700">Usuários</span>
          </label>
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-700">Movimentações</span>
          </label>
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-700">Unidades</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button className="px-6 py-3.5 rounded-xl text-base font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors flex items-center">
            <FileText className="w-5 h-5 mr-2.5" />
            Gerar Relatório
          </button>
          <button className="px-6 py-3.5 rounded-xl text-base font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center">
            <Download className="w-5 h-5 mr-2.5" />
            Exportar Excel
          </button>
        </div>
      </div>
    </div>
  )
}

