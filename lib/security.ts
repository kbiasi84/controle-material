import { prisma } from './prisma'
import { Perfil } from '@prisma/client'

/**
 * Busca recursivamente todas as unidades descendentes (filhas, netas, etc)
 */
async function getUnidadesDescendentes(unidadeId: number): Promise<number[]> {
  const ids: number[] = [unidadeId]
  
  const subordinadas = await prisma.unidade.findMany({
    where: { unidadeSuperiorId: unidadeId },
    select: { id: true },
  })
  
  for (const sub of subordinadas) {
    const subIds = await getUnidadesDescendentes(sub.id)
    ids.push(...subIds)
  }
  
  return ids
}

/**
 * Retorna as unidades que um usuário pode gerenciar/visualizar
 * 
 * @param usuarioId - ID do usuário
 * @returns Array de IDs das unidades permitidas
 * 
 * Regras:
 * - USUARIO/CONTROLADOR: Apenas a própria unidade
 * - GESTOR: Sua unidade + todas as descendentes (hierarquia completa abaixo)
 */
export async function getUnidadesPermitidas(usuarioId: number): Promise<number[]> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      perfil: true,
      unidadeId: true,
    },
  })

  if (!usuario) {
    return []
  }

  const { perfil, unidadeId } = usuario

  // USUARIO e CONTROLADOR: apenas própria unidade
  if (perfil === 'USUARIO' || perfil === 'CONTROLADOR') {
    return [unidadeId]
  }

  // GESTOR: unidade atual + todas as descendentes
  if (perfil === 'GESTOR') {
    return getUnidadesDescendentes(unidadeId)
  }

  // Fallback: apenas própria unidade
  return [unidadeId]
}

/**
 * Verifica se um gestor pode gerenciar uma unidade específica
 * 
 * @param gestorId - ID do usuário gestor
 * @param targetUnitId - ID da unidade alvo
 * @returns true se a unidade está dentro do escopo do gestor
 */
export async function canManageUnit(gestorId: number, targetUnitId: number): Promise<boolean> {
  const unidadesPermitidas = await getUnidadesPermitidas(gestorId)
  return unidadesPermitidas.includes(targetUnitId)
}

/**
 * Verifica se um usuário pode gerenciar outro usuário
 * (baseado se a unidade do usuário alvo está no escopo)
 */
export async function canManageUser(gestorId: number, targetUserId: number): Promise<boolean> {
  const targetUser = await prisma.usuario.findUnique({
    where: { id: targetUserId },
    select: { unidadeId: true },
  })

  if (!targetUser) {
    return false
  }

  return canManageUnit(gestorId, targetUser.unidadeId)
}

/**
 * Verifica se um usuário pode gerenciar um material específico
 */
export async function canManageMaterial(usuarioId: number, materialId: number): Promise<boolean> {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { unidadeId: true },
  })

  if (!material) {
    return false
  }

  return canManageUnit(usuarioId, material.unidadeId)
}

/**
 * Retorna o filtro WHERE para queries do Prisma baseado nas unidades permitidas
 */
export async function getUnidadeFilter(usuarioId: number) {
  const unidadesPermitidas = await getUnidadesPermitidas(usuarioId)
  
  return {
    unidadeId: {
      in: unidadesPermitidas,
    },
  }
}

/**
 * Verifica se o perfil tem acesso a uma rota específica
 */
export function hasRouteAccess(perfil: Perfil, rota: 'ADMIN' | 'EFETIVO' | 'DASHBOARD'): boolean {
  switch (rota) {
    case 'ADMIN':
      // Apenas GESTOR pode acessar /admin
      return perfil === 'GESTOR'
    
    case 'EFETIVO':
      // CONTROLADOR e GESTOR podem acessar /dashboard/efetivo
      return perfil === 'CONTROLADOR' || perfil === 'GESTOR'
    
    case 'DASHBOARD':
      // Todos os perfis podem acessar /dashboard
      return true
    
    default:
      return false
  }
}

