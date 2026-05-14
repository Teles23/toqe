export default async function globalTeardown() {
  // Aguarda o pool de conexões do pg drenar antes de parar o container.
  // Sem isso, conexões idle recebem FATAL e emitem unhandled 'error'.
  await new Promise((resolve) => setTimeout(resolve, 800));

  const container = (globalThis as any).__PG_CONTAINER__;
  if (container) {
    try {
      await container.stop();
    } catch {
      // Container may already be stopped or Ryuk cleaned it up
    }
  }
}
