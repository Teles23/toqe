export default async function globalTeardown() {
  const container = (globalThis as any).__PG_CONTAINER__;
  if (container) {
    try {
      await container.stop();
    } catch {
      // Container may already be stopped or Ryuk cleaned it up
    }
  }
}
