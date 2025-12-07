import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // --- UNIDADES ---
  console.log('📍 Criando Unidades...')
  
  const unidadeBOP3203 = await prisma.unidade.upsert({
    where: { id: 'unidade-bop-320-3' },
    update: {},
    create: {
      id: 'unidade-bop-320-3',
      nome: 'BOP 320/3',
      endereco: null,
    },
  })

  const unidadeBOP3202 = await prisma.unidade.upsert({
    where: { id: 'unidade-bop-320-2' },
    update: {},
    create: {
      id: 'unidade-bop-320-2',
      nome: 'BOP 320/2',
      endereco: null,
    },
  })

  const unidade3CIA = await prisma.unidade.upsert({
    where: { id: 'unidade-3-cia' },
    update: {},
    create: {
      id: 'unidade-3-cia',
      nome: '3 CIA',
      endereco: null,
    },
  })

  console.log(`✅ Unidades criadas: ${unidadeBOP3203.nome}, ${unidadeBOP3202.nome}, ${unidade3CIA.nome}`)

  // --- TIPOS DE MATERIAL ---
  console.log('📦 Criando Tipos de Material...')

  const tiposMaterial = [
    'Etilômetro',
    'Taser',
    'Viatura',
    'Rádio Comunicador',
    'Colete Balístico',
    'Algema',
    'Lanterna Tática',
    'Câmera Corporal',
    'Notebook',
    'Tablet',
    'Drone',
    'Binóculo',
    'Celular',
    'Armamento',
    'Impressora',
  ]

  for (const nome of tiposMaterial) {
    await prisma.tipoMaterial.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
  }

  console.log(`✅ ${tiposMaterial.length} Tipos de Material criados`)

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

