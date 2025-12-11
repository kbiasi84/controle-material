'use server'

import { getSession } from '@/lib/auth'
import { getUnidadesVisiveis } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

const REGISTROS_POR_PAGINA = 15

interface DateRange {
    from?: Date
    to?: Date
}

/**
 * Busca materiais para o combobox (mínimo 3 caracteres)
 */
export async function searchMateriais(query: string) {
    const session = await getSession()
    if (!session || session.perfil !== 'GESTOR') {
        return []
    }

    if (query.length < 3) {
        return []
    }

    const unidadesVisiveis = await getUnidadesVisiveis(session)

    const materiais = await prisma.material.findMany({
        where: {
            unidadeId: { in: unidadesVisiveis },
            OR: [
                { codigoIdentificacao: { contains: query, mode: 'insensitive' } },
                { descricao: { contains: query, mode: 'insensitive' } },
                { tipo: { nome: { contains: query, mode: 'insensitive' } } },
            ],
        },
        include: {
            tipo: { select: { nome: true } },
        },
        take: 20,
        orderBy: { codigoIdentificacao: 'asc' },
    })

    return materiais.map((m) => ({
        id: m.id,
        codigoIdentificacao: m.codigoIdentificacao,
        descricao: m.descricao,
        tipoNome: m.tipo.nome,
    }))
}

/**
 * Busca usuários para o combobox (mínimo 3 caracteres)
 */
export async function searchUsuarios(query: string) {
    const session = await getSession()
    if (!session || session.perfil !== 'GESTOR') {
        return []
    }

    if (query.length < 3) {
        return []
    }

    const unidadesVisiveis = await getUnidadesVisiveis(session)

    const usuarios = await prisma.usuario.findMany({
        where: {
            unidadeId: { in: unidadesVisiveis },
            OR: [
                { identificacao: { contains: query, mode: 'insensitive' } },
                { nome: { contains: query, mode: 'insensitive' } },
            ],
        },
        include: {
            unidade: { select: { nome: true } },
        },
        take: 20,
        orderBy: { nome: 'asc' },
    })

    return usuarios.map((u) => ({
        id: u.id,
        identificacao: u.identificacao,
        nome: u.nome,
        unidadeNome: u.unidade.nome,
    }))
}

/**
 * Busca histórico de movimentações de um material específico
 */
export async function getRelatorioMaterial(
    materialId: number,
    dateRange?: DateRange,
    page: number = 1
) {
    const session = await getSession()
    if (!session || session.perfil !== 'GESTOR') {
        return { movimentacoes: [], total: 0, totalPaginas: 0 }
    }

    const unidadesVisiveis = await getUnidadesVisiveis(session)

    // Verifica se o material pertence às unidades visíveis
    const material = await prisma.material.findFirst({
        where: {
            id: materialId,
            unidadeId: { in: unidadesVisiveis },
        },
        include: {
            tipo: { select: { nome: true } },
            unidade: { select: { nome: true } },
        },
    })

    if (!material) {
        return { movimentacoes: [], total: 0, totalPaginas: 0, material: null }
    }

    // Monta where com filtro de data opcional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
        materialId,
    }

    if (dateRange?.from || dateRange?.to) {
        whereClause.dataRetirada = {}
        if (dateRange.from) {
            whereClause.dataRetirada.gte = dateRange.from
        }
        if (dateRange.to) {
            // Adiciona 1 dia para incluir o dia final completo
            const toDate = new Date(dateRange.to)
            toDate.setDate(toDate.getDate() + 1)
            whereClause.dataRetirada.lte = toDate
        }
    }

    const total = await prisma.movimentacao.count({ where: whereClause })
    const totalPaginas = Math.ceil(total / REGISTROS_POR_PAGINA)
    const skip = (page - 1) * REGISTROS_POR_PAGINA

    const movimentacoes = await prisma.movimentacao.findMany({
        where: whereClause,
        include: {
            usuario: { select: { id: true, nome: true, identificacao: true } },
            respRetirada: { select: { id: true, nome: true, identificacao: true } },
            respDevolucao: { select: { id: true, nome: true, identificacao: true } },
        },
        orderBy: { dataRetirada: 'desc' },
        skip,
        take: REGISTROS_POR_PAGINA,
    })

    return {
        material: {
            id: material.id,
            codigo: material.codigoIdentificacao,
            descricao: material.descricao,
            tipo: material.tipo.nome,
            unidade: material.unidade.nome,
        },
        movimentacoes: movimentacoes.map((m) => ({
            id: m.id,
            dataRetirada: m.dataRetirada.toISOString(),
            dataDevolucao: m.dataDevolucao?.toISOString() || null,
            obsRetirada: m.obsRetirada,
            obsDevolucao: m.obsDevolucao,
            usuario: m.usuario,
            respRetirada: m.respRetirada,
            respDevolucao: m.respDevolucao,
        })),
        total,
        totalPaginas,
        paginaAtual: page,
    }
}

/**
 * Busca histórico de movimentações de um usuário específico
 */
export async function getRelatorioUsuario(
    usuarioId: number,
    dateRange?: DateRange,
    page: number = 1
) {
    const session = await getSession()
    if (!session || session.perfil !== 'GESTOR') {
        return { movimentacoes: [], total: 0, totalPaginas: 0 }
    }

    const unidadesVisiveis = await getUnidadesVisiveis(session)

    // Verifica se o usuário pertence às unidades visíveis
    const usuario = await prisma.usuario.findFirst({
        where: {
            id: usuarioId,
            unidadeId: { in: unidadesVisiveis },
        },
        include: {
            unidade: { select: { nome: true } },
        },
    })

    if (!usuario) {
        return { movimentacoes: [], total: 0, totalPaginas: 0, usuario: null }
    }

    // Monta where com filtro de data opcional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
        usuarioId,
    }

    if (dateRange?.from || dateRange?.to) {
        whereClause.dataRetirada = {}
        if (dateRange.from) {
            whereClause.dataRetirada.gte = dateRange.from
        }
        if (dateRange.to) {
            const toDate = new Date(dateRange.to)
            toDate.setDate(toDate.getDate() + 1)
            whereClause.dataRetirada.lte = toDate
        }
    }

    const total = await prisma.movimentacao.count({ where: whereClause })
    const totalPaginas = Math.ceil(total / REGISTROS_POR_PAGINA)
    const skip = (page - 1) * REGISTROS_POR_PAGINA

    const movimentacoes = await prisma.movimentacao.findMany({
        where: whereClause,
        include: {
            material: {
                select: {
                    id: true,
                    codigoIdentificacao: true,
                    descricao: true,
                    tipo: { select: { nome: true } },
                },
            },
            respRetirada: { select: { id: true, nome: true, identificacao: true } },
            respDevolucao: { select: { id: true, nome: true, identificacao: true } },
        },
        orderBy: { dataRetirada: 'desc' },
        skip,
        take: REGISTROS_POR_PAGINA,
    })

    return {
        usuario: {
            id: usuario.id,
            identificacao: usuario.identificacao,
            nome: usuario.nome,
            unidade: usuario.unidade.nome,
        },
        movimentacoes: movimentacoes.map((m) => ({
            id: m.id,
            dataRetirada: m.dataRetirada.toISOString(),
            dataDevolucao: m.dataDevolucao?.toISOString() || null,
            obsRetirada: m.obsRetirada,
            obsDevolucao: m.obsDevolucao,
            material: {
                id: m.material.id,
                codigo: m.material.codigoIdentificacao,
                descricao: m.material.descricao,
                tipo: m.material.tipo.nome,
            },
            respRetirada: m.respRetirada,
            respDevolucao: m.respDevolucao,
        })),
        total,
        totalPaginas,
        paginaAtual: page,
    }
}

/**
 * Busca materiais de uma unidade específica
 */
export async function getMateriaisPorUnidade(
    unidadeId: number,
    busca: string = '',
    status: string = '',
    page: number = 1
) {
    const session = await getSession()
    if (!session || session.perfil !== 'GESTOR') {
        return { materiais: [], total: 0, totalPaginas: 0, unidade: null }
    }

    const unidadesVisiveis = await getUnidadesVisiveis(session)

    // Verifica se a unidade pertence às unidades visíveis
    if (!unidadesVisiveis.includes(unidadeId)) {
        return { materiais: [], total: 0, totalPaginas: 0, unidade: null }
    }

    // Busca dados da unidade
    const unidade = await prisma.unidade.findUnique({
        where: { id: unidadeId },
        select: { id: true, nome: true },
    })

    if (!unidade) {
        return { materiais: [], total: 0, totalPaginas: 0, unidade: null }
    }

    // Monta where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
        unidadeId,
    }

    // Filtro por status
    if (status) {
        whereClause.status = status
    }

    // Filtro por busca (mínimo 3 caracteres)
    if (busca.length >= 3) {
        whereClause.OR = [
            { codigoIdentificacao: { contains: busca, mode: 'insensitive' } },
            { descricao: { contains: busca, mode: 'insensitive' } },
            { tipo: { nome: { contains: busca, mode: 'insensitive' } } },
        ]
    }

    const total = await prisma.material.count({ where: whereClause })
    const totalPaginas = Math.ceil(total / REGISTROS_POR_PAGINA)
    const skip = (page - 1) * REGISTROS_POR_PAGINA

    const materiais = await prisma.material.findMany({
        where: whereClause,
        include: {
            tipo: { select: { nome: true } },
            movimentacoes: {
                where: { dataDevolucao: null },
                include: {
                    usuario: { select: { id: true, nome: true, identificacao: true } },
                },
                take: 1,
                orderBy: { dataRetirada: 'desc' },
            },
        },
        orderBy: { codigoIdentificacao: 'asc' },
        skip,
        take: REGISTROS_POR_PAGINA,
    })

    return {
        unidade: {
            id: unidade.id,
            nome: unidade.nome,
        },
        materiais: materiais.map((m) => ({
            id: m.id,
            codigo: m.codigoIdentificacao,
            descricao: m.descricao,
            tipo: m.tipo.nome,
            status: m.status,
            usuarioEmUso: m.movimentacoes[0]?.usuario || null,
        })),
        total,
        totalPaginas,
        paginaAtual: page,
    }
}
