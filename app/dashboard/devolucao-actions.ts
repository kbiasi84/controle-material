'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface DevolverMaterialParams {
  materialId: number
  responsavelId: number
  observacao?: string
  enviarManutencao: boolean
}

export async function devolverMaterial(params: DevolverMaterialParams): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  // Verifica se o perfil pode devolver material
  if (session.perfil !== 'CONTROLADOR' && session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para registrar devoluções.' }
  }

  const { materialId, responsavelId, observacao, enviarManutencao } = params

  try {
    // Busca o material e a movimentação ativa
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        movimentacoes: {
          where: { dataDevolucao: null },
          orderBy: { dataRetirada: 'desc' },
          take: 1,
        },
      },
    })

    if (!material) {
      return { success: false, message: 'Material não encontrado.' }
    }

    if (material.status !== 'EM_USO') {
      return { success: false, message: 'Este material não está em uso.' }
    }

    const movimentacaoAtiva = material.movimentacoes[0]

    if (!movimentacaoAtiva) {
      return { success: false, message: 'Não há registro de retirada para este material.' }
    }

    // Determina o novo status
    const novoStatus = enviarManutencao ? 'MANUTENCAO' : 'DISPONIVEL'

    // Atualiza tudo em uma transação
    await prisma.$transaction(async (tx) => {
      // Atualiza a movimentação (encerra ela)
      await tx.movimentacao.update({
        where: { id: movimentacaoAtiva.id },
        data: {
          dataDevolucao: new Date(),
          respDevolucaoId: responsavelId,
          obsDevolucao: observacao || null,
        },
      })

      // Atualiza o material
      await tx.material.update({
        where: { id: materialId },
        data: {
          status: novoStatus,
          observacaoAtual: enviarManutencao ? (observacao || 'Em manutenção') : null,
        },
      })
    })

    // Revalida o cache das páginas
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/retiradas')
    revalidatePath('/dashboard/historico')
    revalidatePath('/dashboard/devolucao')

    return {
      success: true,
      message: enviarManutencao
        ? 'Material devolvido e encaminhado para manutenção.'
        : 'Material devolvido com sucesso e disponível para uso.',
    }
  } catch (error) {
    console.error('Erro ao devolver material:', error)
    return { success: false, message: 'Erro interno ao processar a devolução.' }
  }
}

