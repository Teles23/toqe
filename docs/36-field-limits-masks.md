# Limites de Campo e Máscaras (Web + Mobile)

## Resumo

Implementação de `maxLength` em todos os campos de formulário e máscaras de entrada nos campos que precisam de formato específico. A fonte de verdade é sempre `packages/contracts/src/schemas/`.

## Schemas Zod corrigidos

| Schema                                       | Campo        | Alteração                                                         |
| -------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| `auth.ts` / `loginSchema`                    | `email`      | Adicionado `.max(100)`                                            |
| `auth.ts` / `loginSchema`                    | `senha`      | Adicionado `.max(128)`                                            |
| `auth.ts` / `registerSchema`                 | `nome`       | Adicionado `.max(100)`                                            |
| `auth.ts` / `registerSchema`                 | `email`      | Adicionado `.max(100)`                                            |
| `auth.ts` / `registerSchema`                 | `senha`      | Adicionado `.max(128)`                                            |
| `auth.ts` / `registerSchema`                 | `telefone`   | Adicionado regex + `.max(20)`                                     |
| `auth.ts` / `criarClienteRapidoSchema`       | `nome`       | Adicionado `.max(100)`                                            |
| `auth.ts` / `criarClienteRapidoSchema`       | `email`      | Adicionado `.max(100)`                                            |
| `auth.ts` / `criarClienteRapidoSchema`       | `telefone`   | Adicionado regex + `.max(20)`                                     |
| `auth.ts` / `forgotPasswordSchema`           | `email`      | Adicionado `.max(100)`                                            |
| `auth.ts` / `resetPasswordSchema`            | `novaSenha`  | Adicionado `.max(128)`                                            |
| `auth.ts` / `changePasswordSchema`           | `senhaAtual` | Adicionado `.max(128)`                                            |
| `auth.ts` / `changePasswordSchema`           | `novaSenha`  | Adicionado `.max(128)`                                            |
| `auth.ts` / `twoFaSetupSchema`               | `code`       | Adicionado `.regex(/^\d{6}$/)`                                    |
| `auth.ts` / `twoFaVerifySchema`              | `code`       | Adicionado `.regex(/^\d{6}$/)`                                    |
| `agendamento.ts` / `createAgendamentoSchema` | `observacao` | Campo novo — `.max(500).optional()`                               |
| `agenda.ts` / `createBloqueioSchema`         | `motivo`     | Corrigido `.max(200)` → `.max(100)` (alinhado ao DB VarChar(100)) |

## Tabela completa de limites

| Campo                      | Tabela              | DB                | Zod                      | maxLength UI | Máscara              |
| -------------------------- | ------------------- | ----------------- | ------------------------ | ------------ | -------------------- |
| `nome` (usuário)           | TQE_USUARIO         | VarChar(100)      | min 2, max 100           | 100          | —                    |
| `email` (usuário)          | TQE_USUARIO         | VarChar(100)      | email, max 100           | 100          | —                    |
| `telefone` (usuário)       | TQE_USUARIO         | VarChar(20)       | regex, max 20            | 20           | `(XX) XXXXX-XXXX`    |
| `senha`                    | —                   | VarChar(255) hash | min 6, max 128           | 128          | secureTextEntry      |
| `nome` (barbearia)         | TQE_BARBEARIA       | VarChar(100)      | min 2, max 100           | 100          | —                    |
| `slug`                     | TQE_BARBEARIA       | VarChar(60)       | min 3, max 60, regex     | 60           | lowercase + hífens   |
| `telefone` (barbearia)     | —                   | —                 | regex, max 20            | 20           | `(XX) XXXXX-XXXX`    |
| `email` (barbearia)        | —                   | —                 | email, max 100           | 100          | —                    |
| `endereco`                 | —                   | —                 | max 200                  | 200          | —                    |
| `nome` (serviço)           | TQE_SERVICO         | VarChar(100)      | min 2, max 100           | 100          | —                    |
| `descricao` (serviço)      | TQE_SERVICO         | Text              | max 500                  | 500          | multiline + contador |
| `precoBase`                | TQE_SERVICO         | Decimal(10,2)     | min 0, max 9999.99       | —            | min/max HTML         |
| `duracaoBase`              | TQE_SERVICO         | Int               | min 5, max 480           | —            | min/max HTML         |
| `observacao`               | TQE_AGENDAMENTO     | Text              | max 500                  | 500          | multiline + contador |
| `motivo` (bloqueio)        | TQE_BLOQUEIO_AGENDA | VarChar(100)      | max 100                  | 100          | —                    |
| `corPrimaria` / `corFundo` | TQE_TEMA_TENANT     | VarChar(7)        | regex #RRGGBB            | 7            | —                    |
| `subdominio`               | TQE_TEMA_TENANT     | VarChar(60)       | min 3, max 60, regex     | 60           | lowercase + hífens   |
| `code` (2FA)               | —                   | —                 | length(6), regex `\d{6}` | 6            | numérico             |

## Utilitários de máscara

### Web — `apps/web/src/shared/utils/masks.ts`

- `maskTelefone(value)` — formata `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`
- `maskSlug(value)` — lowercase, substitui espaços por hífens, remove inválidos
- `maskCurrency(value)` — formata `R$ 1.234,56`
- `parseCurrency(masked)` — parseia valor monetário mascarado para `number`

### Mobile — `apps/mobile/src/shared/utils/masks.ts`

- Mesma implementação que o web (intencionalmente duplicado — pipelines de build separados)

## Formulários atualizados

### Web

- `LoginForm.tsx` — email/senha
- `ForgotPasswordForm.tsx` — email
- `ResetPasswordForm.tsx` — novaSenha/confirmarSenha (schema local também corrigido)
- `SecaoSeguranca.tsx` — campos de senha
- `SecaoBarbearia.tsx` — nome, telefone (máscara), email, endereço
- `ServicoModal.tsx` — nome, precoBase (max), duracaoBase (max), descricao (maxLength + contador)
- `ClienteModal.tsx` — nome, email, telefone (máscara)
- `BarbeiroModal.tsx` — email
- `AgendamentoModal.tsx` — campo observacao adicionado (maxLength + contador)
- `onboarding/page.tsx` — todos os campos da conta, barbearia e serviços

### Mobile

- `login.tsx` — email, senha
- `cadastro.tsx` — nome, email, telefone (máscara), senha, confirmarSenha
- `perfil/editar.tsx` — nome, telefone (máscara)
- `perfil/senha.tsx` — senhaAtual, novaSenha, confirmar (schema local corrigido)
- `AdicionarWalkInModal.tsx` — nome, email, telefone (máscara), schema local corrigido
