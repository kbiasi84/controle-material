'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

interface CriarUsuarioParams {
  identificacao: string
  nome: string
  email: string
  senha: string
  perfil: 'USUARIO' | 'CONTROLADOR' | 'GESTOR'
  unidadeId: number
}

interface EditarUsuarioParams {
  id: number
  identificacao: string
  nome: string
  email: string
  perfil: 'USUARIO' | 'CONTROLADOR' | 'GESTOR'
  unidadeId: number
}

export async function criarUsuario(params: CriarUsuarioParams): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para cadastrar usuários.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  // Verifica se a unidade está dentro do escopo visível
  if (!permissoes.unidadesVisiveis.includes(params.unidadeId)) {
    return { success: false, message: 'Você não tem permissão para cadastrar usuários nesta unidade.' }
  }

  try {
    // Verifica se a identificação já existe
    const existente = await prisma.usuario.findUnique({
      where: { identificacao: params.identificacao }
    })

    if (existente) {
      return { success: false, message: 'Já existe um usuário com esta identificação.' }
    }

    // Verifica se o email já existe
    const emailExistente = await prisma.usuario.findUnique({
      where: { email: params.email }
    })

    if (emailExistente) {
      return { success: false, message: 'Já existe um usuário com este email.' }
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(params.senha, 10)

    // Cria o usuário
    await prisma.usuario.create({
      data: {
        identificacao: params.identificacao,
        nome: params.nome,
        email: params.email,
        senha: senhaHash,
        perfil: params.perfil,
        unidadeId: params.unidadeId,
      }
    })

    revalidatePath('/dashboard/usuarios')

    return { success: true, message: 'Usuário cadastrado com sucesso!' }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { success: false, message: 'Erro interno ao cadastrar usuário.' }
  }
}

export async function editarUsuario(params: EditarUsuarioParams): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para editar usuários.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id }
    })

    if (!usuario) {
      return { success: false, message: 'Usuário não encontrado.' }
    }

    // Verifica se o usuário está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(usuario.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para editar este usuário.' }
    }

    // Verifica se a nova unidade está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(params.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para mover o usuário para esta unidade.' }
    }

    // Verifica se a nova identificação já existe (se foi alterada)
    if (params.identificacao !== usuario.identificacao) {
      const existente = await prisma.usuario.findUnique({
        where: { identificacao: params.identificacao }
      })

      if (existente) {
        return { success: false, message: 'Já existe um usuário com esta identificação.' }
      }
    }

    // Verifica se o novo email já existe (se foi alterado)
    if (params.email !== usuario.email) {
      const emailExistente = await prisma.usuario.findUnique({
        where: { email: params.email }
      })

      if (emailExistente) {
        return { success: false, message: 'Já existe um usuário com este email.' }
      }
    }

    // Atualiza o usuário
    await prisma.usuario.update({
      where: { id: params.id },
      data: {
        identificacao: params.identificacao,
        nome: params.nome,
        email: params.email,
        perfil: params.perfil,
        unidadeId: params.unidadeId,
      }
    })

    revalidatePath('/dashboard/usuarios')

    return { success: true, message: 'Usuário atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao editar usuário:', error)
    return { success: false, message: 'Erro interno ao editar usuário.' }
  }
}

export async function excluirUsuario(id: number): Promise<{ success: boolean; message: string; podeInativar?: boolean }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para excluir usuários.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca o usuário com movimentações
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        movimentacoesFeitas: true,
        retiradasAutorizadas: true,
        devolucoesAutorizadas: true,
      }
    })

    if (!usuario) {
      return { success: false, message: 'Usuário não encontrado.' }
    }

    // Verifica se o usuário está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(usuario.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para excluir este usuário.' }
    }

    // Não permite excluir a si mesmo
    if (usuario.id === session.userId) {
      return { success: false, message: 'Você não pode excluir sua própria conta.' }
    }

    // Verifica se tem movimentações vinculadas - oferece inativar
    const temMovimentacoes =
      usuario.movimentacoesFeitas.length > 0 ||
      usuario.retiradasAutorizadas.length > 0 ||
      usuario.devolucoesAutorizadas.length > 0

    if (temMovimentacoes) {
      return {
        success: false,
        message: 'Este usuário possui histórico de movimentações e não pode ser excluído.',
        podeInativar: true
      }
    }

    // Exclui o usuário
    await prisma.usuario.delete({
      where: { id }
    })

    revalidatePath('/dashboard/usuarios')

    return { success: true, message: 'Usuário excluído com sucesso!' }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return { success: false, message: 'Erro interno ao excluir usuário.' }
  }
}

export async function inativarUsuario(id: number): Promise<{ success: boolean; message: string }> {
  const session = await getSession()

  if (!session) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  if (session.perfil !== 'GESTOR') {
    return { success: false, message: 'Você não tem permissão para inativar usuários.' }
  }

  const permissoes = await getPermissoesUsuario(session)

  try {
    // Busca o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!usuario) {
      return { success: false, message: 'Usuário não encontrado.' }
    }

    // Verifica se o usuário está no escopo visível
    if (!permissoes.unidadesVisiveis.includes(usuario.unidadeId)) {
      return { success: false, message: 'Você não tem permissão para inativar este usuário.' }
    }

    // Não permite inativar a si mesmo
    if (usuario.id === session.userId) {
      return { success: false, message: 'Você não pode inativar sua própria conta.' }
    }

    // Inativa o usuário
    await prisma.usuario.update({
      where: { id },
      data: { ativo: false }
    })

    revalidatePath('/dashboard/usuarios')

    return { success: true, message: 'Usuário inativado com sucesso!' }
  } catch (error) {
    console.error('Erro ao inativar usuário:', error)
    return { success: false, message: 'Erro interno ao inativar usuário.' }
  }
}

