Documentação Técnica: Sistema de Controle de Materiais e Patrimônio (SCMP)

1. Visão Geral

Sistema web para gerenciamento ágil de retirada, devolução e manutenção de materiais e equipamentos. O foco é a eficiência operacional (poucos cliques), rastreabilidade total (logs de auditoria), padronização de cadastros e isolamento de dados entre múltiplas unidades físicas.

2. Stack Tecnológica

Framework: Next.js (App Router) – Fullstack, seguro e rápido.
Estilização: Tailwind CSS + Shadcn/ui – Interface moderna e responsiva.
anco de Dados: PostgreSQL.ORM: Prisma – Gerenciamento do banco e tipos.

3. Arquitetura de Dados (Modelagem)

O banco é projetado para suportar Multi-unidade, Categorização Rígida e Persistência de Status.

3.1 Tabelas Principais

UnidadeLocais físicos (Ex: "Base Centro", "Posto Rodoviário 01").
id (PK)
nome (String)
endereco (String?)
Regra: Criadas apenas via script (Seed) ou Super Admin para evitar duplicidade.

TipoMaterial
Categorias padronizadas (Ex: "Etilômetro", "Taser", "Viatura").
id (PK)
nome (Unique - String)
Regra: Impede que usuários criem categorias erradas (ex: "Tazer" vs "Taser").

Usuario
Atores do sistema.
id (PK)
identificacao (Unique - Login)
nome, senha
perfil (USUARIO, CONTROLADOR, ADMINISTRADOR, SUPER_ADMIN)
unidadeId (FK) – Todo usuário pertence a um local fixo.


Material (Atualizada)
Inventário físico.
id (PK)
codigoIdentificacao (Unique - Ex: Patrimônio/Barras)
descricao (Detalhes fixos. Ex: "Marca Bosch, Modelo X")
status (DISPONIVEL, EM_USO, MANUTENCAO)
observacaoAtual (String?) – Novo: Guarda o defeito ou motivo do status atual (Ex: "Tela Trincada"). É limpo quando volta a ficar disponível.
tipoId (FK), unidadeId (FK).

Movimentacao
Log histórico de uso diário.
id, dataRetirada, dataDevolucao
obsRetirada, obsDevolucao
usuarioId (Quem usou), respRetiradaId (Quem entregou), respDevolucaoId (Quem recebeu).

Transferencia
Log de mudança de patrimônio entre unidades.
id, dataTransferencia, observacao
origemId, destinoId, materialId, responsavelId.

4. Matriz de Perfis e Permissões
Perfil,Escopo de Visão,Retirada/Devolução,Gestão de Estoque,Admin
USUARIO,Apenas sua Unidade,Apenas para si mesmo,Visualizar apenas,N/A
CONTROLADOR,Apenas sua Unidade,Para si e terceiros,Baixar p/ Manutenção,N/A
ADMINISTRADOR,Apenas sua Unidade,Para si e terceiros,Cadastrar/Editar/Baixar,Relatórios Locais
SUPER_ADMIN,Todas as Unidades,Total,Criar Tipos/Unidades,Transferir entre Unidades

5. Fluxos e Regras de Negócio
A. Regra de Isolamento (Multi-Tenancy)
Todo acesso a dados deve filtrar por unidadeId. Um usuário da "Unidade A" nunca vê materiais da "Unidade B".

B. Fluxo de Retirada (Check-out)
Usuário seleciona item "Disponível".

Identificação:
Se Usuario: O sistema assume que é ele mesmo.
Se Controlador: Seleciona o beneficiário de uma lista.
O sistema muda status para EM_USO.

C. Fluxo de Devolução (Check-in)
Usuário clica em "Devolver" no item.
Preenche observação (opcional).
Decisão de Avaria: Checkbox [ ] Enviar para Manutenção?
Se SIM:
Status vira MANUTENCAO.
Campo observacaoAtual recebe o texto do defeito (Ex: "Bateria viciada").
Automação: Envia e-mail de alerta.
Se NÃO:
Status vira DISPONIVEL.
Campo observacaoAtual é limpo (null).
Log é salvo em Movimentacao.

6. Código Final do Banco de Dados (schema.prisma)
Copie este código para o arquivo prisma/schema.prisma do seu projeto. Ele contém todas as atualizações solicitadas.
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- ENUMS ---

enum Perfil {
  USUARIO
  CONTROLADOR
  ADMINISTRADOR
  SUPER_ADMIN
}

enum StatusMaterial {
  DISPONIVEL
  EM_USO
  MANUTENCAO
}

// --- MODELOS ---

model Unidade {
  id        String   @id @default(uuid())
  nome      String
  endereco  String?
  createdAt DateTime @default(now())

  // Relacionamentos
  usuarios              Usuario[]
  materiais             Material[]
  transferenciasOrigem  Transferencia[] @relation("OrigemUnidade")
  transferenciasDestino Transferencia[] @relation("DestinoUnidade")
}

model TipoMaterial {
  id        String     @id @default(uuid())
  nome      String     @unique // Ex: "Etilômetro", "Taser"
  
  materiais Material[]
}

model Usuario {
  id            String @id @default(uuid())
  identificacao String @unique // Login
  nome          String
  senha         String 
  perfil        Perfil @default(USUARIO)
  
  unidadeId     String
  unidade       Unidade @relation(fields: [unidadeId], references: [id])

  // Logs
  movimentacoesFeitas    Movimentacao[] @relation("Beneficiario")
  retiradasAutorizadas   Movimentacao[] @relation("ResponsavelRetirada")
  devolucoesAutorizadas  Movimentacao[] @relation("ResponsavelDevolucao")
  transferenciasRealizadas Transferencia[]
}

model Material {
  id                  String         @id @default(uuid())
  codigoIdentificacao String         @unique
  descricao           String         // Detalhe fixo do bem
  status              StatusMaterial @default(DISPONIVEL)
  
  // O que está acontecendo agora com o material (Ex: "Tela quebrada")
  // Deve ser limpo quando o status voltar a ser DISPONIVEL
  observacaoAtual     String?        

  // FKs
  unidadeId           String
  unidade             Unidade        @relation(fields: [unidadeId], references: [id])
  tipoId              String
  tipo                TipoMaterial   @relation(fields: [tipoId], references: [id])

  movimentacoes       Movimentacao[]
  transferencias      Transferencia[]
}

model Movimentacao {
  id             String    @id @default(uuid())
  dataRetirada   DateTime  @default(now())
  dataDevolucao  DateTime?
  obsRetirada    String?
  obsDevolucao   String?   // Histórico do que aconteceu
  
  materialId     String
  material       Material  @relation(fields: [materialId], references: [id])

  usuarioId      String
  usuario        Usuario   @relation("Beneficiario", fields: [usuarioId], references: [id])

  respRetiradaId String
  respRetirada   Usuario   @relation("ResponsavelRetirada", fields: [respRetiradaId], references: [id])

  respDevolucaoId String?
  respDevolucao   Usuario?  @relation("ResponsavelDevolucao", fields: [respDevolucaoId], references: [id])
}

model Transferencia {
  id                String   @id @default(uuid())
  dataTransferencia DateTime @default(now())
  observacao        String?

  materialId        String
  material          Material @relation(fields: [materialId], references: [id])

  origemId          String
  origem            Unidade  @relation("OrigemUnidade", fields: [origemId], references: [id])

  destinoId         String
  destino           Unidade  @relation("DestinoUnidade", fields: [destinoId], references: [id])

  responsavelId     String
  responsavel       Usuario  @relation(fields: [responsavelId], references: [id])
}