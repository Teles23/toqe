# 55 — EAS Build: lockfile desatualizado + conflito @types/react

**Status:** Resolvido  
**Branch:** develop  
**Data:** 2026-05-21

## Problema

O EAS Build falhava na fase "Install dependencies" com `ERR_PNPM_OUTDATED_LOCKFILE`:

```
specifiers in the lockfile ({"@types/react":"19.1.17",...})
don't match specs in package.json ({"@types/react":"19.2.2",...})
```

## Causa raiz

O `package.json` raiz tem `pnpm.overrides` que força `@types/react: 19.2.2` para toda a workspace (necessário para `apps/web` + Next.js 15 + React 19). Quando o pnpm avalia `--frozen-lockfile`, aplica o override e compara a especificação efetiva (`19.2.2`) com o que estava gravado no lockfile de `apps/mobile` (`19.1.17`) — divergência fatal.

O build local não explodiu porque `pnpm install` sem `--frozen-lockfile` resolve silenciosamente. O EAS Build foi o primeiro ambiente limpo a expor o problema.

## Arquivos modificados

| Arquivo                       | Mudança                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/mobile/package.json`    | `@types/react` de `19.1.17` → `19.2.2` para alinhar com o override da raiz                          |
| `apps/mobile/package.json`    | Adicionado `expo.install.exclude: ["@types/react"]` para silenciar aviso do expo doctor             |
| `apps/mobile/metro.config.js` | Reescrito: merge com defaults do Expo + blockList (antes sobrescrevia `watchFolders` completamente) |
| `pnpm-lock.yaml`              | Regenerado via `pnpm install`                                                                       |

## Conflito de versões (by design)

| Quem quer                        | Versão     |
| -------------------------------- | ---------- |
| Expo SDK 54 (expo doctor)        | `~19.1.10` |
| `apps/web` + pnpm.overrides raiz | `19.2.2`   |

Não é possível satisfazer os dois ao mesmo tempo num monorepo com override global. O risco é baixo: `19.2.2` é um minor bump de tipos, sem breaking changes para o código React Native. O `expo.install.exclude` documenta que o desvio é intencional.

## Metro config

O `metro.config.js` original usava `config.watchFolders = [monorepoRoot]` (sobrescrevia os defaults do Expo, causando alerta no expo doctor). A versão corrigida:

```js
config.watchFolders = [...(config.watchFolders ?? []), ...extraWatchFolders];
```

O `blockList` exclui `apps/api`, `apps/web`, `.git` e `.turbo` — mantendo a performance no Windows sem violar os defaults do Expo.

## Como evitar no futuro

- Ao adicionar uma entrada em `pnpm.overrides` na raiz, verificar se algum app do workspace tem restrição de versão diferente (ex: Expo SDK pins)
- Rodar `npx expo-doctor` após qualquer mudança de dependência no mobile
- Se houver divergência intencional, adicionar ao `expo.install.exclude` imediatamente
