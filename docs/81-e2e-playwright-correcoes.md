# 81 · Correções nos specs E2E Playwright (web)

**Status:** Concluído  
**Branch:** develop  
**Base:** feat — correção de seletores nos specs Playwright que não batiam com o app real

---

## Arquivos modificados

| Arquivo                                 | O que mudou                                                                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/e2e/auth.spec.ts`             | Timeout em `toHaveURL` para redirect (30s login, 15s logout); logout via `button[title="Sair"]`                                                                                                                         |
| `apps/web/e2e/fixtures/auth.fixture.ts` | `waitForURL` com `timeout: 30000` para aguardar compilação Next.js na 1ª requisição                                                                                                                                     |
| `apps/web/e2e/agendamento.spec.ts`      | Rota `/agendamentos/novo` não existe — adaptado para `/agenda` + botão "Novo agendamento"; `test.setTimeout(60000)` para compensar compile time                                                                         |
| `apps/web/e2e/barbeiros.spec.ts`        | Heading substituído por `getByText("Total de barbeiros")` (stat card); botão de convite usa `getByRole("button", { name: /novo barbeiro/i })`; email via `input[type="email"]` direto; fechar via `aria-label="Fechar"` |
| `apps/web/e2e/servicos.spec.ts`         | Heading substituído por `getByText("Serviços ativos")` (stat card); modal aberto por `getByRole("button", { name: /novo serviço/i })`; nome do serviço via `getByPlaceholder` pois labels usam classe CSS, não `for=`   |
| `apps/web/e2e/configuracoes.spec.ts`    | Sem accordion — navegação via botão do sidebar "Notificações"; toggle via `.rounded-full.transition-all` (é um `<button>`, não `role="switch"`); verifica mudança de `style` em vez de `aria-checked`                   |
| `apps/web/src/app/page.tsx`             | Removido import `Shield` (Lucide) não utilizado que causava aviso de lint                                                                                                                                               |
| `turbo.json`                            | Adicionado `PLAYWRIGHT_BASE_URL` em `env` do task `test:e2e` para silenciar warning `turbo/no-undeclared-env-vars`                                                                                                      |

---

## Diagnóstico por falha original

### 1. auth – login válido (timeout 5s)

**Causa:** Next.js compila o app na primeira requisição. O redirect para `/dashboard` levava mais de 5s.  
**Correção:** `toHaveURL(/dashboard/, { timeout: 30000 })` e `waitForURL("**/dashboard", { timeout: 30000 })` no fixture.

### 2. auth – logout (botão não encontrado)

**Causa:** O botão de logout em `topbar.tsx` é icon-only (`<LogOut>`), sem texto visível. O label real é `title="Sair"`.  
**Correção:** `page.locator('button[title="Sair"]')` + `toHaveURL(/login/, { timeout: 15000 })`.

### 3. agendamento (rota inexistente)

**Causa:** `/agendamentos/novo` não existe no Next.js. O fluxo real é acessar `/agenda` e clicar no botão "Novo agendamento" que abre `AgendamentoModal`.  
**Correção:** Adaptado para navegar a `/agenda`, clicar no botão, e verificar a presença do modal (`.fixed.inset-0.z-50` com texto "Novo agendamento") e o `<select>` de barbeiro.

### 4. barbeiros (heading não encontrado)

**Causa:** A página não tem `<h1>` semântico — o título "Barbeiros" é um `<span>` no `Topbar`. O botão "Novo barbeiro" tem texto na `span.hidden.sm:inline`.  
**Correção:** Identificação via stat card `getByText("Total de barbeiros")`; botão `getByRole("button", { name: /novo barbeiro/i })` funciona pois Playwright procura accessible name; email via `input[type="email"]`; fechar via `button[aria-label="Fechar"]`.

### 5. barbeiros – email via `getByLabel(/email/i)`

**Causa:** O `BarbeiroModal` usa `label` com texto "E-mail \*" mas é renderizado como `<label class="tqe-ab-label">` sem atributo `for=`, portanto `getByLabel` não associa ao input.  
**Correção:** `page.locator('input[type="email"]').first()`.

### 6. servicos (heading não encontrado)

**Causa:** Mesmo padrão — sem `<h1>`. Labels no `ServicoModal` também usam `tqe-label` sem `for=`.  
**Correção:** Stat card `getByText("Serviços ativos")`; nome via `getByPlaceholder("Ex: Corte Clássico")`.

### 7. configuracoes – accordion (estrutura inexistente)

**Causa:** `ConfiguracoesView` usa um sidebar com botões de navegação, não um accordion. `SecaoNotificacoes` renderiza grupos de items diretamente, sem accordion expansível.  
**Correção:** Clicar no botão sidebar `getByRole("button", { name: "Notificações" })` e verificar o texto "Novo agendamento" (label do primeiro item).

### 8. configuracoes – toggle `role="switch"` / `aria-checked`

**Causa:** O componente `Toggle` em `toggle.tsx` é um `<button>` simples sem `role="switch"` nem `aria-checked`. Clicá-lo durante re-render causa detach.  
**Correção:** Selecionar via `.rounded-full.transition-all`, comparar atributo `style` antes/depois do click (a cor de fundo muda de `status-success` para `border-strong`).

---

## Resultado final

```
8 passed (chromium) · lint ✓ · tsc --noEmit ✓
```
