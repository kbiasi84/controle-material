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

  // Limpar dados existentes (na ordem correta por causa das FKs)
  console.log('🗑️ Limpando dados existentes...')
  await prisma.movimentacao.deleteMany()
  await prisma.transferencia.deleteMany()
  await prisma.material.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.unidade.deleteMany()
  await prisma.tipoMaterial.deleteMany()
  console.log('  ✅ Dados limpos')

  // --- HIERARQUIA DE UNIDADES ---
  console.log('\n🏛️ Criando Hierarquia de Unidades...')

  // Nível 1: 3º BPRv (Topo da hierarquia)
  const bprv3 = await prisma.unidade.create({
    data: {
      nome: '3º BPRv',
      sigla: '3BPRv',
      endereco: '3º Batalhão de Polícia Rodoviária',
    },
  })
  console.log(`  ✅ ${bprv3.nome} (id: ${bprv3.id})`)

  // Nível 2: 3ª CIA (subordinada ao 3º BPRv)
  const cia3 = await prisma.unidade.create({
    data: {
      nome: '3ª CIA',
      sigla: '3CIA',
      endereco: '3ª Companhia',
      unidadeSuperiorId: bprv3.id,
    },
  })
  console.log(`    ↳ ${cia3.nome} (id: ${cia3.id})`)

  // Nível 3: 3º PEL (subordinado à 3ª CIA)
  const pel3 = await prisma.unidade.create({
    data: {
      nome: '3º PEL',
      sigla: '3PEL',
      endereco: '3º Pelotão',
      unidadeSuperiorId: cia3.id,
    },
  })
  console.log(`      ↳ ${pel3.nome} (id: ${pel3.id})`)

  // Nível 4: BOPs (subordinadas ao 3º PEL)
  const bop320_1 = await prisma.unidade.create({
    data: {
      nome: 'BOP 320/1',
      sigla: 'BOP1',
      endereco: 'Base Operacional 320/1',
      unidadeSuperiorId: pel3.id,
    },
  })
  console.log(`        ↳ ${bop320_1.nome} (id: ${bop320_1.id})`)

  const bop320_2 = await prisma.unidade.create({
    data: {
      nome: 'BOP 320/2',
      sigla: 'BOP2',
      endereco: 'Base Operacional 320/2',
      unidadeSuperiorId: pel3.id,
    },
  })
  console.log(`        ↳ ${bop320_2.nome} (id: ${bop320_2.id})`)

  const bop320_3 = await prisma.unidade.create({
    data: {
      nome: 'BOP 320/3',
      sigla: 'BOP3',
      endereco: 'Base Operacional 320/3',
      unidadeSuperiorId: pel3.id,
    },
  })
  console.log(`        ↳ ${bop320_3.nome} (id: ${bop320_3.id})`)

  // Array de todas as unidades para facilitar o loop
  const unidades = [bprv3, cia3, pel3, bop320_1, bop320_2, bop320_3]

  // --- TIPOS DE MATERIAL ---
  console.log('\n📦 Criando Tipos de Material...')

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

  const tiposCriados: { id: number; nome: string }[] = []
  for (const nome of tiposMaterial) {
    const tipo = await prisma.tipoMaterial.create({
      data: { nome },
    })
    tiposCriados.push(tipo)
  }
  console.log(`  ✅ ${tiposMaterial.length} Tipos de Material criados`)

  // --- USUÁRIOS (2 por unidade) ---
  console.log('\n👥 Criando Usuários (2 por unidade)...')

  const senhaHash = await bcrypt.hash('123456', 10)

  // Configuração de usuários por unidade
  const usuariosPorUnidade = [
    // 3º BPRv - Gestores
    {
      unidade: bprv3, usuarios: [
        { id: 'maj.silva', nome: 'Maj. Silva', perfil: 'GESTOR', email: 'major@policia.gov.br' },
        { id: 'cap.almeida', nome: 'Cap. Almeida', perfil: 'GESTOR', email: 'capitao.almeida@policia.gov.br' },
      ]
    },
    // 3ª CIA - Gestores
    {
      unidade: cia3, usuarios: [
        { id: 'cap.santos', nome: 'Cap. Santos', perfil: 'GESTOR', email: 'capitao.santos@policia.gov.br' },
        { id: 'ten.oliveira', nome: 'Ten. Oliveira', perfil: 'CONTROLADOR', email: 'tenente@policia.gov.br' },
      ]
    },
    // 3º PEL - Controladores
    {
      unidade: pel3, usuarios: [
        { id: 'sgt.costa', nome: 'Sgt. Costa', perfil: 'CONTROLADOR', email: 'sargento.costa@policia.gov.br' },
        { id: 'sgt.ferreira', nome: 'Sgt. Ferreira', perfil: 'CONTROLADOR', email: 'sargento.ferreira@policia.gov.br' },
      ]
    },
    // BOP 320/1 - Usuários
    {
      unidade: bop320_1, usuarios: [
        { id: 'cb.lima', nome: 'Cb. Lima', perfil: 'USUARIO', email: 'cabo.lima@policia.gov.br' },
        { id: 'sd.martins', nome: 'Sd. Martins', perfil: 'USUARIO', email: 'soldado.martins@policia.gov.br' },
      ]
    },
    // BOP 320/2 - Usuários
    {
      unidade: bop320_2, usuarios: [
        { id: 'cb.souza', nome: 'Cb. Souza', perfil: 'USUARIO', email: 'cabo.souza@policia.gov.br' },
        { id: 'sd.rodrigues', nome: 'Sd. Rodrigues', perfil: 'USUARIO', email: 'soldado.rodrigues@policia.gov.br' },
      ]
    },
    // BOP 320/3 - Usuários
    {
      unidade: bop320_3, usuarios: [
        { id: 'cb.pereira', nome: 'Cb. Pereira', perfil: 'CONTROLADOR', email: 'cabo.pereira@policia.gov.br' },
        { id: 'sd.gomes', nome: 'Sd. Gomes', perfil: 'USUARIO', email: 'soldado.gomes@policia.gov.br' },
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

  // --- MATERIAIS (4 por unidade, todos DISPONIVEL) ---
  console.log('\n🔧 Criando Materiais (4 por unidade)...')

  // Função para gerar código único
  let codigoCounter = 1
  const gerarCodigo = (tipo: string) => {
    const prefixo = tipo.substring(0, 3).toUpperCase()
    return `${prefixo}-${String(codigoCounter++).padStart(3, '0')}`
  }

  // Função para pegar tipo aleatório
  const tipoAleatorio = () => tiposCriados[Math.floor(Math.random() * tiposCriados.length)]

  for (const unidade of unidades) {
    for (let i = 0; i < 4; i++) {
      const tipo = tipoAleatorio()
      const codigo = gerarCodigo(tipo.nome)

      await prisma.material.create({
        data: {
          codigoIdentificacao: codigo,
          descricao: `${tipo.nome} - ${unidade.sigla}`,
          tipoId: tipo.id,
          unidadeId: unidade.id,
          status: 'DISPONIVEL',
          observacaoAtual: null,
        },
      })
    }
    console.log(`  ✅ 4 materiais criados para ${unidade.nome}`)
  }

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Resumo da Hierarquia:')
  console.log(`
  3º BPRv (GESTOR: maj.silva, cap.almeida)
    ↳ 3ª CIA (GESTOR: cap.santos | CONTROLADOR: ten.oliveira)
        ↳ 3º PEL (CONTROLADOR: sgt.costa, sgt.ferreira)
            ↳ BOP 320/1 (USUARIO: cb.lima, sd.martins)
            ↳ BOP 320/2 (USUARIO: cb.souza, sd.rodrigues)
            ↳ BOP 320/3 (CONTROLADOR: cb.pereira | USUARIO: sd.gomes)
  `)
  console.log('📦 Total de materiais: 24 (4 por unidade)')
  console.log('👥 Total de usuários: 12 (2 por unidade)')
  console.log('\n🔑 Logins de teste (senha: 123456):')
  console.log('   GESTORES:')
  console.log('     • maj.silva    (3º BPRv - vê tudo)')
  console.log('     • cap.almeida  (3º BPRv - vê tudo)')
  console.log('     • cap.santos   (3ª CIA - vê CIA e abaixo)')
  console.log('   CONTROLADORES:')
  console.log('     • ten.oliveira (3ª CIA)')
  console.log('     • sgt.costa    (3º PEL)')
  console.log('     • sgt.ferreira (3º PEL)')
  console.log('     • cb.pereira   (BOP 320/3)')
  console.log('   USUARIOS:')
  console.log('     • cb.lima      (BOP 320/1)')
  console.log('     • sd.martins   (BOP 320/1)')
  console.log('     • cb.souza     (BOP 320/2)')
  console.log('     • sd.rodrigues (BOP 320/2)')
  console.log('     • sd.gomes     (BOP 320/3)')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
