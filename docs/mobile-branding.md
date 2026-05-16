# Mobile — Branding (Splash + Ícone)

**Status:** ✅ Implementado
**Branch:** `mobile/feat/branding` → `mobile/base`
**Base:** Expo SDK 54, sharp 0.34 (devDependency da raiz), source SVG vetorial

---

## O que mudou

Os ícones e splash do app deixaram de ser os placeholders default do template Expo (quadrado azul com "E") e passaram a ter identidade Toqe. Toda a geração é reproduzível a partir de SVGs versionados em `tools/branding/source/`.

| Asset                         | Antes                      | Agora                                    |
| ----------------------------- | -------------------------- | ---------------------------------------- |
| `icon.png`                    | 385 KB (template Expo "E") | **4.5 KB** (T branco em fundo `#1a73e8`) |
| `splash-icon.png`             | 18 KB (template Expo)      | **4.5 KB** (T transparente)              |
| `favicon.png`                 | 1.2 KB (template Expo)     | **0.3 KB** (T compacto)                  |
| `android-icon-foreground.png` | 77 KB (template)           | **1.6 KB** (T centralizado em safe-zone) |
| `android-icon-background.png` | 18 KB                      | **0.3 KB** (sólido `#1a73e8`)            |
| `android-icon-monochrome.png` | 4.1 KB                     | **0.9 KB** (T puro, Android 13+)         |
| `react-logo*.png` (×4)        | template não usado         | **deletados**                            |
| `partial-react-logo.png`      | template não usado         | **deletado**                             |

**Redução total:** ~485 KB → ~12 KB no APK final.

---

## Arquivos criados/modificados

| Arquivo                                          | Papel                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `tools/branding/source/icon.svg`                 | Source do ícone principal (background + T + acento)                                                        |
| `tools/branding/source/icon-foreground.svg`      | Adaptive icon Android (transparente, safe-zone 33%)                                                        |
| `tools/branding/source/icon-monochrome.svg`      | Themed icon Android 13+ (T puro, sem acento)                                                               |
| `tools/branding/generate.mjs`                    | Renderiza SVGs → PNGs com `sharp` (palette PNG8)                                                           |
| `tools/branding/README.md`                       | Como editar a marca e regerar                                                                              |
| `apps/mobile/src/_init/splash.ts`                | Controle de splash (`preventAutoHideAsync` + `hideSplash`)                                                 |
| `apps/mobile/src/_init/__tests__/splash.test.ts` | Testes do controle de splash                                                                               |
| `apps/mobile/app/_layout.tsx`                    | Hook `useEffect(() => hideSplash())` quando `loading=false`                                                |
| `apps/mobile/app/__tests__/_layout.test.tsx`     | Testes do RootLayout (splash control)                                                                      |
| `apps/mobile/app.config.ts`                      | Splash: `backgroundColor: '#1a73e8'`, `dark: '#0d1117'`, `imageWidth: 240`. Adaptive: background `#1a73e8` |
| `package.json` (raiz)                            | Scripts `branding:generate` + `branding:check`; `sharp` em devDeps                                         |

---

## Design

### Geometria

Monograma "T" geométrico puro (não depende de fonte instalada):

- **Barra horizontal:** 540×140 com cantos arredondados (raio 24)
- **Tronco vertical:** 140×540 com cantos arredondados (raio 24)
- **Acento:** disco branco de raio 64px no canto inferior direito do tronco — sugere o "toque" de "Toqe"

### Paleta

| Token       | Hex       | Uso                                               |
| ----------- | --------- | ------------------------------------------------- |
| Primary     | `#1a73e8` | Fundo do ícone, splash light, adaptive background |
| White       | `#ffffff` | "T" e acento                                      |
| Splash dark | `#0d1117` | Background do splash em dark mode                 |

---

## Regerar os assets

```bash
# Gera todos os 6 PNGs (executa sharp)
pnpm branding:generate

# Lista os 6 alvos sem gerar arquivos (sanity check de CI)
pnpm branding:check
```

Para editar a marca: alterar os SVGs em `tools/branding/source/`, depois rodar `pnpm branding:generate`. Commit SVG + PNG juntos no mesmo commit (auditoria do PR mostra a mudança visual via diff do SVG).

---

## Controle do splash em runtime

### Problema resolvido

Sem `SplashScreen.preventAutoHideAsync()`, o splash desaparece **assim que o JS bundle carrega** — antes do `AuthProvider` ler tokens do SecureStore. O usuário vê: splash → tela em branco → tela final.

### Solução

`src/_init/splash.ts` é importado pelo root layout. No top-level do módulo chama `preventAutoHideAsync()`, bloqueando o auto-hide. O hide só acontece via `hideSplash()` chamado pelo `useEffect` quando `useAuth().loading === false`.

```typescript
// src/_init/splash.ts
void SplashScreen.preventAutoHideAsync().catch(() => {});
export async function hideSplash() {
  /* idempotente */
}

// app/_layout.tsx
function RootNavigator() {
  const { loading } = useAuth();
  useEffect(() => {
    if (!loading) void hideSplash();
  }, [loading]);
  // ...
}
```

`hideSplash` é idempotente — chamadas duplicadas (hot reload, race conditions) são no-op.

---

## Testes

```bash
pnpm --filter mobile test
```

| Suite                                | Cenários                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/_init/__tests__/splash.test.ts` | preventAutoHideAsync chamado no import; hideSplash chama hideAsync; idempotência (3 calls → 1 hideAsync); swallows erro de hideAsync |
| `app/__tests__/_layout.test.tsx`     | hideSplash NÃO chamado com loading=true; hideSplash chamado quando loading vira false                                                |

**Total mobile:** 28 testes em 7 suites (todos passando).

---

## Segurança / Performance / Escalabilidade

### Segurança

- `sharp` é **devDependency** — não vai no bundle do app
- `generate.mjs` lê apenas de `tools/branding/source/` (path hardcoded, sem input externo)
- SVGs não contêm scripts, foreignObject, ou external resources (assets autocontidos)

### Performance

- Cada PNG é **30-50× menor** que o equivalente do template Expo (PNG8 paletted vs PNG24 truecolor)
- APK final: ~470 KB economizados em assets de branding
- `preventAutoHideAsync` elimina o flash entre splash e primeira tela renderizada
- `hideSplash` é idempotente — sem custo de chamadas duplicadas

### Escalabilidade

- Adicionar novo tamanho (notification icon 96×96, OG image 1200×630, etc.): **1 linha** em `targets[]` no `generate.mjs`
- Mudar paleta da marca: alterar a cor no `icon.svg` + `generate.mjs` + `app.config.ts` (3 pontos) e rodar `pnpm branding:generate`
- Source SVG é vetorial → renderiza nítido em qualquer densidade futura (5x, 6x DPR)

---

## Checklist de verificação manual (antes de release)

- [x] `pnpm branding:generate` produz 6 PNGs em `apps/mobile/assets/images/`
- [x] `pnpm --filter mobile lint` — 0 erros
- [x] `pnpm --filter mobile type-check` — 0 erros
- [x] `pnpm --filter mobile test` — 28/28 passando
- [ ] **(manual)** Build dev (`eas build --profile development --platform android`) → APK no launcher mostra ícone do Toqe (T branco em fundo azul)
- [ ] **(manual)** Abrir o APK → splash mostra T centralizado em fundo azul, persiste até auth resolver
