#!/usr/bin/env node
/**
 * Toqe — gerador de assets de branding.
 *
 * Lê os SVGs source em `tools/branding/source/` e renderiza PNGs nos tamanhos
 * exigidos pelo Expo em `apps/mobile/assets/images/`.
 *
 * Uso:
 *   node tools/branding/generate.mjs           # gera os arquivos
 *   node tools/branding/generate.mjs --dry-run # só lista os alvos (CI/teste)
 */

import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Paths ───────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const SRC = join(ROOT, 'tools', 'branding', 'source');
const OUT = join(ROOT, 'apps', 'mobile', 'assets', 'images');

// ─── Targets ─────────────────────────────────────────────────────────────────
// Cada entrada: { src, dst, size, background, transparent, solid }
//   - src: SVG file relativo a SRC (ou null se gerar bloco sólido)
//   - dst: PNG file relativo a OUT
//   - size: lado do quadrado (px)
//   - background: cor de fundo para flatten (default: transparente)
//   - transparent: se true, mantém alfa
//   - solid: se definido, gera um PNG monocolor (ignora src)
export const targets = [
  { src: 'icon.svg', dst: 'icon.png', size: 1024, background: '#1a73e8' },
  // Splash transparente — o backgroundColor vem do plugin expo-splash-screen.
  { src: 'icon.svg', dst: 'splash-icon.png', size: 1024, transparent: true },
  { src: 'icon.svg', dst: 'favicon.png', size: 48, background: '#1a73e8' },
  { src: 'icon-foreground.svg', dst: 'android-icon-foreground.png', size: 432, transparent: true },
  { src: 'icon-monochrome.svg', dst: 'android-icon-monochrome.png', size: 432, transparent: true },
  { src: null, dst: 'android-icon-background.png', size: 432, solid: '#1a73e8' },
];

// ─── Render ──────────────────────────────────────────────────────────────────
async function renderOne(sharp, t) {
  const outPath = join(OUT, t.dst);

  if (t.solid) {
    // PNG sólido — sem SVG. Útil para android-icon-background.
    await sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: t.solid,
      },
    })
      .png({ compressionLevel: 9, palette: true })
      .toFile(outPath);
  } else {
    const svgBuffer = await readFile(join(SRC, t.src));
    let pipeline = sharp(svgBuffer, { density: 384 }).resize(t.size, t.size, {
      fit: 'contain',
      background: t.transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : t.background,
    });

    if (!t.transparent && t.background) {
      pipeline = pipeline.flatten({ background: t.background });
    }

    // palette: true → PNG8 indexed. Para ícones de poucas cores reduz 5-10x.
    await pipeline.png({ compressionLevel: 9, palette: true }).toFile(outPath);
  }

  const info = await stat(outPath);
  return { dst: t.dst, bytes: info.size };
}

// ─── Main ────────────────────────────────────────────────────────────────────
export async function generate({ dryRun = false } = {}) {
  if (dryRun) {
    return targets.map((t) => ({ dst: t.dst, dryRun: true }));
  }

  // Import dinâmico — sharp é devDependency da raiz; em dry-run nem é exigido.
  const { default: sharp } = await import('sharp');

  await mkdir(OUT, { recursive: true });
  const results = [];
  for (const t of targets) {
    const r = await renderOne(sharp, t);
    results.push(r);
    // eslint-disable-next-line no-console
    console.log(`✓ ${r.dst.padEnd(36)} ${(r.bytes / 1024).toFixed(1).padStart(6)} KB`);
  }
  return results;
}

// Entry point — só roda quando executado diretamente (não em import de teste).
// Compara via pathToFileURL para funcionar igual em Windows e POSIX.
const { pathToFileURL } = await import('node:url');
const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const dryRun = process.argv.includes('--dry-run');
  generate({ dryRun })
    .then((results) => {
      if (dryRun) {
        console.log('Dry run — would generate:');
        for (const r of results) console.log(`  - ${r.dst}`);
      }
    })
    .catch((err) => {
      console.error('Branding generation failed:', err);
      process.exit(1);
    });
}
