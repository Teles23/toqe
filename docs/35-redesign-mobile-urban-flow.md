# 35 — Redesign do App Mobile: Urban Flow Native

**Status:** Em andamento
**Branch:** `mobile/feat/redesign-visual`
**Base:** `mobile/base`
**Doc anterior:** [33-perfil-mobile.md](./33-perfil-mobile.md)

---

## Motivação

O app mobile estava em paleta azul `#1a73e8` / `#4da3ff` light-first, com tipografia padrão do sistema. A web roda Urban Flow desde a Fase 3d (âmbar `#f4b400`, verde `#1db954`, fundo `#0d0d0d`, Sora + Inter + JetBrains Mono). Quem alterna entre web e mobile não reconhecia o mesmo produto.

Esta fase migra os tokens mobile para Urban Flow adaptado ao contexto nativo, redesenha as 11 telas com paradigmas mobile (gestos, bottom sheets, ações de 1 toque) e introduz um design system de 10 componentes inovadores no segmento de barbearia.

---

## Pesquisa de mercado (Fase 0)

### Concorrentes analisados

| App                     | O que faz bem                                                          | O que repete (padrão genérico)                                      | Lacuna                                                             |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Booksy**              | Maior comunidade nos EUA, marketplace integrado, lembretes automáticos | Card-list plana, paleta branca/azul corporativa, modais bloqueantes | Sem feedback "ao vivo" no dia do atendimento                       |
| **Fresha**              | Booking grátis, sem subscription, UI clara                             | Mesma estética cinza/azul, ações enterradas em 3+ telas             | Hora é tratada como detalhe textual, não como protagonista visual  |
| **StyleSeat**           | Marketplace forte para profissionais autônomos                         | Lista de horários como dropdown, sem hierarquia visual              | Sem countdown ao vivo; cliente nunca sabe "quanto falta"           |
| **Square Appointments** | Integração POS robusta                                                 | Tipografia padrão iOS/Android sem identidade                        | Barbeiro precisa de 2–3 toques para mudar status de um agendamento |
| **Trafft / Setmore**    | Multi-canal (web + mobile)                                             | Bottom navigation idêntica a apps SaaS                              | Sem inovação em UX gestural                                        |

### 5 padrões a evitar (todo app do segmento repete)

1. **Card-list horizontal homogênea** — todos os agendamentos do dia listados com mesma proeminência visual. O agendamento **agora** se perde entre o de daqui a 3h.
2. **Paleta branca/azul corporativa** — sem personalidade de marca, todos parecem o mesmo ERP de barbearia.
3. **Modais centrais bloqueantes** — usar `Alert` ou `Modal` central quando bottom sheets gestuais são o padrão nativo de iOS/Android desde 2020.
4. **Tipografia do sistema** — San Francisco/Roboto puros, sem identidade visual; horários (a info mais consultada) tratados como texto comum.
5. **Mudança de status em fluxo navegado** — barbeiro toca no card, vai para tela de detalhe, toca em "Editar status", escolhe novo, salva. 4 toques para algo que devia ser 1.

### 3 oportunidades — o que nenhum concorrente faz bem

1. **CountdownTimer ao vivo no cliente** — Uber Eats mostra "Chegando em 8 min" enquanto o pedido vem; nenhum app de barbearia mostra "Em 2h 15min" mudando de cor conforme o horário se aproxima. Cliente sai do app com a próxima consulta na cabeça.
2. **Hora como protagonista visual (mono XL)** — usar JetBrains Mono 42pt para a hora do próximo agendamento é uma escolha de identidade. O cliente abre o app e vê **16:30** como o primeiro objeto da tela, não enterrado num parágrafo.
3. **QuickActionBar inline** — barbeiro muda status (Iniciar / Concluir / Cancelar) **direto no card**, com haptic feedback, sem navegar. Inspirado em ações de swipe no Mail e Things 3.

---

## Filosofia de design escolhida

### **Barber's Flow**

Três princípios que guiam cada decisão:

1. **A hora é o herói.** Toda tela mostra horário primeiro, grande, em fonte monoespaçada — para a hora ser visualmente reconhecível antes de qualquer outra informação. Sora para nomes/títulos, Inter para corpo, JetBrains Mono **só** para horários e números críticos.
2. **Toque único.** Ações primárias (confirmar, iniciar, cancelar agendamento; agendar novo; ligar para cliente) sempre acessíveis no nível atual via QuickActionBar, FAB ou BottomSheet — nunca atrás de 2+ navegações.
3. **Dark é o palco.** Fundo escuro como tela em branco; âmbar e verde como pinceladas de luz que guiam o olho. Cor não decora — sinaliza estado (confirmado/pendente/em atendimento/atrasado).

### Coerência com Urban Flow web

| Eixo            | Web (Urban Flow)                     | Mobile (Barber's Flow)                                |
| --------------- | ------------------------------------ | ----------------------------------------------------- |
| Paleta primária | `#f4b400` âmbar, `#1db954` verde     | **Idêntica**                                          |
| Fundo           | `#0d0d0d`                            | `#0a0a0a` (1 ponto mais escuro no OLED)               |
| Headings        | Sora 700                             | **Sora 700** (display 34pt)                           |
| Body            | Inter 400/500/600                    | **Inter** mesmas variações                            |
| Mono            | "JetBrains Mono" em horários/códigos | **JetBrains Mono** com escala XL (42pt) para horários |
| Status          | success/warning/error/info           | **Idênticas**, com `dim` variants para backgrounds    |

### O que muda do web para o mobile

- **Modais → BottomSheets** com handle bar e backdrop blur.
- **Hover → Long-press + haptic** (gestos confirmados por feedback tátil).
- **Sidebar → Tab bar inferior** com 4 tabs, ícones `lucide-react-native`.
- **Tabelas → Cards verticais** com hierarquia tipográfica forte.
- **Tooltips → PulsingDot inline** para status ao vivo.
- **Densidade reduzida** (padding mais generoso para áreas de toque ≥44pt).

---

## Cronograma de execução

Ver `~/.claude/plans/c-users-thiago-teles-downloads-prompt-r-elegant-metcalfe.md` para o plano completo. Resumo:

- **Fase 0:** Pesquisa + este doc.
- **Fase 1 (Commit 1):** Tokens + fontes + design system base (10 componentes novos).
- **Fase 2 (Commits 2–12):** 11 telas redesenhadas, 1 commit por tela.
- **Fase 3 (Commit 13):** Tab bars Urban Flow.
- **Fase 4 (Commit 14):** Remoção do alias `Button`, finalização do doc, merge.

---

## Tabela "antes × depois" das telas

> A tabela é preenchida progressivamente; cada commit de tela atualiza sua linha.

| Tela                               | Antes                                                      | Depois (Barber's Flow)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Status      |
| ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `/(auth)/login`                    | Form padrão azul, fontes do sistema                        | Monograma "T" 80px âmbar com text-shadow âmbar, nome `toqe` em Sora 26pt, tagline "Sua barbearia. Seu ritmo.", AmberButton "Entrar" + divider "ou" + GhostButton "Entrar com Google", footer "Cadastre-se" em âmbar                                                                                                                                                                                                                                                                                                             | ✅ Commit 2 |
| `/(auth)/cadastro`                 | Form único de 5 campos, sistema                            | Brand tag âmbar em pill no topo, título "Criar conta" em Sora, 5 campos com FormInput dark, AmberButton "Criar conta", footer link "Entrar" em âmbar. _Nota: single-page mantido (não 3 steps) por contrato de teste; split em steps fica como refino futuro_                                                                                                                                                                                                                                                                   | ✅ Commit 4 |
| `/(cliente)/home`                  | Lista de barbearias com card chapado                       | Greeting dinâmico ("Boa tarde ⛅" baseado em `getGreeting(hour)`) em card destacado dark; section headers em caption uppercase âmbar-muted; cards de barbearias usando Avatar + bodyBold + caption; atalhos como grupo de ListItem; AmberButton "Agendar novo horário" como CTA final. _Nota: card hero com TimeDisplay XL + CountdownTimer ficou como refino futuro porque depende de endpoint `/agendamentos/proximo` que ainda não existe — comentário TODO inline indica o ponto de evolução_                               | ✅ Commit 5 |
| `/(barbeiro)/agenda`               | Lista de cards, badge sólido, status via Alert/ActionSheet | Day nav com tokens dark; `AgendamentoCard` reescrito com `TimeDisplay` mono âmbar, `StatusBadge` semântico (PulsingDot quando confirmado), `QuickActionBar` inline com ações contextuais por status, long-press → `BottomSheet` premium com 4 ações + cliente em destaque. Utils puros (`getInlineActions`/`getFullActions`/`statusToBadge`) — 8 testes unitários novos. **Refino futuro:** card hero "AGORA" destacando o agendamento em andamento + lista compacta no estilo timeline depende de hook `useAgendamentoAtual()` | ✅ Commit 6 |
| `/(barbeiro)/fila`                 | Lista de cards com nome e hora                             | **Live progress bar** por tempo de espera, número grande em mono, ações inline                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Pendente    |
| `/(barbeiro)/clientes`             | Lista textual                                              | Search dark + avatares hash-color + telefone em mono                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Pendente    |
| `/(barbeiro)/perfil`               | Form de edição                                             | Seções como grupos de ListItem + DangerButton sair                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Pendente    |
| `/(cliente)/buscar`                | Lista de barbearias                                        | Chips "Disponível agora" / "Próximas" + cards com PulsingDots de barbeiros online                                                                                                                                                                                                                                                                                                                                                                                                                                               | Pendente    |
| `/(cliente)/agendamentos`          | Lista única                                                | Tabs Próximos/Passados com underline âmbar + CountdownTimer nos cards futuros                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Pendente    |
| `/(cliente)/agendamentos/[codigo]` | Página de detalhe textual                                  | **Ticket premium**: TimeDisplay XL + StatusBadge grande + CountdownTimer + breakdown visual                                                                                                                                                                                                                                                                                                                                                                                                                                     | Pendente    |
| `/(cliente)/perfil`                | Form de edição                                             | Mesmo padrão da perfil barbeiro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Pendente    |

---

## Componentes criados (design system)

> Atualizado conforme Commit 1 da Fase 1.

| Componente       | Arquivo                            | Propósito                                             |
| ---------------- | ---------------------------------- | ----------------------------------------------------- |
| `BaseButton`     | `src/shared/ui/BaseButton.tsx`     | Base SOLID para os botões; haptic + scale + loading   |
| `AmberButton`    | `src/shared/ui/AmberButton.tsx`    | CTA primário âmbar                                    |
| `GhostButton`    | `src/shared/ui/GhostButton.tsx`    | Ação secundária com borda                             |
| `DangerButton`   | `src/shared/ui/DangerButton.tsx`   | Ação destrutiva (cancelar/sair)                       |
| `PulsingDot`     | `src/shared/ui/PulsingDot.tsx`     | Indicador "ao vivo" (online, confirmado)              |
| `StatusBadge`    | `src/shared/ui/StatusBadge.tsx`    | Badge de status com cor e PulsingDot opcional         |
| `TimeDisplay`    | `src/shared/ui/TimeDisplay.tsx`    | Horário em JetBrains Mono nos tamanhos sm/md/lg/xl    |
| `SkeletonBox`    | `src/shared/ui/SkeletonBox.tsx`    | Placeholder de loading com shimmer                    |
| `BottomSheet`    | `src/shared/ui/BottomSheet.tsx`    | Substitui modais (gesture + backdrop blur)            |
| `CountdownTimer` | `src/shared/ui/CountdownTimer.tsx` | Contagem regressiva ao agendamento, cor por threshold |
| `QuickActionBar` | `src/shared/ui/QuickActionBar.tsx` | Barra de ações inline (1 toque)                       |

---

## Tokens — antes × depois

### Paleta (dark)

| Token                    | Antes     | Depois                               |
| ------------------------ | --------- | ------------------------------------ |
| `bg`                     | `#111111` | `#0a0a0a`                            |
| `surface` (era `cardBg`) | `#1e1e1e` | `#111111`                            |
| `surfaceHigh` (novo)     | —         | `#181818`                            |
| `border`                 | `#333333` | `#1e1e1e`                            |
| `borderStrong` (novo)    | —         | `#2a2a2a`                            |
| `text`                   | `#f5f5f5` | `#f0f0f0`                            |
| `textMuted`              | `#999999` | `#777777`                            |
| `primary`                | `#4da3ff` | `#f4b400` (âmbar Urban Flow)         |
| `success`                | `#51cf66` | `#1db954` (verde Spotify/Urban Flow) |
| `info` (novo)            | —         | `#4da3ff`                            |
| `danger`                 | `#ff6b6b` | `#ff3b30`                            |
| `warning`                | `#ffd43b` | `#ff9500`                            |

### Tipografia

| Token               | Antes                       | Depois                      |
| ------------------- | --------------------------- | --------------------------- |
| `display`           | 36pt / weight 700 (sistema) | **Sora 700** 34pt           |
| `title`             | 28pt / 700                  | **Sora 700** 26pt           |
| `heading`           | 22pt / 600                  | **Sora 600** 20pt           |
| `subheading` (novo) | —                           | **Sora 600** 16pt           |
| `body`              | 16pt / 400 (sistema)        | **Inter 400** 16pt          |
| `bodyMedium` (novo) | —                           | **Inter 500** 16pt          |
| `bodyBold`          | 16pt / 600                  | **Inter 600** 16pt          |
| `label`             | 14pt / 500                  | **Inter 500** 14pt          |
| `caption`           | 12pt / 400                  | **Inter 400** 12pt          |
| `mono` (novo)       | —                           | **JetBrains Mono 400** 14pt |
| `monoMedium` (novo) | —                           | **JetBrains Mono 500** 16pt |
| `monoLarge` (novo)  | —                           | **JetBrains Mono 500** 28pt |
| `monoXL` (novo)     | —                           | **JetBrains Mono 700** 42pt |

---

## Contagem de testes

| Fase                   | Testes                 |
| ---------------------- | ---------------------- |
| Antes (mobile/base)    | 44                     |
| Após Fase 1 (Commit 1) | _atualizado no commit_ |
| Após Fase 2            | _atualizado_           |
| Final                  | _atualizado_           |

---

## Comandos de verificação

```powershell
pnpm --filter mobile lint
cd apps\mobile; npx tsc --noEmit
pnpm --filter mobile test
# Smoke test visual (opcional):
cd apps\mobile; npx expo start
```

Grep finais (devem retornar vazio):

```powershell
# Nenhum bypass de qualidade
Get-ChildItem apps\mobile -Recurse -Include *.ts,*.tsx | Select-String "eslint-disable|@ts-ignore|@ts-expect-error| as any"
```

---

## Referências de pesquisa

- Muz.li — "What's Changing in Mobile App Design? UI Patterns That Matter in 2026" (dark-first, bottom sheets, compound gestures + haptic).
- ActionSprout — "Dark Mode, Gesture Navigation, and Other Mobile Design Trends for 2025" (OLED true black, ~43% economia de energia em modo escuro no YouTube).
- Booksy Biz — análise comparativa de feature set; identificado gap em feedback ao vivo.
- Fresha — análise de pricing e UX; identificado gap na hierarquia visual do horário.
- Uber Engineering Blog — padrão Sagas para state ao vivo (referência para CountdownTimer).
- Page Flows — fluxos iOS de booking; referência para BottomSheet como substituto do Alert.

Sources:

- [What's Changing in Mobile App Design? — Muz.li](https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/)
- [Mobile Design Trends 2025 — ActionSprout](https://actionsprout.com/blog/dark-mode-gesture-navigation-and-other-mobile-design-trends-for-2025/)
- [7 Best Barbershop Software Options in 2025 — SpaceDaily](https://www.spacedaily.com/reports/7_Best_Barbershop_Software_Options_in_2025_999.html)
- [Powering UberEATS with React Native — Uber Engineering](https://www.uber.com/blog/ubereats-react-native/)
- [iOS Booking an appointment UX Flows — Page Flows](https://pageflows.com/ios/flows/booking-an-appointment/)
