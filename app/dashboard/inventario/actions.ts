'use server'

import { getSession } from '@/lib/auth'
import { getUnidadesVisiveis } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

const REGISTROS_POR_PAGINA = 15

/**
 * Busca materiais de uma unidade específica para conferência de inventário
 */
export async function getMateriaisPorUnidade(
    unidadeId: number,
    busca: string = '',
    status: string = '',
    page: number = 1
) {
    const session = await getSession()
    if (!session || (session.perfil !== 'GESTOR' && session.perfil !== 'CONTROLADOR')) {
        return { materiais: [], total: 0, totalPaginas: 0, paginaAtual: 1, unidade: null, quantitativoPorTipo: [] }
    }

    const unidadesVisiveis = await getUnidadesVisiveis(session)

    // Verifica se a unidade pertence às unidades visíveis
    if (!unidadesVisiveis.includes(unidadeId)) {
        return { materiais: [], total: 0, totalPaginas: 0, paginaAtual: 1, unidade: null, quantitativoPorTipo: [] }
    }

    // Busca dados da unidade
    const unidade = await prisma.unidade.findUnique({
        where: { id: unidadeId },
        select: { id: true, nome: true },
    })

    if (!unidade) {
        return { materiais: [], total: 0, totalPaginas: 0, paginaAtual: 1, unidade: null, quantitativoPorTipo: [] }
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
        orderBy: [
            { tipo: { nome: 'asc' } },
            { descricao: 'asc' },
        ],
        skip,
        take: REGISTROS_POR_PAGINA,
    })

    // Busca quantitativo por tipo (sem considerar paginação nem busca por texto)
    const contagemPorTipo = await prisma.material.groupBy({
        by: ['tipoId'],
        where: {
            unidadeId,
            ...(status ? { status: status as 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO' } : {}),
        },
        _count: true,
    })

    // Busca os nomes dos tipos
    const tiposIds = contagemPorTipo.map(c => c.tipoId)
    const tipos = await prisma.tipoMaterial.findMany({
        where: { id: { in: tiposIds } },
        select: { id: true, nome: true },
    })

    const tiposMap = new Map(tipos.map(t => [t.id, t.nome]))

    const quantitativoPorTipo = contagemPorTipo
        .map(c => ({
            tipo: tiposMap.get(c.tipoId) || 'Desconhecido',
            quantidade: c._count,
        }))
        .sort((a, b) => a.tipo.localeCompare(b.tipo))

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
        quantitativoPorTipo,
        total,
        totalPaginas,
        paginaAtual: page,
    }
}

/**
 * Busca todos os materiais de uma unidade (sem paginação) para impressão
 */
export async function getMateriaisParaImpressao(
    unidadeId: number,
    status: string = ''
) {
    const session = await getSession()
    if (!session || (session.perfil !== 'GESTOR' && session.perfil !== 'CONTROLADOR')) {
        return { materiais: [], unidade: null, quantitativoPorTipo: [] }
    }

    const unidadesVisiveis = await getUnidadesVisiveis(session)

    // Verifica se a unidade pertence às unidades visíveis
    if (!unidadesVisiveis.includes(unidadeId)) {
        return { materiais: [], unidade: null, quantitativoPorTipo: [] }
    }

    // Busca dados da unidade
    const unidade = await prisma.unidade.findUnique({
        where: { id: unidadeId },
        select: { id: true, nome: true },
    })

    if (!unidade) {
        return { materiais: [], unidade: null, quantitativoPorTipo: [] }
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
        orderBy: [
            { tipo: { nome: 'asc' } },
            { descricao: 'asc' },
        ],
    })

    // Busca quantitativo por tipo
    const contagemPorTipo = await prisma.material.groupBy({
        by: ['tipoId'],
        where: {
            unidadeId,
            ...(status ? { status: status as 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO' } : {}),
        },
        _count: true,
    })

    // Busca os nomes dos tipos
    const tiposIds = contagemPorTipo.map(c => c.tipoId)
    const tipos = await prisma.tipoMaterial.findMany({
        where: { id: { in: tiposIds } },
        select: { id: true, nome: true },
    })

    const tiposMap = new Map(tipos.map(t => [t.id, t.nome]))

    const quantitativoPorTipo = contagemPorTipo
        .map(c => ({
            tipo: tiposMap.get(c.tipoId) || 'Desconhecido',
            quantidade: c._count,
        }))
        .sort((a, b) => a.tipo.localeCompare(b.tipo))

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
        quantitativoPorTipo,
        total: materiais.length,
    }
}
