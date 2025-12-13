# Documentação Técnica: Sistema de Controle de Materiais e Patrimônio (LCMP)

## 1. Visão Geral

Sistema web para gerenciamento ágil de retirada, devolução e manutenção de materiais e equipamentos. O foco é a eficiência operacional (poucos cliques), rastreabilidade total (logs de auditoria), padronização de cadastros e visibilidade hierárquica em cascata entre unidades organizacionais.

## 2. Stack Tecnológica

| Tecnologia | Descrição |
|------------|-----------|
| **Framework** | Next.js 16.x (App Router) – Fullstack, seguro e rápido |
| **Estilização** | Tailwind CSS + Shadcn/ui – Interface moderna e responsiva |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma 7.x – Gerenciamento do banco e tipos |
| **Autenticação** | JWT com jose + bcryptjs |
| **E-mail** | Resend + React Email – Envio de emails transacionais |

## 3. Arquitetura de Dados (Modelagem)

O banco é projetado para suportar Hierarquia Organizacional em Cascata, Categorização Rígida e Persistência de Status.

### 3.1 Estrutura Hierárquica (A Árvore)

O sistema usa auto-relacionamento na tabela Unidade para criar uma árvore hierárquica:

```
CPRV (Superior: null)
  ↳ 3 BPRV (Superior: CPRV)
      ↳ 3 CIA (Superior: 3 BPRV)
          ↳ 3 PEL (Superior: 3 CIA)
              ↳ BOP 320/1 (Superior: 3 PEL)
              ↳ BOP 320/2 (Superior: 3 PEL)
              ↳ BOP 320/3 (Superior: 3 PEL)
```

**Regra de Visibilidade:** Um usuário vê materiais da sua unidade + todas as subordinadas (cascata para baixo).

### 3.2 Tabelas Principais

#### Unidade
Locais físicos organizados hierarquicamente.
- `id` (PK - Int Auto-increment)
- `nome` (Unique - String) Ex: "BOP 320/3", "3 CIA", "3 BPRV"
- `sigla` (String?) Ex: "BOP", "CIA", "PEL", "BPRV", "CPRV"
- `endereco` (String?)
- `unidadeSuperiorId` (FK - Int?) – Referência à unidade pai na hierarquia
- `subordinadas` (Relação) – Lista de unidades filhas

**Regra:** Criadas via Seed ou por GESTOR (para subunidades).

#### TipoMaterial
Categorias padronizadas (Ex: "Etilômetro", "Taser", "Viatura").
- `id` (PK - Int Auto-increment)
- `nome` (Unique - String)

**Regra:** Impede que usuários criem categorias erradas (ex: "Tazer" vs "Taser").

#### Usuario
Atores do sistema.
- `id` (PK - Int Auto-increment)
- `identificacao` (Unique - Login)
- `nome`, `senha` (hash bcrypt)
- `email` (Unique - String) – Obrigatório para login/recuperação
- `perfil` (USUARIO, CONTROLADOR, GESTOR)
- `ativo` (Boolean) – Se o usuário está ativo
- `resetToken` (String?) – Token para recuperação de senha
- `resetExpires` (DateTime?) – Validade do token
- `unidadeId` (FK - Int) – Todo usuário pertence a uma unidade fixa.

#### Material
Inventário físico.
- `id` (PK - Int Auto-increment)
- `codigoIdentificacao` (Unique - Ex: Patrimônio/Barras)
- `descricao` (Detalhes fixos. Ex: "Marca Bosch, Modelo X")
- `status` (DISPONIVEL, EM_USO, MANUTENCAO)
- `observacaoAtual` (String?) – Guarda o defeito ou motivo do status atual.
- `tipoId` (FK - Int), `unidadeId` (FK - Int).

#### Movimentacao
Log histórico de uso diário.
- `id` (PK - Int Auto-increment), `dataRetirada`, `dataDevolucao`
- `obsRetirada`, `obsDevolucao`
- `usuarioId` (FK - Int, Quem usou), `respRetiradaId` (FK - Int, Quem entregou), `respDevolucaoId` (FK - Int?, Quem recebeu).

#### Transferencia
Log de mudança de patrimônio entre unidades.
- `id` (PK - Int Auto-increment), `dataTransferencia`, `observacao`
- `origemId` (FK - Int), `destinoId` (FK - Int), `materialId` (FK - Int), `responsavelId` (FK - Int).

## 4. Matriz de Perfis e Permissões (Hierárquica)

| Perfil | Foco de Atuação | Escopo de Visão | Permissões Chave |
|--------|-----------------|-----------------|------------------|
| USUARIO | Operacional (BOP) | Local: Apenas sua unidade | Retirar para si mesmo |
| CONTROLADOR | Gestão Local (BOP/PEL) | Local: Apenas sua unidade | Retirar/Devolver para a tropa local |
| Gestão Tática (CIA/PEL) | Regional: Sua unidade + Filhas | Cadastrar Materiais, Editar, Transferir |
| GESTOR | Comando (BPRv) | Regional Ampla: Toda árvore abaixo | Relatórios Avançados, Auditoria, Histórico, Concluir Manutenção |
| Geral (CPRv/TI) | Global: Todas as unidades | Criar Unidades, Tipos, Gestão do Sistema |

## 5. Fluxos e Regras de Negócio

### A. Regra de Visibilidade Hierárquica (Algoritmo da Árvore)

Quando um usuário loga, o sistema calcula a lista de IDs Permitidos:
1. Pega o ID da unidade do usuário.
2. Se perfil = USUARIO ou CONTROLADOR: lista contém apenas esse ID.
3. Se perfil = GESTOR: executa busca recursiva de todas as unidades subordinadas.
4. Resultado: Materiais são filtrados por `WHERE unidadeId IN [Lista_Calculada]`.

**Exemplo prático:**
- Usuário do "3 BPRV" (GESTOR) vê: 3 BPRV, 3 CIA, 3 PEL, BOP 320/1, BOP 320/2, BOP 320/3.
- Usuário do "BOP 320/1" (USUARIO) NÃO vê nada do BOP 320/2 ou BOP 320/3.

### B. Fluxo de Retirada (Check-out)
1. Usuário seleciona item "Disponível".
2. Identificação:
   - Se USUARIO: O sistema assume que é ele mesmo (retirada direta).
   - Se CONTROLADOR+: Seleciona o beneficiário de uma lista com busca.
3. O sistema muda status para `EM_USO`.
4. Log é salvo em `Movimentacao`.
5. Mensagem de confirmação é exibida.

### C. Fluxo de Devolução (Check-in)
1. CONTROLADOR ou GESTOR clica em "Devolver" no item (USUARIO não vê este botão).
2. Preenche observação (opcional).
3. Decisão de Avaria: [ ] Enviar para Manutenção?
   - Se SIM: Status vira `MANUTENCAO`, `observacaoAtual` recebe o defeito.
   - Se NÃO: Status vira `DISPONIVEL`, `observacaoAtual` é limpo.
4. Log é salvo em `Movimentacao`.

### D. Fluxo de Manutenção (Conclusão)
1. Apenas GESTOR vê o botão "Concluir Manutenção" em materiais com status `MANUTENCAO`.
2. Ao clicar, abre modal de confirmação.
3. Status muda para `DISPONIVEL`, `observacaoAtual` é limpo.
4. Material volta a ficar disponível para retirada.

---

## 6. Funcionalidades Implementadas

### 6.1 Interface Visual

- **Design System:** Tema profissional com cores orange/amber e fundo slate
- **Sidebar:** Menu lateral com logo "LCMP Policial", navegação por ícones, logout
- **Header:** Breadcrumbs, exibição da hierarquia da unidade (ex: "BOP3 > 3PEL > 3CIA > 3BPRV"), avatar do usuário
- **Cards:** Design padronizado com bordas arredondadas, ícones por tipo de material, badges de status coloridos
- **Botões:** Estilo consistente com altura h-12, bordas arredondadas xl, cores padronizadas
- **Responsividade:** Layout adaptável para mobile e desktop

### 6.2 Painel de Controle (Dashboard)

**Localização:** `/dashboard`

**Filtros:**
- **Busca por texto:** Ativa após 3 caracteres, busca por código ou nome do material
- **Filtro por Tipo:** Dropdown dinâmico com tipos cadastrados no banco
- **Filtro por Status:** Dropdown com opções Todos, Disponível (padrão), Em Uso, Manutenção
- **Debounce:** 400ms para otimização de performance na busca

**Cards de Material:**
- Exibem: ícone do tipo, nome, código, unidade, status com badge colorido
- Se `EM_USO`: Mostra nome do usuário em posse e observação (se houver)
- Se `MANUTENCAO`: Mostra observação do defeito
- Botões de ação conforme perfil do usuário

### 6.3 Modal de Retirada

**Funcionalidade:** Permite retirar material para uso

**Regras por Perfil:**
- **USUARIO:** Retira automaticamente para si mesmo (sem seleção)
- **CONTROLADOR/GESTOR:** Pode selecionar qualquer usuário via busca

**Componentes:**
- Campo de observação opcional
- Busca de usuários com API (`/api/usuarios/buscar`)
- Validação: só permite retirada se status = `DISPONIVEL`
- Feedback de sucesso/erro

### 6.4 Modal de Devolução

**Funcionalidade:** Permite devolver material em uso

**Acesso:** Apenas CONTROLADOR e GESTOR

**Campos:**
- Observação de devolução (opcional)
- Checkbox "Enviar para manutenção"

**Comportamento:**
- Se checkbox marcado: Status → `MANUTENCAO`, observação salva em `observacaoAtual`
- Se checkbox desmarcado: Status → `DISPONIVEL`, `observacaoAtual` limpo

### 6.5 Modal de Concluir Manutenção

**Funcionalidade:** Conclui manutenção e disponibiliza material

**Acesso:** Apenas GESTOR

**Comportamento:**
- Status → `DISPONIVEL`
- `observacaoAtual` → null
- Material fica disponível para novas retiradas

### 6.6 Minhas Retiradas

**Localização:** `/dashboard/retiradas`

**Funcionalidade:** Lista materiais em posse do usuário logado

**Características:**
- Cards no mesmo padrão do dashboard
- Mostra data de retirada e observação
- Botão "Devolver" apenas para CONTROLADOR/GESTOR

### 6.7 Controle de Efetivo

**Localização:** `/dashboard/devolucao`

**Acesso:** CONTROLADOR e GESTOR

**Funcionalidade:** Visualiza todos os usuários com materiais em posse

**Características:**
- Cards por usuário mostrando: nome, unidade, lista de materiais
- Filtro de busca (3+ caracteres) por nome, equipamento ou qualquer texto do card
- Botão "Devolver" individual por material
- Botão "Devolver Todos" para devolução rápida sem observação
- Modal de confirmação para "Devolver Todos"

### 6.8 Histórico de Movimentações

**Localização:** `/dashboard/historico`

**Funcionalidade:** Exibe histórico de retiradas e devoluções do usuário

**Filtros:**
- Busca por material ou código
- Status: Todos, Em Posse, Devolvido
- Período: Últimas 24h, Últimos 7 dias, Últimos 30 dias

**Características:**
- Tabela paginada com integração ao banco de dados
- Colunas: Material, Código, Data Retirada, Data Devolução, Status, Observação
- Paginação com controle de página e total de registros

### 6.9 Relatórios Avançados

**Localização:** `/dashboard/relatorios`

**Acesso:** Apenas GESTOR

**Funcionalidade:** Consulta histórico de movimentações por material ou usuário

**Características:**
- **Tabs:** "Histórico do Material" e "Histórico do Usuário"
- **Combobox de busca:** Ativa com 3+ caracteres
- **Filtro de data:** DateRangePicker opcional
- **Tabela paginada:** 15 registros por página
- **Badge "Pendente":** Destaca devoluções não realizadas
- **Formatação pt-BR:** Datas no formato dd/MM/yyyy HH:mm

**Colunas da Tabela (Por Material):**
- Policial (quem usou)
- Retirada (data/hora)
- Responsável Retirada
- Devolução (data/hora)
- Responsável Devolução
- Observações

### 6.10 Recuperação de Senha

**Localização:** Link "Esqueci minha senha" na tela de login

**Funcionalidade:** Permite recuperar senha via email

**Fluxo:**
1. Usuário clica em "Esqueci minha senha" no login
2. Insere email cadastrado no modal
3. Sistema gera token seguro (crypto) com 1h de validade
4. Email é enviado via Resend com link de recuperação
5. Usuário acessa link e define nova senha
6. Token é invalidado após uso

**Componentes:**
- `EsqueciSenhaModal` – Modal de solicitação
- `reset-password/page.tsx` – Página de redefinição
- `ResetEmail` – Template de email profissional

**Segurança:**
- Token gerado com `crypto.randomBytes(32)`
- Expiração em 1 hora
- Mensagem genérica (não revela se email existe)
- Hash bcrypt para nova senha

---

## 7. Estrutura de Arquivos

```
app/
├── dashboard/
│   ├── page.tsx              # Painel principal
│   ├── layout.tsx            # Layout com sidebar e header
│   ├── actions.ts            # Server action de logout
│   ├── retirada-actions.ts   # Server action de retirada
│   ├── devolucao-actions.ts  # Server action de devolução
│   ├── manutencao-actions.ts # Server action de manutenção
│   ├── retiradas/
│   │   └── page.tsx          # Minhas Retiradas
│   ├── efetivo/
│   │   └── page.tsx          # Controle de Efetivo
│   └── historico/
│       └── page.tsx          # Histórico de Movimentações
├── api/
│   └── usuarios/
│       └── buscar/
│           └── route.ts      # API de busca de usuários
├── login/
│   ├── page.tsx              # Página de login
│   ├── actions.ts            # Server actions (login, reset password)
│   ├── esqueci-senha-modal.tsx # Modal de recuperação
│   └── reset-password/
│       └── page.tsx          # Página de redefinição de senha


components/
└── dashboard/
    ├── sidebar.tsx           # Menu lateral
    ├── header.tsx            # Cabeçalho com breadcrumbs
    ├── material-card.tsx     # Card de material
    ├── material-filters.tsx  # Filtros do dashboard
    ├── modal-retirada.tsx    # Modal de retirada
    ├── modal-devolucao.tsx   # Modal de devolução
    ├── modal-manutencao.tsx  # Modal de manutenção
    ├── modal-confirmacao.tsx # Modal de confirmação genérico
    ├── card-usuario-efetivo.tsx # Card de usuário no efetivo
    ├── efetivo-lista.tsx     # Lista filtrável do efetivo
    ├── historico-filtros.tsx # Filtros do histórico
    └── paginacao.tsx         # Componente de paginação
└── emails/
    └── reset-email.tsx       # Template de email para reset de senha

lib/
├── prisma.ts                 # Cliente Prisma
├── auth.ts                   # Funções de autenticação
├── permissions.ts            # Lógica de permissões
└── unidade.ts                # Funções de hierarquia de unidade
```

---

## 8. Código do Banco de Dados (schema.prisma)

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
  GESTOR        // Comando (BPRv) - Relatórios, Auditoria, Visão Regional
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
  sigla     String?
  endereco  String?
  createdAt DateTime @default(now())

  unidadeSuperiorId Int?
  unidadeSuperior   Unidade?  @relation("Hierarquia", fields: [unidadeSuperiorId], references: [id])
  subordinadas      Unidade[] @relation("Hierarquia")

  usuarios              Usuario[]
  materiais             Material[]
  transferenciasOrigem  Transferencia[] @relation("OrigemUnidade")
  transferenciasDestino Transferencia[] @relation("DestinoUnidade")
}

model TipoMaterial {
  id        Int        @id @default(autoincrement())
  nome      String     @unique
  materiais Material[]
}

model Usuario {
  id            Int       @id @default(autoincrement())
  identificacao String    @unique
  nome          String
  email         String    @unique
  senha         String 
  perfil        Perfil    @default(USUARIO)
  ativo         Boolean   @default(true)
  
  // Campos para recuperação de senha
  resetToken    String?   @unique
  resetExpires  DateTime?
  
  unidadeId     Int
  unidade       Unidade @relation(fields: [unidadeId], references: [id])

  movimentacoesFeitas    Movimentacao[] @relation("Beneficiario")
  retiradasAutorizadas   Movimentacao[] @relation("ResponsavelRetirada")
  devolucoesAutorizadas  Movimentacao[] @relation("ResponsavelDevolucao")
  transferenciasRealizadas Transferencia[]
}

model Material {
  id                  Int            @id @default(autoincrement())
  codigoIdentificacao String         @unique
  descricao           String
  status              StatusMaterial @default(DISPONIVEL)
  observacaoAtual     String?        

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
  obsDevolucao   String?
  
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

---

## 9. Usuários de Teste (Seed)

### Estrutura de Unidades

| Unidade | Sigla | Unidade Superior |
|---------|-------|------------------|
| CPRV | CPRV | - |
| 3 BPRV | 3BPRV | CPRV |
| 3 CIA | 3CIA | 3 BPRV |
| 3 PEL | 3PEL | 3 CIA |
| BOP 320/1 | BOP1 | 3 PEL |
| BOP 320/2 | BOP2 | 3 PEL |
| BOP 320/3 | BOP3 | 3 PEL |

### Usuários

| Unidade | Usuário 1 | Usuário 2 |
|---------|-----------|-----------|
| BOP 320/1 | sd.silva (USUARIO) | cb.costa (CONTROLADOR) |
| BOP 320/2 | sd.santos (USUARIO) | cb.lima (CONTROLADOR) |
| BOP 320/3 | sd.gomes (USUARIO) | maj.silva (GESTOR) |
| 3 PEL | sgt.oliveira (CONTROLADOR) |
| 3 CIA | maj.ferreira (GESTOR) |
| 3 BPRV | cel.rodrigues (GESTOR) | tc.mendes (GESTOR) |

**Senha padrão para todos:** `123456`

### Materiais por Unidade

Cada unidade possui 4 materiais de tipos variados:
- Etilômetro, Taser, Colete Balístico, Viatura, Algema, Rádio Comunicador

---

## 10. Próximas Funcionalidades (Roadmap)

- [x] Relatórios e Dashboards Gerenciais (GESTOR+)
- [x] Recuperação de Senha via Email
- [ ] Auditoria e Logs de Sistema (GESTOR+)
- [ ] Exportação de Relatórios (PDF/Excel)
- [ ] Notificações de Materiais em Manutenção prolongada
- [ ] Cadastro de Usuários pelo GESTOR
- [ ] Transferência de Materiais entre Unidades

---

## 11. Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Reset do banco e seed
npx prisma db push --force-reset
npx prisma db seed

# Gerar cliente Prisma
npx prisma generate

# Visualizar banco
npx prisma studio

# Variáveis de ambiente necessárias (.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="seu_secret"
RESEND_API_KEY="re_xxxxxxxxxx"  # Para envio de emails
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Opcional, para produção
```

---

**Última atualização:** Dezembro/2025
