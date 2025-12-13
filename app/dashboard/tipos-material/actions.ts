'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface CriarTipoParams {
    nome: string
}

interface EditarTipoParams {
    id: number
    nome: string
}

export async function criarTipoMaterial(params: CriarTipoParams): Promise<{ success: boolean; message: string }> {
    const session = await getSession()

    if (!session) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    if (session.perfil !== 'GESTOR') {
        return { success: false, message: 'Você não tem permissão para cadastrar tipos de material.' }
    }

    try {
        // Verifica se o nome já existe
        const existente = await prisma.tipoMaterial.findUnique({
            where: { nome: params.nome.toUpperCase() }
        })

        if (existente) {
            return { success: false, message: 'Já existe um tipo de material com este nome.' }
        }

        // Cria o tipo de material
        await prisma.tipoMaterial.create({
            data: {
                nome: params.nome.toUpperCase(),
            }
        })

        revalidatePath('/dashboard/tipos-material')
        revalidatePath('/dashboard/materiais')

        return { success: true, message: 'Tipo de material cadastrado com sucesso!' }
    } catch (error) {
        console.error('Erro ao criar tipo de material:', error)
        return { success: false, message: 'Erro interno ao cadastrar tipo de material.' }
    }
}

export async function editarTipoMaterial(params: EditarTipoParams): Promise<{ success: boolean; message: string }> {
    const session = await getSession()

    if (!session) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    if (session.perfil !== 'GESTOR') {
        return { success: false, message: 'Você não tem permissão para editar tipos de material.' }
    }

    try {
        // Busca o tipo com materiais vinculados
        const tipo = await prisma.tipoMaterial.findUnique({
            where: { id: params.id },
            include: { materiais: true }
        })

        if (!tipo) {
            return { success: false, message: 'Tipo de material não encontrado.' }
        }

        // Verifica se tem materiais vinculados
        if (tipo.materiais.length > 0) {
            return {
                success: false,
                message: `Este tipo possui ${tipo.materiais.length} material(is) vinculado(s). Não é possível editar.`
            }
        }

        // Verifica se o novo nome já existe (se foi alterado)
        if (params.nome.toUpperCase() !== tipo.nome) {
            const existente = await prisma.tipoMaterial.findUnique({
                where: { nome: params.nome.toUpperCase() }
            })

            if (existente) {
                return { success: false, message: 'Já existe um tipo de material com este nome.' }
            }
        }

        // Atualiza o tipo
        await prisma.tipoMaterial.update({
            where: { id: params.id },
            data: {
                nome: params.nome.toUpperCase(),
            }
        })

        revalidatePath('/dashboard/tipos-material')
        revalidatePath('/dashboard/materiais')

        return { success: true, message: 'Tipo de material atualizado com sucesso!' }
    } catch (error) {
        console.error('Erro ao editar tipo de material:', error)
        return { success: false, message: 'Erro interno ao editar tipo de material.' }
    }
}

export async function excluirTipoMaterial(id: number): Promise<{ success: boolean; message: string }> {
    const session = await getSession()

    if (!session) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    if (session.perfil !== 'GESTOR') {
        return { success: false, message: 'Você não tem permissão para excluir tipos de material.' }
    }

    try {
        // Busca o tipo com materiais vinculados
        const tipo = await prisma.tipoMaterial.findUnique({
            where: { id },
            include: { materiais: true }
        })

        if (!tipo) {
            return { success: false, message: 'Tipo de material não encontrado.' }
        }

        // Verifica se tem materiais vinculados
        if (tipo.materiais.length > 0) {
            return {
                success: false,
                message: `Este tipo possui ${tipo.materiais.length} material(is) vinculado(s). Altere o tipo desses materiais antes de excluir.`
            }
        }

        // Exclui o tipo
        await prisma.tipoMaterial.delete({
            where: { id }
        })

        revalidatePath('/dashboard/tipos-material')
        revalidatePath('/dashboard/materiais')

        return { success: true, message: 'Tipo de material excluído com sucesso!' }
    } catch (error) {
        console.error('Erro ao excluir tipo de material:', error)
        return { success: false, message: 'Erro interno ao excluir tipo de material.' }
    }
}
