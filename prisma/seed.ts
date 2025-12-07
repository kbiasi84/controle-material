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
  
  const unidades = ['BOP 320/3', 'BOP 320/2', '3 CIA']
  
  for (const nome of unidades) {
    await prisma.unidade.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
  }

  console.log(`✅ ${unidades.length} Unidades criadas`)

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
