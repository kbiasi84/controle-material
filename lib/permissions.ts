import { Perfil } from '@prisma/client'
import { prisma } from './prisma'
import { SessionPayload } from './auth'

/**
 * Perfis que têm visibilidade apenas local (própria unidade)
 */
const PERFIS_VISAO_LOCAL: Perfil[] = ['USUARIO', 'CONTROLADOR']

/**
 * Busca recursivamente todas as unidades subordinadas a uma unidade
 * Retorna um array com o ID da unidade principal + todos os IDs subordinados
 */
export async function getUnidadesSubordinadas(unidadeId: number): Promise<number[]> {
  const ids: number[] = [unidadeId]
  
  // Busca as subordinadas diretas
  const subordinadas = await prisma.unidade.findMany({
    where: { unidadeSuperiorId: unidadeId },
    select: { id: true },
  })
  
  // Para cada subordinada, busca recursivamente suas subordinadas
  for (const sub of subordinadas) {
    const subIds = await getUnidadesSubordinadas(sub.id)
    ids.push(...subIds)
  }
  
  return ids
}

/**
 * Calcula os IDs de unidades visíveis para um usuário baseado no seu perfil
 * 
 * - USUARIO/CONTROLADOR: Apenas sua unidade
 * - GESTOR: Sua unidade + todas subordinadas (cascata hierárquica)
 */
export async function getUnidadesVisiveis(session: SessionPayload): Promise<number[]> {
  const { perfil, unidadeId } = session
  
  // Perfis com visão local (USUARIO, CONTROLADOR)
  if (PERFIS_VISAO_LOCAL.includes(perfil)) {
    return [unidadeId]
  }
  
  // GESTOR: Visão hierárquica (sua unidade + todas subordinadas)
  if (perfil === 'GESTOR') {
    return getUnidadesSubordinadas(unidadeId)
  }
  
  // Fallback: apenas própria unidade
  return [unidadeId]
}

/**
 * Verifica se um usuário tem acesso a uma unidade específica
 */
export async function temAcessoUnidade(
  session: SessionPayload,
  unidadeIdAlvo: number
): Promise<boolean> {
  const unidadesVisiveis = await getUnidadesVisiveis(session)
  return unidadesVisiveis.includes(unidadeIdAlvo)
}

/**
 * Retorna a cláusula WHERE do Prisma para filtrar por unidades visíveis
 * Use isso em queries para garantir isolamento hierárquico
 * 
 * Exemplo de uso:
 * const materiais = await prisma.material.findMany({
 *   where: await getWhereUnidadeVisivel(session),
 * })
 */
export async function getWhereUnidadeVisivel(session: SessionPayload) {
  const unidadesVisiveis = await getUnidadesVisiveis(session)
  
  return {
    unidadeId: {
      in: unidadesVisiveis,
    },
  }
}

/**
 * Verifica se o usuário pode realizar uma ação específica
 * 
 * Perfis simplificados:
 * - USUARIO: Apenas retirar para si
 * - CONTROLADOR: Retirar/devolver para terceiros da unidade
 * - GESTOR: Todas as ações (cadastrar, transferir, relatórios, admin)
 */
export function podeRealizarAcao(
  session: SessionPayload,
  acao: 'RETIRAR_PARA_SI' | 'RETIRAR_PARA_TERCEIROS' | 'CADASTRAR_MATERIAL' | 'TRANSFERIR' | 'RELATORIOS' | 'ADMIN'
): boolean {
  const { perfil } = session
  
  switch (acao) {
    case 'RETIRAR_PARA_SI':
      // Todos podem retirar para si
      return true
    
    case 'RETIRAR_PARA_TERCEIROS':
      // CONTROLADOR e GESTOR podem retirar para terceiros
      return ['CONTROLADOR', 'GESTOR'].includes(perfil)
    
    case 'CADASTRAR_MATERIAL':
      // Apenas GESTOR pode cadastrar
      return perfil === 'GESTOR'
    
    case 'TRANSFERIR':
      // Apenas GESTOR pode transferir
      return perfil === 'GESTOR'
    
    case 'RELATORIOS':
      // Apenas GESTOR pode ver relatórios avançados
      return perfil === 'GESTOR'
    
    case 'ADMIN':
      // Apenas GESTOR tem acesso ao painel admin
      return perfil === 'GESTOR'
    
    default:
      return false
  }
}

/**
 * Retorna informações detalhadas sobre as permissões do usuário
 */
export async function getPermissoesUsuario(session: SessionPayload) {
  const unidadesVisiveis = await getUnidadesVisiveis(session)
  
  return {
    perfil: session.perfil,
    unidadeId: session.unidadeId,
    unidadesVisiveis,
    quantidadeUnidades: unidadesVisiveis.length,
    permissoes: {
      retirarParaSi: podeRealizarAcao(session, 'RETIRAR_PARA_SI'),
      retirarParaTerceiros: podeRealizarAcao(session, 'RETIRAR_PARA_TERCEIROS'),
      cadastrarMaterial: podeRealizarAcao(session, 'CADASTRAR_MATERIAL'),
      transferir: podeRealizarAcao(session, 'TRANSFERIR'),
      relatorios: podeRealizarAcao(session, 'RELATORIOS'),
      admin: podeRealizarAcao(session, 'ADMIN'),
    },
  }
}

/**
 * Verifica se o usuário é GESTOR (tem acesso administrativo)
 */
export function isGestor(session: SessionPayload): boolean {
  return session.perfil === 'GESTOR'
}
