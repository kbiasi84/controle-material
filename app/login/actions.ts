'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { ResetEmail } from '@/components/emails/reset-email'

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

    // Verifica se o usuário está ativo
    if (!usuario.ativo) {
      return { error: 'Usuário inativo. Entre em contato com o administrador.' }
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

// ========== PASSWORD RESET ACTIONS ==========

export interface PasswordResetState {
  error?: string
  success?: boolean
  message?: string
}

/**
 * Solicita recuperação de senha - gera token e envia email via Resend
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetState> {
  if (!email || !email.includes('@')) {
    return { error: 'Informe um e-mail válido.' }
  }

  try {
    // Busca usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    })

    // Mesmo que não encontre, retornamos sucesso (segurança - não revelar se email existe)
    if (!usuario) {
      return {
        success: true,
        message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação. Confira na caixa de spam!'
      }
    }

    // Gera token seguro usando crypto
    const token = crypto.randomBytes(32).toString('hex')

    // Validade: 1 hora a partir de agora
    const validade = new Date(Date.now() + 60 * 60 * 1000)

    // Atualiza o usuário com token e validade
    await prisma.usuario.update({
      where: { email },
      data: {
        resetToken: token,
        resetExpires: validade,
      },
    })

    // Monta o link de recuperação
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login/reset-password?token=${token}`

    // Envia email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'SCMP <onboarding@resend.dev>',
      to: email,
      subject: 'Recuperação de Senha - SCMP',
      react: ResetEmail({ resetLink, userName: usuario.nome }),
    })

    console.log(`📧 Email de recuperação enviado para: ${email}`)

    return {
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação. Confira na caixa de spam!'
    }
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error)
    return { error: 'Erro interno. Tente novamente.' }
  }
}

/**
 * Reseta a senha usando o token recebido
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetState> {
  if (!token) {
    return { error: 'Token inválido.' }
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: 'A senha deve ter no mínimo 6 caracteres.' }
  }

  try {
    // Busca usuário pelo token
    const usuario = await prisma.usuario.findUnique({
      where: { resetToken: token },
    })

    if (!usuario) {
      return { error: 'Token inválido ou expirado.' }
    }

    // Verifica se o token ainda é válido
    if (!usuario.resetExpires || usuario.resetExpires < new Date()) {
      return { error: 'Token expirado. Solicite uma nova recuperação de senha.' }
    }

    // Gera hash da nova senha
    const senhaHash = await bcrypt.hash(newPassword, 10)

    // Atualiza senha e limpa tokens
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaHash,
        resetToken: null,
        resetExpires: null,
      },
    })

    console.log(`✅ Senha alterada com sucesso para o usuário: ${usuario.identificacao}`)

    return {
      success: true,
      message: 'Senha alterada com sucesso! Você já pode fazer login.'
    }
  } catch (error) {
    console.error('Erro ao resetar senha:', error)
    return { error: 'Erro interno. Tente novamente.' }
  }
}
