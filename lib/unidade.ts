import { prisma } from './prisma'

/**
 * Busca a árvore hierárquica de uma unidade (do filho até a raiz)
 * Retorna array de nomes: ["BOP 320/3", "3º PEL", "3ª CIA", "3º BPRv"]
 */
export async function getHierarquiaUnidade(unidadeId: number): Promise<string[]> {
  const hierarquia: string[] = []
  
  let currentId: number | null = unidadeId
  
  // Limite de 10 níveis para evitar loops infinitos
  let maxIterations = 10
  
  while (currentId !== null && maxIterations > 0) {
    const unidade = await prisma.unidade.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        nome: true,
        sigla: true,
        unidadeSuperiorId: true,
      },
    })
    
    if (!unidade) break
    
    // Usa sigla se disponível, senão usa nome
    hierarquia.push(unidade.sigla || unidade.nome)
    currentId = unidade.unidadeSuperiorId
    maxIterations--
  }
  
  return hierarquia
}

/**
 * Retorna a hierarquia formatada como string
 * Ex: "BOP 320/3 › 3º PEL › 3ª CIA › 3º BPRv"
 */
export async function getHierarquiaFormatada(unidadeId: number): Promise<string> {
  const hierarquia = await getHierarquiaUnidade(unidadeId)
  return hierarquia.join(' › ')
}

