import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const planos = [
  {
    plano: 'free',
    maxBarbeiros: 2,
    maxAgdMes: 50,
    whiteLabel: false,
    apiPublica: false,
    relatoriosAdv: false,
  },
  {
    plano: 'starter',
    maxBarbeiros: 5,
    maxAgdMes: 200,
    whiteLabel: false,
    apiPublica: false,
    relatoriosAdv: false,
  },
  {
    plano: 'pro',
    maxBarbeiros: 15,
    maxAgdMes: 1000,
    whiteLabel: true,
    apiPublica: false,
    relatoriosAdv: true,
  },
  {
    plano: 'enterprise',
    maxBarbeiros: null,
    maxAgdMes: null,
    whiteLabel: true,
    apiPublica: true,
    relatoriosAdv: true,
  },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  for (const plano of planos) {
    await prisma.planoLimite.upsert({
      where: { plano: plano.plano },
      update: plano,
      create: plano,
    });
    console.log(`  ✔ Plano '${plano.plano}' sincronizado`);
  }

  console.log('✅ Seed concluído.');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
