import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { Perfil } from '@prisma/client'

const SECRET_KEY = process.env.JWT_SECRET || 'scmp-dev-secret-key-change-in-production'
const encodedKey = new TextEncoder().encode(SECRET_KEY)

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = ['/login', '/api/auth']

// Rotas que requerem perfil GESTOR
const GESTOR_ONLY_ROUTES = ['/admin']

// Rotas que requerem CONTROLADOR ou GESTOR
const CONTROLADOR_ROUTES = ['/dashboard/devolucao']

interface SessionPayload {
  userId: number
  identificacao: string
  nome: string
  perfil: Perfil
  unidadeId: number
  unidadeNome: string
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas - libera acesso
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Arquivos estáticos - libera acesso
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verifica token de sessão
  const token = request.cookies.get('session')?.value

  if (!token) {
    // Sem token - redireciona para login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verifyToken(token)

  if (!session) {
    // Token inválido - redireciona para login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }

  const { perfil } = session

  // Verifica rotas exclusivas de GESTOR (/admin/*)
  if (GESTOR_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    if (perfil !== 'GESTOR') {
      // Não é GESTOR - redireciona para dashboard com mensagem
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
    }
  }

  // Verifica rotas de CONTROLADOR+ (/dashboard/devolucao)
  if (CONTROLADOR_ROUTES.some(route => pathname.startsWith(route))) {
    if (perfil !== 'CONTROLADOR' && perfil !== 'GESTOR') {
      // Não tem permissão - redireciona para dashboard
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
    }
  }

  // Usuário autenticado e com permissão - libera acesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

