import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  ShoppingBag, 
  ArrowDownToLine,
  Calendar,
  Package,
  AlertCircle,
} from 'lucide-react'

export default async function MinhasRetiradasPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário pode devolver (apenas CONTROLADOR e GESTOR)
  const podeDevolver = session.perfil === 'CONTROLADOR' || session.perfil === 'GESTOR'
  
  // Busca movimentações do usuário (materiais em uso - sem data de devolução)
  const movimentacoes = await prisma.movimentacao.findMany({
    where: {
      usuarioId: session.userId,
      dataDevolucao: null, // Ainda não devolvido
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Minhas Retiradas</h2>
          <p className="text-slate-500 mt-1">
            Materiais que você possui em sua posse atualmente
          </p>
        </div>
        
        {/* Counter Badge */}
        <div className="flex gap-3">
          <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-blue-100 text-blue-800 border-2 border-blue-200">
            <ShoppingBag className="w-5 h-5 mr-2.5" />
            {movimentacoes.length} {movimentacoes.length === 1 ? 'Material' : 'Materiais'} em Posse
          </span>
        </div>
      </div>

      {/* Lista de Materiais em Posse */}
      {movimentacoes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600">Nenhum material em sua posse</h3>
          <p className="text-slate-400 text-base mt-2">
            Vá ao Dashboard para retirar materiais disponíveis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movimentacoes.map((mov) => (
            <div 
              key={mov.id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 group flex flex-col"
            >
              {/* Header com ícone e info */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-slate-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Package className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                    {mov.material.descricao || mov.material.tipo.nome}
                  </h3>
                  <p className="text-sm text-slate-400 font-mono mt-1">
                    {mov.material.codigoIdentificacao}
                  </p>
                </div>
              </div>

              {/* Status e Info */}
              <div className="mb-5 flex-1 space-y-2">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  Em Uso
                </div>
                
                <p className="text-sm text-slate-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  <span>Retirado em: {formatDate(mov.dataRetirada)}</span>
                </p>

                {mov.obsRetirada && (
                  <p className="text-sm text-slate-500 flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{mov.obsRetirada}</span>
                  </p>
                )}
              </div>

              {/* Action Button - Apenas para CONTROLADOR e GESTOR */}
              {podeDevolver && (
                <button className="w-full py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                  <ArrowDownToLine className="w-5 h-5 mr-2.5" />
                  Devolver
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
