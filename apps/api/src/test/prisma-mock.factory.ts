export function createPrismaMock() {
  const makeMethods = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  });

  return {
    usuario: makeMethods(),
    barbearia: makeMethods(),
    membroBarbearia: makeMethods(),
    servico: makeMethods(),
    agendamento: makeMethods(),
    agendamentoItem: makeMethods(),
    refreshToken: makeMethods(),
    temaTenant: makeMethods(),
    notificacaoPreferencia: makeMethods(),
    pushToken: makeMethods(),
    horarioFuncionamento: makeMethods(),
    jornadaTrabalho: makeMethods(),
    bloqueioAgenda: makeMethods(),
    planoLimite: makeMethods(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}
