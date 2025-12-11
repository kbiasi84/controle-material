import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UnidadesGestao } from '@/components/admin/unidades-gestao'
import { getUnidadesParaSeletor } from '@/lib/unidades-helper'

const REGISTROS_POR_PAGINA = 15

interface PageProps {
  searchParams: Promise<{
    busca?: string
    pagina?: string
  }>
}

export default async function GestaoUnidadesPage({ searchParams }: PageProps) {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão (apenas GESTOR)
  if (session.perfil !== 'GESTOR') {
    redirect('/dashboard?error=unauthorized')
  }

  const params = await searchParams
  const busca = params.busca || ''
  const paginaAtual = parseInt(params.pagina || '1')

  const permissoes = await getPermissoesUsuario(session)

  // Monta o where clause para busca no banco
  const whereClause: any = {
    id: { in: permissoes.unidadesVisiveis }
  }

  // Filtro por busca (mínimo 3 caracteres)
  if (busca.length >= 3) {
    whereClause.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { sigla: { contains: busca, mode: 'insensitive' } },
    ]
  }

  // Conta total de registros (para paginação)
  const totalRegistros = await prisma.unidade.count({
    where: whereClause,
  })

  // Calcula paginação
  const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)
  const skip = (paginaAtual - 1) * REGISTROS_POR_PAGINA

  // Busca unidades com paginação
  const unidades = await prisma.unidade.findMany({
    where: whereClause,
    include: {
      unidadeSuperior: true,
      _count: {
        select: {
          usuarios: true,
          materiais: true,
        }
      }
    },
    orderBy: { nome: 'asc' },
    skip,
    take: REGISTROS_POR_PAGINA,
  })

  // Busca todas as unidades com caminho completo para o dropdown de unidade superior
  // Já vem ordenado alfabeticamente pelo caminho completo
  const unidadesParaSeletor = await getUnidadesParaSeletor()

  // Cria mapa com caminho superior e índice de ordenação
  const unidadeInfoMap = new Map(unidadesParaSeletor.map((u, index) => {
    const partes = u.caminhoCompleto.split(' > ')
    const caminhoSuperior = partes.slice(0, -1).join(' > ')
    return [u.id, { caminhoSuperior, ordem: index }]
  }))

  // Filtra unidades visíveis baseado na busca
  let unidadesFiltradas = unidadesParaSeletor
  if (busca.length >= 3) {
    const buscaLower = busca.toLowerCase()
    unidadesFiltradas = unidadesParaSeletor.filter(u =>
      u.nome.toLowerCase().includes(buscaLower) ||
      u.caminhoCompleto.toLowerCase().includes(buscaLower)
    )
  }

  // Calcula paginação baseado nas unidades filtradas
  const totalRegistrosFiltrados = unidadesFiltradas.length
  const totalPaginasFiltrado = Math.ceil(totalRegistrosFiltrados / REGISTROS_POR_PAGINA)
  const skipFiltrado = (paginaAtual - 1) * REGISTROS_POR_PAGINA

  // Pega os IDs das unidades para a página atual
  const unidadesDaPagina = unidadesFiltradas.slice(skipFiltrado, skipFiltrado + REGISTROS_POR_PAGINA)

  // Busca os dados completos das unidades da página
  const unidadesCompletas = await prisma.unidade.findMany({
    where: {
      id: { in: unidadesDaPagina.map(u => u.id) }
    },
    include: {
      _count: {
        select: {
          usuarios: true,
          materiais: true,
        }
      }
    },
  })

  // Ordena pelo índice original do seletor
  const unidadesOrdenadas = unidadesCompletas.sort((a, b) => {
    const ordemA = unidadeInfoMap.get(a.id)?.ordem ?? 999
    const ordemB = unidadeInfoMap.get(b.id)?.ordem ?? 999
    return ordemA - ordemB
  })

  return (
    <UnidadesGestao
      unidades={unidadesOrdenadas.map(u => ({
        id: u.id,
        nome: u.nome,
        sigla: u.sigla,
        endereco: u.endereco,
        unidadeSuperiorId: u.unidadeSuperiorId,
        caminhoSuperior: unidadeInfoMap.get(u.id)?.caminhoSuperior || null,
        _count: u._count,
      }))}
      todasUnidades={unidadesParaSeletor.map(u => ({ id: u.id, nome: u.caminhoCompleto }))}
      paginaAtual={paginaAtual}
      totalPaginas={totalPaginasFiltrado}
      totalRegistros={totalRegistrosFiltrados}
      registrosPorPagina={REGISTROS_POR_PAGINA}
    />
  )
}
