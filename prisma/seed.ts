import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // --- UNIDADE RAIZ ---
  console.log('\n🏛️ Criando unidade raiz...')

  // Nível 1: CPRV (Topo da hierarquia)
  const cprv = await prisma.unidade.create({
    data: {
      nome: 'CPRV',
      sigla: 'CPRV',
      endereco: 'Comando de Polciamento Rodoviário',
    },
  })
  console.log(`  ✅ ${cprv.nome} (id: ${cprv.id})`)

  // --- USUÁRIOS ---
  console.log('\n👥 Criando Usuário Gestor da unidade raiz...')

  const senhaHash = await bcrypt.hash('123456', 10)

  // Configuração de usuários por unidade
  const usuariosPorUnidade = [
    // CPRv - GESTOR - Inicial no banco de dados que vai começar os cadastros
    {
      unidade: cprv, usuarios: [
        { id: '117241-7', nome: 'CB PM KLEYTON', perfil: 'GESTOR', email: 'biasi.kleyton@gmail.com' },
      ]
    },
  ]

  for (const config of usuariosPorUnidade) {
    for (const usr of config.usuarios) {
      await prisma.usuario.create({
        data: {
          identificacao: usr.id,
          nome: usr.nome,
          email: usr.email,
          senha: senhaHash,
          perfil: usr.perfil as 'GESTOR' | 'CONTROLADOR' | 'USUARIO',
          unidadeId: config.unidade.id,
        },
      })
      console.log(`  ✅ ${usr.id} (${usr.perfil}) → ${config.unidade.nome} | ${usr.email}`)
    }
  }

  console.log('\n🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
