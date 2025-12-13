'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

interface TransferirMaterialParams {
    materialId: number
    destinoId: number
    observacao?: string
}

export async function transferirMaterial(params: TransferirMaterialParams): Promise<{ success: boolean; message: string }> {
    const session = await getSession()

    if (!session) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    if (session.perfil !== 'GESTOR') {
        return { success: false, message: 'Você não tem permissão para transferir materiais.' }
    }

    const permissoes = await getPermissoesUsuario(session)

    try {
        // Busca o material
        const material = await prisma.material.findUnique({
            where: { id: params.materialId },
            include: { unidade: true }
        })

        if (!material) {
            return { success: false, message: 'Material não encontrado.' }
        }

        // Verifica se o material está no escopo visível do gestor
        if (!permissoes.unidadesVisiveis.includes(material.unidadeId)) {
            return { success: false, message: 'Você não tem permissão para transferir este material.' }
        }

        // Verifica se a unidade destino está no escopo visível
        if (!permissoes.unidadesVisiveis.includes(params.destinoId)) {
            return { success: false, message: 'Você não tem permissão para transferir para esta unidade.' }
        }

        // Verifica se o material está disponível
        if (material.status !== 'DISPONIVEL') {
            const statusTexto: Record<string, string> = {
                'EM_USO': 'em uso',
                'MANUTENCAO': 'em manutenção',
                'INATIVO': 'inativo'
            }
            return {
                success: false,
                message: `Não é possível transferir um material ${statusTexto[material.status] || material.status}. O material deve estar disponível.`
            }
        }

        // Verifica se não está transferindo para a mesma unidade
        if (material.unidadeId === params.destinoId) {
            return { success: false, message: 'O material já pertence a esta unidade.' }
        }

        // Busca a unidade destino
        const unidadeDestino = await prisma.unidade.findUnique({
            where: { id: params.destinoId }
        })

        if (!unidadeDestino) {
            return { success: false, message: 'Unidade de destino não encontrada.' }
        }

        // Realiza a transferência em uma transação
        await prisma.$transaction(async (tx) => {
            // Cria o registro de transferência
            await tx.transferencia.create({
                data: {
                    materialId: params.materialId,
                    origemId: material.unidadeId,
                    destinoId: params.destinoId,
                    responsavelId: session.userId,
                    observacao: params.observacao || null,
                }
            })

            // Atualiza a unidade do material
            await tx.material.update({
                where: { id: params.materialId },
                data: { unidadeId: params.destinoId }
            })
        })

        revalidatePath('/dashboard/materiais')
        revalidatePath('/dashboard/transferencias')
        revalidatePath('/dashboard')

        return { success: true, message: `Material transferido com sucesso para ${unidadeDestino.nome}!` }
    } catch (error) {
        console.error('Erro ao transferir material:', error)
        return { success: false, message: 'Erro interno ao transferir material.' }
    }
}
