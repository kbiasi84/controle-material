'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

interface CriarUnidadeParams {
  nome: string
  sigla?: string
  endereco?: string
  unidadeSuperiorId?: number
}

interface EditarUnidadeParams {
  id: number
  nome: string
  sigla?: string
  endereco?: string
  unidadeSuperiorId?: number | null
}

export async function criarUnidade(params: CriarUnidadeParams): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para cadastrar unidades.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  // Se tem unidade superior, verifica se está no escopo
  if (params.unidadeSuperiorId && !permissoes.unidadesVisiveis.includes(params.unidadeSuperiorId)) {
    return { success: false, message: 'Você não tem permissão para criar unidades nesta hierarquia.' }
  }

  try {
    // Verifica se o nome já existe NA MESMA unidade superior (unicidade composta)
    const existente = await prisma.unidade.findFirst({
      where: {
        nome: params.nome,
        unidadeSuperiorId: params.unidadeSuperiorId || null
      }
    })

    if (existente) {
      return { success: false, message: 'Já existe uma unidade com este nome nesta hierarquia.' }
    }

    // Cria a unidade
    await prisma.unidade.create({
      data: {
        nome: params.nome,
        sigla: params.sigla || null,
        endereco: params.endereco || null,
        unidadeSuperiorId: params.unidadeSuperiorId || null,
      }
    })

    revalidatePath('/dashboard/unidades')

    return { success: true, message: 'Unidade cadastrada com sucesso!' }
  } catch (error) {
    console.error('Erro ao criar unidade:', error)
    return { success: false, message: 'Erro interno ao cadastrar unidade.' }
  }
}

export async function editarUnidade(params: EditarUnidadeParams): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para editar unidades.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca a unidade
    const unidade = await prisma.unidade.findUnique({
      where: { id: params.id }
    })

    if (!unidade) {
      return { success: false, message: 'Unidade não encontrada.' }
    }

    // Verifica se a unidade está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(unidade.id)) {
      return { success: false, message: 'Você não tem permissão para editar esta unidade.' }
    }

    // Verifica se o novo nome já existe NA MESMA unidade superior (se foi alterado)
    if (params.nome !== unidade.nome || params.unidadeSuperiorId !== unidade.unidadeSuperiorId) {
      const existente = await prisma.unidade.findFirst({
        where: {
          nome: params.nome,
          unidadeSuperiorId: params.unidadeSuperiorId ?? null,
          NOT: { id: params.id } // Exclui a própria unidade da busca
        }
      })

      if (existente) {
        return { success: false, message: 'Já existe uma unidade com este nome nesta hierarquia.' }
      }
    }

    // Não pode ser subordinada de si mesma
    if (params.unidadeSuperiorId === params.id) {
      return { success: false, message: 'Uma unidade não pode ser subordinada de si mesma.' }
    }

    // Atualiza a unidade
    await prisma.unidade.update({
      where: { id: params.id },
      data: {
        nome: params.nome,
        sigla: params.sigla || null,
        endereco: params.endereco || null,
        unidadeSuperiorId: params.unidadeSuperiorId,
      }
    })

    revalidatePath('/dashboard/unidades')

    return { success: true, message: 'Unidade atualizada com sucesso!' }
  } catch (error) {
    console.error('Erro ao editar unidade:', error)
    return { success: false, message: 'Erro interno ao editar unidade.' }
  }
}

export async function excluirUnidade(id: number): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para excluir unidades.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca a unidade com relacionamentos
    const unidade = await prisma.unidade.findUnique({
      where: { id },
      include: {
        usuarios: true,
        materiais: true,
        subordinadas: true,
      }
    })

    if (!unidade) {
      return { success: false, message: 'Unidade não encontrada.' }
    }

    // Verifica se a unidade está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(unidade.id)) {
      return { success: false, message: 'Você não tem permissão para excluir esta unidade.' }
    }

    // Verifica se tem usuários vinculados
    if (unidade.usuarios.length > 0) {
      return {
        success: false,
        message: `Esta unidade possui ${unidade.usuarios.length} usuário(s) vinculado(s). Transfira-os antes de excluir.`
      }
    }

    // Verifica se tem materiais vinculados
    if (unidade.materiais.length > 0) {
      return {
        success: false,
        message: `Esta unidade possui ${unidade.materiais.length} material(is) vinculado(s). Transfira-os antes de excluir.`
      }
    }

    // Verifica se tem unidades subordinadas
    if (unidade.subordinadas.length > 0) {
      return {
        success: false,
        message: `Esta unidade possui ${unidade.subordinadas.length} unidade(s) subordinada(s). Remova a hierarquia antes de excluir.`
      }
    }

    // Exclui a unidade
    await prisma.unidade.delete({
      where: { id }
    })

    revalidatePath('/dashboard/unidades')

    return { success: true, message: 'Unidade excluída com sucesso!' }
  } catch (error) {
    console.error('Erro ao excluir unidade:', error)
    return { success: false, message: 'Erro interno ao excluir unidade.' }
  }
}

