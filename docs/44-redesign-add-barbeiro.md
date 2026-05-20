# 44 — Redesign da tela de Adicionar Barbeiro

| Campo      | Valor                        |
| ---------- | ---------------------------- |
| **Status** | ✅ Completo                  |
| **Branch** | `feat/redesign-add-barbeiro` |
| **Base**   | `feat/redesign-onboarding`   |

---

## Contexto

Redesign completo do modal de convite de barbeiro, convertido de um dialog simples para um **drawer lateral deslizante** (slide from right), seguindo a linguagem editorial/urbana inaugurada pelo redesign de login e onboarding.

O componente passou de um dialog minimalista (só e-mail + perfil) para um formulário guiado com 5 seções, animado com Framer Motion, com CSS tokens próprios (`tqe-ab-*`) definidos em `globals.css`.

---

## Arquivos criados

| Arquivo                                                             | Descrição                                            |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/web/src/features/barbeiros/components/BarbeiroModal.spec.tsx` | 10 testes Vitest para o drawer de adicionar barbeiro |
| `docs/44-redesign-add-barbeiro.md`                                  | Este documento                                       |

## Arquivos modificados

| Arquivo                                                        | Mudança                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/web/src/features/barbeiros/components/BarbeiroModal.tsx` | Reescrito como drawer lateral completo (5 seções, ~480 linhas) |
| `apps/web/src/app/globals.css`                                 | +350 linhas: design system do drawer (`tqe-ab-*`)              |

---

## Arquitetura do drawer

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Overlay semitransparente (backdrop)                     │
│  ┌───────────────────────────────────┐                  │
│  │  aside.tqe-ab-drawer (500px)     │                  │
│  │  ──────────────────────────────   │                  │
│  │  Header: título + ProgressBar    │                  │
│  │                                   │                  │
│  │  01 · Quem é ele?                │                  │
│  │  02 · Contato e acesso           │                  │
│  │  03 · Serviços que faz           │                  │
│  │  04 · Quando trabalha            │                  │
│  │  05 · Comissão                   │                  │
│  │                                   │                  │
│  │  Footer: [Convidar barbeiro →]   │                  │
│  └───────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

### Seções

| #   | Título           | Campos                                                                                                                     |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Quem é ele?      | Nome completo, apelido/exibição, avatar color picker                                                                       |
| 2   | Contato e acesso | Telefone, e-mail, perfil (barbeiro/gerente/recepcionista), método de acesso (link e-mail / magic link WhatsApp — em breve) |
| 3   | Serviços que faz | Checklist dinâmico de serviços (via `useServicos`)                                                                         |
| 4   | Quando trabalha  | Toggle "herdar horário da barbearia" ou tabela semanal custom                                                              |
| 5   | Comissão         | Modelo: % por serviço / R$ fixo por serviço / Salário fixo                                                                 |

### Estados do drawer

```
form  →  (submit com sucesso)  →  success
success  →  (+ Adicionar outro)  →  form (resetado)
success  →  (Voltar à equipe)  →  onClose()
```

### Animação

```typescript
// slide from right via Framer Motion
initial={{ x: "100%" }}
animate={{ x: 0 }}
exit={{ x: "100%" }}
transition={{ type: "spring", stiffness: 320, damping: 32 }}
```

---

## API

O componente chama apenas `convidar.mutate({ email, perfil })` — os campos extras da UI (nome, telefone, serviços, horário, comissão) são UX local, aguardando suporte backend. A integração atual é intencional e documentada em comentário no componente.

### Método de acesso

| Opção               | Status      | Implementação                             |
| ------------------- | ----------- | ----------------------------------------- |
| Link por e-mail     | ✅ Ativo    | `convidar.mutate({ email, perfil })`      |
| Magic link WhatsApp | 🔜 Em breve | Visível mas `disabled` + badge "EM BREVE" |

---

## Sub-componentes internos

| Componente          | Responsabilidade                                                    |
| ------------------- | ------------------------------------------------------------------- |
| `Toggle`            | Switch on/off estilizado com CSS tokens                             |
| `SectionTitle`      | Numeração + título da seção (ex: "01 · Quem é ele?")                |
| `Field`             | Label + input wrapper com slot de erro                              |
| `PickBtn`           | Botão de seleção mutualmente exclusiva (perfil, modelo de comissão) |
| `AvatarPicker`      | Grade de cores para avatar do barbeiro                              |
| `ScheduleTable`     | Tabela de horários semanais com toggles e inputs de hora            |
| `CommissionSection` | Seletor de modelo + input de valor                                  |
| `ProgressBar`       | Barra de progresso visual baseada no preenchimento do formulário    |
| `SuccessScreen`     | Tela de confirmação pós-convite com card preview                    |

---

## Testes — `BarbeiroModal.spec.tsx` (10 testes)

| Teste                                                  |
| ------------------------------------------------------ |
| Renderiza o drawer com título e 5 seções               |
| Botão "Convidar →" está desabilitado sem nome e e-mail |
| Botão habilita ao preencher nome e e-mail válido       |
| Magic link WhatsApp está desabilitado visualmente      |
| Badge "EM BREVE" aparece ao lado do magic link         |
| Renderiza lista de serviços da API                     |
| Toggle de serviço atualiza contagem de selecionados    |
| Submit chama `convidar.mutate` com email e perfil      |
| Exibe tela de sucesso após convite enviado             |
| "Adicionar outro" reseta o formulário e volta ao form  |

---

## Validação pré-commit

```bash
# Lint
pnpm --filter web lint        # ✅

# Tipos
cd apps/web && npx tsc --noEmit   # ✅

# Testes
pnpm --filter web test -- src/features/barbeiros/components/BarbeiroModal.spec.tsx --run
# 10/10 ✅
pnpm --filter web test -- --run   # 146/146 ✅
```

---

## Reutilizações (sem código novo desnecessário)

- `useServicos(barCodigo)` — `@/features/servicos/hooks/use-servicos`
- `useBarbeiroMutations` — `../hooks/use-barbeiros` (hook existente, sem alteração)
- `useAuth` — `@/shared/hooks/use-auth`
- `maskTelefone` — `@/shared/utils/masks`
- Design tokens CSS (`var(--primary)`, `var(--bg-card)`, `var(--text-*)`, etc.) — `globals.css`
- Framer Motion (`motion`, `AnimatePresence`) — já em uso no projeto
