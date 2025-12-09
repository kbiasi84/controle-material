'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface RetirarMaterialParams {
  materialId: number
  beneficiarioId: number
  responsavelId: number
  observacao?: string
}

export async function retirarMaterial(params: RetirarMaterialParams) {
  const { materialId, beneficiarioId, responsavelId, observacao } = params

  try {
    // Verificar se o material existe e está disponível
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { tipo: true }
    })

    if (!material) {
      return { success: false, message: 'Material não encontrado.' }
    }

    if (material.status !== 'DISPONIVEL') {
      return { 
        success: false, 
        message: `Este material está ${material.status === 'EM_USO' ? 'em uso por outro policial' : 'em manutenção'} e não pode ser retirado.` 
      }
    }

    // Verificar se o beneficiário existe
    const beneficiario = await prisma.usuario.findUnique({
      where: { id: beneficiarioId }
    })

    if (!beneficiario) {
      return { success: false, message: 'Policial não encontrado.' }
    }

    // Criar a movimentação e atualizar o status do material em uma transação
    await prisma.$transaction([
      // Criar registro de movimentação
      prisma.movimentacao.create({
        data: {
          materialId,
          usuarioId: beneficiarioId,
          respRetiradaId: responsavelId,
          obsRetirada: observacao,
          dataRetirada: new Date(),
        }
      }),
      // Atualizar status do material
      prisma.material.update({
        where: { id: materialId },
        data: { 
          status: 'EM_USO',
          observacaoAtual: observacao || null
        }
      })
    ])

    // Revalidar a página do dashboard para atualizar a lista
    revalidatePath('/dashboard')

    return { 
      success: true, 
      message: `${material.descricao || material.tipo.nome} foi retirado com sucesso para ${beneficiario.nome}.` 
    }

  } catch (error) {
    console.error('Erro ao retirar material:', error)
    return { success: false, message: 'Erro interno ao processar a retirada. Tente novamente.' }
  }
}

