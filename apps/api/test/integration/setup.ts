import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

let container: any;

export default async function globalSetup() {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('toqe_test')
    .withUsername('toqe')
    .withPassword('toqe')
    .start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  (globalThis as any).__PG_CONTAINER__ = container;

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    cwd: process.cwd(),
    stdio: 'pipe',
  });
}
