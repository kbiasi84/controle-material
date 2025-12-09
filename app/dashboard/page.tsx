import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { MaterialFilters } from '@/components/dashboard/material-filters'
import { MaterialCard } from '@/components/dashboard/material-card'
import { Shield } from 'lucide-react'

interface DashboardPageProps {
  searchParams: Promise<{ status?: string; search?: string; tipo?: string }>
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

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca tipos de material do banco
  const tiposMaterial = await prisma.tipoMaterial.findMany({
    orderBy: { nome: 'asc' },
  })

  // Busca TODOS os materiais ATIVOS com a movimentação ativa (quem está usando)
  // Exclui materiais INATIVOS do dashboard operacional
  const todosMateriais = await prisma.material.findMany({
    where: { 
      unidadeId: { in: permissoes.unidadesVisiveis },
      status: { not: 'INATIVO' } // Exclui inativos
    },
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
      )}
    </div>
  )
}
