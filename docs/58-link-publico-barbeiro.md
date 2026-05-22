# 58 — Link público do barbeiro (Fase 4-A)

**Status:** Implementado (copiar via Share nativo; resolução da página é follow-up)
**Branch:** develop
**Base:** Fase 4 do fluxo barbeiro (slides 05 e 14)

## Contexto

Slides 05 e 14: o barbeiro tem um link público compartilhável
(`toqe.app/u/{slug}`) — para a bio do Instagram etc. — com "1-tap copiar".
Esta entrega adiciona o link e a ação de compartilhar. **Fecha o pendente do
empty state da agenda (Fase 1).**

## Sem migração

O slug é **derivado do nome** (não armazenado) — `slugify(nome)`. Sem coluna
nova, sem migração. A resolução real da página `/u/:slug` (página pública do
barbeiro) é **feature futura**: hoje o booking público é por barbearia
(`/publico/:slug`), não por barbeiro.

## Mudanças

| Arquivo                                                          | Mudança                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/api/src/common/utils/slug.utils.ts` _(novo)_               | `slugify()` (sem acentos) + `linkPublicoBarbeiro(nome)` → `toqe.app/u/{slug}` |
| `packages/shared/src/types/index.ts`                             | `UsuarioMe.linkPublico?: string`                                              |
| `apps/api/src/usuario/usuario.service.ts`                        | `me()` retorna `linkPublico` derivado do nome                                 |
| `apps/mobile/src/shared/providers/auth-provider.tsx`             | `AuthUser.linkPublico`; `buildUser` propaga `me.linkPublico`                  |
| `apps/mobile/src/shared/hooks/use-compartilhar-link.ts` _(novo)_ | `useCompartilharLink()` → `Share.share({ message })` + toast de erro          |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                          | empty "Dia livre" ganha ação "Copiar link público" (`btn-copiar-link`)        |
| `apps/mobile/app/(barbeiro)/perfil/index.tsx`                    | pill da URL agora usa `user.linkPublico` e é clicável (compartilha)           |

## Clipboard vs Share

A spec (adendo A) pede **copiar para o clipboard + toast "Link copiado"**, o que
exige `expo-clipboard` (dependência nativa + dev build). Como o pacote ainda não
está instalado, usamos a API **`Share`** embutida do React Native (sem instalação)
— abre a folha de compartilhar com o link. Para trocar por clipboard silencioso:
`npx expo install expo-clipboard` e substituir o corpo de `useCompartilharLink`.

## Testes

- **api** `slug.utils.spec.ts` (slugify acentos/colapso/fallback; linkPublico);
  `usuario.service.spec.ts` (me retorna `linkPublico`).
- **mobile** `use-auth.test` (mock com `linkPublico`); agenda/perfil seguem verdes.

## Follow-up

- Página pública do barbeiro (`/u/:slug` resolvendo o barbeiro) — hoje não resolve.
- Slug único persistido (evita colisão de nomes) quando a página existir.
- Trocar `Share` por `expo-clipboard` (copiar + toast) após instalar o pacote.
