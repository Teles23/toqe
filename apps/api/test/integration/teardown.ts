export default async function globalTeardown() {
  const container = (globalThis as any).__PG_CONTAINER__;
  if (container) {
    await container.stop();
  }
}
