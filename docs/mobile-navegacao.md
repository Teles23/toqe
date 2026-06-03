# Mobile — Navegação e Rotas

**Status:** ✅ Implementado (estrutura base)  
**Branch:** `mobile/feat/setup` + `mobile/feat/auth` → `mobile/base`  
**Base:** Expo Router 6, React Navigation (Tabs + Stack)

---

## Mapa de rotas

```
app/
├── _layout.tsx              ← Root layout: QueryProvider > AuthProvider > ThemeProvider > Stack
├── index.tsx                ← Guard de redirecionamento (depende do estado de auth)
├── b/[slug].tsx             ← Entrada Universal/App Link `/b/:slug` (cadastro/login → barbearia)
├── convite.tsx              ← Ponte `/convite?token=...` → `/convite/[token]`
│
├── (auth)/
│   ├── _layout.tsx          ← Stack sem header; bloqueia se já autenticado
│   ├── login.tsx            ← Tela de login
│   └── cadastro.tsx         ← Tela de cadastro
│
├── (cliente)/
│   ├── _layout.tsx          ← Tabs: Início | Buscar | Agendamentos | Perfil
│   ├── home.tsx             ← ✅ Saudação + cards das barbearias + atalhos
│   ├── buscar.tsx           ← ⏳ EmptyScreen "Em breve" (backend público pendente)
│   ├── agendamentos/
│   │   ├── index.tsx        ← ⏳ EmptyScreen "Em breve" (role cliente sem GET lista)
│   │   └── [codigo].tsx     ← ✅ Detalhe completo + cancelar (role cliente PODE)
│   └── perfil/              ← ✅ Re-export thin de (barbeiro)/perfil/ — DRY total
│
└── (barbeiro)/
    ├── _layout.tsx          ← Tabs: Agenda | Fila | Clientes | Perfil
    ├── agenda.tsx           ← ✅ Agenda do dia (lista + navegação ±1d, status update)
    ├── fila.tsx             ← ✅ Fila de walk-ins (lista + FAB + modal)
    ├── clientes.tsx         ← ✅ Lista de clientes (busca, sort, detalhe com histórico)
    └── perfil/              ← ✅ Stack interno (index/editar/senha/2fa/sessoes/notificacoes)
```

---

## Lógica de redirecionamento

### `app/index.tsx` — guard principal

```
loading = true   → renderiza <ActivityIndicator> (sem redirect)
user = null      → <Redirect href="/(auth)/login" />
perfil = barbeiro/dono/gerente/recepcionista/super_admin
                 → <Redirect href="/(barbeiro)/agenda" />
perfil = cliente (ou qualquer outro)
                 → <Redirect href="/(cliente)/home" />
```

### Profiles e rotas

| Perfil (`Perfil` enum) | Rota home            |
| ---------------------- | -------------------- |
| `BARBEIRO`             | `/(barbeiro)/agenda` |
| `DONO`                 | `/(barbeiro)/agenda` |
| `GERENTE`              | `/(barbeiro)/agenda` |
| `RECEPCIONISTA`        | `/(barbeiro)/agenda` |
| `SUPER_ADMIN`          | `/(barbeiro)/agenda` |
| `CLIENTE`              | `/(cliente)/home`    |

---

## Providers no Root Layout

```tsx
// app/_layout.tsx
<QueryProvider>
  {" "}
  // TanStack Query — cache de dados
  <AuthProvider>
    {" "}
    // contexto de auth (user, perfil, tokens)
    <ThemeProvider>
      {" "}
      // dark/light via useColorScheme
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(cliente)" />
        <Stack.Screen name="(barbeiro)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  </AuthProvider>
</QueryProvider>
```

Google Sign-In é configurado via `GoogleSignin.configure()` antes do render do Stack.

---

## Tabs por grupo

### `(cliente)` — Bottom Tabs

| Tab          | Rota           | Ícone (placeholder) |
| ------------ | -------------- | ------------------- |
| Início       | `home`         | home                |
| Buscar       | `buscar`       | search              |
| Agendamentos | `agendamentos` | calendar            |
| Perfil       | `perfil`       | person              |

### `(barbeiro)` — Bottom Tabs

| Tab      | Rota       | Ícone (placeholder) |
| -------- | ---------- | ------------------- |
| Agenda   | `agenda`   | calendar            |
| Fila     | `fila`     | list                |
| Clientes | `clientes` | people              |
| Perfil   | `perfil`   | person              |

---

## Proteção de rotas

A proteção é feita em dois pontos:

1. **`app/index.tsx`** — entrada principal: decide para onde ir com base no estado de auth
2. **`api-client.ts`** — interceptor de 401: em qualquer request que retorne 401 após falha de refresh, limpa SecureStore e redireciona para `/(auth)/login` via `router.replace`

O `(auth)/_layout.tsx` redireciona para a home do perfil se o usuário já está autenticado (evita voltar para login após login bem-sucedido).

## Universal Links / App Links

O app captura, via build nativo, URLs HTTPS do domínio configurado em
`EXPO_PUBLIC_APP_LINK_DOMAIN` (`app.toqe-barber.com.br` em preview/produção).
O Web continua sendo fallback do mesmo link quando o app não está instalado.

Rotas atuais:

```
https://app.toqe-barber.com.br/b/:slug
  → app/b/[slug].tsx
  → se não autenticado: /(auth)/cadastro?returnTo=/b/:slug
  → após cadastro/login: /(cliente)/barbearia/:slug

https://app.toqe-barber.com.br/convite?token=abc...
  → app/convite.tsx
  → app/convite/[token].tsx
```

O parâmetro `returnTo` é validado por allowlist e só aceita rotas internas do
booking público/barbearia. Alterar o domínio ou os caminhos capturados exige novo
build EAS, pois `android.intentFilters` e `ios.associatedDomains` são nativos.

---

## Fluxo completo de boot

```
App abre
  → AuthProvider.mount()
  → lê token do SecureStore
  → if token: GET /api/v1/usuarios/me
      → preenche user, barbearias, perfil
  → loading = false
  → app/index.tsx renderiza:
      → if !user → /(auth)/login
      → if barbeiro → /(barbeiro)/agenda
      → else       → /(cliente)/home
```

---

## Fluxo de login

```
/(auth)/login → useAuth().login(email, senha)
  → POST /auth/login
  → salva tokens no SecureStore
  → GET /usuarios/me
  → router.replace(homeByPerfil)
```

## Fluxo de logout

```
Tela de perfil → useAuth().logout()
  → POST /auth/logout (fire-and-forget)
  → TokenStorage.clearTokens()
  → router.replace('/(auth)/login')
```

---

## Testes E2E (Maestro)

```bash
maestro test .maestro/flows/auth-login-email.yaml
maestro test .maestro/flows/auth-logout.yaml
maestro test .maestro/flows/auth-cadastro.yaml
```

| Arquivo                 | Cenário                                                 |
| ----------------------- | ------------------------------------------------------- |
| `auth-login-email.yaml` | Login com e-mail e senha, verifica redirect             |
| `auth-logout.yaml`      | Navega para Perfil > Sair, verifica tela de login       |
| `auth-cadastro.yaml`    | Preenche formulário, submete, verifica login automático |
