Documentação Técnica: Sistema de Controle de Materiais e Patrimônio (SCMP)

1. Visão Geral

Sistema web para gerenciamento ágil de retirada, devolução e manutenção de materiais e equipamentos. O foco é a eficiência operacional (poucos cliques), rastreabilidade total (logs de auditoria), padronização de cadastros e visibilidade hierárquica em cascata entre unidades organizacionais.

2. Stack Tecnológica

Framework: Next.js (App Router) – Fullstack, seguro e rápido.
Estilização: Tailwind CSS + Shadcn/ui – Interface moderna e responsiva.
Banco de Dados: PostgreSQL.
ORM: Prisma 7.x – Gerenciamento do banco e tipos.
Autenticação: JWT com jose + bcryptjs.

3. Arquitetura de Dados (Modelagem)

O banco é projetado para suportar Hierarquia Organizacional em Cascata, Categorização Rígida e Persistência de Status.

3.1 Estrutura Hierárquica (A Árvore)

O sistema usa auto-relacionamento na tabela Unidade para criar uma árvore hierárquica:

```
CPRv (Superior: null)
  ↳ 2º BPRv (Superior: CPRv)
      ↳ 1ª CIA (Superior: 2º BPRv)
          ↳ 1º PEL (Superior: 1ª CIA)
              ↳ BOP 320/3 (Superior: 1º PEL)
              ↳ BOP 320/2 (Superior: 1º PEL)
      ↳ 3ª CIA (Superior: 2º BPRv)
          ↳ 2º PEL (Superior: 3ª CIA)
              ↳ BOP Centro (Superior: 2º PEL)
  ↳ 3º BPRv (Superior: CPRv)
```

Regra de Visibilidade: Um usuário vê materiais da sua unidade + todas as subordinadas (cascata para baixo).

3.2 Tabelas Principais

Unidade
Locais físicos organizados hierarquicamente.
- id (PK - Int Auto-increment)
- nome (Unique - String) Ex: "BOP 320/3", "1ª CIA", "2º BPRv"
- sigla (String?) Ex: "BOP", "CIA", "PEL", "BPRv", "CPRv"
- endereco (String?)
- unidadeSuperiorId (FK - Int?) – Referência à unidade pai na hierarquia
- subordinadas (Relação) – Lista de unidades filhas
Regra: Criadas apenas via Seed ou SUPER_ADMIN.

TipoMaterial
Categorias padronizadas (Ex: "Etilômetro", "Taser", "Viatura").
- id (PK - Int Auto-increment)
- nome (Unique - String)
Regra: Impede que usuários criem categorias erradas (ex: "Tazer" vs "Taser").

Usuario
Atores do sistema.
- id (PK - Int Auto-increment)
- identificacao (Unique - Login)
- nome, senha (hash bcrypt)
- perfil (USUARIO, CONTROLADOR, ADMINISTRADOR, GESTOR, SUPER_ADMIN)
- unidadeId (FK - Int) – Todo usuário pertence a uma unidade fixa.

Material
Inventário físico.
- id (PK - Int Auto-increment)
- codigoIdentificacao (Unique - Ex: Patrimônio/Barras)
- descricao (Detalhes fixos. Ex: "Marca Bosch, Modelo X")
- status (DISPONIVEL, EM_USO, MANUTENCAO)
- observacaoAtual (String?) – Guarda o defeito ou motivo do status atual.
- tipoId (FK - Int), unidadeId (FK - Int).

Movimentacao
Log histórico de uso diário.
- id (PK - Int Auto-increment), dataRetirada, dataDevolucao
- obsRetirada, obsDevolucao
- usuarioId (FK - Int, Quem usou), respRetiradaId (FK - Int, Quem entregou), respDevolucaoId (FK - Int?, Quem recebeu).

Transferencia
Log de mudança de patrimônio entre unidades.
- id (PK - Int Auto-increment), dataTransferencia, observacao
- origemId (FK - Int), destinoId (FK - Int), materialId (FK - Int), responsavelId (FK - Int).

4. Matriz de Perfis e Permissões (Hierárquica)

| Perfil | Foco de Atuação | Escopo de Visão | Permissões Chave |
|--------|-----------------|-----------------|------------------|
| USUARIO | Operacional (BOP) | Local: Apenas sua unidade | Retirar para si mesmo |
| CONTROLADOR | Gestão Local (BOP/PEL) | Local: Apenas sua unidade | Retirar/Devolver para a tropa local |
| ADMINISTRADOR | Gestão Tática (CIA/PEL) | Regional: Sua unidade + Filhas | Cadastrar Materiais, Editar, Transferir |
| GESTOR | Comando (BPRv) | Regional Ampla: Toda árvore abaixo | Relatórios Avançados, Auditoria, Histórico |
| SUPER_ADMIN | Geral (CPRv/TI) | Global: Todas as unidades | Criar Unidades, Tipos, Gestão do Sistema |

5. Fluxos e Regras de Negócio

A. Regra de Visibilidade Hierárquica (Algoritmo da Árvore)

Quando um usuário loga, o sistema calcula a lista de IDs Permitidos:
1. Pega o ID da unidade do usuário.
2. Se perfil = USUARIO ou CONTROLADOR: lista contém apenas esse ID.
3. Se perfil = ADMINISTRADOR, GESTOR ou SUPER_ADMIN: executa busca recursiva de todas as unidades subordinadas.
4. Resultado: Materiais são filtrados por WHERE unidadeId IN [Lista_Calculada].

Exemplo prático:
- Usuário do "2º BPRv" (GESTOR) vê: 2º BPRv, 1ª CIA, 3ª CIA, 1º PEL, 2º PEL, BOP 320/3, BOP 320/2, BOP Centro.
- Usuário do "3º BPRv" (GESTOR) NÃO vê nada do 2º BPRv (está em "galho" diferente).

B. Fluxo de Retirada (Check-out)
1. Usuário seleciona item "Disponível".
2. Identificação:
   - Se USUARIO: O sistema assume que é ele mesmo.
   - Se CONTROLADOR+: Seleciona o beneficiário de uma lista.
3. O sistema muda status para EM_USO.
4. Log é salvo em Movimentacao.

C. Fluxo de Devolução (Check-in)
1. Usuário clica em "Devolver" no item.
2. Preenche observação (opcional).
3. Decisão de Avaria: [ ] Enviar para Manutenção?
   - Se SIM: Status vira MANUTENCAO, observacaoAtual recebe o defeito.
   - Se NÃO: Status vira DISPONIVEL, observacaoAtual é limpo.
4. Log é salvo em Movimentacao.

6. Código Final do Banco de Dados (schema.prisma)

Nota: No Prisma 7.x, a URL do banco é configurada em prisma.config.ts, não mais no schema.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// --- ENUMS ---

enum Perfil {
  USUARIO       // Operacional (BOP) - Retirar para si
  CONTROLADOR   // Gestão Local (BOP/PEL) - Retirar/Devolver para a tropa
  ADMINISTRADOR // Gestão Tática (CIA/PEL) - Cadastrar, Editar, Transferir
  GESTOR        // Comando (BPRv) - Relatórios, Auditoria, Visão Regional
  SUPER_ADMIN   // Geral (CPRv) - Gestão do Sistema, Visão Global
}

enum StatusMaterial {
  DISPONIVEL
  EM_USO
  MANUTENCAO
}

// --- MODELOS ---

model Unidade {
  id        Int      @id @default(autoincrement())
  nome      String   @unique
  sigla     String?  // Ex: "BOP", "PEL", "CIA", "BPRv", "CPRv"
  endereco  String?
  createdAt DateTime @default(now())

  // Hierarquia Organizacional (Auto-relacionamento)
  unidadeSuperiorId Int?
  unidadeSuperior   Unidade?  @relation("Hierarquia", fields: [unidadeSuperiorId], references: [id])
  subordinadas      Unidade[] @relation("Hierarquia")

  // Relacionamentos
  usuarios              Usuario[]
  materiais             Material[]
  transferenciasOrigem  Transferencia[] @relation("OrigemUnidade")
  transferenciasDestino Transferencia[] @relation("DestinoUnidade")
}

model TipoMaterial {
  id        Int        @id @default(autoincrement())
  nome      String     @unique // Ex: "Etilômetro", "Taser"
  
  materiais Material[]
}

model Usuario {
  id            Int    @id @default(autoincrement())
  identificacao String @unique // Login
  nome          String
  senha         String 
  perfil        Perfil @default(USUARIO)
  
  unidadeId     Int
  unidade       Unidade @relation(fields: [unidadeId], references: [id])

  // Logs
  movimentacoesFeitas    Movimentacao[] @relation("Beneficiario")
  retiradasAutorizadas   Movimentacao[] @relation("ResponsavelRetirada")
  devolucoesAutorizadas  Movimentacao[] @relation("ResponsavelDevolucao")
  transferenciasRealizadas Transferencia[]
}

model Material {
  id                  Int            @id @default(autoincrement())
  codigoIdentificacao String         @unique
  descricao           String         // Detalhe fixo do bem
  status              StatusMaterial @default(DISPONIVEL)
  
  // O que está acontecendo agora com o material (Ex: "Tela quebrada")
  // Deve ser limpo quando o status voltar a ser DISPONIVEL
  observacaoAtual     String?        

  // FKs
  unidadeId           Int
  unidade             Unidade        @relation(fields: [unidadeId], references: [id])
  tipoId              Int
  tipo                TipoMaterial   @relation(fields: [tipoId], references: [id])

  movimentacoes       Movimentacao[]
  transferencias      Transferencia[]
}

model Movimentacao {
  id             Int       @id @default(autoincrement())
  dataRetirada   DateTime  @default(now())
  dataDevolucao  DateTime?
  obsRetirada    String?
  obsDevolucao   String?   // Histórico do que aconteceu
  
  materialId     Int
  material       Material  @relation(fields: [materialId], references: [id])

  usuarioId      Int
  usuario        Usuario   @relation("Beneficiario", fields: [usuarioId], references: [id])

  respRetiradaId Int
  respRetirada   Usuario   @relation("ResponsavelRetirada", fields: [respRetiradaId], references: [id])

  respDevolucaoId Int?
  respDevolucao   Usuario?  @relation("ResponsavelDevolucao", fields: [respDevolucaoId], references: [id])
}

model Transferencia {
  id                Int      @id @default(autoincrement())
  dataTransferencia DateTime @default(now())
  observacao        String?

  materialId        Int
  material          Material @relation(fields: [materialId], references: [id])

  origemId          Int
  origem            Unidade  @relation("OrigemUnidade", fields: [origemId], references: [id])

  destinoId         Int
  destino           Unidade  @relation("DestinoUnidade", fields: [destinoId], references: [id])

  responsavelId     Int
  responsavel       Usuario  @relation(fields: [responsavelId], references: [id])
}
```

7. Usuários de Teste (Seed)

| Identificação | Senha | Perfil | Unidade |
|---------------|-------|--------|---------|
| superadmin | 123456 | SUPER_ADMIN | CPRv |
| gestor | 123456 | GESTOR | 2º BPRv |
| admin | 123456 | ADMINISTRADOR | 1ª CIA |
| controlador | 123456 | CONTROLADOR | 1º PEL |
| usuario | 123456 | USUARIO | BOP 320/3 |
