# 86 — Convite: enforce de limite de plano atômico (Serializable + P2034 retry)

**Status:** Implementado
**Branch:** `fix/convite-limite-plano-atomico` → develop → main
**PRs:** #153 (convite atômico), #154 (maxBarbeiros migration), #155 (squash final)
**Data:** 2026-06-02

---

## Problema

A verificação do limite de barbeiros no `aceitarConvite` era feita **fora da transação**
(consulta pré-transação → insert dentro), criando uma race condition: dois aceites
simultâneos no último slot passavam na verificação antes de qualquer um inserir o membro,
permitindo ultrapassar o cap do plano.

---

## Solução

### 1. Transação SERIALIZABLE

Toda a lógica de `aceitarConvite` foi movida para dentro de uma transação com
`isolationLevel: Prisma.TransactionIsolationLevel.Serializable`. O PostgreSQL aborta
automaticamente uma das transações concorrentes que violariam a serialização, retornando
o erro `P2034`.

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. cria/recupera usuário
  // 2. verifica membroBarbearia existente (re-invite não conta no cap)
  // 3. verifica cap do plano (só se novo membro + perfil barbeiro)
  // 4. cria membroBarbearia (se não existente)
  // 5. claim atômico do convite (updateMany usadoEm: null → now)
}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
```

### 2. Retry loop (P2034)

P2034 pode ser um conflito transiente (dois aceites válidos em uma barbearia com
múltiplas vagas livres). Retentar até 3 vezes antes de reportar conflito:

```typescript
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    usuario = await this.prisma.$transaction(..., { isolationLevel: Serializable });
    break;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      lastP2034 = err;
      continue;
    }
    throw err; // outros erros (ForbiddenException, ConflictException) passam direto
  }
}
if (lastP2034 || !usuario) throw new ConflictException('Conflito simultâneo — tente novamente');
```

### 3. Re-invite não consome vaga

Antes de checar o cap, verifica se o usuário já é membro (`membroBarbearia.findFirst`).
Se for, o aceite atualiza o convite sem criar novo membro — não conta como slot ocupado.

### 4. bcrypt fora da transação

O hash da senha (`bcrypt.hash`) permanece **fora** da transação para não segurar
conexão de banco durante operação CPU-bound lenta.

---

## Arquivos modificados

### API (`apps/api`)

| Arquivo | O que mudou |
|---|---|
| `src/convite/convite.service.ts` | Transação Serializable, retry P2034, check de membro existente antes do cap, bcrypt fora |
| `src/convite/convite.service.spec.ts` | 5 novos testes: ForbiddenException no limite, re-invite pula cap, retry 3x P2034, sucesso no 2º retry, erros desconhecidos relançados |
| `prisma/migrations/20260602000000_fix_free_plan_max_barbeiros/migration.sql` | `UPDATE TQE_PLANO_LIMITE SET maxBarbeiros = 2 WHERE plano = 'free' AND maxBarbeiros = 1` — corrige migration anterior que gravou 1 em vez de 2 |

---

## Cenários cobertos pelos testes

| Cenário | Comportamento esperado |
|---|---|
| Aceite quando cap atingido | `ForbiddenException` com mensagem do limite |
| Re-invite de membro já existente | Ignora cap, aceita normalmente |
| P2034 em todas as 3 tentativas | `ConflictException` "Conflito simultâneo" |
| P2034 na 1ª tentativa, sucesso na 2ª | Retorna tokens normalmente |
| Erro desconhecido dentro da tx | Re-lança sem engolir |
| Convite já utilizado (claim atômico) | `ConflictException` "já foi utilizado" |

---

## Diagrama do fluxo atômico

```
aceitarConvite(token, dto)
  │
  ├─ [fora da tx] valida convite (não expirado, não usado)
  ├─ [fora da tx] valida usuário existente + senha
  ├─ [fora da tx] bcrypt.hash (lento — não segura conexão DB)
  │
  └─ loop (até 3 tentativas)
       └─ $transaction SERIALIZABLE
            ├─ cria/recupera usuário
            ├─ findFirst membroBarbearia (já é membro?)
            ├─ se perfil=barbeiro e NÃO é membro:
            │    ├─ count membros barbeiros
            │    └─ se >= limite → ForbiddenException (propaga, sem retry)
            ├─ cria membroBarbearia (se não existe)
            └─ updateMany convite usadoEm: null → now
                 └─ se count=0 → ConflictException (propaga, sem retry)
       catch P2034 → continua loop
       catch outro → relança
```
