import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TransferenciasHistorico } from '@/components/admin/transferencias-historico'

const REGISTROS_POR_PAGINA = 15

interface PageProps {
    searchParams: Promise<{
        busca?: string
        pagina?: string
    }>
}

export default async function TransferenciasPage({ searchParams }: PageProps) {
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

    const permissoes = await getPermissoesUsuario(session)

    // Monta o where clause para busca
    const whereClause: any = {
        OR: [
            { origemId: { in: permissoes.unidadesVisiveis } },
            { destinoId: { in: permissoes.unidadesVisiveis } },
        ]
    }

    // Filtro por busca (mínimo 3 caracteres)
    if (busca.length >= 3) {
        whereClause.AND = [
            {
                OR: [
                    { material: { codigoIdentificacao: { contains: busca, mode: 'insensitive' } } },
                    { material: { descricao: { contains: busca, mode: 'insensitive' } } },
                    { origem: { nome: { contains: busca, mode: 'insensitive' } } },
                    { destino: { nome: { contains: busca, mode: 'insensitive' } } },
                    { responsavel: { nome: { contains: busca, mode: 'insensitive' } } },
                ]
            }
        ]
    }

    // Conta total de registros (para paginação)
    const totalRegistros = await prisma.transferencia.count({
        where: whereClause,
    })

    // Calcula paginação
    const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)
    const skip = (paginaAtual - 1) * REGISTROS_POR_PAGINA

    // Busca transferências com paginação
    const transferencias = await prisma.transferencia.findMany({
        where: whereClause,
        include: {
            material: {
                include: { tipo: true }
            },
            origem: true,
            destino: true,
            responsavel: true,
        },
        orderBy: { dataTransferencia: 'desc' },
        skip,
        take: REGISTROS_POR_PAGINA,
    })

    return (
        <TransferenciasHistorico
            transferencias={transferencias.map(t => ({
                id: t.id,
                dataTransferencia: t.dataTransferencia.toISOString(),
                observacao: t.observacao,
                material: {
                    codigoIdentificacao: t.material.codigoIdentificacao,
                    descricao: t.material.descricao,
                    tipo: t.material.tipo.nome,
                },
                origem: t.origem.nome,
                destino: t.destino.nome,
                responsavel: t.responsavel.nome,
            }))}
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            registrosPorPagina={REGISTROS_POR_PAGINA}
        />
    )
}
