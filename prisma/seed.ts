import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando Seed Completo...')

  // 1. LIMPEZA COMPLETA (Ordem correta para evitar erros de chave estrangeira)
  console.log('🧹 Limpando banco de dados...')
  await prisma.movimentacao.deleteMany()
  await prisma.transferencia.deleteMany()
  await prisma.material.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.unidade.deleteMany()
  await prisma.tipoMaterial.deleteMany()

  // 2. TIPOS DE MATERIAL
  console.log('📋 Criando tipos de material...')
  const tiposData = [
    'ARMAMENTO',
    'TASER',
    'ETILÔMETRO ATIVO',
    'ETILÔMETRO PASSIVO',
    'RADAR',
    'VIATURA',
    'TALONÁRIO',
    'TPD'
  ]

  const tiposMap: Record<string, number> = {}
  for (const nome of tiposData) {
    const tipo = await prisma.tipoMaterial.create({ data: { nome } })
    tiposMap[nome] = tipo.id
    console.log(`  ✓ ${nome}`)
  }

  // 3. UNIDADES (com hierarquia definida manualmente conforme seu padrão)
  console.log('🏢 Criando unidades...')
  const cia3 = await prisma.unidade.create({
    data: { nome: '3ª CIA', sigla: '3ª CIA' }
  })

  const bop310_5 = await prisma.unidade.create({
    data: { nome: 'BOP 310/5', sigla: 'BOP 310/5', unidadeSuperiorId: cia3.id }
  })
  const bop310_6 = await prisma.unidade.create({
    data: { nome: 'BOP 310/6', sigla: 'BOP 310/6', unidadeSuperiorId: cia3.id }
  })
  const bop310_7 = await prisma.unidade.create({
    data: { nome: 'BOP 310/7', sigla: 'BOP 310/7', unidadeSuperiorId: cia3.id }
  })
  const bop310_8 = await prisma.unidade.create({
    data: { nome: 'BOP 310/8', sigla: 'BOP 310/8', unidadeSuperiorId: cia3.id }
  })
  const bop320_1 = await prisma.unidade.create({
    data: { nome: 'BOP 320/1', sigla: 'BOP 320/1', unidadeSuperiorId: cia3.id }
  })
  const bop320_2 = await prisma.unidade.create({
    data: { nome: 'BOP 320/2', sigla: 'BOP 320/2', unidadeSuperiorId: cia3.id }
  })
  const bop320_3 = await prisma.unidade.create({
    data: { nome: 'BOP 320/3', sigla: 'BOP 320/3', unidadeSuperiorId: cia3.id }
  })
  const paTor = await prisma.unidade.create({
    data: { nome: 'PA/TOR', sigla: 'PA/TOR', unidadeSuperiorId: cia3.id }
  })
  const gpTor = await prisma.unidade.create({
    data: { nome: 'GP/TOR', sigla: 'GP/TOR', unidadeSuperiorId: cia3.id }
  })

  // Mapa para vincular string da planilha -> ID do banco
  const unidades: Record<string, number> = {
    '3ª CIA': cia3.id,
    'BOP 310/5': bop310_5.id,
    'BOP 310/6': bop310_6.id,
    'BOP 310/7': bop310_7.id,
    'BOP 310/8': bop310_8.id,
    'BOP 320/1': bop320_1.id,
    'BOP 320/2': bop320_2.id,
    'BOP 320/3': bop320_3.id,
    'PA/TOR': paTor.id,
    'GP/TOR': gpTor.id
  }

  // 4. MATERIAIS
  console.log('📦 Inserindo materiais...')

  const materiais = [
    { id: '03809-Z', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: paTor.id },
    { id: '02854-D', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: bop310_5.id },
    { id: '02857-G', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: bop320_3.id },
    { id: '02858-H', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: bop310_6.id },
    { id: '02860-B', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: bop320_1.id },
    { id: '03289-L', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: gpTor.id },
    { id: '2156 - Y', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: bop310_7.id },
    { id: '2158 - A', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: bop320_2.id },
    { id: '2159 - B', desc: 'M3 TACTICAL', tipo: 'ARMAMENTO', uni: bop320_3.id },
    { id: 'BRA07590', desc: 'IA 2', tipo: 'ARMAMENTO', uni: bop320_1.id },
    { id: 'BRA07519', desc: 'IA 2', tipo: 'ARMAMENTO', uni: bop310_7.id },
    { id: 'BRA09602', desc: 'IA 2', tipo: 'ARMAMENTO', uni: gpTor.id },
    { id: 'BRA09646', desc: 'IA 2', tipo: 'ARMAMENTO', uni: bop320_3.id },
    { id: 'BRA09647', desc: 'IA 2', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'BRA09605', desc: 'IA 2', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'BRA09665', desc: 'IA 2', tipo: 'ARMAMENTO', uni: paTor.id },
    { id: 'BRA03368', desc: 'IA 2', tipo: 'ARMAMENTO', uni: gpTor.id },
    { id: 'AG105908', desc: 'M964 AI MD1', tipo: 'ARMAMENTO', uni: paTor.id },
    { id: 'AG105943', desc: 'M964 AI MD1', tipo: 'ARMAMENTO', uni: gpTor.id },
    { id: 'H031800', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: gpTor.id },
    { id: 'H031800-1', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: gpTor.id },
    { id: 'H031800-2', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'H031591', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: paTor.id },
    { id: 'H031591-1', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: paTor.id },
    { id: 'H031591-2', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'H031843', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'H031843-1', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'H031843-2', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'H031850', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'H031850-1', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'H031850-2', desc: 'SCAR 20', tipo: 'ARMAMENTO', uni: cia3.id },
    { id: 'C5415BR/14', desc: 'TUFLY', tipo: 'ARMAMENTO', uni: gpTor.id },
    { id: 'X2900H74H', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: cia3.id },
    { id: 'X2900H73N', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: cia3.id },
    { id: 'X2900H17P', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: cia3.id },
    { id: 'X2900H1PM', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_5.id },
    { id: 'X2900F0T7', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_5.id },
    { id: 'X2900H8PX', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_5.id },
    { id: 'X2900H786', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_6.id },
    { id: 'X2900E9Y0', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_7.id },
    { id: 'X2900H1FE', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_7.id },
    { id: 'X2900F40X', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_7.id },
    { id: 'X2900H7AA', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_7.id },
    { id: 'X2900H7WE', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_7.id },
    { id: 'X2900H68H', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_7.id },
    { id: 'X2900H7XN', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_1.id },
    { id: 'X2900H6FP', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_1.id },
    { id: 'X2900H6MO', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_1.id },
    { id: 'X2900H7AE', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_1.id },
    { id: 'X2900E9PY', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_1.id },
    { id: 'X2900H7P2', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_2.id },
    { id: 'X2900H7KW', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_2.id },
    { id: 'X2900H7RW', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_2.id },
    { id: 'X2900H77P', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_2.id },
    { id: 'X2900H1TW', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_3.id },
    { id: 'X2900H6M3', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_3.id },
    { id: 'X2900H85A', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_3.id },
    { id: 'X2900H109', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_3.id },
    { id: 'X2900E9YW', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop320_3.id },
    { id: 'X2900H78R', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: bop310_8.id },
    { id: 'X2900EA2A', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: paTor.id },
    { id: 'X2900H9AH', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: gpTor.id },
    { id: 'X2900H8RA', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: gpTor.id },
    { id: 'X2900F6VD', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: cia3.id },
    { id: 'X2900ECE7', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: cia3.id },
    { id: 'X2900ECAW', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: cia3.id },
    { id: 'X2900EFY7', desc: 'TASER CLASS III - X2', tipo: 'TASER', uni: cia3.id },
    { id: '82063', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop310_7.id },
    { id: '82064', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop310_7.id },
    { id: '82065', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: cia3.id },
    { id: '91727', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_3.id },
    { id: '91729', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_1.id },
    { id: '91739', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_1.id },
    { id: '91761', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_3.id },
    { id: '94388', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop310_5.id },
    { id: '94389', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_1.id },
    { id: '94390', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_3.id },
    { id: '94391', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_3.id },
    { id: '114776', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop310_7.id },
    { id: '114781', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_1.id },
    { id: '114782', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_3.id },
    { id: '115467', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop310_5.id },
    { id: '115468', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_1.id },
    { id: '115469', desc: 'ALCO-SENSOR-IV', tipo: 'ETILÔMETRO ATIVO', uni: bop320_3.id },
    { id: 'WAP5N0021', desc: 'IBLOW 10 PRO', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'WAP5N0057', desc: 'IBLOW 10 PRO', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'WAP5N0143', desc: 'IBLOW 10 PRO', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_3.id },
    { id: 'WAP5N0167', desc: 'IBLOW 10 PRO', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_5.id },
    { id: 'WAP5N0168', desc: 'IBLOW 10 PRO', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'WAP5N0169', desc: 'IBLOW 10 PRO', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_1.id },
    { id: 'WAP5N0198', desc: 'IBLOW 10 PRO', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_3.id },
    { id: 'TBJCD0171', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_5.id },
    { id: 'TBJCD0135', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'TBJCD0114', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_6.id },
    { id: 'TBJCD0137', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'TBLB90048', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'TBLB90046', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'TBJCD0130', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop310_7.id },
    { id: 'TBJCD0170', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_1.id },
    { id: 'TBJCD0173', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_1.id },
    { id: 'TBLB90228', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_1.id },
    { id: 'TBLB90231', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_3.id },
    { id: 'TBLB90137', desc: 'IBLOW 10', tipo: 'ETILÔMETRO PASSIVO', uni: bop320_2.id },
    { id: 'TC012049', desc: 'LASER TECH', tipo: 'RADAR', uni: bop310_5.id },
    { id: 'TC012052', desc: 'LASER TECH', tipo: 'RADAR', uni: bop310_7.id },
    { id: 'TC012109', desc: 'LASER TECH', tipo: 'RADAR', uni: bop310_7.id },
    { id: 'TC012053', desc: 'LASER TECH', tipo: 'RADAR', uni: bop320_1.id },
    { id: 'TC008666', desc: 'LASER TECH', tipo: 'RADAR', uni: bop320_3.id },
    { id: 'LT001750', desc: 'FLASH', tipo: 'RADAR', uni: bop320_1.id },
    { id: 'LT001747', desc: 'FLASH', tipo: 'RADAR', uni: bop320_3.id },
    { id: 'R-03300', desc: 'COROLLA', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03301', desc: 'COROLLA', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03302', desc: 'COROLLA', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03303', desc: 'COROLLA', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03304', desc: 'DUSTER', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03307', desc: 'DUSTER', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03306', desc: 'CRONOS', tipo: 'VIATURA', uni: bop310_7.id },
    { id: 'R-03311', desc: 'DUSTER', tipo: 'VIATURA', uni: bop310_7.id },
    { id: 'R-03312', desc: 'CRONOS', tipo: 'VIATURA', uni: bop310_6.id },
    { id: 'R-03313', desc: 'CRONOS', tipo: 'VIATURA', uni: bop310_7.id },
    { id: 'R-03314', desc: 'DUSTER', tipo: 'VIATURA', uni: bop310_7.id },
    { id: 'R-03315', desc: 'DUSTER', tipo: 'VIATURA', uni: bop310_5.id },
    { id: 'R-03317', desc: 'CRONOS', tipo: 'VIATURA', uni: bop310_5.id },
    { id: 'R-03318', desc: 'CRONOS', tipo: 'VIATURA', uni: bop310_7.id },
    { id: 'R-03319', desc: 'CRONOS', tipo: 'VIATURA', uni: bop310_7.id },
    { id: 'R-03320', desc: 'YARIS', tipo: 'VIATURA', uni: bop320_1.id },
    { id: 'R-03321', desc: 'DUSTER', tipo: 'VIATURA', uni: bop320_1.id },
    { id: 'R-03322', desc: 'YARIS', tipo: 'VIATURA', uni: bop320_1.id },
    { id: 'R-03323', desc: 'YARIS', tipo: 'VIATURA', uni: bop320_1.id },
    { id: 'R-03324', desc: 'DUSTER', tipo: 'VIATURA', uni: bop320_1.id },
    { id: 'R-03326', desc: 'DUSTER', tipo: 'VIATURA', uni: bop320_1.id },
    { id: 'R-03331', desc: 'DUSTER', tipo: 'VIATURA', uni: bop320_3.id },
    { id: 'R-03332', desc: 'YARIS', tipo: 'VIATURA', uni: bop320_3.id },
    { id: 'R-03333', desc: 'YARIS', tipo: 'VIATURA', uni: bop320_3.id },
    { id: 'R-03336', desc: 'DUSTER', tipo: 'VIATURA', uni: bop320_3.id },
    { id: 'R-03361', desc: 'TRAILBLAZER', tipo: 'VIATURA', uni: paTor.id },
    { id: 'R-03363', desc: 'TRAILBLAZER', tipo: 'VIATURA', uni: gpTor.id },
    { id: 'R-03263', desc: 'TRAILBLAZER', tipo: 'VIATURA', uni: gpTor.id },
    { id: '8-181', desc: 'DUSTER', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03309', desc: 'SIENA', tipo: 'VIATURA', uni: cia3.id },
    { id: 'R-03310', desc: 'ONIX', tipo: 'VIATURA', uni: cia3.id },
    { id: 'RXCY800PXCD', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: cia3.id },
    { id: 'RXCY8018DAA', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_5.id },
    { id: 'RXCY80186BW', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_5.id },
    { id: 'RXCY80186EX', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_5.id },
    { id: 'RXCY8018CZX', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_5.id },
    { id: 'RXCY800PRXJ', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_5.id },
    { id: 'RXCY800PQ9A', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_6.id },
    { id: 'RXCY800PRPB', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY800NS8Z', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY800P40K', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY800P5LB', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY800PSGM', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY800PSHP', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY800PRWY', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY8018A0J', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_7.id },
    { id: 'RXCY80189PX', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY80189MD', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY80189HA', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY800NTCH', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY800Q0MV', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY80189QL', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY8018BEE', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY8018A4W', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_1.id },
    { id: 'RXCY8018C4H', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_2.id },
    { id: 'RXCY80188KV', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_2.id },
    { id: 'RXCY8018B5M', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_2.id },
    { id: 'RXCY8018BAX', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_2.id },
    { id: 'RXCY80189ST', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop310_8.id },
    { id: 'RXCY800Q3SM', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY8018A5D', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY800NYYD', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY80182CH', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY80186AP', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY800Q7VE', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY80183DR', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY800Q04L', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: bop320_3.id },
    { id: 'RXCY8018AVN', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: gpTor.id },
    { id: 'RXCY800P4SM', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: gpTor.id },
    { id: 'RXCY80184SV', desc: 'SAMSUNG GALAXY A26 5G', tipo: 'TALONÁRIO', uni: paTor.id },
    { id: 'R9XN808360B', desc: 'SAMSUNG / A10S', tipo: 'TPD', uni: bop310_5.id },
    { id: 'R9XN80A6NNN', desc: 'SAMSUNG / A10S', tipo: 'TPD', uni: bop310_7.id },
    { id: 'R9XN805EC5F', desc: 'SAMSUNG / A10S', tipo: 'TPD', uni: bop320_1.id },
    { id: 'R9XN80871ZN', desc: 'SAMSUNG / A10S', tipo: 'TPD', uni: bop320_1.id },
    { id: 'R9XN80A8SPE', desc: 'SAMSUNG / A10S', tipo: 'TPD', uni: bop320_3.id },
    { id: 'R9XN80A6J5W', desc: 'SAMSUNG / A10S', tipo: 'TPD', uni: paTor.id },
    { id: 'R9XN808F2XY', desc: 'SAMSUNG / A10S', tipo: 'TPD', uni: gpTor.id },
    { id: 'RX8T50EKERY', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_5.id },
    { id: 'RX8T50G9LXF', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_5.id },
    { id: 'RX8T50G01DD', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_6.id },
    { id: 'RX8T50GA2RY', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_7.id },
    { id: 'RX8T50F6S0J', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_7.id },
    { id: 'RX8T50EHYTP', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_7.id },
    { id: 'RX8T50F6VDM', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop320_2.id },
    { id: 'RX8T50CDKBP', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_8.id },
    { id: 'RX8T50G9F9K', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop320_1.id },
    { id: 'RX8T50G9K3H', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop320_1.id },
    { id: 'RX8T5097BGJ', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_7.id },
    { id: 'RX8T50FD97Z', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop320_3.id },
    { id: 'RX8T50G961K', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop320_3.id },
    { id: 'RX8T50CDX6P', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop310_7.id },
    { id: 'RX8T50F3K6F', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop320_1.id },
    { id: 'RX8T50EKGED', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: bop320_3.id },
    { id: 'RX8T50G01SV', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: paTor.id },
    { id: 'RX8T50F474E', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: gpTor.id },
    { id: 'RX8T50GR1PJ', desc: 'TPD-SAMSUNG A13', tipo: 'TPD', uni: gpTor.id },

  ]

  let contador = 0
  for (const m of materiais) {
    await prisma.material.create({
      data: {
        codigoIdentificacao: m.id,
        descricao: m.desc,
        tipoId: tiposMap[m.tipo],
        unidadeId: m.uni,
        status: 'DISPONIVEL'
      }
    })
    contador++
    if (contador % 50 === 0) {
      console.log(`  ✓ ${contador} materiais inseridos...`)
    }
  }
  console.log(`✅ Total: ${contador} materiais cadastrados com sucesso!`)

  // 5. USUÁRIOS
  console.log('👥 Inserindo usuários...')

  const usuarios = [
    { id: '112713-6', nome: 'MAURICIO NOE CAVALARI', email: 'noecavalari@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '105459-7', nome: 'VAGNER SEVERO DE SOCORRO', email: 'vsevero@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '180276-3', nome: 'DANILO RODRIGUES CUTIS', email: 'cutis@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '990387-9', nome: 'MILTON MATAQUEIRO TARDIOLLI', email: 'tardiolli@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: gpTor.id },
    { id: '117087-2', nome: 'RICARDO DE PAULA', email: 'rpaula@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '128378-2', nome: 'PEDRO HENRIQUE COTRIM', email: 'pedrocotrim@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: paTor.id },
    { id: '105607-7', nome: 'LUCAS OLIVEIRA COSTA SILVA', email: 'lucasocs@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '105476-7', nome: 'GUSTAVO CESAR RIBEIRO CAVALCANTE', email: 'gcrcavalcante@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '105584-4', nome: 'JOSÉ WILSON ABDO DELLA VALLE', email: 'dellavalle@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '105450-3', nome: 'EDILSON JOSÉ DE LIMA', email: 'edilsonjosedelima@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: bop320_3.id },
    { id: '137039-1', nome: 'MATHEUS BIFARONI MORELLI', email: 'matheusmorelli@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '135570-8', nome: 'EVERTON APARECIDO PEREIRA DOS SANTOS', email: 'aparecidoeverton@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: gpTor.id },
    { id: '137185-1', nome: 'EDER ROGÉRIO VILALVA MARTINS', email: 'rogerioeder@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '127092-3', nome: 'RHANDLEY DO AMORIM SANTOS', email: 'rhandley@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: gpTor.id },
    { id: '110884-A', nome: 'HALISON LOPES DE CARVALHO', email: 'halison@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '117031-7', nome: 'JAIMAR RODRIGUES DE SOUZA', email: 'jaimar@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '146333-A', nome: 'WILLIAN DE SIQUEIRA SILVA', email: 'williansiqueira@policiamilitar.sp.gov.br', perfil: 'GESTOR', uni: cia3.id },
    { id: '990681-9', nome: 'ROGÉRIO SANTIAGO', email: 'rogeriosantiago@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '105462-7', nome: 'FERNANDO PERPETUO PORTO', email: 'fporto@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_6.id },
    { id: '114481-2', nome: 'AGNALDO LUCAS VERTO', email: 'verto@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_1.id },
    { id: '119305-8', nome: 'PAULO CESAR DOS SANTOS', email: 'pcdspaulo@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '118058-4', nome: 'FABIANO RODRIGUES ALVES SANTANA', email: 'fabianosantana@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '981499-0', nome: 'VIVIANA CRISTINA DA SILVA MARQUES', email: 'vivianasilva@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_1.id },
    { id: '982564-9', nome: 'ROSIMEIRE PIRES', email: 'rosimeirep@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '105582-8', nome: 'LUIS ALBERTO RABESCO', email: 'rabesco@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_6.id },
    { id: '105458-9', nome: 'FABIO LUIS GODOY BARBOZA', email: 'fabiobarboza@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_7.id },
    { id: '105448-1', nome: 'ALEXANDRE ALEX ZAMBOM', email: 'alexandrez@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '105503-8', nome: 'ANTONIO FABIANO DAGA', email: 'daga@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '105888-6', nome: 'FABIANO MASSOTI ESTATI', email: 'fabianoestati@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '107870-4', nome: 'ANDRE LUIS MORET BENEVIDES', email: 'moret@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '128777-0', nome: 'EDER EMILIO DE PAULA', email: 'emilioedp@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_7.id },
    { id: '122162-A', nome: 'EVANDRO RODRIGO DA SILVA', email: 'evandrorodrigo@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '132218-4', nome: 'ADRIEL FILIPE MARAYA', email: 'adrielmaraya@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_5.id },
    { id: '131548-0', nome: 'NELSON LUIZ PRACONE', email: 'pracone@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '134537-A', nome: 'SAMUEL HENRIQUE BORGES DE SOUZA', email: 'samuelhenrique@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '110936-7', nome: 'TARCISIO LOURENCO DE OLIVEIRA', email: 'tarcisio@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '105555-A', nome: 'ONIVALDO CARLOS DE MORI', email: 'onivaldocarlos@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '133873-A', nome: 'RENAN RODRIGUES', email: 'rrenan@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_6.id },
    { id: '141159-4', nome: 'NICOLAS GASPAR COTES TAKAHASHI', email: 'ntakahashi@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '141615-4', nome: 'LUÍS HENRIQUE RODRIGUES PRIMO', email: 'lluisprimo@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '114308-5', nome: 'CESAR MENDES SOARES DA SILVA', email: 'cesarmendes@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_6.id },
    { id: '140501-2', nome: 'LEONARDO SILVESTRE PEREIRA DE SOUZA', email: 'leonardosilvestre@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '117641-2', nome: 'ANDRE LUIZ COELHO DE ARAÚJO', email: 'andrelcdaraujo@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '118612-4', nome: 'FÁBIO AUGUSTO SCAPIN', email: 'fabioaugustoscapin@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '113968-1', nome: 'RODRIGO BATISTA MAURÍCIO', email: 'rodrigobm@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '113951-7', nome: 'RODOLFO DEZANI DA COSTA', email: 'rdezani@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_1.id },
    { id: '114459-6', nome: 'EMERSON DONIZETE FACIN', email: 'edfacin@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_1.id },
    { id: '114434-A', nome: 'MARCELO ANDRE SILVA CHAVES', email: 'maschaves@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '136687-4', nome: 'IVAN RENE GONÇALVES MUNIZ', email: 'ivanrene@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '132594-9', nome: 'MARCOS ALMEIDA FERREIRA', email: 'ferreiraaf@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '144026-8', nome: 'FERNANDO LEITE DE OLIVEIRA', email: 'fleite@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '132447-A', nome: 'CLAYTON CARNEIRO ALEXANDRE', email: 'alexandrecc@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '117015-5', nome: 'ARNALDO DE OLIVEIRA', email: 'arnaldooliveira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '116229-2', nome: 'FABIANO RENATO FLORIANO', email: 'frfloriano@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_7.id },
    { id: '117055-4', nome: 'FABIANO DA SILVA NEVES', email: 'fabianoneves@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '117119-4', nome: 'MARCOS CÉSAR LAZARETTI', email: 'lazaretti@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '116266-7', nome: 'DORIVAL AMARAL JÚNIOR', email: 'dorivalamaral@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '116768-5', nome: 'WELINGTON VENTURA MARQUES', email: 'welingtonventura@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '116168-7', nome: 'ANDERSON CARLOS DE SOUZA TOSATI', email: 'tosati@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '116162-8', nome: 'WILSON EDUARDO IPOLITO', email: 'wilsoneduardoipolito@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '116235-7', nome: 'EDSON FERNANDO GAMERO CARVALHO', email: 'gamero@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_6.id },
    { id: '117023-6', nome: 'JOSÉ ORONIDES CAMBUY', email: 'cambuy@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '116786-3', nome: 'ALAN AUGUSTO ZANATA BRACHINI', email: 'alanaugusto@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_2.id },
    { id: '116243-8', nome: 'FÁBIO TORRENTE DIOGO DE FARIAS', email: 'fabiodiogo@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '117232-8', nome: 'LUCIANO DA SILVA', email: 'lucianods@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_6.id },
    { id: '117633-1', nome: 'IDENILSON TIAGO GONÇALVES', email: 'idenilsontiago@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '117619-6', nome: 'JEAN PETER MAESTRELLO', email: 'maestrello@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_2.id },
    { id: '116930-A', nome: 'VAGNER MARCELO MERLOTTO', email: 'merlotto@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '117241-7', nome: 'KLEYTON DE BIASI', email: 'biasi.kleyton@gmail.com', perfil: 'GESTOR', uni: cia3.id },
    { id: '129722-8', nome: 'EMERSON ALEXANDRE DELATIN', email: 'emersonalexandre@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '135677-1', nome: 'EMERSON RODRIGO MILAN', email: 'emersonmilan@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '141610-3', nome: 'EDER FAZOLLI', email: 'fazolli@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '131729-6', nome: 'RODRIGO ANTONIO DE OLIVEIRA RUFFATO', email: 'ruffato@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '141537-9', nome: 'LEANDRO RAFAEL DE ALMEIDA', email: 'leandrorafael@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '134949-0', nome: 'HELDER WILLIAN SILVA', email: 'helderwillian@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '144263-5', nome: 'GERRI FELIPE BARBOSA VILALVA', email: 'gerrivilalva@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '141783-5', nome: 'RAFAEL NUNES LEAL', email: 'nunesleal@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '141620-A', nome: 'RODRIGO ALVES DA SILVA', email: 'rodrigooalves@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '117621-8', nome: 'EVERTON RODRIGUES', email: 'evertonrodrigues@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '136691-2', nome: 'JOAO VICTOR OLIVEIRA DA SILVA', email: 'joaovictoroliveira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '118224-2', nome: 'JEFFERSON JANSEN PEREIRA', email: 'jeffersonjansen@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '107050-3', nome: 'CLAUDEMIR DONIZETI GABRIEL', email: 'claudemirgabriel@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '117765-6', nome: 'DANIEL DOS SANTOS LEAL', email: 'danielsl@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '145952-0', nome: 'FERNANDO FERREIRA DE SOUZA', email: 'fernandoferreira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '145532-0', nome: 'KAIQUE AUGUSTO VIANA DO NASCIMENTO', email: 'kavnascimento@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_2.id },
    { id: '146755-7', nome: 'LUCAS DA SILVA', email: 'lucasds@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '144288-A', nome: 'LUIS EDUARDO CUMPIAN', email: 'lecumpian@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '146313-6', nome: 'MATHEUS DO NASCIMENTO', email: 'mdnascimento@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '144078-A', nome: 'MURILO DA SILVA FERREIRA', email: 'murilodasilva@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '133642-8', nome: 'RAFAEL APARECIDO DO ESPIRITO SANTO', email: 'rafaelsanto@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '146743-3', nome: 'RENATO PERTILE', email: 'renatopertile@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_8.id },
    { id: '144081-A', nome: 'RÔMULO RODRIGUES DE OLIVEIRA', email: 'rrodoliveira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '146332-2', nome: 'WELINGTON GUILHERME SANTANA', email: 'welingtongsantana@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_8.id },
    { id: '131553-6', nome: 'RAFAEL LOPES DE SOUZA', email: 'rafaellopes@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '130282-5', nome: 'RENAN DA SILVA GARCIA', email: 'renangarcia@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '124036-6', nome: 'RENE TOLEDO RODRIGUES', email: 'renetoledo@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '126435-4', nome: 'VAGNER LUIZ MONTEIRO', email: 'vagnermonteiro@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_8.id },
    { id: '150413-4', nome: 'ADONIS DE CASTRO ARAUJO', email: 'adoniscastro@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_5.id },
    { id: '150411-8', nome: 'ALISSON VINICIUS DA COSTA FERREIRA', email: 'avcferreira@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_2.id },
    { id: '150645-5', nome: 'FABIO HENRIQUE ALMEIDA LIMA', email: 'fabiolima@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_8.id },
    { id: '150462-2', nome: 'JULIO CÉSAR DE OLIVEIRA', email: 'juliocesar@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '151560-8', nome: 'LUCAS MATHEUS ROCHA DA SILVA', email: 'lucasrocha@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_6.id },
    { id: '150493-2', nome: 'RENAN DE MELLO PONTEL', email: 'renanpontel@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_8.id },
    { id: '150494-A', nome: 'RICARDO RIBEIRO DA COSTA', email: 'ricardoribeiro@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_8.id },
    { id: '150643-9', nome: 'DANIEL HENRIQUE DA COSTA SOUZA', email: 'danielcosta@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '152062-8', nome: 'DIEGO SOUZA GUIMARÃES', email: 'diegoviana@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '152092-0', nome: 'JOAO VITOR OLIVEIRA GOMES', email: 'joaogomes@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_8.id },
    { id: '153325-8', nome: 'MATHEUS AUGUSTO DOS SANTOS', email: 'matheussantos@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '153835-7', nome: 'JOAO VITOR DE ALMEIDA LEAL', email: 'joaoleal@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '154747-0', nome: 'VITOR EMANOEL DE SOUZA', email: 'vitoremanoel@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop320_3.id },
    { id: '153790-3', nome: 'VINICIUS RUIZ GARCIA', email: 'viniciusruiz@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '152775-4', nome: 'MAYK RICARDO DEL MOURO', email: 'rmouro@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_1.id },
    { id: '157617-8', nome: 'TAUAN GOMES DA SILVA', email: 'gomestauan@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '161535-1', nome: 'ROBERTO APARECIDO DA CUNHA JUNIOR', email: 'robertoradcj@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_6.id },
    { id: '162292-7', nome: 'MATEUS DE AGUIAR CABRAL', email: 'dmateus@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '160992-A', nome: 'MATHEUS FERNANDO BERTOLIN', email: 'matheusbertolin@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_3.id },
    { id: '161570-0', nome: 'ERICO ANTONIO BOSQUESI', email: 'ericoab@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '156571-A', nome: 'ABNER GABRIEL AFFONSO', email: 'gabrielaffonso@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '157018-8', nome: 'FERNANDO ALBERTO PEREIRA', email: 'fpereira@policiamilitar.sp.gov.br', perfil: 'CONTROLADOR', uni: bop310_7.id },
    { id: '150650-1', nome: 'GUILHERME FELIX DA SILVA', email: 'guilhermefelix@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '144075-6', nome: 'MATEUS ALVES GUILHERME', email: 'mateusguilherme@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '127083-4', nome: 'MARCELO DE SOUZA SOARES', email: 'marcelosoares@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_7.id },
    { id: '962450-3', nome: 'CLAUDIO ROBERTO DA SILVA', email: 'claudioroberto@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '976214-2', nome: 'SILVIO CÉSAR DE OLIVEIRA', email: 'silviocesar@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '113334-9', nome: 'ANDERSON FABIANO ALVES', email: 'andersonfa@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '118063-A', nome: 'FLÁVIO DE ALMEIDA', email: 'flavioalmeida@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '118073-8', nome: 'JEAN CARLOS DE CAMPOS CARVALHO', email: 'jeancarlos@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_5.id },
    { id: '108428-3', nome: 'ROGÉRIO DE PAULA PEREIRA', email: 'rogeriodepp@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_6.id },
    { id: '132607-4', nome: 'RENATO MARTIMIANO DE MOURA', email: 'renatomartimiano@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_6.id },
    { id: '965306-6', nome: 'EMILSON DE OLIVEIRA', email: 'emilsondooliveira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_8.id },
    { id: '117070-8', nome: 'LUIS CARLOS BORDINASSI', email: 'bordinassi@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_8.id },
    { id: '117109-7', nome: 'LEANDRO DOS SANTOS', email: 'leandrodossantos@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop310_8.id },
    { id: '109722-9', nome: 'ELIZEU RODRIGUES DE AGUIAR', email: 'elizeuaguiar@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '112933-3', nome: 'MÁRCIO FERREIRA', email: 'marcioferreira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '112217-7', nome: 'VAGNER BALSAN', email: 'vagnerbalsan@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '117042-2', nome: 'CLEBER RICARDO DA SILVA', email: 'cleberricardo@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '108423-2', nome: 'RICHARD ALEXANDER DE OLIVEIRA', email: 'richarddeoliveira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: bop320_2.id },
    { id: '102555-5', nome: 'EDSON LUIS FERRAZ', email: 'edsonferraz@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: paTor.id },
    { id: '105436-8', nome: 'ALAN DOUGLAS DA SILVA', email: 'alandouglas@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: paTor.id },
    { id: '124115-0', nome: 'RENATO CESAR GOMES', email: 'renatocgomes@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: paTor.id },
    { id: '127988-2', nome: 'ROBSON BATISTA', email: 'robsonbatista@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: paTor.id },
    { id: '135572-4', nome: 'FABIO ALEXANDRE PEROZIM', email: 'fabioap@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: paTor.id },
    { id: '141604-9', nome: 'CAIO CÉSAR MARQUES', email: 'caiocm@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: paTor.id },
    { id: '150495-9', nome: 'SAMUEL CARVALHO ZANINI', email: 'samuelzanini@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: paTor.id },
    { id: '962164-4', nome: 'ALEXANDRE DONIZETTI SILVESTRE', email: 'alexandresilvestre@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '974347-4', nome: 'CLAUDIO ROBERTO BERTASSI', email: 'crbertassi@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '117066-0', nome: 'JULIANO CÉSAR RUIZ', email: 'julianocruiz@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '117622-6', nome: 'FÁBIO ALVES DE OLIVEIRA', email: 'fabioadeoliveira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '118080-A', nome: 'LEONARDO HENRIQUE COSTA', email: 'leonardohc@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '121966-9', nome: 'MARCELO CORTEZI', email: 'marcelocortezi@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '127055-9', nome: 'EDUARDO DE FREITAS', email: 'efreitas@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '130105-5', nome: 'LUCAS DA SILVA OLIVEIRA', email: 'lucasdsoliveira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '135565-1', nome: 'BRUNO CÉSAR MARANGONI', email: 'brunocm@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '139887-3', nome: 'FELIPE AUGUSTO FERREIRA', email: 'felipeferreira@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '141547-6', nome: 'MURILO HENRIQUE FURLANI DE SOUZA', email: 'murilofurlani@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '146312-8', nome: 'LUAN HENRIQUE DOS SANTOS LEAL', email: 'luanleal@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '149170-9', nome: 'LUCAS HENRIQUE MARCOLINO', email: 'lucasmarcolino@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '150499-1', nome: 'THALES VINICIUS DE OLIVEIRA', email: 'thalesvinicius@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '150478-9', nome: 'MATHEUS PERPETUO PORTO', email: 'matheusporto@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id },
    { id: '154019-0', nome: 'ANDERSON FELIPE DA SILVA CÂNDIDO', email: 'andersonfcandido@policiamilitar.sp.gov.br', perfil: 'USUARIO', uni: gpTor.id }
  ]

  let userCount = 0
  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash(u.id, 10)
    await prisma.usuario.create({
      data: {
        identificacao: u.id,
        nome: u.nome,
        email: u.email,
        senha: senhaHash,
        perfil: u.perfil as any,
        unidadeId: u.uni
      }
    })
    userCount++
  }
  console.log(`✅ Total: ${userCount} usuários cadastrados com sucesso!`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })