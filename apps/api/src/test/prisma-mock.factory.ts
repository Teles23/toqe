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
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}
