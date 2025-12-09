import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas CONTROLADOR e GESTOR podem buscar outros usuários
    if (session.perfil !== 'CONTROLADOR' && session.perfil !== 'GESTOR') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json({ usuarios: [] })
    }

    // Busca usuários por nome ou identificação
    // Para CONTROLADOR: apenas da mesma unidade
    // Para GESTOR: todas as unidades visíveis
    const usuarios = await prisma.usuario.findMany({
      where: {
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { identificacao: { contains: query, mode: 'insensitive' } },
        ],
        // Não inclui o próprio usuário na busca
        id: { not: session.userId },
      },
      include: {
        unidade: {
          select: {
            nome: true
          }
        }
      },
      orderBy: { nome: 'asc' },
      take: 20,
    })

    return NextResponse.json({ 
      usuarios: usuarios.map(u => ({
        id: u.id,
        nome: u.nome,
        identificacao: u.identificacao,
        unidade: {
          nome: u.unidade.nome
        }
      }))
    })

  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

