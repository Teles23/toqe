# 28 — Funcionalidade: Novo Agendamento (feedback + testes)

**Status:** Concluído
**Branch:** feature/novo-agendamento
**Base:** develop

---

## Contexto

O scaffold da funcionalidade de criar agendamentos já existia:
botão "Novo agendamento", modal com formulário, service e hook de mutation.
Faltavam três itens para considerar a feature completa:

1. Feedback de erro/sucesso ao usuário
2. Handlers MSW com a URL correta para os testes
3. Testes de componente para o `AgendamentoModal`

---

## Problemas resolvidos

### 1. MSW handlers com URL errada

**Causa:** Os handlers de agendamento apontavam para
`/barbearias/:barCodigo/agendamentos`, mas o service usa `tenantApi` que
chama `/agendamentos` com header `x-tenant-id`. Testes que dependessem do
MSW retornariam 404/unhandled silenciosamente.

**Correção:**

```typescript
// Antes
http.get(`${BASE}/barbearias/:barCodigo/agendamentos`, () => HttpResponse.json([]))
http.post(`${BASE}/barbearias/:barCodigo/agendamentos`, ...)

// Depois
http.get(`${BASE}/agendamentos`, () => HttpResponse.json([]))
http.post(`${BASE}/agendamentos`, async ({ request }) => { ... })
```

O handler relativo `http.get("/agendamentos", ...)` foi mantido porque é
usado diretamente pelo `setup.spec.ts`.

---

### 2. Sem feedback ao usuário no `AgendamentoModal`

**Causa:** O `onSubmit` do modal chamava `criar.mutate(data, { onSuccess: onClose })`
sem tratar erros. Qualquer falha (conflito de horário, erro de rede, etc.)
era silenciada.

**Correção:** Adicionado toast de sucesso/erro e exibição de erro inline:

```typescript
import { toast } from "sonner";

function onSubmit(data: CreateAgendamentoInput) {
  criar.mutate(data, {
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
```

Bloco de erro inline adicionado acima dos botões de ação:

```tsx
{
  criar.isError && (
    <p
      className="text-[12px] px-5 pb-2"
      style={{ color: "var(--status-error)" }}
    >
      {criar.error.message}
    </p>
  );
}
```

A mensagem exibida é sempre a mensagem real do servidor — sem fallbacks
genéricos que mascarem a causa raiz.

---

## Arquivos modificados / criados

| Arquivo                                                             | Ação                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/web/src/test/msw-handlers.ts`                                 | URL dos handlers de agendamento corrigida para `/agendamentos` |
| `apps/web/src/features/agenda/components/AgendamentoModal.tsx`      | Toast de sucesso/erro + erro inline adicionados                |
| `apps/web/src/features/agenda/components/AgendamentoModal.spec.tsx` | **Criado** — 7 cenários de teste                               |
| `docs/28-funcionalidade-novo-agendamento.md`                        | Esta documentação                                              |

---

## Testes — `AgendamentoModal.spec.tsx`

| Cenário                   | Verificação                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| Renderiza campos          | Barbeiro, cliente, data/hora e serviços são renderizados                     |
| Botão desabilitado        | `disabled` enquanto `isPending` é `true`                                     |
| Dados corretos            | `criar.mutate` chamado com `barbeiroId`, `clienteId`, `servicosIds` corretos |
| Sucesso                   | `onClose` chamado + `toast.success` exibido após criação                     |
| Erro                      | Erro inline + `toast.error` com mensagem real do servidor                    |
| Validação — campos vazios | Zod exibe "Selecione um barbeiro"; `mutate` não é chamado                    |
| Validação — sem serviço   | Zod exibe "Selecione ao menos um serviço"; `mutate` não é chamado            |

Estratégia de mock: `useAgendaMutations`, `useBarbeiros`, `useClientes`,
`useServicos` e `useAuth` são todos mockados via `vi.mock`. O `sonner`
também é mockado para verificar chamadas ao `toast`.

---

## Verificação

```bash
# Testes da feature
pnpm --filter web test -- AgendamentoModal

# Todos os testes web
pnpm --filter web test

# Lint + tipos
pnpm --filter web lint
cd apps/web && npx tsc --noEmit
```
