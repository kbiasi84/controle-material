import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TiposMaterialGestao } from '@/components/admin/tipos-material-gestao'

const REGISTROS_POR_PAGINA = 15

interface PageProps {
    searchParams: Promise<{
        busca?: string
        pagina?: string
    }>
}

export default async function GestaoTiposMaterialPage({ searchParams }: PageProps) {
    const session = await getSession()

    if (!session) {
        return null
    }

    // Verifica se o usuário tem permissão
    if (session.perfil !== 'GESTOR') {
        redirect('/dashboard?error=unauthorized')
    }

    const params = await searchParams
    const busca = params.busca || ''
    const paginaAtual = parseInt(params.pagina || '1')

    // Monta o where clause para busca
    const whereClause: any = {}

    // Filtro por busca (mínimo 3 caracteres)
    if (busca.length >= 3) {
        whereClause.nome = { contains: busca, mode: 'insensitive' }
    }

    // Conta total de registros (para paginação)
    const totalRegistros = await prisma.tipoMaterial.count({
        where: whereClause,
    })

    // Calcula paginação
    const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)
    const skip = (paginaAtual - 1) * REGISTROS_POR_PAGINA

    // Busca tipos de material com paginação e contagem de materiais
    const tipos = await prisma.tipoMaterial.findMany({
        where: whereClause,
        include: {
            _count: {
                select: { materiais: true }
            }
        },
        orderBy: { nome: 'asc' },
        skip,
        take: REGISTROS_POR_PAGINA,
    })

    return (
        <TiposMaterialGestao
            tipos={tipos.map(t => ({
                id: t.id,
                nome: t.nome,
                _count: { materiais: t._count.materiais }
            }))}
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            registrosPorPagina={REGISTROS_POR_PAGINA}
        />
    )
}
