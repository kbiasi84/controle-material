/**
 * Script para corrigir materiais EM_USO sem movimentação associada
 * 
 * Execução: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/fix-movimentacoes.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL!

async function main() {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log('🔧 Iniciando correção de movimentações...\n')

  // 1. Buscar materiais EM_USO
  const materiaisEmUso = await prisma.material.findMany({
    where: { status: 'EM_USO' },
    include: {
      tipo: true,
      unidade: true,
      movimentacoes: {
        where: { dataDevolucao: null },
        take: 1,
      }
    }
  })

  console.log(`📦 Encontrados ${materiaisEmUso.length} materiais com status EM_USO`)

  // 2. Filtrar apenas os que NÃO têm movimentação ativa
  const materiaisSemMovimentacao = materiaisEmUso.filter(m => m.movimentacoes.length === 0)

  console.log(`⚠️  ${materiaisSemMovimentacao.length} materiais sem movimentação associada\n`)

  if (materiaisSemMovimentacao.length === 0) {
    console.log('✅ Todos os materiais já têm movimentação! Nada a corrigir.')
    await prisma.$disconnect()
    await pool.end()
    return
  }

  // 3. Buscar o usuário "Sd. Pereira" para associar (ou outro padrão)
  const usuarioPadrao = await prisma.usuario.findFirst({
    where: {
      OR: [
        { identificacao: 'sd.pereira' },
        { perfil: 'USUARIO' }
      ]
    },
    orderBy: { id: 'asc' }
  })

  if (!usuarioPadrao) {
    console.log('❌ Nenhum usuário encontrado para associar!')
    await prisma.$disconnect()
    await pool.end()
    return
  }

  console.log(`👤 Usuário padrão para associação: ${usuarioPadrao.nome} (${usuarioPadrao.identificacao})\n`)

  // 4. Criar movimentações para cada material
  for (const material of materiaisSemMovimentacao) {
    console.log(`📝 Criando movimentação para: ${material.descricao || material.tipo.nome} (${material.codigoIdentificacao})`)
    
    await prisma.movimentacao.create({
      data: {
        materialId: material.id,
        usuarioId: usuarioPadrao.id,
        respRetiradaId: usuarioPadrao.id,
        dataRetirada: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
        obsRetirada: null,
      }
    })

    // Limpar observação redundante se existir
    if (material.observacaoAtual?.toLowerCase().startsWith('em uso por')) {
      await prisma.material.update({
        where: { id: material.id },
        data: { observacaoAtual: null }
      })
      console.log(`   🧹 Observação redundante removida`)
    }
  }

  console.log(`\n✅ ${materiaisSemMovimentacao.length} movimentações criadas com sucesso!`)

  // 5. Relatório final
  console.log('\n📊 Resumo:')
  for (const material of materiaisSemMovimentacao) {
    console.log(`   • ${material.descricao || material.tipo.nome} → ${usuarioPadrao.nome}`)
  }

  await prisma.$disconnect()
  await pool.end()
}

main()
  .catch(async (e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })

