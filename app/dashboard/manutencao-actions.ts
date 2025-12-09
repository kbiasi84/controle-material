'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function concluirManutencao(materialId: number): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  // Apenas GESTOR pode concluir manutenção
  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para concluir manutenção.' }
  }

  try {
    // Busca o material
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    })

    if (!material) {
      return { success: false, message: 'Material não encontrado.' }
    }

    if (material.status !== 'MANUTENCAO') {
      return { success: false, message: 'Este material não está em manutenção.' }
    }

    // Atualiza o material para DISPONIVEL e limpa a observação
    await prisma.material.update({
      where: { id: materialId },
      data: {
        status: 'DISPONIVEL',
        observacaoAtual: null, // Limpa o motivo da manutenção
      },
    })

    // Revalida o cache das páginas
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/materiais')

    return {
      success: true,
      message: 'Manutenção concluída com sucesso! O material está disponível para uso.',
    }
  } catch (error) {
    console.error('Erro ao concluir manutenção:', error)
    return { success: false, message: 'Erro interno ao processar a conclusão.' }
  }
}

