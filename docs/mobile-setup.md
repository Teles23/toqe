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
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com
# Preencher após rodar: eas init (veja seção EAS abaixo)
EAS_PROJECT_ID=
```

> **`EXPO_PUBLIC_*`** são variáveis de build-time expostas ao bundle pelo Expo.
> Nunca coloque segredos nessas variáveis — ficam visíveis no bundle.
> **`EAS_PROJECT_ID`** é lido em `app.config.ts` para habilitar OTA. Sem ele, o app funciona normalmente (sem verificar updates).

As variáveis ficam em `app.config.ts` no campo `extra` para acesso via `expo-constants`:

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

# Branding (raiz do repo)
pnpm branding:generate            # Regera PNGs a partir dos SVGs em tools/branding/source/
pnpm branding:check               # Dry-run: lista os alvos sem gerar arquivos
```

> Detalhes do sistema de branding em [`mobile-branding.md`](./mobile-branding.md).

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

## Monorepo — Packages Compartilhados

O mobile consome:

- `@toqe/contracts` — schemas Zod e tipos inferidos (auth, agendamento, etc.)
- `@toqe/shared` — tipos de domínio, enums (`Perfil`), DTOs

Resolução via Metro (`extraNodeModules`) e TypeScript (`paths`).

---

## EAS Build + OTA (expo-updates)

### Perfis (`eas.json`)

| Perfil        | Distribuição | Channel OTA   | Uso                           |
| ------------- | ------------ | ------------- | ----------------------------- |
| `development` | internal     | `development` | Dev com hot-reload nativo     |
| `preview`     | internal     | `preview`     | QA interno (APK/IPA via link) |
| `production`  | store        | `production`  | Google Play / App Store       |

### Primeiro uso — criar projeto EAS

```bash
# 1. Instalar EAS CLI (se não tiver)
npm install -g eas-cli

# 2. Autenticar na conta Expo
eas login

# 3. Criar projeto e obter projectId
cd apps/mobile
eas init
# → gera UUID e exibe: "Project ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 4. Copiar o UUID para .env
echo "EAS_PROJECT_ID=<uuid-gerado>" >> .env
```

### Builds

```bash
# Build de desenvolvimento (Android)
eas build --profile development --platform android

# Build de preview (todas as plataformas)
eas build --profile preview --platform all

# Build de produção
eas build --profile production --platform all
```

### OTA Updates — enviar sem nova build

```bash
# Publicar update no canal preview (QA)
eas update --channel preview --message "fix: descrição do ajuste"

# Publicar update no canal production
eas update --channel production --message "fix: descrição do ajuste"
```

> **Como funciona:** quando o app abre, verifica se há uma nova versão no canal EAS configurado para o build (`channel: preview` ou `channel: production`). Se houver, baixa em background e aplica no próximo restart. A política `runtimeVersion: { policy: 'appVersion' }` garante que o update só é aplicado em apps com a mesma versão nativa.

### Verificar configuração local

```bash
# Em apps/mobile — mostra a config resolvida (updates, runtimeVersion, etc.)
npx expo config --type introspect
```

### Estrutura de pastas (atualizada)

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
│       ├── providers/      # AuthProvider, QueryProvider
│       └── types/          # Tipos de domínio (AgendamentoResumo, etc.)
├── assets/                 # Ícones, splash, imagens
├── app.config.ts           # Configuração Expo (dinâmica — lê EAS_PROJECT_ID)
├── eas.json                # Perfis de build EAS
├── metro.config.js         # Bundler (monorepo)
└── tsconfig.json           # TypeScript com path aliases
```
