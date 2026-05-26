import 'dotenv/config';
import {
  PrismaClient,
  type Usuario,
  type Servico,
} from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { addHours, startOfDay, setHours, setMinutes } from 'date-fns';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed idempotente...');

  // 1. Planos
  const planos = [
    { plano: 'free', maxBarbeiros: 2, maxAgdMes: 50 },
    { plano: 'starter', maxBarbeiros: 5, maxAgdMes: 200 },
    { plano: 'pro', maxBarbeiros: 15, maxAgdMes: 1000, whiteLabel: true },
    {
      plano: 'enterprise',
      maxBarbeiros: null,
      maxAgdMes: null,
      whiteLabel: true,
      apiPublica: true,
    },
  ];

  for (const p of planos) {
    await prisma.planoLimite.upsert({
      where: { plano: p.plano },
      update: p,
      create: p,
    });
  }
  console.log('  ✔ Planos sincronizados');

  // 2. Usuários (Dono e Barbeiros)
  const senhaHash = await bcrypt.hash('senha123', 10);

  const usuarios = [
    {
      nome: 'Thiago Teles',
      email: 'thiago@email.com',
      telefone: '11999999999',
    },
    {
      nome: 'Lucas Barbeiro',
      email: 'barbeiro1@email.com',
      telefone: '11888888888',
    },
    { nome: 'João Cliente', email: 'joao.cliente@email.com' },
    { nome: 'Marcos Silva', email: 'marcos.silva@email.com' },
  ];

  const dbUsers: Record<string, Usuario> = {};
  for (const u of usuarios) {
    dbUsers[u.email] = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome },
      create: {
        ...u,
        senhaHash: u.email.includes('cliente') ? '---' : senhaHash,
      },
    });
  }
  console.log('  ✔ Usuários sincronizados');

  // 3. Barbearia
  const barbearia = await prisma.barbearia.upsert({
    where: { slug: 'toqe-barber' },
    update: { nome: 'Toqe Barber Shop' },
    create: {
      nome: 'Toqe Barber Shop',
      slug: 'toqe-barber',
      plano: 'pro',
    },
  });
  console.log('  ✔ Barbearia sincronizada');

  // 4. Membros (Dono e Barbeiro)
  const membros = [
    { usrCodigo: dbUsers['thiago@email.com'].codigo, perfil: 'dono' },
    { usrCodigo: dbUsers['barbeiro1@email.com'].codigo, perfil: 'barbeiro' },
  ];

  for (const m of membros) {
    await prisma.membroBarbearia.upsert({
      where: {
        barCodigo_usrCodigo: {
          barCodigo: barbearia.codigo,
          usrCodigo: m.usrCodigo,
        },
      },
      update: { perfil: m.perfil },
      create: {
        barCodigo: barbearia.codigo,
        usrCodigo: m.usrCodigo,
        perfil: m.perfil,
      },
    });
  }
  console.log('  ✔ Membros sincronizados');

  // 5. Serviços
  const servicos = [
    { nome: 'Corte Degradê', preco: 45.0, duracao: 40 },
    { nome: 'Barba Terapia', preco: 35.0, duracao: 30 },
  ];

  const dbServices: Record<string, Servico> = {};
  for (const s of servicos) {
    dbServices[s.nome] = await prisma.servico.upsert({
      where: { nome_barCodigo: { nome: s.nome, barCodigo: barbearia.codigo } },
      update: { precoBase: s.preco, duracaoBase: s.duracao },
      create: {
        nome: s.nome,
        precoBase: s.preco,
        duracaoBase: s.duracao,
        barCodigo: barbearia.codigo,
      },
    });
  }
  console.log('  ✔ Serviços sincronizados');

  // 6. Agendamentos para HOJE
  const hoje = startOfDay(new Date());
  const agendamentosRaw = [
    {
      email: 'joao.cliente@email.com',
      inicio: setHours(setMinutes(hoje, 0), 9),
      status: 'CONCLUIDO',
      barbeiroEmail: 'thiago@email.com',
    },
    {
      email: 'marcos.silva@email.com',
      inicio: setHours(setMinutes(hoje, 0), 10),
      status: 'CONCLUIDO',
      barbeiroEmail: 'barbeiro1@email.com',
    },
    {
      email: 'joao.cliente@email.com',
      inicio: addHours(new Date(), -1),
      status: 'EM_ATENDIMENTO',
      barbeiroEmail: 'thiago@email.com',
    },
  ];

  for (const a of agendamentosRaw) {
    const inicio = a.inicio;
    const fim = addHours(inicio, 1);

    let agendamento = await prisma.agendamento.findFirst({
      where: {
        barbeiroId: dbUsers[a.barbeiroEmail].codigo,
        inicio: inicio,
      },
    });
    if (agendamento) {
      agendamento = await prisma.agendamento.update({
        where: { codigo: agendamento.codigo },
        data: { status: a.status },
      });
    } else {
      agendamento = await prisma.agendamento.create({
        data: {
          barCodigo: barbearia.codigo,
          barbeiroId: dbUsers[a.barbeiroEmail].codigo,
          clienteId: dbUsers[a.email].codigo,
          inicio: inicio,
          fim: fim,
          status: a.status,
        },
      });
    }

    // Itens do agendamento
    await prisma.agendamentoItem.upsert({
      where: {
        agdCodigo_srvCodigo: {
          agdCodigo: agendamento.codigo,
          srvCodigo: dbServices['Corte Degradê'].codigo,
        },
      },
      update: {},
      create: {
        barCodigo: barbearia.codigo,
        agdCodigo: agendamento.codigo,
        srvCodigo: dbServices['Corte Degradê'].codigo,
        duracaoMin: 40,
        preco: 45.0,
      },
    });
  }

  console.log('✅ Seed 100% Idempotente concluído!');
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
