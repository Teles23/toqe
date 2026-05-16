# Toqe Branding

Source-of-truth dos assets visuais do app mobile.

## Arquivos

```
tools/branding/
├── source/
│   ├── icon.svg               # Ícone principal (fundo + T + acento)
│   ├── icon-foreground.svg    # Adaptive icon Android (transparente)
│   └── icon-monochrome.svg    # Themed icon Android 13+ (T puro)
├── generate.mjs               # Renderiza SVGs → PNGs com sharp
├── __tests__/
│   └── generate.test.mjs      # Dry-run test (sanity check de configuração)
└── README.md                  # Este arquivo
```

## Regerar todos os PNGs

```bash
pnpm branding:generate
```

Saída em `apps/mobile/assets/images/`:

| PNG                           | Tamanho   | Fonte                                                     |
| ----------------------------- | --------- | --------------------------------------------------------- |
| `icon.png`                    | 1024×1024 | `icon.svg` com fundo `#1a73e8`                            |
| `splash-icon.png`             | 1024×1024 | `icon.svg` transparente (background vem do plugin splash) |
| `favicon.png`                 | 48×48     | `icon.svg` com fundo `#1a73e8`                            |
| `android-icon-foreground.png` | 432×432   | `icon-foreground.svg` transparente                        |
| `android-icon-background.png` | 432×432   | Sólido `#1a73e8` (sem SVG)                                |
| `android-icon-monochrome.png` | 432×432   | `icon-monochrome.svg` transparente                        |

## Editar a marca

1. Abra `source/*.svg` em qualquer editor (Inkscape, Figma, browser, VS Code)
2. Mantenha **viewBox** original (1024 para `icon.svg`, 432 para variantes Android)
3. Para variantes Android: respeite a **safe zone** central de 1/3 — Android corta as bordas para forma adaptativa (círculo, squircle, etc.)
4. Rode `pnpm branding:generate`
5. Commit os SVGs + PNGs juntos

## Paleta

- **Primary:** `#1a73e8` (azul Toqe, light mode)
- **Primary dark:** `#4da3ff` (uso na UI, não no ícone)
- **Splash background light:** `#1a73e8`
- **Splash background dark:** `#0d1117`

## Por que esse formato?

- **DRY:** uma fonte vetorial → N tamanhos derivados (favicon, notification, OG, etc.)
- **Reproducível:** qualquer dev regenera com 1 comando — sem dependência de designer
- **Versionável:** diff de SVG em PR mostra a mudança visual
- **Escalável:** adicionar novo tamanho = 1 linha em `targets[]` no `generate.mjs`
