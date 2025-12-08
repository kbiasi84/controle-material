'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export interface LoginState {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identificacao = formData.get('identificacao') as string
  const senha = formData.get('senha') as string

  // Validação básica
  if (!identificacao || !senha) {
    return { error: 'Preencha todos os campos.' }
  }

  try {
    // Busca o usuário no banco
    const usuario = await prisma.usuario.findUnique({
      where: { identificacao },
      include: { unidade: true },
    })

    if (!usuario) {
      return { error: 'Usuário ou senha inválidos.' }
    }

    // Compara a senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      return { error: 'Usuário ou senha inválidos.' }
    }

    // Cria a sessão
    await createSession({
      userId: usuario.id,
      identificacao: usuario.identificacao,
      nome: usuario.nome,
      perfil: usuario.perfil,
      unidadeId: usuario.unidadeId,
      unidadeNome: usuario.unidade.nome,
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return { error: 'Erro interno. Tente novamente.' }
  }

  // Redireciona para o dashboard
  redirect('/dashboard')
}

