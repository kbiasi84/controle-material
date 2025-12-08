import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Perfil } from '@prisma/client'

// Chave secreta para JWT - usar variável de ambiente em produção
const SECRET_KEY = process.env.JWT_SECRET || 'scmp-dev-secret-key-change-in-production'
const encodedKey = new TextEncoder().encode(SECRET_KEY)

// Configurações do token
const TOKEN_EXPIRATION = '7d' // 7 dias
const COOKIE_NAME = 'session'

// Tipo do payload do token
export interface SessionPayload {
  userId: number
  identificacao: string
  nome: string
  perfil: Perfil
  unidadeId: number
  unidadeNome: string
}

/**
 * Cria um token JWT com os dados do usuário
 */
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(encodedKey)
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * Cria o cookie de sessão com o token JWT
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload)
  const cookieStore = await cookies()
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
  })
}

/**
 * Obtém a sessão atual do cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  
  if (!token) return null
  
  return verifyToken(token)
}

/**
 * Remove o cookie de sessão (logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

