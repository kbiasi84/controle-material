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

  // --- HIERARQUIA DE UNIDADES ---
  console.log('🏛️ Criando Hierarquia de Unidades...')

  // Nível 1: CPRv (Topo da hierarquia)
  const cprv = await prisma.unidade.upsert({
    where: { nome: 'CPRv' },
    update: {},
    create: {
      nome: 'CPRv',
      sigla: 'CPRv',
      endereco: 'Comando Regional',
    },
  })
  console.log(`  ✅ ${cprv.nome} (id: ${cprv.id})`)

  // Nível 2: BPRv (subordinado ao CPRv)
  const bprv2 = await prisma.unidade.upsert({
    where: { nome: '2º BPRv' },
    update: {},
    create: {
      nome: '2º BPRv',
      sigla: 'BPRv',
      endereco: '2º Batalhão',
      unidadeSuperiorId: cprv.id,
    },
  })
  console.log(`    ↳ ${bprv2.nome} (id: ${bprv2.id})`)

  const bprv3 = await prisma.unidade.upsert({
    where: { nome: '3º BPRv' },
    update: {},
    create: {
      nome: '3º BPRv',
      sigla: 'BPRv',
      endereco: '3º Batalhão',
      unidadeSuperiorId: cprv.id,
    },
  })
  console.log(`    ↳ ${bprv3.nome} (id: ${bprv3.id})`)

  // Nível 3: CIA (subordinada ao BPRv)
  const cia1 = await prisma.unidade.upsert({
    where: { nome: '1ª CIA' },
    update: {},
    create: {
      nome: '1ª CIA',
      sigla: 'CIA',
      endereco: '1ª Companhia',
      unidadeSuperiorId: bprv2.id,
    },
  })
  console.log(`      ↳ ${cia1.nome} (id: ${cia1.id})`)

  const cia3 = await prisma.unidade.upsert({
    where: { nome: '3ª CIA' },
    update: {},
    create: {
      nome: '3ª CIA',
      sigla: 'CIA',
      endereco: '3ª Companhia',
      unidadeSuperiorId: bprv2.id,
    },
  })
  console.log(`      ↳ ${cia3.nome} (id: ${cia3.id})`)

  // Nível 4: PEL (subordinado à CIA)
  const pel1 = await prisma.unidade.upsert({
    where: { nome: '1º PEL' },
    update: {},
    create: {
      nome: '1º PEL',
      sigla: 'PEL',
      endereco: '1º Pelotão',
      unidadeSuperiorId: cia1.id,
    },
  })
  console.log(`        ↳ ${pel1.nome} (id: ${pel1.id})`)

  const pel2 = await prisma.unidade.upsert({
    where: { nome: '2º PEL' },
    update: {},
    create: {
      nome: '2º PEL',
      sigla: 'PEL',
      endereco: '2º Pelotão',
      unidadeSuperiorId: cia3.id,
    },
  })
  console.log(`        ↳ ${pel2.nome} (id: ${pel2.id})`)

  // Nível 5: BOP (subordinada ao PEL)
  const bop320_3 = await prisma.unidade.upsert({
    where: { nome: 'BOP 320/3' },
    update: {},
    create: {
      nome: 'BOP 320/3',
      sigla: 'BOP',
      endereco: 'Base Operacional 320/3',
      unidadeSuperiorId: pel1.id,
    },
  })
  console.log(`          ↳ ${bop320_3.nome} (id: ${bop320_3.id})`)

  const bop320_2 = await prisma.unidade.upsert({
    where: { nome: 'BOP 320/2' },
    update: {},
    create: {
      nome: 'BOP 320/2',
      sigla: 'BOP',
      endereco: 'Base Operacional 320/2',
      unidadeSuperiorId: pel1.id,
    },
  })
  console.log(`          ↳ ${bop320_2.nome} (id: ${bop320_2.id})`)

  const bopCentro = await prisma.unidade.upsert({
    where: { nome: 'BOP Centro' },
    update: {},
    create: {
      nome: 'BOP Centro',
      sigla: 'BOP',
      endereco: 'Base Operacional Centro',
      unidadeSuperiorId: pel2.id,
    },
  })
  console.log(`          ↳ ${bopCentro.nome} (id: ${bopCentro.id})`)

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

  for (const nome of tiposMaterial) {
    await prisma.tipoMaterial.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
  }
  console.log(`  ✅ ${tiposMaterial.length} Tipos de Material criados`)

  // Buscar tipos criados para usar nas referências
  const tipoTaser = await prisma.tipoMaterial.findUnique({ where: { nome: 'Taser' } })
  const tipoRadio = await prisma.tipoMaterial.findUnique({ where: { nome: 'Rádio Comunicador' } })
  const tipoViatura = await prisma.tipoMaterial.findUnique({ where: { nome: 'Viatura' } })
  const tipoColete = await prisma.tipoMaterial.findUnique({ where: { nome: 'Colete Balístico' } })
  const tipoAlgema = await prisma.tipoMaterial.findUnique({ where: { nome: 'Algema' } })
  const tipoLanterna = await prisma.tipoMaterial.findUnique({ where: { nome: 'Lanterna Tática' } })
  const tipoEtilometro = await prisma.tipoMaterial.findUnique({ where: { nome: 'Etilômetro' } })

  // --- MATERIAIS DE EXEMPLO ---
  console.log('\n🔧 Criando Materiais de Exemplo...')

  const materiaisExemplo = [
    { codigo: 'TAS-001', descricao: 'Taser X26', tipoId: tipoTaser!.id, unidadeId: bop320_3.id, status: 'DISPONIVEL', obs: 'Bateria 85%' },
    { codigo: 'RAD-550', descricao: 'Rádio HT Motorola', tipoId: tipoRadio!.id, unidadeId: bop320_3.id, status: 'EM_USO', obs: null },
    { codigo: 'VTR-900', descricao: 'Viatura SW4', tipoId: tipoViatura!.id, unidadeId: bop320_3.id, status: 'MANUTENCAO', obs: 'Pneu traseiro furado' },
    { codigo: 'COL-102', descricao: 'Colete Balístico G2', tipoId: tipoColete!.id, unidadeId: bop320_3.id, status: 'DISPONIVEL', obs: 'Venc: 12/2026' },
    { codigo: 'ALG-045', descricao: 'Algemas Inox', tipoId: tipoAlgema!.id, unidadeId: bop320_3.id, status: 'DISPONIVEL', obs: 'Chaves inclusas' },
    { codigo: 'LAN-099', descricao: 'Lanterna Tática', tipoId: tipoLanterna!.id, unidadeId: bop320_3.id, status: 'EM_USO', obs: null },
    { codigo: 'ETI-500', descricao: 'Etilômetro Digital', tipoId: tipoEtilometro!.id, unidadeId: bop320_3.id, status: 'DISPONIVEL', obs: 'Calibrado' },
    { codigo: 'TAS-002', descricao: 'Taser X26 Pro', tipoId: tipoTaser!.id, unidadeId: bop320_2.id, status: 'DISPONIVEL', obs: null },
    { codigo: 'RAD-551', descricao: 'Rádio HT Motorola', tipoId: tipoRadio!.id, unidadeId: bop320_2.id, status: 'DISPONIVEL', obs: null },
    { codigo: 'COL-103', descricao: 'Colete Balístico G3', tipoId: tipoColete!.id, unidadeId: pel1.id, status: 'DISPONIVEL', obs: null },
  ]

  for (const mat of materiaisExemplo) {
    await prisma.material.upsert({
      where: { codigoIdentificacao: mat.codigo },
      update: {},
      create: {
        codigoIdentificacao: mat.codigo,
        descricao: mat.descricao,
        tipoId: mat.tipoId,
        unidadeId: mat.unidadeId,
        status: mat.status as 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO',
        observacaoAtual: mat.obs,
      },
    })
  }
  console.log(`  ✅ ${materiaisExemplo.length} Materiais criados`)

  // --- USUÁRIOS DE EXEMPLO (3 perfis: GESTOR, CONTROLADOR, USUARIO) ---
  console.log('\n👥 Criando Usuários de Exemplo...')

  const senhaHash = await bcrypt.hash('123456', 10)

  // GESTOR - CPRv (Cel. - Visão Global)
  await prisma.usuario.upsert({
    where: { identificacao: 'cel.silva' },
    update: {},
    create: {
      identificacao: 'cel.silva',
      nome: 'Cel. Silva - Comandante CPRv',
      senha: senhaHash,
      perfil: 'GESTOR',
      unidadeId: cprv.id,
    },
  })
  console.log(`  ✅ cel.silva (GESTOR) → ${cprv.nome}`)

  // GESTOR - BPRv (Maj. - Visão Regional)
  await prisma.usuario.upsert({
    where: { identificacao: 'maj.santos' },
    update: {},
    create: {
      identificacao: 'maj.santos',
      nome: 'Maj. Santos - Comandante 2º BPRv',
      senha: senhaHash,
      perfil: 'GESTOR',
      unidadeId: bprv2.id,
    },
  })
  console.log(`  ✅ maj.santos (GESTOR) → ${bprv2.nome}`)

  // GESTOR - CIA (Cap. - Visão Tática)
  await prisma.usuario.upsert({
    where: { identificacao: 'cap.oliveira' },
    update: {},
    create: {
      identificacao: 'cap.oliveira',
      nome: 'Cap. Oliveira - Comandante 1ª CIA',
      senha: senhaHash,
      perfil: 'GESTOR',
      unidadeId: cia1.id,
    },
  })
  console.log(`  ✅ cap.oliveira (GESTOR) → ${cia1.nome}`)

  // CONTROLADOR - PEL (Sgt. - Gestão Local)
  await prisma.usuario.upsert({
    where: { identificacao: 'sgt.costa' },
    update: {},
    create: {
      identificacao: 'sgt.costa',
      nome: 'Sgt. Costa - Controlador 1º PEL',
      senha: senhaHash,
      perfil: 'CONTROLADOR',
      unidadeId: pel1.id,
    },
  })
  console.log(`  ✅ sgt.costa (CONTROLADOR) → ${pel1.nome}`)

  // USUARIO - BOP (Sd. - Operacional)
  await prisma.usuario.upsert({
    where: { identificacao: 'sd.pereira' },
    update: {},
    create: {
      identificacao: 'sd.pereira',
      nome: 'Sd. Pereira - BOP 320/3',
      senha: senhaHash,
      perfil: 'USUARIO',
      unidadeId: bop320_3.id,
    },
  })
  console.log(`  ✅ sd.pereira (USUARIO) → ${bop320_3.nome}`)

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Resumo da Hierarquia:')
  console.log(`
  CPRv (GESTOR: cel.silva)
    ↳ 2º BPRv (GESTOR: maj.santos)
    │   ↳ 1ª CIA (GESTOR: cap.oliveira)
    │   │   ↳ 1º PEL (CONTROLADOR: sgt.costa)
    │   │       ↳ BOP 320/3 (USUARIO: sd.pereira)
    │   │       ↳ BOP 320/2
    │   ↳ 3ª CIA
    │       ↳ 2º PEL
    │           ↳ BOP Centro
    ↳ 3º BPRv
  `)
  console.log('\n🔑 Logins de teste (senha: 123456):')
  console.log('   • cel.silva   (GESTOR - vê tudo)')
  console.log('   • maj.santos  (GESTOR - vê 2º BPRv e abaixo)')
  console.log('   • cap.oliveira (GESTOR - vê 1ª CIA e abaixo)')
  console.log('   • sgt.costa   (CONTROLADOR - apenas 1º PEL)')
  console.log('   • sd.pereira  (USUARIO - apenas BOP 320/3)')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
