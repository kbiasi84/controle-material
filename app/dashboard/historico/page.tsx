import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  History, 
  ArrowUpFromLine,
  ArrowDownToLine,
  Package,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { HistoricoFiltros } from '@/components/dashboard/historico-filtros'
import { Paginacao } from '@/components/dashboard/paginacao'

const REGISTROS_POR_PAGINA = 15

interface HistoricoPageProps {
  searchParams: Promise<{ 
    busca?: string
    status?: string
    periodo?: string
    pagina?: string
  }>
}

export default async function HistoricoPage({ searchParams }: HistoricoPageProps) {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Aguarda os searchParams (Next.js 15+)
  const params = await searchParams

  // Parâmetros de filtro
  const busca = params.busca || ''
  const status = params.status || 'TODOS'
  const periodo = params.periodo || '30' // Padrão: últimos 30 dias
  const paginaAtual = parseInt(params.pagina || '1')

  // Monta o where clause
  const whereClause: any = {
    usuarioId: session.userId,
  }

  // Filtro de status
  if (status === 'EM_POSSE') {
    whereClause.dataDevolucao = null
  } else if (status === 'DEVOLVIDO') {
    whereClause.dataDevolucao = { not: null }
  }

  // Filtro de período (1 = 24h, 7 = 7 dias, 30 = 30 dias)
  const dias = parseInt(periodo) || 30
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - dias)
  whereClause.dataRetirada = { gte: dataLimite }

  // Filtro de busca
  if (busca.length >= 3) {
    whereClause.material = {
      OR: [
        { codigoIdentificacao: { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
        { tipo: { nome: { contains: busca, mode: 'insensitive' } } },
      ],
    }
  }

  // Conta total de registros
  const totalRegistros = await prisma.movimentacao.count({
    where: whereClause,
  })

  // Calcula paginação
  const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)
  const skip = (paginaAtual - 1) * REGISTROS_POR_PAGINA

  // Busca movimentações com paginação
  const movimentacoes = await prisma.movimentacao.findMany({
    where: whereClause,
    include: {
      material: {
        include: {
          tipo: true,
          unidade: true,
        }
      },
    },
    orderBy: { dataRetirada: 'desc' },
    skip,
    take: REGISTROS_POR_PAGINA,
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Histórico de Movimentações</h2>
        <p className="text-slate-500 mt-1">
          Registro de todas as suas retiradas e devoluções
        </p>
      </div>

      {/* Filtros */}
      <HistoricoFiltros />

      {/* Lista de Movimentações */}
      {movimentacoes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">
            {busca.length >= 3 || status !== 'TODOS'
              ? 'Nenhum resultado encontrado' 
              : 'Nenhuma movimentação registrada'}
          </h3>
          <p className="text-slate-400 text-base mt-2">
            {busca.length >= 3 || status !== 'TODOS'
              ? 'Tente ajustar os filtros para ver mais resultados.'
              : 'Seu histórico aparecerá aqui quando você retirar ou devolver materiais.'}
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
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Retirada
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Devolução
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Observação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimentacoes.map((mov) => {
                  const isDevolvido = !!mov.dataDevolucao
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isDevolvido 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {mov.material.descricao || mov.material.tipo.nome}
                            </p>
                            <p className="text-sm text-slate-400 font-mono">
                              {mov.material.codigoIdentificacao}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                          isDevolvido 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {isDevolvido ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Devolvido
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 mr-1.5" />
                              Em Posse
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600">
                          <ArrowUpFromLine className="w-4 h-4 mr-2 text-slate-400" />
                          {formatDate(mov.dataRetirada)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {mov.dataDevolucao ? (
                          <div className="flex items-center text-slate-600">
                            <ArrowDownToLine className="w-4 h-4 mr-2 text-slate-400" />
                            {formatDate(mov.dataDevolucao)}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-500 truncate max-w-xs">
                          {mov.obsRetirada || mov.obsDevolucao || '-'}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          <Paginacao
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            registrosPorPagina={REGISTROS_POR_PAGINA}
            baseUrl="/dashboard/historico"
          />
        </div>
      )}
    </div>
  )
}
