import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { 
  History, 
  ArrowUpFromLine,
  ArrowDownToLine,
  Calendar,
  Search,
  Package,
  CheckCircle,
  Clock,
} from 'lucide-react'

export default async function HistoricoPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca todas as movimentações do usuário
  const movimentacoes = await prisma.movimentacao.findMany({
    where: {
      usuarioId: session.userId,
    },
    include: {
      material: {
        include: {
          tipo: true,
          unidade: true,
        }
      },
    },
    orderBy: { dataRetirada: 'desc' },
    take: 50,
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

  // Conta retiradas e devoluções
  const emPosse = movimentacoes.filter(m => !m.dataDevolucao).length
  const devolvidos = movimentacoes.filter(m => m.dataDevolucao).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Movimentações</h2>
          <p className="text-slate-500 mt-1">
            Registro de todas as suas retiradas e devoluções
          </p>
        </div>
        
        {/* Stats Badges */}
        <div className="flex gap-3">
          <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-orange-100 text-orange-800 border-2 border-orange-200">
            <Clock className="w-5 h-5 mr-2.5" />
            {emPosse} Em Posse
          </span>
          <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-green-100 text-green-800 border-2 border-green-200">
            <CheckCircle className="w-5 h-5 mr-2.5" />
            {devolvidos} Devolvidos
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por código ou nome do material..." 
              className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
              <option>Todos os Status</option>
              <option>Em Posse</option>
              <option>Devolvido</option>
            </select>
            <select className="h-12 px-5 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors">
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
              <option>Hoje</option>
              <option>Todo período</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Movimentações */}
      {movimentacoes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">Nenhuma movimentação registrada</h3>
          <p className="text-slate-400 text-base mt-2">
            Seu histórico aparecerá aqui quando você retirar ou devolver materiais.
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
        </div>
      )}
    </div>
  )
}
