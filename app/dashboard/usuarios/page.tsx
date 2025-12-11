import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UsuariosGestao } from '@/components/admin/usuarios-gestao'
import { getUnidadesParaSeletor } from '@/lib/unidades-helper'

const REGISTROS_POR_PAGINA = 15

interface PageProps {
  searchParams: Promise<{
    busca?: string
    perfil?: string
    unidade?: string
    pagina?: string
  }>
}

export default async function GestaoUsuariosPage({ searchParams }: PageProps) {
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
  const perfilFilter = params.perfil || ''
  const unidadeFilter = params.unidade || ''
  const paginaAtual = parseInt(params.pagina || '1')

  const permissoes = await getPermissoesUsuario(session)

  // Busca unidades com caminho completo para o seletor
  const unidadesComCaminho = await getUnidadesParaSeletor()

  // Monta o where clause para busca no banco (apenas usuários ativos)
  const whereClause: any = {
    unidadeId: { in: permissoes.unidadesVisiveis },
    ativo: true
  }

  // Filtro por unidade
  if (unidadeFilter) {
    const unidadeId = parseInt(unidadeFilter)
    if (!isNaN(unidadeId) && permissoes.unidadesVisiveis.includes(unidadeId)) {
      whereClause.unidadeId = unidadeId
    }
  }

  // Filtro por perfil
  if (perfilFilter) {
    whereClause.perfil = perfilFilter
  }

  // Filtro por busca (mínimo 3 caracteres)
  if (busca.length >= 3) {
    whereClause.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { identificacao: { contains: busca, mode: 'insensitive' } },
    ]
  }

  // Conta total de registros (para paginação)
  const totalRegistros = await prisma.usuario.count({
    where: whereClause,
  })

  // Calcula paginação
  const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)
  const skip = (paginaAtual - 1) * REGISTROS_POR_PAGINA

  // Busca usuários com paginação
  const usuarios = await prisma.usuario.findMany({
    where: whereClause,
    include: {
      unidade: true,
    },
    orderBy: { nome: 'asc' },
    skip,
    take: REGISTROS_POR_PAGINA,
  })

  // Cria mapa para buscar caminho pelo ID
  const unidadeMap = new Map(unidadesComCaminho.map(u => [u.id, u.caminhoCompleto]))

  return (
    <UsuariosGestao
      usuarios={usuarios.map(u => ({
        id: u.id,
        identificacao: u.identificacao,
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        unidadeId: u.unidadeId,
        unidade: { nome: unidadeMap.get(u.unidadeId) || u.unidade.nome },
      }))}
      unidades={unidadesComCaminho.map(u => ({ id: u.id, nome: u.caminhoCompleto }))}
      paginaAtual={paginaAtual}
      totalPaginas={totalPaginas}
      totalRegistros={totalRegistros}
      registrosPorPagina={REGISTROS_POR_PAGINA}
    />
  )
}
