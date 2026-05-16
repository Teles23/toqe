# Mobile — Design System (Tokens + Componentes)

**Status:** ✅ Implementado
**Branch:** `mobile/refactor/dry-tokens` → `mobile/base`
**Base:** Expo SDK 54, React Native 0.81

---

## Por que existe

Antes deste refactor:

- 4 arquivos duplicavam `lightColors`/`darkColors` (login, cadastro, agenda, AgendamentoCard)
- `apps/mobile/constants/theme.ts` existia mas estava abandonado
- `<TextInput>` recebia estilos in-line idênticos em login e cadastro (~40 linhas duplicadas)
- `<Pressable>` + `<ActivityIndicator>` + `<Text>` reimplementavam o mesmo botão primário em 3 lugares
- `AgendamentoCard` sem `React.memo` e com `handleLongPress` recriado a cada render — gap de perf na FlatList de agenda

Resultado: mudar a paleta da marca exigia editar 4 arquivos; corrigir um detalhe de estilo exigia replicar em N lugares. **Violação clara de DRY.**

---

## Estrutura

```
apps/mobile/src/shared/
├── theme/
│   ├── tokens.ts           # Paleta, spacing, radius, typography, a11y
│   ├── use-theme.ts        # Hook: retorna paleta correta + tokens
│   ├── index.ts            # Re-exports
│   └── __tests__/use-theme.test.tsx
└── ui/
    ├── Button.tsx          # Botão padrão (primary/secondary/danger + loading)
    ├── FormInput.tsx       # Label + TextInput + error (compatível com Controller)
    ├── Card.tsx            # Container (View ou Pressable conforme handlers)
    ├── Select.tsx          # Picker tipado genérico (Modal + FlatList)
    ├── index.ts
    └── __tests__/
        ├── Button.test.tsx
        ├── FormInput.test.tsx
        ├── Card.test.tsx
        └── Select.test.tsx
```

---

## Tokens

### Paleta (`palette.light` / `palette.dark`)

| Token         | Light              | Dark                     | Uso                         |
| ------------- | ------------------ | ------------------------ | --------------------------- |
| `bg`          | `#f5f5f5`          | `#111111`                | Fundo de tela               |
| `cardBg`      | `#ffffff`          | `#1e1e1e`                | Fundo de card e input       |
| `border`      | `#e0e0e0`          | `#333333`                | Bordas em geral             |
| `inputBg`     | `#ffffff`          | `#1e1e1e`                | Fundo de TextInput          |
| `inputBorder` | `#dddddd`          | `#333333`                | Borda de TextInput          |
| `text`        | `#111111`          | `#f5f5f5`                | Texto primário              |
| `textMuted`   | `#666666`          | `#999999`                | Texto secundário            |
| `primary`     | `#1a73e8`          | `#4da3ff`                | Botão primário, links, foco |
| `primaryOn`   | `#ffffff`          | `#ffffff`                | Texto/ícones sobre primary  |
| `danger`      | `#c62828`          | `#ff6b6b`                | Erros, validação            |
| `dangerBg`    | `#fdecea`          | `#3a0a0a`                | Fundo de banner de erro     |
| `success`     | `#2f9e44`          | `#51cf66`                | Status concluído            |
| `warning`     | `#f59f00`          | `#ffd43b`                | Status pendente             |
| `overlay`     | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | Overlay neutro              |

### Spacing (escala base 4)

`xs=4 · sm=8 · md=16 · lg=24 · xl=32 · xxl=48`

### Radius

`sm=6 · md=10 · lg=16 · pill=999`

### Typography

| Token      | fontSize | fontWeight | lineHeight |
| ---------- | -------- | ---------- | ---------- |
| `display`  | 36       | 700        | 44         |
| `title`    | 28       | 700        | 36         |
| `heading`  | 22       | 600        | 28         |
| `body`     | 16       | 400        | 22         |
| `bodyBold` | 16       | 600        | 22         |
| `label`    | 14       | 500        | 20         |
| `caption`  | 12       | 400        | 16         |

### Acessibilidade

- `a11y.minTouch = 44` (pt) — alvo mínimo de toque WCAG AA
- `a11y.minTextContrast = 4.5` — referência de contraste mínimo

---

## Hook `useTheme()`

```typescript
import { useTheme } from '@/src/shared/theme';

function MeuComponente() {
  const { palette, spacing, radius, typography, a11y, isDark } = useTheme();
  return (
    <View style={{ backgroundColor: palette.bg, padding: spacing.md }}>
      <Text style={{ ...typography.body, color: palette.text }}>Olá</Text>
    </View>
  );
}
```

Internamente usa `useColorScheme()` do React Native para decidir entre `palette.light` e `palette.dark`. Os outros tokens (spacing, radius, typography, a11y) são estáticos.

---

## Componentes

### `<Button>`

```tsx
<Button label="Entrar" onPress={handleSubmit} loading={isSubmitting} />
<Button label="Cancelar" variant="secondary" onPress={onClose} />
<Button label="Excluir" variant="danger" onPress={onDelete} />
```

| Prop       | Tipo                                   | Default     | Descrição                                      |
| ---------- | -------------------------------------- | ----------- | ---------------------------------------------- |
| `label`    | `string`                               | —           | Texto do botão                                 |
| `onPress`  | `() => void`                           | —           | Handler de toque                               |
| `loading`  | `boolean`                              | `false`     | Mostra `ActivityIndicator`, desabilita o press |
| `disabled` | `boolean`                              | `false`     | Desabilita visualmente + funcionalmente        |
| `variant`  | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Estilo visual                                  |

Garante:

- Touch target ≥ 44pt (a11y)
- `accessibilityState.busy` quando loading
- `accessibilityState.disabled` quando desabilitado
- Cores via tokens (sem hex hardcoded)

### `<FormInput>`

```tsx
<Controller
  control={control}
  name="email"
  render={({ field }) => (
    <FormInput
      label="E-mail"
      placeholder="seu@email.com"
      keyboardType="email-address"
      onBlur={field.onBlur}
      onChangeText={field.onChange}
      value={field.value}
      error={errors.email?.message}
    />
  )}
/>
```

Encapsula:

- Label estilizado
- Hint opcional ao lado do label (ex: `hint="(opcional)"`)
- TextInput com estilo do tema (input bg, border, color, placeholder)
- Mensagem de erro com `accessibilityRole="alert"`
- Borda vermelha quando há erro

Aceita todas as props padrão de `TextInputProps` (autoComplete, secureTextEntry, keyboardType, etc.).

### `<Card>`

```tsx
{
  /* Estático */
}
<Card>
  <Text>conteúdo</Text>
</Card>;

{
  /* Pressable com long-press */
}
<Card
  onLongPress={handleLongPress}
  accessibilityLabel="Agendamento de Carlos"
  accessibilityHint="Pressione e segure para mudar o status"
>
  <Text>...</Text>
</Card>;
```

Container com:

- `backgroundColor: palette.cardBg`
- Borda + radius via tokens
- Comporta-se como `Pressable` se receber `onPress`/`onLongPress`, senão `View`
- Opacity reduzida quando pressionado

---

## Refatorações aplicadas

| Arquivo                                     | Antes                                               | Depois                                                        |
| ------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `app/(auth)/login.tsx`                      | 283 linhas, 17 hex hardcoded, TextInput in-line × 2 | 156 linhas, 0 hex hardcoded, 2× `<FormInput>` + 1× `<Button>` |
| `app/(auth)/cadastro.tsx`                   | 372 linhas, 17 hex hardcoded, TextInput × 5         | 224 linhas, 0 hex hardcoded, 5× `<FormInput>` + 1× `<Button>` |
| `app/(barbeiro)/agenda.tsx`                 | colors locais, useColorScheme manual                | useTheme(), sem duplicação                                    |
| `src/features/barbeiro/AgendamentoCard.tsx` | colors locais, sem memo, handleLongPress recriado   | useTheme(), `React.memo`, `useCallback`, usa `<Card>`         |

**Net:** −395 linhas removidas, −51 hex hardcoded eliminados, +4 componentes reutilizáveis, +6 testes novos.

---

## Performance (gap fechado)

`AgendamentoCard` agora:

- Envolvido por `React.memo()` — re-renderiza apenas quando `agendamento` ou `onChangeStatus` muda
- `handleLongPress` estabilizado via `useCallback([agendamento.codigo, agendamento.cliente.nome, onChangeStatus])`

Em uma FlatList de 30 agendamentos, atualizar status de 1 card antes causava re-render dos 30. Agora re-renderiza apenas o card afetado + o invalidate-query do TanStack.

Na tela `agenda.tsx`, `goPrev`/`goNext`/`goToday` também passaram a usar `useCallback` para evitar regerar refs dos `onPress` dos botões de navegação.

---

## Testes

```bash
pnpm --filter mobile test
```

| Suite                                | Cenários novos                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `theme/__tests__/use-theme.test.tsx` | retorna light/dark/null, expõe spacing/radius/typography/a11y                                                         |
| `ui/__tests__/Button.test.tsx`       | renderiza label, onPress, loading mostra spinner, disabled/loading não disparam onPress, accessibilityState.busy      |
| `ui/__tests__/FormInput.test.tsx`    | label, hint, onChangeText, error com role=alert, sem alert quando ok, accessibilityLabel customizado, secureTextEntry |
| `ui/__tests__/Card.test.tsx`         | render estático, render Pressable, onLongPress                                                                        |

**Totais mobile após o refactor:** 11 suites, 48 testes (todos passando).

---

## Segurança / Performance / Escalabilidade

### Segurança

- Tokens são valores estáticos — sem interpolação dinâmica de input do usuário
- `dangerBg` em dark mode (`#3a0a0a`) garante contraste mínimo do texto de erro
- `a11y.minTouch=44` consistente em todos os componentes (regra WCAG)

### Performance

- `React.memo` + `useCallback` em `AgendamentoCard` reduz re-renders proporcionais a N agendamentos
- Tokens em `const` no module scope — sem alocações por render
- `useTheme()` retorna referências estáveis (`palette.light` / `palette.dark` são singletons)

### Escalabilidade

- Adicionar novo token (ex: `info` color): 1 linha em `tokens.ts` (interface + light + dark)
- Adicionar novo componente compartilhado: criar em `src/shared/ui/`, exportar via `index.ts`
- Trocar a marca: alterar `palette.primary` (light + dark) — 2 pontos
- Adicionar novo modo (ex: `high-contrast`): adicionar mais uma chave em `palette` + ajustar `useTheme()` para suportar a nova fonte de modo
