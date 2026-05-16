# Mobile — Diagnóstico Inicial

**Status:** Concluído
**Branch:** mobile/feat/setup → mobile/base
**Data:** 2026-05-15

---

## O que já existia no `apps/mobile`

| Item                                                            | Estado                                    |
| --------------------------------------------------------------- | ----------------------------------------- |
| Expo SDK 54 + React Native 0.81.5                               | ✅ Instalado                              |
| Expo Router 6.0.23                                              | ✅ Instalado                              |
| New Architecture (`newArchEnabled: true`)                       | ✅ Habilitado                             |
| React Compiler (`reactCompiler: true`)                          | ✅ Habilitado                             |
| Metro config para monorepo (`watchFolders`, `nodeModulesPaths`) | ✅ OK                                     |
| `@toqe/shared` e `@toqe/contracts` como dependências            | ✅ OK                                     |
| TypeScript com `strict: true`                                   | ✅ OK                                     |
| ESLint com `eslint-config-expo` flat                            | ✅ OK                                     |
| Scripts `type-check` e `test`                                   | ❌ Ausentes → adicionados                 |
| Path aliases `@toqe/*` no tsconfig                              | ❌ Ausentes → adicionados                 |
| Dependências de negócio                                         | ❌ Ausentes → instaladas                  |
| Estrutura de rotas de negócio                                   | ❌ Apenas template padrão → reestruturado |
| `.env`                                                          | ❌ Ausente → criado                       |

---

## Dependências Instaladas nesta Branch

```
expo-secure-store         — armazenamento seguro de tokens JWT
@react-native-google-signin/google-signin — login Google nativo Android
@tanstack/react-query     — data fetching (padrão do web)
react-hook-form           — formulários
@hookform/resolvers       — integração react-hook-form + zod
date-fns + date-fns-tz    — datas (padrão do projeto)
react-native-mmkv         — storage leve para preferências não-sensíveis
jest + jest-expo          — testes unitários
@testing-library/react-native — testes de componentes
```

**HTTP Client:** `fetch` nativo — mesmo padrão do web, sem axios/ky.

---

## Estrutura de Rotas Implementada

```
apps/mobile/app/
├── _layout.tsx              ← root: QueryProvider + ThemeProvider + Stack
├── index.tsx                ← redirect para /(auth)/login
├── (auth)/
│   ├── _layout.tsx          ← Stack sem header
│   ├── login.tsx            ← placeholder (implementado em mobile/feat/auth)
│   └── cadastro.tsx         ← placeholder (implementado em mobile/feat/auth)
├── (cliente)/
│   ├── _layout.tsx          ← Tabs: Início | Buscar | Agendamentos | Perfil
│   ├── home.tsx
│   ├── buscar.tsx
│   ├── agendamentos/
│   │   ├── index.tsx
│   │   └── [codigo].tsx
│   └── perfil.tsx
└── (barbeiro)/
    ├── _layout.tsx          ← Tabs: Agenda do Dia | Fila | Clientes | Perfil
    ├── agenda.tsx
    ├── fila.tsx
    ├── clientes.tsx
    └── perfil.tsx
```

---

## Telas do Web com Equivalente Mobile

| Web (`apps/web`)          | Mobile (`apps/mobile`)                    | Perfil                     |
| ------------------------- | ----------------------------------------- | -------------------------- |
| `/login`                  | `/(auth)/login`                           | todos                      |
| `/onboarding`             | `/(auth)/cadastro`                        | novos usuários             |
| `/dashboard`              | `/(cliente)/home` ou `/(barbeiro)/agenda` | por perfil                 |
| `/agenda`                 | `/(barbeiro)/agenda`                      | barbeiro/gerente           |
| `/clientes`               | `/(barbeiro)/clientes`                    | barbeiro/gerente           |
| `/agendamentos` (cliente) | `/(cliente)/agendamentos`                 | cliente                    |
| N/A                       | `/(cliente)/buscar`                       | cliente — exclusivo mobile |

---

## Inconsistências e Riscos Identificados

1. **Sem endpoint Google na API** — `POST /api/v1/auth/google` não existe em `apps/api/src/auth/`. O fluxo Google ficará como placeholder até o endpoint ser implementado na API.

2. **`react-native-mmkv` requer build nativo** — não funciona no Expo Go padrão. Precisará de Development Build (EAS Build) para ser testada. Para dev, o fallback é `AsyncStorage` apenas para preferências não-sensíveis.

3. **`@react-native-google-signin/google-signin` requer build nativo** — idem acima. Login Google só funciona em Development Build ou APK.

4. **Versão React 19.1.0 vs `react-test-renderer` 19.2.0** — peer dependency warning em `jest-expo`. Não impede testes; atualizar quando Expo SDK 55 sair.

5. **`@toqe/config`** — package existe no monorepo mas sem `src/index.ts`. Path alias configurado mas não utilizado por enquanto.

---

## Próximos Passos

- `mobile/feat/auth` — AuthContext, SecureStore, API client, telas de login/cadastro, testes
