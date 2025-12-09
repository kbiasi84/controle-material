import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MateriaisGestao } from '@/components/admin/materiais-gestao'

const REGISTROS_POR_PAGINA = 15

interface PageProps {
  searchParams: Promise<{ 
    busca?: string
    tipo?: string
    status?: string
    unidade?: string
    pagina?: string
  }>
}

export default async function GestaoMateriaisPage({ searchParams }: PageProps) {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão
  if (session.perfil !== 'GESTOR') {
    redirect('/dashboard?error=unauthorized')
  }

  const params = await searchParams
  const busca = params.busca || ''
  const tipoFilter = params.tipo || ''
  const statusFilter = params.status || ''
  const unidadeFilter = params.unidade || ''
  const paginaAtual = parseInt(params.pagina || '1')

  const permissoes = await getPermissoesUsuario(session)
  
  // Busca tipos de material para o filtro
  const tiposMaterial = await prisma.tipoMaterial.findMany({
    orderBy: { nome: 'asc' },
  })

  // Busca unidades visíveis para o filtro e formulário
  const unidades = await prisma.unidade.findMany({
    where: {
      id: { in: permissoes.unidadesVisiveis }
    },
    orderBy: { nome: 'asc' },
  })

  // Monta o where clause para busca no banco
  const whereClause: any = {
    unidadeId: { in: permissoes.unidadesVisiveis }
  }

  // Filtro por unidade
  if (unidadeFilter) {
    const unidadeId = parseInt(unidadeFilter)
    if (!isNaN(unidadeId) && permissoes.unidadesVisiveis.includes(unidadeId)) {
      whereClause.unidadeId = unidadeId
    }
  }

  // Filtro por tipo
  if (tipoFilter) {
    const tipoId = parseInt(tipoFilter)
    if (!isNaN(tipoId)) {
      whereClause.tipoId = tipoId
    }
  }

  // Filtro por status
  if (statusFilter) {
    whereClause.status = statusFilter
  }

  // Filtro por busca (mínimo 3 caracteres)
  if (busca.length >= 3) {
    whereClause.OR = [
      { codigoIdentificacao: { contains: busca, mode: 'insensitive' } },
      { descricao: { contains: busca, mode: 'insensitive' } },
      { tipo: { nome: { contains: busca, mode: 'insensitive' } } },
    ]
  }

  // Conta total de registros (para paginação)
  const totalRegistros = await prisma.material.count({
    where: whereClause,
  })

  // Calcula paginação
  const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)
  const skip = (paginaAtual - 1) * REGISTROS_POR_PAGINA

  // Busca materiais com paginação
  const materiais = await prisma.material.findMany({
    where: whereClause,
    include: {
      tipo: true,
      unidade: true,
      // Busca última movimentação para pegar quem enviou para manutenção
      movimentacoes: {
        orderBy: { dataDevolucao: 'desc' },
        take: 1,
        where: { dataDevolucao: { not: null } },
        include: {
          respDevolucao: { select: { nome: true } }
        }
      }
    },
    orderBy: { id: 'desc' },
    skip,
    take: REGISTROS_POR_PAGINA,
  })

  // Conta materiais em manutenção (para exibir badge de alerta)
  const manutencao = await prisma.material.count({
    where: {
      unidadeId: { in: permissoes.unidadesVisiveis },
      status: 'MANUTENCAO',
    },
  })

  return (
    <MateriaisGestao 
      materiais={materiais.map(m => {
        // Pega quem enviou para manutenção (última devolução)
        const ultimaMovimentacao = m.movimentacoes[0]
        const enviadoManutencaoPor = m.status === 'MANUTENCAO' && ultimaMovimentacao?.respDevolucao
          ? ultimaMovimentacao.respDevolucao.nome
          : null

        return {
          id: m.id,
          codigoIdentificacao: m.codigoIdentificacao,
          descricao: m.descricao,
          status: m.status,
          observacaoAtual: m.observacaoAtual,
          enviadoManutencaoPor,
          tipoId: m.tipoId,
          unidadeId: m.unidadeId,
          tipo: { nome: m.tipo.nome },
          unidade: { nome: m.unidade.nome },
        }
      })}
      tipos={tiposMaterial.map(t => ({ id: t.id, nome: t.nome }))}
      unidades={unidades.map(u => ({ id: u.id, nome: u.nome }))}
      paginaAtual={paginaAtual}
      totalPaginas={totalPaginas}
      totalRegistros={totalRegistros}
      registrosPorPagina={REGISTROS_POR_PAGINA}
      manutencao={manutencao}
    />
  )
}
