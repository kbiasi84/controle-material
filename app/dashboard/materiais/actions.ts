'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

interface CriarMaterialParams {
  codigoIdentificacao: string
  descricao: string
  tipoId: number
  unidadeId: number
}

interface EditarMaterialParams {
  id: number
  codigoIdentificacao: string
  descricao: string
  tipoId: number
  unidadeId: number
  status: 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO'
}

export async function criarMaterial(params: CriarMaterialParams): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para cadastrar materiais.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  // Verifica se a unidade está dentro do escopo visível
  if (!permissoes.unidadesVisiveis.includes(params.unidadeId)) {
    return { success: false, message: 'Você não tem permissão para cadastrar materiais nesta unidade.' }
  }

  try {
    // Verifica se o código já existe
    const existente = await prisma.material.findUnique({
      where: { codigoIdentificacao: params.codigoIdentificacao }
    })

    if (existente) {
      return { success: false, message: 'Já existe um material com este código de identificação.' }
    }

    // Verifica se o tipo existe
    const tipo = await prisma.tipoMaterial.findUnique({
      where: { id: params.tipoId }
    })

    if (!tipo) {
      return { success: false, message: 'Tipo de material não encontrado.' }
    }

    // Cria o material
    await prisma.material.create({
      data: {
        codigoIdentificacao: params.codigoIdentificacao,
        descricao: params.descricao,
        tipoId: params.tipoId,
        unidadeId: params.unidadeId,
        status: 'DISPONIVEL',
      }
    })

    revalidatePath('/dashboard/materiais')
    revalidatePath('/dashboard')

    return { success: true, message: 'Material cadastrado com sucesso!' }
  } catch (error) {
    console.error('Erro ao criar material:', error)
    return { success: false, message: 'Erro interno ao cadastrar material.' }
  }
}

export async function editarMaterial(params: EditarMaterialParams): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para editar materiais.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca o material
    const material = await prisma.material.findUnique({
      where: { id: params.id }
    })

    if (!material) {
      return { success: false, message: 'Material não encontrado.' }
    }

    // Verifica se o material está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(material.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para editar este material.' }
    }

    // Verifica se a nova unidade está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(params.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para mover o material para esta unidade.' }
    }

    // Verifica se o novo código já existe (se foi alterado)
    if (params.codigoIdentificacao !== material.codigoIdentificacao) {
      const existente = await prisma.material.findUnique({
        where: { codigoIdentificacao: params.codigoIdentificacao }
      })

      if (existente) {
        return { success: false, message: 'Já existe um material com este código de identificação.' }
      }
    }

    // Atualiza o material
    await prisma.material.update({
      where: { id: params.id },
      data: {
        codigoIdentificacao: params.codigoIdentificacao,
        descricao: params.descricao,
        tipoId: params.tipoId,
        unidadeId: params.unidadeId,
        status: params.status,
      }
    })

    revalidatePath('/dashboard/materiais')
    revalidatePath('/dashboard')

    return { success: true, message: 'Material atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao editar material:', error)
    return { success: false, message: 'Erro interno ao editar material.' }
  }
}

export async function excluirMaterial(id: number): Promise<{ success: boolean; message: string; podeInativar?: boolean }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para excluir materiais.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca o material
    const material = await prisma.material.findUnique({
      where: { id },
      include: { movimentacoes: true }
    })

    if (!material) {
      return { success: false, message: 'Material não encontrado.' }
    }

    // Verifica se o material está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(material.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para excluir este material.' }
    }

    // Verifica se o material está em uso
    if (material.status === 'EM_USO') {
      return { success: false, message: 'Não é possível excluir um material que está em uso. Faça a devolução primeiro.' }
    }

    // Verifica se tem movimentações - oferece inativar
    if (material.movimentacoes.length > 0) {
      return { 
        success: false, 
        message: 'Este material possui histórico de movimentações e não pode ser excluído.', 
        podeInativar: true 
      }
    }

    // Exclui o material
    await prisma.material.delete({
      where: { id }
    })

    revalidatePath('/dashboard/materiais')
    revalidatePath('/dashboard')

    return { success: true, message: 'Material excluído com sucesso!' }
  } catch (error) {
    console.error('Erro ao excluir material:', error)
    return { success: false, message: 'Erro interno ao excluir material.' }
  }
}

export async function inativarMaterial(id: number): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para inativar materiais.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca o material
    const material = await prisma.material.findUnique({
      where: { id }
    })

    if (!material) {
      return { success: false, message: 'Material não encontrado.' }
    }

    // Verifica se o material está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(material.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para inativar este material.' }
    }

    // Verifica se o material está em uso
    if (material.status === 'EM_USO') {
      return { success: false, message: 'Não é possível inativar um material que está em uso. Faça a devolução primeiro.' }
    }

    // Inativa o material
    await prisma.material.update({
      where: { id },
      data: { status: 'INATIVO' }
    })

    revalidatePath('/dashboard/materiais')
    revalidatePath('/dashboard')

    return { success: true, message: 'Material inativado com sucesso!' }
  } catch (error) {
    console.error('Erro ao inativar material:', error)
    return { success: false, message: 'Erro interno ao inativar material.' }
  }
}

