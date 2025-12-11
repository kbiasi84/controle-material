'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'

// ============ TIPOS ============

interface UnidadeComCaminho {
    id: number
    nome: string
    caminhoCompleto: string
}

// ============ FUNÇÕES AUXILIARES ============

/**
 * Busca todas as unidades e cria um mapa para acesso rápido
 */
async function getUnidadesMap() {
    const todasUnidades = await prisma.unidade.findMany({
        select: {
            id: true,
            nome: true,
            unidadeSuperiorId: true,
        },
    })

    return new Map(todasUnidades.map(u => [u.id, u]))
}

/**
 * Monta o caminho completo de uma unidade (recursivo para cima)
 * @param unidadeId - ID da unidade
 * @param unidadeMap - Mapa de unidades para acesso rápido
 * @returns Array de nomes do filho até a raiz: ["BOP 320/3", "3º PEL", "3ª CIA", "3º BPRv", "CPRV"]
 */
function montarHierarquia(
    unidadeId: number,
    unidadeMap: Map<number, { id: number; nome: string; unidadeSuperiorId: number | null }>
): string[] {
    const partes: string[] = []
    let currentId: number | null = unidadeId

    // Limita a 10 níveis para evitar loop infinito
    let nivel = 0
    while (currentId !== null && nivel < 10) {
        const unidade = unidadeMap.get(currentId)
        if (!unidade) break

        partes.push(unidade.nome)
        currentId = unidade.unidadeSuperiorId
        nivel++
    }

    return partes
}

// ============ FUNÇÕES EXPORTADAS ============

/**
 * Busca a hierarquia de uma unidade (do filho até a raiz)
 * Usado no Header para exibir o breadcrumb da unidade do usuário
 * 
 * @param unidadeId - ID da unidade
 * @returns Array de nomes: ["BOP 320/3", "3º PEL", "3ª CIA", "3º BPRv", "CPRV"]
 */
export async function getHierarquiaUnidade(unidadeId: number): Promise<string[]> {
    const unidadeMap = await getUnidadesMap()
    return montarHierarquia(unidadeId, unidadeMap)
}

/**
 * Retorna a hierarquia formatada como string
 * Ex: "BOP 320/3 › 3º PEL › 3ª CIA › 3º BPRv"
 */
export async function getHierarquiaFormatada(unidadeId: number): Promise<string> {
    const hierarquia = await getHierarquiaUnidade(unidadeId)
    return hierarquia.join(' › ')
}

/**
 * Busca todas as unidades visíveis para o usuário logado
 * com o caminho completo (breadcrumbs) para uso em selects
 * 
 * Exemplo de caminho: "CPRV > 3º BPRv > 1ª CIA > 1º PEL > BOP 320/3"
 * 
 * @returns Lista de unidades ordenadas alfabeticamente pelo caminho completo
 */
export async function getUnidadesParaSeletor(): Promise<UnidadeComCaminho[]> {
    const session = await getSession()

    if (!session) {
        return []
    }

    const permissoes = await getPermissoesUsuario(session)
    const unidadeMap = await getUnidadesMap()

    // Filtra apenas as unidades visíveis e monta o caminho
    const unidadesComCaminho: UnidadeComCaminho[] = []

    for (const [id, unidade] of unidadeMap.entries()) {
        if (permissoes.unidadesVisiveis.includes(id)) {
            const hierarquia = montarHierarquia(id, unidadeMap)
            // Inverte para mostrar da raiz até o filho: "CPRV > 3º BPRv > ... > BOP"
            hierarquia.reverse()

            unidadesComCaminho.push({
                id,
                nome: unidade.nome,
                caminhoCompleto: hierarquia.join(' > '),
            })
        }
    }

    // Ordena alfabeticamente pelo caminho completo
    unidadesComCaminho.sort((a, b) => a.caminhoCompleto.localeCompare(b.caminhoCompleto, 'pt-BR'))

    return unidadesComCaminho
}
