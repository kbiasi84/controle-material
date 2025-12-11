import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MaterialFilters } from '@/components/dashboard/material-filters'
import { MaterialCard } from '@/components/dashboard/material-card'
import { Paginacao } from '@/components/dashboard/paginacao'
import { Shield } from 'lucide-react'

const ITEMS_PER_PAGE = 12

interface DashboardPageProps {
  searchParams: Promise<{ status?: string; search?: string; tipo?: string; pagina?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession()

  if (!session) {
    return null
  }

  const params = await searchParams
  const statusFilter = params.status || 'DISPONIVEL' // Padrão: Disponível
  const searchFilter = params.search || ''
  const tipoFilter = params.tipo || ''
  const paginaAtual = parseInt(params.pagina || '1')

  // Busca tipos de material do banco (para o filtro)
  const tiposMaterial = await prisma.tipoMaterial.findMany({
    orderBy: { nome: 'asc' },
  })

  // Monta o WHERE clause - APENAS materiais da unidade direta do usuário
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {
    unidadeId: session.unidadeId, // Apenas unidade direta!
    status: { not: 'INATIVO' },   // Exclui inativos
  }

  // Filtro por status (se não for TODOS)
  if (statusFilter !== 'TODOS') {
    whereClause.status = statusFilter
  }

  // Filtro por tipo
  if (tipoFilter) {
    const tipoId = parseInt(tipoFilter)
    if (!isNaN(tipoId)) {
      whereClause.tipoId = tipoId
    }
  }

  // Filtro por busca (mínimo 3 caracteres)
  if (searchFilter.length >= 3) {
    whereClause.OR = [
      { codigoIdentificacao: { contains: searchFilter, mode: 'insensitive' } },
      { descricao: { contains: searchFilter, mode: 'insensitive' } },
      { tipo: { nome: { contains: searchFilter, mode: 'insensitive' } } },
    ]
  }

  // Conta total de registros (para paginação)
  const totalRegistros = await prisma.material.count({ where: whereClause })
  const totalPaginas = Math.ceil(totalRegistros / ITEMS_PER_PAGE)
  const skip = (paginaAtual - 1) * ITEMS_PER_PAGE

  // Busca materiais com paginação
  const materiais = await prisma.material.findMany({
    where: whereClause,
    include: {
      tipo: true,
      unidade: true,
      // Busca a movimentação ativa (sem devolução)
      movimentacoes: {
        where: { dataDevolucao: null },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              identificacao: true,
            }
          }
        },
        take: 1,
        orderBy: { dataRetirada: 'desc' }
      }
    },
    orderBy: { id: 'desc' },
    skip,
    take: ITEMS_PER_PAGE,
  })

  // Dados do usuário logado para passar aos cards
  const usuarioLogado = {
    userId: session.userId,
    nome: session.nome,
    perfil: session.perfil,
    unidadeId: session.unidadeId,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Retirar Material</h2>
          <p className="text-slate-500 mt-1">
            Materiais disponíveis no {session.unidadeNome}
          </p>
        </div>

        {/* Badge com total */}
        <div className="flex gap-3">
          <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-blue-100 text-blue-800 border-2 border-blue-200">
            {totalRegistros} {totalRegistros === 1 ? 'material' : 'materiais'}
          </span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <MaterialFilters
        tipos={tiposMaterial.map(t => ({ id: t.id, nome: t.nome }))}
      />

      {/* Materials Grid */}
      {materiais.length === 0 ? (
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {materiais.map((material) => {
              // Pega o usuário que está usando o material (se houver)
              const movimentacaoAtiva = material.movimentacoes[0]
              const usuarioEmUso = movimentacaoAtiva?.usuario || null

              return (
                <MaterialCard
                  key={material.id}
                  material={{
                    id: material.id,
                    codigoIdentificacao: material.codigoIdentificacao,
                    descricao: material.descricao,
                    status: material.status,
                    observacaoAtual: material.observacaoAtual,
                    tipo: {
                      nome: material.tipo.nome
                    },
                    usuarioEmUso: usuarioEmUso ? {
                      id: usuarioEmUso.id,
                      nome: usuarioEmUso.nome,
                    } : null
                  }}
                  usuarioLogado={usuarioLogado}
                />
              )
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <Paginacao
              paginaAtual={paginaAtual}
              totalPaginas={totalPaginas}
              totalRegistros={totalRegistros}
              registrosPorPagina={ITEMS_PER_PAGE}
              baseUrl="/dashboard"
            />
          )}
        </>
      )}
    </div>
  )
}
