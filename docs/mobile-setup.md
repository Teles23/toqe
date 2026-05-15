# Mobile — Setup e Desenvolvimento Local

**Status:** Ativo
**Branch base:** mobile/base

---

## Pré-requisitos

- Node.js 22+
- pnpm 9+
- Android Studio (para emulador Android) ou dispositivo físico
- [Expo Go](https://expo.dev/go) no dispositivo (para rodar sem build nativo)
- EAS CLI: `npm install -g eas-cli` (para builds)

---

## Rodar Localmente

```bash
# 1. Instalar dependências do monorepo
pnpm install

# 2. Entrar na pasta do mobile
cd apps/mobile

# 3. Criar arquivo .env (se não existir)
cp .env.example .env  # ou criar manualmente

# 4. Iniciar o servidor Metro
pnpm start

# 5. Abrir no Android
pnpm android

# 6. Abrir no iOS
pnpm ios
```

---

## Variáveis de Ambiente

Crie `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://toqe.duckdns.org/api/v1
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=330194878953-3iql45i1robhr8di453uhtp92qtqhrrh.apps.googleusercontent.com
```

> **`EXPO_PUBLIC_*`** são variáveis de build-time expostas ao bundle pelo Expo.
> Nunca coloque segredos nessas variáveis — ficam visíveis no bundle.

As mesmas variáveis ficam em `app.json` no campo `extra` para acesso via `expo-constants`:

```typescript
import Constants from "expo-constants";
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
const googleClientId = Constants.expoConfig?.extra?.googleWebClientId;
```

---

## Scripts Disponíveis

```bash
pnpm --filter mobile start        # Metro bundler
pnpm --filter mobile android      # Abrir no emulador/dispositivo Android
pnpm --filter mobile ios          # Abrir no simulador iOS
pnpm --filter mobile lint         # ESLint
pnpm --filter mobile type-check   # TypeScript sem emitir arquivos
pnpm --filter mobile test         # Jest (unit + componentes)
pnpm --filter mobile test:e2e     # Maestro (fluxos e2e)
```

---

## Development Build (funcionalidades nativas)

Algumas dependências exigem código nativo e **não funcionam no Expo Go**:

- `react-native-mmkv` — storage MMKV
- `@react-native-google-signin/google-signin` — login Google
- `expo-secure-store` — **funciona no Expo Go** ✅

Para usar funcionalidades nativas, gere um Development Build:

```bash
# Build Android (development)
eas build --platform android --profile development

# Build iOS (development)
eas build --platform ios --profile development
```

Configuração EAS em `apps/mobile/eas.json`.

---

## Estrutura de Pastas

```
apps/mobile/
├── app/                    # Rotas (Expo Router — file-based)
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Redirect por autenticação
│   ├── (auth)/             # Login, cadastro
│   ├── (cliente)/          # Área do cliente (tabs)
│   └── (barbeiro)/         # Área do barbeiro (tabs)
├── src/
│   └── shared/
│       ├── api/            # API client com refresh automático
│       ├── hooks/          # useAuth e outros hooks
│       ├── lib/            # SecureStore, utilitários
│       └── providers/      # AuthProvider, QueryProvider
├── assets/                 # Ícones, splash, imagens
├── components/             # Componentes de UI reutilizáveis
├── constants/              # Tema, cores
├── hooks/                  # Hooks do Expo (useColorScheme, etc.)
├── app.json                # Configuração Expo
├── metro.config.js         # Bundler (monorepo)
└── tsconfig.json           # TypeScript com path aliases
```

---

## Monorepo — Packages Compartilhados

O mobile consome:

- `@toqe/contracts` — schemas Zod e tipos inferidos (auth, agendamento, etc.)
- `@toqe/shared` — tipos de domínio, enums (`Perfil`), DTOs

Resolução via Metro (`extraNodeModules`) e TypeScript (`paths`).

---

## EAS Build — Configuração

`apps/mobile/eas.json` define os perfis:

- `development` — build de dev com cliente de desenvolvimento
- `preview` — build interno para testes (APK)
- `production` — build de produção (Google Play / App Store)

Para configurar um novo projeto EAS:

```bash
eas init
eas build:configure
```
