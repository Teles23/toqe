# Mobile — Autenticação

**Status:** ✅ Implementado  
**Branch:** `mobile/feat/auth` → `mobile/base`  
**Base:** Expo SDK 54, Expo Router 6, expo-secure-store

---

## Arquivos criados / modificados

| Arquivo                                                       | Papel                                               |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `apps/mobile/src/shared/lib/secure-storage.ts`                | Wrapper tipado sobre `expo-secure-store`            |
| `apps/mobile/src/shared/api/api-client.ts`                    | Fetch wrapper com Bearer token + refresh automático |
| `apps/mobile/src/shared/providers/auth-provider.tsx`          | AuthContext (estado + ações)                        |
| `apps/mobile/src/shared/hooks/use-auth.ts`                    | Atalho de consumo do AuthContext                    |
| `apps/mobile/app/(auth)/login.tsx`                            | Tela de login (e-mail + Google placeholder)         |
| `apps/mobile/app/(auth)/cadastro.tsx`                         | Tela de cadastro                                    |
| `apps/mobile/src/shared/lib/__tests__/secure-storage.test.ts` | Testes de TokenStorage                              |
| `apps/mobile/src/shared/api/__tests__/api-client.test.ts`     | Testes de api-client (401 retry etc.)               |
| `apps/mobile/src/shared/hooks/__tests__/use-auth.test.tsx`    | Testes de useAuth                                   |
| `apps/mobile/.maestro/flows/auth-login-email.yaml`            | Fluxo E2E login por e-mail                          |
| `apps/mobile/.maestro/flows/auth-logout.yaml`                 | Fluxo E2E logout                                    |
| `apps/mobile/.maestro/flows/auth-cadastro.yaml`               | Fluxo E2E cadastro                                  |

---

## Onde ficam os tokens

Os tokens JWT são armazenados **exclusivamente em `expo-secure-store`**, nunca em `AsyncStorage`.

```
Chave "toqe_access_token"   → access token (Bearer)
Chave "toqe_refresh_token"  → refresh token
```

`expo-secure-store` usa o Keychain (iOS) ou EncryptedSharedPreferences (Android) — equivalente seguro a httpOnly cookies.

### TokenStorage helper

```ts
import { TokenStorage } from "@/src/shared/lib/secure-storage";

await TokenStorage.getAccessToken(); // → string | null
await TokenStorage.getRefreshToken(); // → string | null
await TokenStorage.saveTokens(access, refresh);
await TokenStorage.clearTokens();
```

---

## API Client

Arquivo: `src/shared/api/api-client.ts`

### Comportamento de autenticação

```
Toda request →
  1. Lê access token via TokenStorage.getAccessToken()
  2. Adiciona Authorization: Bearer <token> no header
  3. Envia a request
  4. Se response.status === 401:
      a. Lê refresh token
      b. POST /auth/refresh com { refresh_token }
      c. Salva os novos tokens via TokenStorage.saveTokens()
      d. Repete a request original com o novo access token
      e. Se refresh também retorna 401:
           → limpa tokens (clearTokens)
           → router.replace('/(auth)/login')
           → lança ApiError(401)
  5. Se status >= 400 e != 401: lança ApiError(status, message)
```

### API surface

```ts
import { api, tenantApi, ApiError } from "@/src/shared/api/api-client";

// Requisições padrão (sem tenant)
await api.get<T>("/usuarios/me");
await api.post<T>("/auth/login", { email, senha });
await api.put<T>("/path", body);
await api.patch<T>("/path", body);
await api.delete("/path");

// Requisições com tenant (adiciona x-tenant-id header)
const tapi = tenantApi(42);
await tapi.get("/barbearia/agenda");

// Tratamento de erros
try {
  await api.get("/...");
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.status); // ex: 409
    console.log(err.message); // mensagem do servidor
  }
}
```

### BASE_URL

Lida de `Constants.expoConfig?.extra?.apiUrl` (via `app.json`) com fallback para `EXPO_PUBLIC_API_URL` do `.env`.

---

## AuthContext

Arquivo: `src/shared/providers/auth-provider.tsx`

### Estado

```ts
interface AuthState {
  user: AuthUser | null; // dados do usuário logado
  barbearia: BarbeariaResumo | null; // barbearia selecionada
  perfil: Perfil | null; // perfil ativo (ex: BARBEIRO, CLIENTE)
  barbearias: BarbeariaResumo[]; // todas as barbearias do usuário
  loading: boolean; // true enquanto carrega do SecureStore
}
```

### Ações

```ts
interface AuthActions {
  login(email: string, senha: string): Promise<void>;
  loginWithGoogle(idToken: string): Promise<void>; // placeholder — endpoint não existe ainda
  logout(): Promise<void>;
  switchBarbearia(codigo: number): void;
}
```

### Ciclo de vida

```
Mount
  → lê access token do SecureStore
  → se token existe: GET /usuarios/me
      → popula state (user, barbearias, perfil, barbearia)
  → loading = false

login(email, senha)
  → POST /auth/login → { access_token, refresh_token }
  → TokenStorage.saveTokens(...)
  → GET /usuarios/me
  → redirect por perfil (ver abaixo)

logout()
  → POST /auth/logout (fire-and-forget)
  → TokenStorage.clearTokens()
  → router.replace('/(auth)/login')

loginWithGoogle(idToken)
  → POST /auth/google (placeholder — ativo quando endpoint for criado na API)
  → mesmo fluxo que login()
```

### Redirect por perfil

```ts
const BARBEIRO_PERFIS = [
  Perfil.BARBEIRO,
  Perfil.DONO,
  Perfil.GERENTE,
  Perfil.RECEPCIONISTA,
  Perfil.SUPER_ADMIN,
];

// BARBEIRO_PERFIS → /(barbeiro)/agenda
// caso contrário   → /(cliente)/home
```

---

## Telas de autenticação

### Login (`app/(auth)/login.tsx`)

- Validação com `react-hook-form` + `zodResolver(loginSchema)` de `@toqe/contracts`
- Campos: e-mail, senha
- Estados de erro em português:
  - 401 → "E-mail ou senha incorretos."
  - 5xx → "Erro no servidor. Tente novamente."
  - else → "Sem conexão. Verifique sua internet."
- Botão "Entrar com Google" (chama `loginWithGoogle` — placeholder)
- Link para cadastro
- Suporte dark/light mode
- Touch targets ≥ 44pt (acessibilidade)

### Cadastro (`app/(auth)/cadastro.tsx`)

- Estende `registerSchema` de `@toqe/contracts` com campo `confirmarSenha`
- Validação `.refine()` para checar se senhas coincidem
- Campos: nome, e-mail, telefone (opcional), senha, confirmar senha
- Fluxo: `POST /auth/register` → `login(email, senha)` automático
- Erro 409 → "Este e-mail já está cadastrado."

---

## Testes

```bash
pnpm --filter mobile test
```

| Suite                    | Cenários                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `secure-storage.test.ts` | getAccessToken, getRefreshToken, saveTokens, clearTokens                                                    |
| `api-client.test.ts`     | GET com/sem token, x-tenant-id, retry em 401, redirect em refresh falho, ApiError em 404/500, POST com body |
| `use-auth.test.tsx`      | hook com contexto, lança erro fora do provider                                                              |

---

## Google Sign-In

**Estado atual:** placeholder implementado. O botão existe, o fluxo chama `loginWithGoogle(idToken)`, que chama `POST /auth/google`. O endpoint **não existe ainda na API NestJS**. Quando for criado, o fluxo funciona automaticamente.

Google Client ID configurado em `app.json` → `extra.googleWebClientId` para ser lido via `Constants.expoConfig.extra`.

Configuração `GoogleSignin.configure()` é chamada em `app/_layout.tsx` root antes do primeiro render.
