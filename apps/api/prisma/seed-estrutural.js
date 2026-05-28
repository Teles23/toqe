'use strict';
/**
 * Seed estrutural — executa em PRODUÇÃO a cada deploy.
 *
 * Contém APENAS dados obrigatórios para o sistema funcionar:
 *   - PlanoLimite (free, starter, pro, enterprise)
 *
 * Dados de demonstração (usuários, barbearia fictícia, agendamentos) NÃO
 * são inseridos aqui. Use seed-runner.js em ambiente de desenvolvimento.
 */
require('dotenv/config');
const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seed estrutural: iniciando...');

  // Planos — dados estruturais obrigatórios para o sistema funcionar
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

  for (const plano of planos) {
    await prisma.planoLimite.upsert({
      where: { plano: plano.plano },
      update: plano,
      create: plano,
    });
  }
  console.log('  ✔ Planos sincronizados');

  console.log('✅ Seed estrutural concluído.');
}

main()
  .catch((e) => {
    console.error('❌ Seed estrutural falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
